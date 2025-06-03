from fastapi import FastAPI
from pydantic import BaseModel
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import json

app = FastAPI()

# Load model and tokenizer
MODEL_PATH = "./needs_model/knowledge_sharing"
model = BertForSequenceClassification.from_pretrained(MODEL_PATH)
tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
model.eval()  # Important: set to evaluation mode

# Load id2label mapping
with open(f"{MODEL_PATH}/id2label.json", "r", encoding="utf-8") as f:
    id2label = json.load(f)

# Request model
class TextInput(BaseModel):
    text: str

@app.post("/predict")
def predict(input: TextInput):
    inputs = tokenizer(input.text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    predicted_id = torch.argmax(probs, dim=1).item()
    confidence = probs[0][predicted_id].item()

    label_info = id2label.get(str(predicted_id), {
        "category": "Uncategorized",
        "sub_category": "Uncategorized"
    })

    return {
        "category": label_info["category"],
        "sub_category": label_info["sub_category"],
        "confidence": confidence
    }






