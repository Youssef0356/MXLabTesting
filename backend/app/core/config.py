import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

MODEL_STORAGE = os.getenv("MODEL_STORAGE", "models")
QR_STORAGE = os.getenv("QR_STORAGE", os.path.join(BASE_DIR, "qrcodes"))
