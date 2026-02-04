from flask import Flask, request, jsonify
import csv
import os
import subprocess
import threading
import unicodedata
import sys
import joblib

app = Flask(__name__)

MODEL_PATH = os.path.abspath("model")
MODEL_FILE = os.path.join(MODEL_PATH, "model.joblib")
PORT = int(os.environ.get("PORT", "5001"))
DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"

model = None
model_lock = threading.Lock()


def normalize_text(text: str) -> str:
    text = (text or "").strip().lower()
    text = "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )
    return " ".join(text.split())


def load_model():
    global model
    print("Carregando modelo...")
    if not os.path.exists(MODEL_FILE):
        raise FileNotFoundError(
            f"Modelo nao encontrado em {MODEL_FILE}. Execute train.py."
        )
    model = joblib.load(MODEL_FILE)
    print("Modelo carregado com sucesso.")


load_model()


def run_training():
    global model
    print("Iniciando processo de treinamento...")

    try:
        subprocess.run([sys.executable, "train.py"], check=True)

        print("Treinamento concluido. Recarregando modelo...")

        with model_lock:
            load_model()

        print("Modelo recarregado com sucesso.")

    except subprocess.CalledProcessError as e:
        print(f"Erro durante o treinamento: {e}")
    except Exception as e:
        print(f"Erro inesperado: {e}")


@app.post("/retrain")
def retrain():
    training_thread = threading.Thread(target=run_training, daemon=True)
    training_thread.start()
    return jsonify({"status": "training_started"}), 202


@app.post("/classify")
def classify():
    data = request.get_json()
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "missing text"}), 400

    text = normalize_text(text)

    with model_lock:
        prediction = model.predict([text])[0]

    return jsonify({"category": prediction})


@app.post("/feedback")
def feedback():
    data = request.get_json()
    text = data.get("text")
    label = data.get("label")

    if not text or not label:
        return jsonify({"error": "missing text or label"}), 400

    file_exists = os.path.isfile("feedback.csv")

    with open("feedback.csv", "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["text", "label"])
        writer.writerow([text, label])

    return jsonify({"status": "feedback received"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
