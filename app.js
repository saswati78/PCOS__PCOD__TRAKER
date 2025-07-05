// Imports
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const axios = require("axios");
const moment = require("moment");
const bodyParser = require("body-parser");
const UserData = require("./models/userData.js");
const SymptomLog = require("./models/symptomLog.js");

const app = express();

// Middleware
app.use(session({
  secret: "superSecretKey",
  resave: false,
  saveUninitialized: false,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "/public")));

app.use((req, res, next) => {
  res.locals.title = "PCOD Calendar AI";
  next();
});

// DB Connection
const MONGO_URL = "mongodb://127.0.0.1:27017/pcosTracker";
mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middleware: Auth
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// Routes
app.get("/", (req, res) => {
  res.render("userDataListings/home", { title: "Home - SheSync", user: req.session.user });
});

// Login
app.get("/login", (req, res) => {
  res.render("userDataListings/login", { title: "Login" });
});

app.post("/login", async (req, res) => {
  const { user_id, password } = req.body;
  const user = await UserData.findOne({ user_id, password });
  if (user) {
    req.session.user = { username: user.username, user_id: user.user_id };
    return res.redirect("/dashboard");
  }
  res.render("userDataListings/error", {
    title: "Login Failed",
    message: "Invalid user ID or password. Please try again.",
    redirectPath: "/login"
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Signup
app.get("/signup", (req, res) => {
  res.render("userDataListings/signup", { title: "Signup" });
});

app.post("/signup", async (req, res) => {
  const { username, user_id, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render("userDataListings/error", {
      title: "Signup Error",
      message: "Passwords do not match.",
      redirectPath: "/signup"
    });
  }

  try {
    const existingUser = await UserData.findOne({ user_id });
    if (existingUser) {
      return res.render("userDataListings/error", {
        title: "Signup Error",
        message: "User ID already exists. Try logging in.",
        redirectPath: "/login"
      });
    }

    const newUser = new UserData({ username, user_id, password });
    await newUser.save();
    req.session.user = { username: newUser.username, user_id: newUser.user_id };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("userDataListings/error", {
      title: "Signup Error",
      message: "Something went wrong on the server.",
      redirectPath: "/signup"
    });
  }
});

// Dashboard
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.render("userDataListings/dashboard", {
    title: "Dashboard",
    user: req.session.user,
  });
});

// Calendar
app.get("/calendar", isLoggedIn, (req, res) => {
  res.render("userDataListings/calendar", { title: "Calendar" });
});

app.get("/api/calendar-events", isLoggedIn, async (req, res) => {
  try {
    const user = await UserData.findOne({ user_id: req.session.user.user_id });
    const lastPeriodDate = new Date(user?.last_period_date || new Date());
    const cycleLength = user?.cycle_length || 30;
    const periodLength = user?.period_length || 5;
    const events = [];

    for (let i = 0; i < periodLength; i++) {
      const d = new Date(lastPeriodDate);
      d.setDate(lastPeriodDate.getDate() + i);
      events.push({ title: "🔴 Actual Period", start: d.toISOString().split("T")[0], type: "active" });
    }

    for (let cycle = 1; cycle <= 4; cycle++) {
      const predictedStart = new Date(lastPeriodDate);
      predictedStart.setDate(lastPeriodDate.getDate() + cycle * cycleLength);
      for (let i = 0; i < periodLength; i++) {
        const d = new Date(predictedStart);
        d.setDate(predictedStart.getDate() + i);
        events.push({
          title: cycle === 1 ? "🟠 Predicted Next Period" : "🧠 AI-Predicted Period",
          start: d.toISOString().split("T")[0],
          type: "predicted"
        });
      }
    }

    res.json(events);
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    res.status(500).json([]);
  }
});

app.post("/calendar/save", isLoggedIn, async (req, res) => {
  const selectedDates = JSON.parse(req.body.selectedDates || "[]");
  try {
    const user = await UserData.findOne({ user_id: req.session.user.user_id });
    if (!user) return res.redirect("/login");
    user.last_period_date = selectedDates[selectedDates.length - 1];
    user.period_log = selectedDates;
    await user.save();
    res.redirect("/calendar");
  } catch (err) {
    console.error("❌ Error saving period dates:", err);
    res.send("Failed to save dates.");
  }
});

// Log Symptoms
app.get("/log-symptoms", isLoggedIn, (req, res) => {
  res.render("userDataListings/logSymptoms", { title: "Log Symptoms" });
});

app.post("/log-symptoms", isLoggedIn, async (req, res) => {
  const {
    date, symptoms, mood, sleep_hours, water_intake_liters,
    physical_activity, diet_quality, notes
  } = req.body;

  const symptomList = Array.isArray(symptoms) ? symptoms : [];

  const inputData = {
    bmi: 22.5,
    cycle_length: 28,
    period_length: 5,
    irregular_periods: 1,
    acne: symptomList.includes("Acne") ? 1 : 0,
    hair_growth: 0,
    skin_darkening: 0,
    bp_systolic: 110,
    bp_diastolic: 70,
    hb_count: 12.5,
    stress_level: 1,
    physical_activity: physical_activity === "High" ? 2 :
                      physical_activity === "Moderate" ? 1 : 0
  };

  try {
    const response = await axios.post("http://127.0.0.1:5000/predict", inputData, {
      headers: { "Content-Type": "application/json" }
    });

    const prediction = response.data.prediction;
    req.session.prediction = prediction;
    res.redirect("/prediction");
  } catch (error) {
    console.error("❌ Error calling predictor API:", error.message);
    res.send("Prediction failed. Please try again.");
  }
});

// Prediction View
app.get("/prediction", isLoggedIn, (req, res) => {
  res.render("userDataListings/prediction", {
    title: "Prediction Result",
    prediction: req.session.prediction
  });
});

// Static Pages
app.get("/health-tips", isLoggedIn, (req, res) => {
  res.render("userDataListings/healthTips", { title: "Health Tips" });
});

app.get("/features", (req, res) => res.render("features"));
app.get("/about", (req, res) => res.render("about"));
app.get("/contact", (req, res) => res.render("contact"));
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  console.log("Contact form submitted:", name, email, message);
  res.send("Thank you for reaching out! We'll get back to you soon.");
});

app.get("/faq", (req, res) => res.render("faqs"));
app.get("/help", (req, res) => res.render("help"));
app.get("/feedback", (req, res) => res.render("feedback"));
app.get("/privacy", (req, res) => res.render("privacy"));
app.get("/terms", (req, res) => res.render("terms"));

app.post("/submit-feedback", (req, res) => res.render("feedback-thanks"));
app.post("/submit-resource-request", (req, res) => res.render("resources-thanks"));
app.post("/guides/getting-started/submit", (req, res) => res.render("getting-started-thanks"));
app.post("/guides/tracking-tips/submit", (req, res) => res.render("tracking-tips-thanks"));
app.post("/guides/data-privacy/submit", (req, res) => res.render("data-privacy-thanks"));

app.get("/tips/yoga", (req, res) => res.render("yoga"));
app.get("/tips/diet", (req, res) => res.render("diet"));
app.get("/tips/lifestyle", (req, res) => res.render("lifestyle"));

// Server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
