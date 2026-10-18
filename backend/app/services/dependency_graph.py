"""
Financial Dependency Graph Engine
Models cash inflows, allocations, mandatory/discretionary expense categories,
debt/bill obligations, and savings goals.
Provides BFS (breadth-first impact wave analysis) and DFS (depth-first causal path tracing).
"""

from collections import deque
from typing import List, Dict, Any, Set, Tuple

class FinancialNode:
    def __init__(self, node_id: str, label: str, node_type: str, amount: float, flexible: bool = False):
        self.node_id = node_id
        self.label = label
        self.node_type = node_type  # "income_source", "mandatory_expense", "discretionary_expense", "debt_bill", "savings_goal"
        self.amount = amount
        self.flexible = flexible

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.node_id,
            "label": self.label,
            "type": self.node_type,
            "amount": self.amount,
            "flexible": self.flexible
        }

class FinancialEdge:
    def __init__(self, source_id: str, target_id: str, allocation_amount: float, percentage_of_source: float):
        self.source_id = source_id
        self.target_id = target_id
        self.allocation_amount = allocation_amount
        self.percentage_of_source = percentage_of_source

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source_id,
            "target": self.target_id,
            "allocation_amount": self.allocation_amount,
            "percentage_of_source": self.percentage_of_source
        }

class FinancialDependencyGraph:
    def __init__(self):
        self.nodes: Dict[str, FinancialNode] = {}
        self.adj_list: Dict[str, List[FinancialEdge]] = {}
        self.rev_adj_list: Dict[str, List[FinancialEdge]] = {}

    def add_node(self, node: FinancialNode):
        self.nodes[node.node_id] = node
        if node.node_id not in self.adj_list:
            self.adj_list[node.node_id] = []
        if node.node_id not in self.rev_adj_list:
            self.rev_adj_list[node.node_id] = []

    def add_edge(self, source_id: str, target_id: str, amount: float, percentage: float):
        edge = FinancialEdge(source_id, target_id, amount, percentage)
        self.adj_list[source_id].append(edge)
        self.rev_adj_list[target_id].append(edge)

    def to_graph_response(self) -> Dict[str, Any]:
        total_inflows = sum(n.amount for n in self.nodes.values() if n.node_type == "income_source")
        total_outflows = sum(n.amount for n in self.nodes.values() if n.node_type in ["mandatory_expense", "discretionary_expense", "debt_bill"])
        net_surplus = total_inflows - total_outflows

        all_edges = []
        for edges in self.adj_list.values():
            for e in edges:
                all_edges.append(e.to_dict())

        return {
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": all_edges,
            "total_inflows": total_inflows,
            "total_outflows": total_outflows,
            "net_surplus": max(0.0, net_surplus)
        }

    def bfs_impact_analysis(self, root_id: str, amount_delta_percentage: float) -> Dict[str, Any]:
        """
        Uses Breadth-First Search (BFS) to propagate an upstream change (e.g. salary cut)
        level-by-level across dependent allocations.
        """
        if root_id not in self.nodes:
            return {"error": f"Node {root_id} not found in dependency graph"}

        root = self.nodes[root_id]
        visited: Set[str] = set([root_id])
        queue: deque = deque([(root_id, 0, amount_delta_percentage)])  # (node_id, depth_level, current_pct_change)
        
        affected_nodes: List[Dict[str, Any]] = []
        total_surplus_impact = 0.0

        while queue:
            curr_id, level, pct_change = queue.popleft()
            curr_node = self.nodes[curr_id]

            if curr_id != root_id:
                # Calculate financial reduction/increase on this node
                raw_impact = curr_node.amount * (pct_change / 100.0)
                # Discretionary absorption vs mandatory protection
                absorbed_impact = raw_impact
                if not curr_node.flexible:
                    # Mandatory expenses resist cuts unless deficit exceeds discretionary capacity
                    absorbed_impact = raw_impact * 0.2
                else:
                    absorbed_impact = raw_impact * 1.5

                affected_nodes.append({
                    "node_id": curr_id,
                    "label": curr_node.label,
                    "type": curr_node.node_type,
                    "level": level,
                    "flexible": curr_node.flexible,
                    "original_amount": curr_node.amount,
                    "estimated_impact": round(absorbed_impact, 2),
                    "new_projected_amount": max(0.0, round(curr_node.amount + absorbed_impact, 2)),
                    "vulnerability": "High" if curr_node.flexible else "Protected (Mandatory)"
                })
                total_surplus_impact += absorbed_impact

            # Enqueue downstream children (Breadth-First)
            for edge in self.adj_list.get(curr_id, []):
                child_id = edge.target_id
                if child_id not in visited:
                    visited.add(child_id)
                    # Next level gets propagated impact
                    queue.append((child_id, level + 1, pct_change))

        cascade_summary = (
            f"BFS evaluated {len(affected_nodes)} downstream commitments across {max([n['level'] for n in affected_nodes], default=0)} graph levels. "
            f"A {amount_delta_percentage:+.1f}% change in '{root.label}' cascades an estimated total impact of ₹{abs(total_surplus_impact):,.2f} "
            f"predominantly absorbed by flexible discretionary categories and goal savings."
        )

        return {
            "traversal_algorithm": "BFS (Breadth-First Impact Propagation)",
            "root_node": root.to_dict(),
            "affected_nodes": affected_nodes,
            "surplus_impact": round(total_surplus_impact, 2),
            "cascade_summary": cascade_summary
        }

    def dfs_trace_paths(self, start_id: str, target_id: Optional[str] = None) -> List[List[Dict[str, Any]]]:
        """
        Uses Depth-First Search (DFS) with backtracking to trace all complete causal paths
        from an income/funding source to final leaf commitments or specific savings goals.
        Cycle-safe via visited path set.
        """
        all_paths: List[List[Dict[str, Any]]] = []

        def dfs_recursive(curr_id: str, current_path: List[str], visited_in_path: Set[str]):
            if curr_id in visited_in_path:
                return  # Prevent cycles
            
            visited_in_path.add(curr_id)
            current_path.append(curr_id)

            edges = self.adj_list.get(curr_id, [])
            is_terminal = len(edges) == 0 or (target_id is not None and curr_id == target_id)

            if is_terminal and (target_id is None or curr_id == target_id):
                # Construct path objects
                path_nodes = [self.nodes[nid].to_dict() for nid in current_path]
                all_paths.append(path_nodes)
            else:
                for edge in edges:
                    dfs_recursive(edge.target_id, current_path, visited_in_path)

            current_path.pop()
            visited_in_path.remove(curr_id)

        if start_id in self.nodes:
            dfs_recursive(start_id, [], set())

        return all_paths


def build_default_dependency_graph(
    monthly_income: float,
    essential_expenses: List[Dict[str, float]],    # [{label, amount}]
    discretionary_expenses: List[Dict[str, float]],# [{label, amount}]
    recurring_bills: List[Dict[str, float]],       # [{label, amount}]
    goals: List[Dict[str, float]]                  # [{label, target_monthly}]
) -> FinancialDependencyGraph:
    """
    Constructs a calibrated Indian personal finance dependency network.
    """
    graph = FinancialDependencyGraph()

    # 1. Root Income Source
    graph.add_node(FinancialNode("income_primary", "Primary Salary", "income_source", monthly_income, False))

    # Intermediate Allocations
    mandatory_pool_amt = sum(e["amount"] for e in essential_expenses) + sum(b["amount"] for b in recurring_bills)
    discretionary_pool_amt = sum(d["amount"] for d in discretionary_expenses)
    savings_pool_amt = max(0.0, monthly_income - mandatory_pool_amt - discretionary_pool_amt)

    graph.add_node(FinancialNode("pool_mandatory", "Mandatory Obligations Pool", "mandatory_expense", mandatory_pool_amt, False))
    graph.add_node(FinancialNode("pool_discretionary", "Discretionary Spending Pool", "discretionary_expense", discretionary_pool_amt, True))
    graph.add_node(FinancialNode("pool_savings", "Savings & Investment Reserve", "savings_goal", savings_pool_amt, True))

    if monthly_income > 0:
        graph.add_edge("income_primary", "pool_mandatory", mandatory_pool_amt, round((mandatory_pool_amt / monthly_income) * 100, 1))
        graph.add_edge("income_primary", "pool_discretionary", discretionary_pool_amt, round((discretionary_pool_amt / monthly_income) * 100, 1))
        graph.add_edge("income_primary", "pool_savings", savings_pool_amt, round((savings_pool_amt / monthly_income) * 100, 1))

    # Child nodes: Essential
    for i, e in enumerate(essential_expenses):
        nid = f"ess_{i}_{e['label'].lower().replace(' ', '_')}"
        amt = float(e["amount"])
        graph.add_node(FinancialNode(nid, e["label"], "mandatory_expense", amt, False))
        pct = round((amt / mandatory_pool_amt) * 100, 1) if mandatory_pool_amt > 0 else 0.0
        graph.add_edge("pool_mandatory", nid, amt, pct)

    # Child nodes: Recurring bills
    for i, b in enumerate(recurring_bills):
        nid = f"bill_{i}_{b['label'].lower().replace(' ', '_')}"
        amt = float(b["amount"])
        graph.add_node(FinancialNode(nid, b["label"], "debt_bill", amt, False))
        pct = round((amt / mandatory_pool_amt) * 100, 1) if mandatory_pool_amt > 0 else 0.0
        graph.add_edge("pool_mandatory", nid, amt, pct)

    # Child nodes: Discretionary
    for i, d in enumerate(discretionary_expenses):
        nid = f"disc_{i}_{d['label'].lower().replace(' ', '_')}"
        amt = float(d["amount"])
        graph.add_node(FinancialNode(nid, d["label"], "discretionary_expense", amt, True))
        pct = round((amt / discretionary_pool_amt) * 100, 1) if discretionary_pool_amt > 0 else 0.0
        graph.add_edge("pool_discretionary", nid, amt, pct)

    # Child nodes: Goals
    for i, g in enumerate(goals):
        nid = f"goal_{i}_{g['label'].lower().replace(' ', '_')}"
        amt = float(g.get("amount", g.get("target_monthly", 5000)))
        graph.add_node(FinancialNode(nid, g["label"], "savings_goal", amt, True))
        pct = round((amt / savings_pool_amt) * 100, 1) if savings_pool_amt > 0 else 0.0
        graph.add_edge("pool_savings", nid, amt, pct)

    return graph
