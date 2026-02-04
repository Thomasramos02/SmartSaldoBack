import json
import os
import unicodedata
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib


def normalize_text(text: str) -> str:
    text = (text or "").strip().lower()
    text = "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )
    return " ".join(text.split())


base_data = [
    # Alimentacao
    {"text": "mc donalds lanche", "label": "Alimentacao"},
    {"text": "ifood pedido", "label": "Alimentacao"},
    {"text": "restaurante almoco", "label": "Alimentacao"},
    {"text": "padaria pao e cafe", "label": "Alimentacao"},
    {"text": "pizza delivery", "label": "Alimentacao"},
    {"text": "barzinho cerveja", "label": "Alimentacao"},
    # Transporte
    {"text": "uber viagem", "label": "Transporte"},
    {"text": "99 taxi corrida", "label": "Transporte"},
    {"text": "combustivel gasolina", "label": "Transporte"},
    {"text": "estacionamento shopping", "label": "Transporte"},
    {"text": "onibus bilhete", "label": "Transporte"},
    {"text": "metro passagem", "label": "Transporte"},
    # Saude
    {"text": "farmacia araujo", "label": "Saude"},
    {"text": "drogasil medicamentos", "label": "Saude"},
    {"text": "consulta medica", "label": "Saude"},
    {"text": "dentista clinica", "label": "Saude"},
    {"text": "laboratorio exames", "label": "Saude"},
    # Mercado
    {"text": "carrefour compras", "label": "Mercado"},
    {"text": "supermercado dia", "label": "Mercado"},
    {"text": "mercado pao de acucar", "label": "Mercado"},
    {"text": "hortifruti feira", "label": "Mercado"},
    # Moradia
    {"text": "aluguel apartamento", "label": "Moradia"},
    {"text": "condominio mensal", "label": "Moradia"},
    {"text": "iptu parcela", "label": "Moradia"},
    # Contas
    {"text": "conta de luz energia", "label": "Contas"},
    {"text": "conta de agua", "label": "Contas"},
    {"text": "conta de gas", "label": "Contas"},
    {"text": "internet fibra", "label": "Contas"},
    {"text": "telefone claro", "label": "Contas"},
    # Lazer
    {"text": "cinema ingresso", "label": "Lazer"},
    {"text": "spotify assinatura", "label": "Lazer"},
    {"text": "netflix assinatura", "label": "Lazer"},
    {"text": "show ingresso", "label": "Lazer"},
    {"text": "parque diversoes", "label": "Lazer"},
    # Educacao
    {"text": "curso online", "label": "Educacao"},
    {"text": "faculdade mensalidade", "label": "Educacao"},
    {"text": "livros escolares", "label": "Educacao"},
    # Vestuario
    {"text": "roupa loja", "label": "Vestuario"},
    {"text": "tenis esporte", "label": "Vestuario"},
    {"text": "sapato social", "label": "Vestuario"},
    # Servicos
    {"text": "salao de beleza", "label": "Servicos"},
    {"text": "barbearia", "label": "Servicos"},
    {"text": "lavanderia", "label": "Servicos"},
    {"text": "manutencao carro", "label": "Servicos"},
    # Pets
    {"text": "petshop racao", "label": "Pets"},
    {"text": "veterinario", "label": "Pets"},
    # Viagem
    {"text": "passagem aerea", "label": "Viagem"},
    {"text": "hotel reserva", "label": "Viagem"},
    {"text": "airbnb", "label": "Viagem"},
    # Assinaturas
    {"text": "amazon prime", "label": "Assinaturas"},
    {"text": "google drive", "label": "Assinaturas"},
    {"text": "office 365", "label": "Assinaturas"},
    # Impostos
    {"text": "taxa bancaria", "label": "Impostos"},
    {"text": "multa transito", "label": "Impostos"},
    {"text": "imposto renda", "label": "Impostos"},
    # Investimentos
    {"text": "aplicacao tesouro direto", "label": "Investimentos"},
    {"text": "corretora aporte", "label": "Investimentos"},
    # Transferencias
    {"text": "pix para amigo", "label": "Transferencias"},
    {"text": "transferencia bancaria", "label": "Transferencias"},
    # Outros
    {"text": "presente aniversario", "label": "Outros"},
    {"text": "doacao ong", "label": "Outros"},
]


feedback_file = "feedback.csv"
if os.path.exists(feedback_file):
    print(f"Carregando dados de feedback de: {feedback_file}")
    feedback_df = pd.read_csv(feedback_file)
    feedback_df = feedback_df.dropna(subset=["text", "label"])
    feedback_data = feedback_df.to_dict("records")
    data = base_data + feedback_data
    print(f"Total de {len(feedback_data)} exemplos carregados do feedback.")
else:
    print("Arquivo de feedback nao encontrado. Usando apenas o dataset base.")
    data = base_data

data = [{"text": normalize_text(d["text"]), "label": d["label"]} for d in data]

texts = [d["text"] for d in data]
labels = [d["label"] for d in data]
unique_labels = sorted(list(set(labels)))

label_counts = {}
for label in labels:
    label_counts[label] = label_counts.get(label, 0) + 1

min_count = min(label_counts.values()) if label_counts else 0
num_classes = len(unique_labels)
has_enough_classes = num_classes >= 2 and min_count >= 2

if len(data) < 10 or not has_enough_classes:
    X_train, y_train = texts, labels
    X_test, y_test = [], []
else:
    desired_test_size = max(num_classes, int(len(data) * 0.2))
    if desired_test_size >= len(data):
        X_train, y_train = texts, labels
        X_test, y_test = [], []
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            texts,
            labels,
            test_size=desired_test_size,
            random_state=42,
            stratify=labels,
        )

pipeline = Pipeline(
    [
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("clf", LogisticRegression(max_iter=1000)),
    ]
)

print("Iniciando treinamento...")
pipeline.fit(X_train, y_train)

if X_test:
    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Metricas finais: {{'accuracy': {acc:.4f}}}")

output_path = "./model"
os.makedirs(output_path, exist_ok=True)

model_path = os.path.join(output_path, "model.joblib")
joblib.dump(pipeline, model_path)

labels_path = os.path.join(output_path, "labels.json")
with open(labels_path, "w") as f:
    json.dump({"labels": unique_labels}, f)

print(f"Modelo salvo com sucesso em: {output_path}")
