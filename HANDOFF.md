# FinSense — Project Handoff & Operational Guide

## Current System State
FinSense is a fully functional, production-ready fintech web application unifying transaction intelligence, budget management, savings optimization, cash-flow forecasting, financial decision support, and a conversational AI copilot.

All ten required AI and intelligent-system techniques have genuine, verified implementations and are integrated into the application's unified database and user interface.

## Verification & Test Results
- **Automated Tests**: 17 / 17 passed (`pytest backend/app/tests/ -v`).
- **Frontend Production Build**: Completed cleanly (`npm run build` in 268ms, zero compilation errors).
- **Backend Health**: Verified live on `http://localhost:8000/health`.
- **Frontend Server**: Verified live on `http://localhost:5173`.
- **Default Demonstration Profile**: Pre-seeded with a comprehensive fictional Indian financial profile (INR ₹1,25,000/mo salary, multi-account ledger, calibrated anomalies, budget breaches, goals, bills).

---

## The 10 Integrated AI & Intelligent System Implementations

| # | Technique | Module Path | Inputs | Outputs & Product Role |
|---|---|---|---|---|
| 1 | **PEAS Agent Architecture** | `app/services/agent_peas.py` | Ledger transactions, budgets, bills, accounts, goals | Multi-sensor financial monitor orchestrating automated audits, risk flags, and prioritized actionable advice without unauthorized fund movement. |
| 2 | **Prolog Rule-Based Reasoning** | `app/services/prolog_engine.py` | Category budgets, transaction classifications, emergency reserves, goal pace | Genuine First-Order Horn Clause SLD Resolution engine evaluating budget violations, upcoming bills, and emergency reserve deficits with natural explanations. |
| 3 | **Financial Dependency Graph (BFS/DFS)** | `app/services/dependency_graph.py` | Income sources, allocation pools, mandatory expenses, discretionary nodes, goals | BFS evaluates level-by-level shockwaves (e.g. 20% salary cut); DFS traces complete causal allocation paths from income to leaf commitments. |
| 4 | **Goal-Based Budget Search (A*)** | `app/services/astar_search.py` | Target amount, deadline months, baseline surplus, category flexibilities & floors | Admissible heuristic state-space search minimizing inconvenience cost $g(n)$ while unlocking monthly savings to hit goal targets. |
| 5 | **Bill Strategy Simulator (Minimax)** | `app/services/minimax_simulator.py` | Recurring bill cost, subscription terms, provider identity | 3-round game-tree simulating User (MAX) actions (retain, downgrade, switch, negotiate) against simulated Provider (MIN) retention counter-offers. |
| 6 | **Fuzzy Spending Alert Controller** | `app/services/fuzzy_controller.py` | Burn rate, days remaining in cycle, goal completion % | 18+ fuzzy rules with Centroid defuzzification producing an urgency score (0-100) and qualitative status (Comfortable, Caution, High Risk, Freeze). |
| 7 | **Investment Readiness (Mamdani vs Sugeno)** | `app/services/investment_readiness.py` | Emergency coverage (months), expense stability score, goal progress, surplus | Side-by-side comparison: Mamdani outputs qualitative class & readiness score; Sugeno outputs crisp investable surplus bounded by a 70% safety ceiling. |
| 8 | **Cash-Flow Forecasting (ANFIS)** | `app/services/anfis_forecast.py` | Liquid balance, daily spend velocity, fixed upcoming bills, salary inflow timing | 5-Layer Takagi-Sugeno-Kang (TSK) neuro-fuzzy model trained via hybrid gradient descent predicting month-end balance alongside baseline benchmarks. |
| 9 | **Neural Anomaly Detection & Clustering** | `app/services/neural_analytics.py` | Transaction feature vectors (Z-score, category frequency, day-of-month, off-hours) | Supervised Perceptron classifier for statistical anomaly scoring + Unsupervised Competitive Learning (SOM/VQ) for behavioral persona clustering. |
| 10 | **Lightweight Language Model Copilot** | `app/services/copilot_slm.py` | User natural language queries | Intent identification with safe backend tool routing (`get_overspending_categories`, `get_upcoming_bills_due`, `get_month_end_forecast`) with zero numerical hallucination. |

---

## Default Demonstration Credentials
- **Email**: `demo@finsense.ai`
- **Password**: `finsense123`
- **Auto-Login**: Enabled on the frontend for immediate evaluation.

## Startup Commands
- **Local Dev Server**: Run `./run_local.sh`
- **Docker Compose (Full Stack + Postgres)**: Run `docker compose up --build`
- **Automated Tests**: Run `(cd backend && PYTHONPATH=. venv/bin/pytest -v)`
- **Frontend Production Build**: Run `(cd frontend && npm run build)`
