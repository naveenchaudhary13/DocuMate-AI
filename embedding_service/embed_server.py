from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

app = Flask(__name__)

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/embed", methods=["POST"])
def embed():
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    texts = data.get("texts")

    if not isinstance(texts, list) or len(texts) == 0:
        return jsonify({"error": "texts must be a non-empty list"}), 400

    embeddings = model.encode(
        texts,
        batch_size=16,
        show_progress_bar=False,
        convert_to_numpy=True,
    )

    return jsonify({"embeddings": embeddings.tolist()})
    

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
