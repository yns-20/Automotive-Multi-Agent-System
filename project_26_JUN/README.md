# 🚗 Automotive Multi-Agent Support System

Une plateforme intelligente basée sur des agents IA permettant d'assister les utilisateurs dans le diagnostic, l'analyse et le support automobile grâce à une architecture multi-agents orchestrée par LangGraph.

---

## 📋 Vue d'ensemble

Ce projet implémente un système multi-agents capable de :

- Comprendre les requêtes utilisateurs
- Router automatiquement les demandes vers l'agent approprié
- Gérer les sessions de conversation
- Collecter les métriques d'exécution
- Fournir un dashboard de supervision en temps réel

L'application est composée de :

1. Backend FastAPI
2. Agents IA LangGraph
3. Dashboard React/Vite
4. API REST pour l'intégration externe

---

## 🏗️ Architecture

```text
┌─────────────────┐
│ Dashboard React │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FastAPI API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LangGraph Hub  │
└────────┬────────┘
         │
 ┌───────┼────────┐
 ▼       ▼        ▼
Agent  Agent   Agent
 A       B       C