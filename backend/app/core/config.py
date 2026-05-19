from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://jitsu_user:jitsu_password@localhost:5432/jitsu_db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 1 week
    UPLOAD_DIR: str = "./uploads"
    TUTOR_EMAIL: str = "tutor@jitsu.com"
    TUTOR_PASSWORD: str = "tutor123"
    TUTOR_NAME: str = "Head Tutor"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
