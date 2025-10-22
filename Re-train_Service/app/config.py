import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
    WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "isiriw")
    PROJECT = os.getenv("ROBOFLOW_PROJECT", "transformer-thermal-images-bpkdr")

    if not ROBOFLOW_API_KEY:
        raise RuntimeError("ROBOFLOW_API_KEY not set in environment variables")
