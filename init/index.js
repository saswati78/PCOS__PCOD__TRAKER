const mongoose = require('mongoose');
const initData = require("./data.js"); 
const UserData = require("../models/userData.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/pcosTracker";

main()
  .then(() => {
    console.log("Connected to DB");
    initDB(); 
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

const initDB = async () => {
  try {
    await UserData.deleteMany({});
    await UserData.insertMany(initData.data); 
    console.log("Data was initialized");
  } catch (error) {
    console.error("Error initializing data:", error);
  }
};
