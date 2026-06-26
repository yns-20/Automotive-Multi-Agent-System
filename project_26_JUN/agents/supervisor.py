"""
Supervisor Agent - Architecture Multi-Agents Automobile
Orchestre les agents spécialisés via LangGraph
"""

import uuid
from typing import Annotated, Literal, TypedDict
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from agents.diagnostic_agent import DiagnosticAgent
from agents.maintenance_agent import MaintenanceAgent
from agents.parts_agent import PartsAgent
from agents.telemetry_agent import TelemetryAgent
from monitoring.monitor import MonitoringAgent


# ─── State Definition ────────────────────────────────────────────────────────

class AutoState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next_agent: str
    correlation_id: str
    vehicle_context: dict
    agent_history: list[str]


# ─── LLM Placeholder (sera mocké dans les tests) ─────────────────────────────

import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

diagnostic_agent = DiagnosticAgent(llm)
maintenance_agent = MaintenanceAgent(llm)
parts_agent = PartsAgent(llm)
telemetry_agent = TelemetryAgent(llm)
monitoring_agent = MonitoringAgent()


# ─── Supervisor Node ─────────────────────────────────────────────────────────

AGENTS = ["diagnostic", "maintenance", "parts", "telemetry", "finish"]


def supervisor_node(state: AutoState) -> AutoState:
    correlation_id = state.get("correlation_id", str(uuid.uuid4()))

    monitoring_agent.log(
        correlation_id,
        "supervisor",
        "routing_decision"
    )

    system_prompt = """
Tu es un superviseur automobile.

Ta mission est de choisir UN SEUL agent.

diagnostic :
- code OBD
- panne
- voyant moteur
- problème mécanique

maintenance :
- entretien
- vidange
- révision
- calendrier maintenance

parts :
- pièce
- référence
- compatibilité
- prix

telemetry :
- température
- consommation
- capteurs
- performance

Réponds uniquement avec :

diagnostic
maintenance
parts
telemetry
FINISH

Aucun texte supplémentaire.
"""

    messages = [{"role": "system", "content": system_prompt}] + [
        {
            "role": "user",
            "content": getattr(m, "content", str(m))
        }
        for m in state["messages"]
    ]

    response = llm.invoke(messages)
    next_agent = response.content.strip().lower()

    if next_agent not in AGENTS:
        next_agent = "FINISH"

    monitoring_agent.log(
        correlation_id,
        "supervisor",
        f"routed_to={next_agent}"
    )

    return {
        **state,
        "next_agent": next_agent,
        "correlation_id": correlation_id,
        "agent_history": state.get("agent_history", [])
        + [f"supervisor→{next_agent}"],
    }


# ─── Agent Nodes ─────────────────────────────────────────────────────────────

def diagnostic_node(state: AutoState) -> AutoState:
    correlation_id = state.get("correlation_id")
    monitoring_agent.log(correlation_id, "diagnostic", "start")
    result = diagnostic_agent.run(
        state["messages"],
        state.get("vehicle_context", {})
    )
    monitoring_agent.log(correlation_id, "diagnostic", "end")

    return {
        **state,
        "messages": state["messages"] + [AIMessage(content=result)],
        "agent_history": state["agent_history"] + ["diagnostic:done"],
    }


def maintenance_node(state: AutoState) -> AutoState:
    correlation_id = state.get("correlation_id")
    monitoring_agent.log(correlation_id, "maintenance", "start")
    result = maintenance_agent.run(
        state["messages"],
        state.get("vehicle_context", {})
    )
    monitoring_agent.log(correlation_id, "maintenance", "end")

    return {
        **state,
        "messages": state["messages"] + [AIMessage(content=result)],
        "agent_history": state["agent_history"] + ["maintenance:done"],
    }


def parts_node(state: AutoState) -> AutoState:
    correlation_id = state.get("correlation_id")
    monitoring_agent.log(correlation_id, "parts", "start")
    result = parts_agent.run(
        state["messages"],
        state.get("vehicle_context", {})
    )
    monitoring_agent.log(correlation_id, "parts", "end")

    return {
        **state,
        "messages": state["messages"] + [AIMessage(content=result)],
        "agent_history": state["agent_history"] + ["parts:done"],
    }


def telemetry_node(state: AutoState) -> AutoState:
    correlation_id = state.get("correlation_id")
    monitoring_agent.log(correlation_id, "telemetry", "start")
    result = telemetry_agent.run(
        state["messages"],
        state.get("vehicle_context", {})
    )
    monitoring_agent.log(correlation_id, "telemetry", "end")

    return {
        **state,
        "messages": state["messages"] + [AIMessage(content=result)],
        "agent_history": state["agent_history"] + ["telemetry:done"],
    }


# ─── Routing ─────────────────────────────────────────────────────────────────

def route(
    state: AutoState
) -> Literal[
    "diagnostic",
    "maintenance",
    "parts",
    "telemetry",
    "__end__"
]:
    mapping = {
        "diagnostic": "diagnostic",
        "maintenance": "maintenance",
        "parts": "parts",
        "telemetry": "telemetry",
    }

    return mapping.get(
        state.get("next_agent", "").lower(),
        "__end__"
    )


# ─── Graph ───────────────────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(AutoState)

    graph.add_node("supervisor", supervisor_node)
    graph.add_node("diagnostic", diagnostic_node)
    graph.add_node("maintenance", maintenance_node)
    graph.add_node("parts", parts_node)
    graph.add_node("telemetry", telemetry_node)

    graph.add_edge(START, "supervisor")

    graph.add_conditional_edges(
        "supervisor",
        route,
        {
            "diagnostic": "diagnostic",
            "maintenance": "maintenance",
            "parts": "parts",
            "telemetry": "telemetry",
            "__end__": END,
        },
    )

    graph.add_edge("diagnostic", END)
    graph.add_edge("maintenance", END)
    graph.add_edge("parts", END)
    graph.add_edge("telemetry", END)

    return graph.compile()


automotive_graph = build_graph()


def run(user_input: str, vehicle_context: dict = None):
    correlation_id = str(uuid.uuid4())

    # Log global session start
    monitoring_agent.log(
        correlation_id,
        "system",
        "session_start",
        extra={"query": user_input, "vehicle_context": vehicle_context or {}}
    )

    initial_state: AutoState = {
        "messages": [HumanMessage(content=user_input)],
        "next_agent": "",
        "correlation_id": correlation_id,
        "vehicle_context": vehicle_context or {},
        "agent_history": [],
    }

    final_state = automotive_graph.invoke(initial_state)

    response_content = final_state["messages"][-1].content

    # Log global session end
    monitoring_agent.log(
        correlation_id,
        "system",
        "session_end",
        extra={"response": response_content}
    )

    return {
        "correlation_id": correlation_id,
        "response": response_content,
        "agent_history": final_state["agent_history"],
    }