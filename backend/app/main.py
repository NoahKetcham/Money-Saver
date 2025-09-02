from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import accounts, transactions, auth as auth_router


def create_app() -> FastAPI:
    app = FastAPI(title="Money Saver API", version="0.1.0")

    # CORS (adjust origins as needed)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"]
        ,
        allow_headers=["*"]
    )

    # Create tables on startup if they don't exist
    Base.metadata.create_all(bind=engine)

    app.include_router(auth_router.router)
    app.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
    app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()


