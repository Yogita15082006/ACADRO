import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Explicitly load the .env file into the environment
print(f"Loading env from: {ENV_PATH}")
load_dotenv(ENV_PATH, override=True)
print(f"Loaded GROQ_API_KEY from os.environ: {os.environ.get('GROQ_API_KEY')}")

class Settings(BaseSettings):
    groq_api_key: str
    groq_base_url: str = "https://api.groq.com/openai/v1/chat/completions"
    groq_model: str = "gemma2-9b-it"
    timeout_ms: int = 300000
    max_retries: int = 3

    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8", extra="ignore")

settings = Settings()
