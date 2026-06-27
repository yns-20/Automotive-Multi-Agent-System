from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.supervisor import run, monitoring_agent

app = FastAPI(title="Automotive Multi-Agent API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    question: str
    vehicle_context: dict | None = None


@app.get("/")
def root():
    return {"status": "running"}


@app.post("/query")
def query(data: QueryRequest):
    # Default vehicle context if none provided
    vehicle = data.vehicle_context or {
        "marque": "Renault",
        "modele": "Clio IV",
        "annee": 2019,
        "kilometrage": 85000,
        "motorisation": "1.5 dCi 90ch"
    }

    try:
        return run(
            data.question,
            vehicle_context=vehicle
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions")
def get_sessions():
    """Return all session summaries, sorted by date (newest first)."""
    return monitoring_agent.get_all_sessions()


@app.get("/sessions/{correlation_id}")
def get_session(correlation_id: str):
    """Return detailed trace and metrics for a specific session."""
    metrics = monitoring_agent.get_session_metrics(correlation_id)
    if "error" in metrics:
        raise HTTPException(status_code=404, detail="Correlation ID not found")
    return metrics


@app.get("/metrics")
def get_global_metrics():
    """Return aggregated system performance metrics."""
    return monitoring_agent.get_global_metrics()