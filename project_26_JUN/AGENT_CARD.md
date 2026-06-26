# Agent Card — Automotive Multi-Agent System
> Critère de gouvernance : Agent Card complète et à jour ✅

---

## Identité du Système

| Champ              | Valeur                                              |
|--------------------|-----------------------------------------------------|
| **Nom**            | Automotive MAS                                      |
| **Version**        | 1.0.0                                               |
| **Architecture**   | Supervisor + 4 agents spécialisés (LangGraph)       |
| **Secteur**        | Automobile                                          |
| **Langue**         | Français                                            |
| **Modèle LLM**     | claude-3-5-sonnet-20241022                          |
| **Framework**      | LangGraph + LangChain                               |

---

## Agents du Système

### 🧠 Supervisor Agent
- **Rôle** : Orchestrateur central (Supervisor pattern)
- **Responsabilité** : Analyser la requête utilisateur et router vers l'agent approprié
- **Sorties** : Décision de routage (`diagnostic | maintenance | parts | telemetry | FINISH`)
- **Biais connus** : Peut hésiter entre diagnostic et télémétrie pour des symptômes ambigus

### 🔍 Diagnostic Agent
- **Rôle** : Analyse des pannes et codes OBD-II
- **Expertise** : Codes P/C/B/U, symptômes moteur, arbres de diagnostic
- **Limites** : Ne peut pas accéder à un dongle OBD physique (simulation uniquement)

### 🛠️ Maintenance Agent
- **Rôle** : Planification d'entretien préventif
- **Expertise** : Intervalles constructeurs, préconisations huiles/fluides
- **Limites** : Les coûts sont estimatifs (varient selon région et garage)

### 🔩 Parts Agent
- **Rôle** : Identification de pièces détachées
- **Expertise** : Références OEM, aftermarket, compatibilité inter-modèles
- **Limites** : Pas de connexion temps réel aux catalogues fournisseurs

### 📊 Telemetry Agent
- **Rôle** : Analyse des données capteurs et performances
- **Expertise** : CAN-bus, MAP, lambda, températures, consommation
- **Limites** : Données fournies par l'utilisateur (pas de flux live intégré)

### 👁️ Monitoring Agent
- **Rôle** : Observabilité transversale
- **Fonction clé** : Génère et propage le **Correlation ID** sur chaque exécution
- **Format** : Logs JSON structurés (ELK/Loki-ready)

---

## Flux d'Exécution

```
Utilisateur
    │
    ▼
[Supervisor] ──── route ────► [Diagnostic Agent]
    ▲                         [Maintenance Agent]
    │◄──── retour ────────── [Parts Agent]
                              [Telemetry Agent]
    │
    ▼
[Réponse finale]

[Monitoring Agent] ← injecté sur chaque nœud du graphe
```

---

## Observabilité

Chaque exécution émet des logs JSON avec :
```json
{
  "timestamp":      "2026-06-26T10:00:00Z",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent":          "diagnostic",
  "event":          "processing",
  "level":          "INFO"
}
```

---

## Sécurité & Éthique

| Dimension        | Mesure                                                |
|------------------|-------------------------------------------------------|
| Hallucination    | Agents spécialisés avec prompts contraints            |
| Données privées  | Aucune donnée véhicule persistée sans consentement    |
| Responsabilité   | Réponses à titre informatif, non substitut pro        |
| Biais            | Évaluation continue via tests automatisés             |

---

## Dépendances

```
langgraph>=0.2.0
langchain>=0.3.0
langchain-anthropic>=0.3.0
python>=3.11
```

---

*Dernière mise à jour : 2026-06-26 | Maintenu par l'équipe Automotive MAS*
