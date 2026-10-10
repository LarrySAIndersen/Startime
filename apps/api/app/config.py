from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_base_url: str = "http://127.0.0.1:4319"
    tz: str = "Europe/Copenhagen"
    keycloak_url: str = "http://127.0.0.1:8080"
    keycloak_realm: str = "star-dev"
    keycloak_client_id: str = "star-hub"
    next_telemetry_disabled: str = "1"


settings = Settings()
