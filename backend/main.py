from fastapi import FastAPI
from api.routes import facility_admin
from database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MTAA Health Backend")

app.include_router(facility_admin.router)

@app.get("/")
def read_root():
    return {"message": "MTAA Health API is running"}
