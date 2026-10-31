from typing import List, Dict, Any, Optional
from ortools.linear_solver import pywraplp

def optimize_pooled_order(
    merchant_demands: List[Dict[str, Any]], # [{"merchant_id": str, "qty": float, "baseline_unit_price": int}]
    quote_tiers: List[Dict[str, Any]],     # [{"min_qty": float, "max_qty": float, "unit_price": int}]
    delivery_fee: int,                     # in paise
    moq: float                             # minimum order quantity
) -> Dict[str, Any]:
    """
    Uses Google OR-Tools linear solver (MIP) to determine the best tier and allocate quantities.
    Minimizes total landed cost while ensuring fair delivery fee split.
    """
    total_requested_qty = sum(m["qty"] for m in merchant_demands)
    if total_requested_qty <= 0:
        return {"success": False, "error": "Requested quantity must be greater than zero"}

    solver = pywraplp.Solver.CreateSolver("SCIP")
    if not solver:
        # Fallback to simple GLOP or direct evaluation if SCIP solver is not loaded
        solver = pywraplp.Solver.CreateSolver("GLOP")

    # Binary variables for selecting which tier is active
    T = len(quote_tiers)
    tier_vars = [solver.BoolVar(f"tier_{t}") for t in range(T)]

    # Exactly one tier must be selected
    solver.Add(solver.Sum(tier_vars) == 1)

    # Total quantity variable
    Q = solver.NumVar(max(moq, total_requested_qty), 10000.0, "total_qty")
    solver.Add(Q == total_requested_qty)

    # Tier bounds constraints: if tier_vars[t] == 1, then min_qty <= Q <= max_qty
    for t in range(T):
        t_min = quote_tiers[t]["min_qty"]
        t_max = quote_tiers[t]["max_qty"]
        solver.Add(Q >= t_min * tier_vars[t])
        # Upper bound constraint with big-M
        solver.Add(Q <= t_max + 10000.0 * (1 - tier_vars[t]))

    # Objective: Minimize total cost = sum(tier_vars[t] * (total_requested_qty * unit_price_t)) + delivery_fee
    objective = solver.Objective()
    for t in range(T):
        cost_at_tier = int(total_requested_qty * quote_tiers[t]["unit_price"])
        objective.SetCoefficient(tier_vars[t], cost_at_tier)
    objective.SetMinimization()

    status = solver.Solve()

    # Determine best tier
    selected_tier_idx = 0
    if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        for t in range(T):
            if tier_vars[t].solution_value() > 0.5:
                selected_tier_idx = t
                break
    else:
        # Fallback: direct selection of tier that fits total_requested_qty
        for idx, t in enumerate(quote_tiers):
            if t["min_qty"] <= total_requested_qty <= t["max_qty"]:
                selected_tier_idx = idx
                break

    best_tier = quote_tiers[selected_tier_idx]
    allocated_unit_price = best_tier["unit_price"]

    # Compute fair allocations
    member_allocations = []
    total_savings_paise = 0

    for m in merchant_demands:
        qty = m["qty"]
        # Fee share proportional to quantity
        fee_share = int(round(delivery_fee * (qty / total_requested_qty)))
        goods_cost = int(round(qty * allocated_unit_price))
        total_payable = goods_cost + fee_share
        
        baseline_unit_price = m.get("baseline_unit_price", int(allocated_unit_price * 1.08))
        baseline_cost = int(round(qty * baseline_unit_price))
        net_saving = max(0, baseline_cost - total_payable)
        total_savings_paise += net_saving

        member_allocations.append({
            "merchant_id": m["merchant_id"],
            "qty": qty,
            "allocated_unit_price": allocated_unit_price,
            "goods_cost": goods_cost,
            "fee_share": fee_share,
            "total_payable": total_payable,
            "baseline_unit_price": baseline_unit_price,
            "baseline_cost": baseline_cost,
            "net_saving": net_saving,
            "saving_per_unit": round(net_saving / qty, 2) if qty > 0 else 0
        })

    return {
        "success": True,
        "selected_tier_index": selected_tier_idx,
        "selected_tier": best_tier,
        "total_qty": total_requested_qty,
        "allocated_unit_price": allocated_unit_price,
        "delivery_fee": delivery_fee,
        "total_landed_cost": int(round(total_requested_qty * allocated_unit_price)) + delivery_fee,
        "total_savings_paise": total_savings_paise,
        "total_savings_rupees": round(total_savings_paise / 100, 2),
        "member_allocations": member_allocations
    }

