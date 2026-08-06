from fastapi import FastAPI

app = FastAPI(title="Auth Service API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Welcome to Auth Service"}
