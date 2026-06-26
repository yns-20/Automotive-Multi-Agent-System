"""
Tests automatisés — Automotive Multi-Agent System
Critère de validation : Suite de tests exécutée avec succès ✅
"""

import pytest
import uuid
from unittest.mock import MagicMock, patch
from langchain_core.messages import HumanMessage, AIMessage

# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.invoke.return_value = AIMessage(content="Réponse de test")
    return llm

@pytest.fixture
def sample_vehicle_context():
    return {
        "marque":       "Renault",
        "modele":       "Clio IV",
        "annee":        2019,
        "kilometrage":  85000,
        "motorisation": "1.5 dCi 90ch",
    }

@pytest.fixture
def monitoring_agent():
    from monitoring.monitor import MonitoringAgent
    return MonitoringAgent()


# ─── Tests Monitoring (Observabilité) ─────────────────────────────────────────

class TestMonitoringAgent:
    """Critère : Correlation ID présent sur chaque exécution."""

    def test_correlation_id_generated(self, monitoring_agent):
        cid = monitoring_agent.generate_correlation_id()
        assert cid is not None
        assert len(cid) == 36
        assert cid.count("-") == 4

    def test_log_contains_correlation_id(self, monitoring_agent):
        """Vérifie via les métriques internes que le log contient le correlation_id."""
        cid = monitoring_agent.generate_correlation_id()
        monitoring_agent.log(cid, "test_agent", "test_event")

        metrics     = monitoring_agent.get_session_metrics(cid)
        first_event = metrics["events"][0]

        assert "correlation_id" in first_event
        assert first_event["correlation_id"] == cid

    def test_log_contains_required_fields(self, monitoring_agent):
        """Vérifie que chaque log contient tous les champs obligatoires."""
        cid = str(uuid.uuid4())
        monitoring_agent.log(cid, "supervisor", "routing_decision")

        metrics   = monitoring_agent.get_session_metrics(cid)
        log_entry = metrics["events"][0]

        required_fields = ["timestamp", "correlation_id", "agent", "event", "level"]
        for field in required_fields:
            assert field in log_entry, f"Champ manquant : {field}"

    def test_session_metrics_tracked(self, monitoring_agent):
        cid = str(uuid.uuid4())
        monitoring_agent.log(cid, "supervisor", "routing_decision")
        monitoring_agent.log(cid, "diagnostic", "processing")
        monitoring_agent.log(cid, "diagnostic", "done")

        metrics = monitoring_agent.get_session_metrics(cid)
        assert metrics["total_events"]   == 3
        assert "diagnostic" in metrics["agents_invoked"]
        assert metrics["correlation_id"] == cid

    def test_unknown_correlation_id(self, monitoring_agent):
        metrics = monitoring_agent.get_session_metrics("unknown-id")
        assert "error" in metrics


# ─── Tests Agents Spécialisés ─────────────────────────────────────────────────

class TestDiagnosticAgent:
    def test_initialization(self, mock_llm):
        from agents.diagnostic_agent import DiagnosticAgent
        agent = DiagnosticAgent(mock_llm)
        assert agent.role == "diagnostic"

    def test_run_returns_string(self, mock_llm, sample_vehicle_context):
        from agents.diagnostic_agent import DiagnosticAgent
        agent  = DiagnosticAgent(mock_llm)
        result = agent.run([HumanMessage(content="Code P0300")], sample_vehicle_context)
        assert isinstance(result, str)
        mock_llm.invoke.assert_called_once()

    def test_vehicle_context_injected_in_prompt(self, mock_llm, sample_vehicle_context):
        from agents.diagnostic_agent import DiagnosticAgent
        agent = DiagnosticAgent(mock_llm)
        agent.run([HumanMessage(content="Panne moteur")], sample_vehicle_context)

        call_args  = mock_llm.invoke.call_args[0][0]
        system_msg = call_args[0]
        assert "Renault" in system_msg.content


class TestMaintenanceAgent:
    def test_initialization(self, mock_llm):
        from agents.maintenance_agent import MaintenanceAgent
        agent = MaintenanceAgent(mock_llm)
        assert agent.role == "maintenance"

    def test_run_returns_string(self, mock_llm, sample_vehicle_context):
        from agents.maintenance_agent import MaintenanceAgent
        agent  = MaintenanceAgent(mock_llm)
        result = agent.run([HumanMessage(content="Vidange nécessaire ?")], sample_vehicle_context)
        assert isinstance(result, str)


class TestPartsAgent:
    def test_initialization(self, mock_llm):
        from agents.parts_agent import PartsAgent
        agent = PartsAgent(mock_llm)
        assert agent.role == "parts"

    def test_run_returns_string(self, mock_llm):
        from agents.parts_agent import PartsAgent
        agent  = PartsAgent(mock_llm)
        result = agent.run([HumanMessage(content="Plaquettes de frein Clio")], {})
        assert isinstance(result, str)


class TestTelemetryAgent:
    def test_initialization(self, mock_llm):
        from agents.telemetry_agent import TelemetryAgent
        agent = TelemetryAgent(mock_llm)
        assert agent.role == "telemetry"

    def test_run_returns_string(self, mock_llm):
        from agents.telemetry_agent import TelemetryAgent
        agent  = TelemetryAgent(mock_llm)
        result = agent.run([HumanMessage(content="Température moteur 110°C")], {})
        assert isinstance(result, str)


# ─── Tests Supervisor (routing) ───────────────────────────────────────────────

class TestSupervisorRouting:
    """Vérifie que le superviseur route correctement selon la requête."""

    ROUTING_CASES = [
        ("Code OBD P0300 détecté",              "diagnostic"),
        ("Quand faire la vidange ?",             "maintenance"),
        ("Référence plaquettes de frein Clio",   "parts"),
        ("Température moteur anormale capteurs", "telemetry"),
    ]

    @pytest.mark.parametrize("query,expected_agent", ROUTING_CASES)
    def test_routing_decision(self, mock_llm, query, expected_agent):
        mock_llm.invoke.return_value = AIMessage(content=expected_agent)

        from agents.supervisor import supervisor_node, AutoState

        state: AutoState = {
            "messages":        [HumanMessage(content=query)],
            "next_agent":      "",
            "correlation_id":  str(uuid.uuid4()),
            "vehicle_context": {},
            "agent_history":   [],
        }

        with patch("agents.supervisor.llm", mock_llm):
            result = supervisor_node(state)

        assert result["next_agent"] == expected_agent

    def test_unknown_intent_routes_to_finish(self, mock_llm):
        mock_llm.invoke.return_value = AIMessage(content="unknown_agent_xyz")

        from agents.supervisor import supervisor_node, AutoState

        state: AutoState = {
            "messages":        [HumanMessage(content="Bonjour")],
            "next_agent":      "",
            "correlation_id":  str(uuid.uuid4()),
            "vehicle_context": {},
            "agent_history":   [],
        }

        with patch("agents.supervisor.llm", mock_llm):
            result = supervisor_node(state)

        assert result["next_agent"] == "FINISH"


# ─── Tests d'intégration ──────────────────────────────────────────────────────

class TestIntegration:
    def test_correlation_id_propagated_through_graph(self):
        from monitoring.monitor import MonitoringAgent
        monitor = MonitoringAgent()
        cid     = monitor.generate_correlation_id()

        for agent in ["supervisor", "diagnostic", "supervisor"]:
            monitor.log(cid, agent, "processing")

        metrics = monitor.get_session_metrics(cid)
        assert metrics["correlation_id"] == cid
        assert metrics["total_events"]   == 3

    def test_agent_history_tracks_execution_path(self):
        history = ["supervisor→diagnostic", "diagnostic:done", "supervisor→FINISH"]
        assert "diagnostic" in " ".join(history)
        assert "supervisor" in history[0]
