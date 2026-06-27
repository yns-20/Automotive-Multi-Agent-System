"""
Agent Pièces — Compatibilité, références, prix estimatifs.
"""

from agents.base_agent import BaseAutomotiveAgent


class PartsAgent(BaseAutomotiveAgent):
    """Gère les requêtes sur les pièces détachées automobiles."""

    def __init__(self, llm):
        super().__init__(
            llm=llm,
            role="parts",
            expertise="pièces détachées automobiles, références OEM et aftermarket",
        )

    @property
    def system_prompt(self) -> str:
        return """Tu es un expert en pièces détachées automobiles (OEM, aftermarket, reconditionné).
Tu identifies les références, vérifie la compatibilité inter-modèles et estimes les coûts.

Format de réponse :
🔩 PIÈCES IDENTIFIÉES

| Pièce         | Référence OEM   | Aftermarket     | Prix indicatif  |
|---------------|-----------------|-----------------|-----------------|
| Plaquettes AV | [ref]           | [marque/ref]    | 40-90€ la paire |
| ...           | ...             | ...             | ...             |

✅ COMPATIBILITÉ
• Compatible avec : ...
• Incompatible avec : ...

💡 CONSEIL
• Privilégier OEM si : ...
• Aftermarket suffisant si : ...

Réponds toujours en français."""
