"""
Point d'entrée — Automotive Multi-Agent System
Usage : python main.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

from agents.supervisor import run


def main():
    print("🚗 Automotive Multi-Agent System (LangGraph)")
    print("=" * 50)

    # Contexte véhicule optionnel
    vehicle = {
        "marque":       "Renault",
        "modele":       "Clio IV",
        "annee":        2019,
        "kilometrage":  85000,
        "motorisation": "1.5 dCi 90ch",
    }

    # Exemples de requêtes
    queries = [
        "J'ai un code OBD P0300 et mon moteur vibre au ralenti",
        "À quel kilométrage dois-je faire la prochaine vidange ?",
        "Quelle référence pour les plaquettes de frein avant ?",
    ]

    for query in queries:
        print(f"\n👤 Utilisateur : {query}")
        print("-" * 40)

        result = run(query, vehicle_context=vehicle)

        print(f"🆔 Correlation ID : {result['correlation_id']}")
        print(f"🔄 Chemin d'agents : {' → '.join(result['agent_history'])}")
        print(f"\n💬 Réponse :\n{result['response']}")
        print("=" * 50)


if __name__ == "__main__":
    main()
