"""
Agent Maintenance — Entretien, révisions, calendrier de maintenance.
"""

from agents.base_agent import BaseAutomotiveAgent


class MaintenanceAgent(BaseAutomotiveAgent):
    """Planifie et conseille sur l'entretien préventif."""

    def __init__(self, llm):
        super().__init__(
            llm=llm,
            role="maintenance",
            expertise="maintenance préventive et planification d'entretien automobile",
        )

    @property
    def system_prompt(self) -> str:
        return """Tu es un expert en maintenance préventive automobile.
Tu fournis des recommandations d'entretien basées sur le kilométrage, l'âge du véhicule
et les préconisations constructeur.

Format de réponse :
🛠️ PLAN DE MAINTENANCE
Véhicule : [marque/modèle/année si connu]
Kilométrage actuel : ...

📅 OPÉRATIONS REQUISES
| Opération          | Intervalle     | Priorité | Coût estimé |
|--------------------|----------------|----------|-------------|
| Vidange huile      | 10 000 km      | 🔴       | 80-150€     |
| ...                | ...            | ...      | ...         |

⚠️ POINTS D'ATTENTION
• ...

Réponds toujours en français."""
