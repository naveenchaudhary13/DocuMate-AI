from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import os, torch

app = Flask(__name__)
device = "cpu"
torch.set_num_threads(1)
model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2",
    device=device,
    cache_folder="./models",
    trust_remote_code=True
)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/embed", methods=["POST"])
def embed():
    try:
        data = request.get_json(force=True)
        texts = data.get("texts", [])
        
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({"error": "texts must be a non-empty list"}), 400

        embeddings = model.encode(
            texts,
            batch_size=8,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        return jsonify({"embeddings": embeddings.tolist()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
