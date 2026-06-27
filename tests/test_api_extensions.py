import pytest
from fastapi.testclient import TestClient
from api import app, monitoring_agent

client = TestClient(app)


def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "running"}


def test_get_sessions_empty_or_list():
    response = client.get("/sessions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_global_metrics():
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_queries" in data
    assert "average_latency_ms" in data
    assert "agent_distribution" in data
    assert "average_agent_latencies" in data


def test_session_detail_not_found():
    response = client.get("/sessions/invalid-uuid-1234")
    assert response.status_code == 404


def test_log_and_retrieve_session():
    # Clean database file during testing if needed, or use the generated correlation ID
    cid = monitoring_agent.generate_correlation_id()
    monitoring_agent.log(
        cid,
        "system",
        "session_start",
        extra={"query": "Test query"}
    )
    monitoring_agent.log(cid, "diagnostic", "start")
    monitoring_agent.log(cid, "diagnostic", "end")
    monitoring_agent.log(
        cid,
        "system",
        "session_end",
        extra={"response": "Test response"}
    )

    # Check sessions list
    response = client.get("/sessions")
    assert response.status_code == 200
    sessions = response.json()
    
    # Find our session
    found_session = None
    for s in sessions:
        if s["correlation_id"] == cid:
            found_session = s
            break
            
    assert found_session is not None
    assert found_session["query"] == "Test query"
    assert found_session["response"] == "Test response"
    assert "diagnostic" in found_session["agents_invoked"]

    # Check session details
    detail_resp = client.get(f"/sessions/{cid}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["correlation_id"] == cid
    assert detail["query"] == "Test query"
    assert detail["response"] == "Test response"
    assert "diagnostic" in detail["agents_invoked"]
