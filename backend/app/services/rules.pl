% FinSense Prolog Knowledge Base & Financial Reasoning Rules
% Standard ISO / SWI-Prolog Specification

% 1. Budget violation rule
budget_violation(Category, Spent, Limit, Overrun) :-
    spent(Category, Spent),
    budget_limit(Category, Limit),
    Spent > Limit,
    Overrun is Spent - Limit.

% 2. Approaching budget limit (>80% and =<100%)
approaching_budget(Category, Spent, Limit, Pct) :-
    spent(Category, Spent),
    budget_limit(Category, Limit),
    Limit > 0,
    Spent =< Limit,
    Threshold is Limit * 0.8,
    Spent >= Threshold,
    Pct is (Spent / Limit) * 100.

% 3. Upcoming bill within 7 days
bill_due_soon(BillName, Amount, DaysRemaining) :-
    bill_schedule(BillName, Amount, DaysRemaining),
    DaysRemaining >= 0,
    DaysRemaining =< 7.

% 4. Critical emergency fund reserve shortfall (< 3 months)
emergency_fund_critical(CurrentReserve, MonthlyEssential, Required3M, Shortfall) :-
    emergency_reserve(CurrentReserve),
    essential_burn(MonthlyEssential),
    Required3M is MonthlyEssential * 3,
    CurrentReserve < Required3M,
    Shortfall is Required3M - CurrentReserve.

% 5. Savings goal shortfall
goal_shortfall(GoalName, Target, Current, NeededMonthly, MonthlySurplus) :-
    goal_target(GoalName, Target, Current, NeededMonthly),
    user_surplus(MonthlySurplus),
    NeededMonthly > MonthlySurplus.
