from abc import ABC, abstractmethod
from langchain_core.messages import SystemMessage


class BaseAutomotiveAgent(ABC):
    """
    Classe de base pour tous les agents automobiles.
    """

    def __init__(self, llm, role: str, expertise: str):
        self.llm = llm
        self.role = role
        self.expertise = expertise

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        pass

    def run(self, messages, vehicle_context=None):
        if vehicle_context is None:
            vehicle_context = {}

        context_text = ""

        if vehicle_context:
            context_text = "\n".join(
                [f"{k}: {v}" for k, v in vehicle_context.items()]
            )

        system_message = SystemMessage(
            content=f"{self.system_prompt}\n\nContexte véhicule :\n{context_text}"
        )

        response = self.llm.invoke(
            [system_message] + messages
        )

        return response.content