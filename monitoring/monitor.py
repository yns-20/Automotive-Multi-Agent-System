"""
Agent de Monitoring — Observabilité avec Correlation ID.
Critère de validation : Correlation ID présent sur chaque exécution.
"""

import logging
import json
import uuid
import os
from datetime import datetime, timezone

# ─── Logger structuré ────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",   # JSON brut → ingestion ELK/Loki-ready
)
logger = logging.getLogger("automotive.mas")


class MonitoringAgent:
    """
    Agent de monitoring transversal.
    - Génère et propage le Correlation ID
    - Logge chaque événement en JSON structuré
    - Collecte les métriques d'exécution
    - Persiste les données dans monitoring/metrics_db.json
    """

    def __init__(self, db_path: str = "monitoring/metrics_db.json"):
        self.db_path = db_path
        self._metrics: dict[str, list] = {}   # correlation_id → events
        self._load_db()

    def _load_db(self) -> None:
        """Charge les métriques persistées si le fichier existe."""
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    self._metrics = json.load(f)
            except Exception:
                self._metrics = {}

    def _save_db(self) -> None:
        """Sauvegarde les métriques dans le fichier JSON."""
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(self._metrics, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    # ─── Logging ─────────────────────────────────────────────────────────────

    def log(
        self,
        correlation_id: str,
        agent: str,
        event: str,
        level: str = "INFO",
        extra: dict | None = None,
    ) -> None:
        """
        Émet un log structuré JSON avec le Correlation ID.
        Satisfait le critère d'observabilité du projet.
        """
        record = {
            "timestamp":      datetime.now(timezone.utc).isoformat(),
            "correlation_id": correlation_id,    # ← critère obligatoire
            "agent":          agent,
            "event":          event,
            "level":          level,
        }
        if extra:
            record["extra"] = extra

        log_fn = getattr(logger, level.lower(), logger.info)
        log_fn(json.dumps(record, ensure_ascii=False))

        # Stockage interne pour métriques
        if correlation_id not in self._metrics:
            self._metrics[correlation_id] = []
        self._metrics[correlation_id].append(record)
        self._save_db()

    # ─── Métriques ────────────────────────────────────────────────────────────

    def get_session_metrics(self, correlation_id: str) -> dict:
        """Retourne les métriques d'une session identifiée par son Correlation ID."""
        events = self._metrics.get(correlation_id, [])
        if not events:
            return {"error": "correlation_id inconnu"}

        agents_used = list({e["agent"] for e in events if e["agent"] not in ("system", "supervisor")})
        start = events[0]["timestamp"]
        end   = events[-1]["timestamp"]

        # Extraire la requête et la réponse si disponibles
        query = ""
        response = ""
        for e in events:
            if e["event"] == "session_start" and e.get("extra"):
                query = e["extra"].get("query", "")
            if e["event"] == "session_end" and e.get("extra"):
                response = e["extra"].get("response", "")

        return {
            "correlation_id": correlation_id,
            "total_events":   len(events),
            "agents_invoked": agents_used,
            "session_start":  start,
            "session_end":    end,
            "query":          query,
            "response":       response,
            "events":         events,
        }

    def get_all_sessions(self) -> list:
        """Retourne la liste résumée de toutes les sessions, du plus récent au plus ancien."""
        sessions = []
        for cid in self._metrics:
            metrics = self.get_session_metrics(cid)
            if "error" not in metrics:
                # Calculer la durée en millisecondes
                try:
                    t_start = datetime.fromisoformat(metrics["session_start"].replace("Z", "+00:00"))
                    t_end = datetime.fromisoformat(metrics["session_end"].replace("Z", "+00:00"))
                    duration_ms = int((t_end - t_start).total_seconds() * 1000)
                except Exception:
                    duration_ms = 0

                sessions.append({
                    "correlation_id": cid,
                    "query":          metrics.get("query", ""),
                    "response":       metrics.get("response", ""),
                    "timestamp":      metrics["session_start"],
                    "agents_invoked": metrics["agents_invoked"],
                    "duration_ms":    duration_ms,
                    "event_count":    metrics["total_events"]
                })
        # Trier du plus récent au plus ancien
        sessions.sort(key=lambda s: s["timestamp"], reverse=True)
        return sessions

    def get_global_metrics(self) -> dict:
        """Retourne des statistiques globales sur l'utilisation du système."""
        sessions = self.get_all_sessions()
        total_queries = len(sessions)
        if total_queries == 0:
            return {
                "total_queries": 0,
                "average_latency_ms": 0,
                "agent_distribution": {},
                "average_agent_latencies": {}
            }

        total_latency = 0
        agent_counts = {}
        agent_latencies = {}  # agent -> list of durations

        for s in sessions:
            total_latency += s["duration_ms"]
            for agent in s["agents_invoked"]:
                agent_counts[agent] = agent_counts.get(agent, 0) + 1

        # Calculer le temps par agent
        for cid, events in self._metrics.items():
            agent_starts = {}
            for e in events:
                agent = e["agent"]
                if agent in ("system", "supervisor"):
                    continue
                if e["event"] == "start":
                    agent_starts[agent] = e["timestamp"]
                elif e["event"] == "end" and agent in agent_starts:
                    try:
                        t_start = datetime.fromisoformat(agent_starts[agent].replace("Z", "+00:00"))
                        t_end = datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00"))
                        dur = int((t_end - t_start).total_seconds() * 1000)
                        if agent not in agent_latencies:
                            agent_latencies[agent] = []
                        agent_latencies[agent].append(dur)
                    except Exception:
                        pass

        avg_agent_latencies = {}
        for agent, list_durations in agent_latencies.items():
            if list_durations:
                avg_agent_latencies[agent] = int(sum(list_durations) / len(list_durations))

        return {
            "total_queries":       total_queries,
            "average_latency_ms":  int(total_latency / total_queries),
            "agent_distribution":  agent_counts,
            "average_agent_latencies": avg_agent_latencies,
        }

    def generate_correlation_id(self) -> str:
        """Génère un Correlation ID unique (UUID v4)."""
        return str(uuid.uuid4())
