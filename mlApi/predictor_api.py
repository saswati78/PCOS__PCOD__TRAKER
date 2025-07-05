from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

# Load your trained model
model = joblib.load("predict_model.pkl")

# Risk labels mapping (adjust based on your model's logic)
labels = {
    0: "Low Risk",
    1: "Medium Risk",
    2: "High Risk"
}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    try:
        features = [
            data["bmi"],
            data["cycle_length"],
            data["period_length"],
            data["irregular_periods"],
            data["acne"],
            data["hair_growth"],
            data["skin_darkening"],
            data["bp_systolic"],
            data["bp_diastolic"],
            data["hb_count"],
            data["stress_level"],
            data["physical_activity"]
        ]
        prediction = model.predict([features])[0]
        label = labels.get(int(prediction), "Unknown Risk")
        return jsonify({"prediction": label})
    except Exception as e:
        print("❌ Prediction error:", str(e))
        return jsonify({"error": "Invalid input or prediction failed."}), 400

if __name__ == "__main__":
    app.run(debug=True)
