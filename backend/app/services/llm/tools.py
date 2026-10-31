import json
from typing import Dict, Any, List
from app.services.analytics.summary import (
    get_sales_summary,
    get_hourly_sales,
    get_top_products,
    get_settlements,
    get_pending_settlement,
    compare_periods
)
from app.services.analytics.inventory import get_inventory_status
from app.services.simulator.price import simulate_price_change
from app.services.simulator.hours import simulate_extended_hours
from app.services.pooling.matcher import find_eligible_group_orders
from app.services.lending.mock_nbfc import mock_nbfc
from app.services.savings.measure import get_merchant_savings_report

# Groq / OpenAI compatible Tool Definitions
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_sales_summary",
            "description": "Get deterministic total sales, transaction counts, and best hours for a given time period (today, yesterday, last_7d, last_30d).",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "enum": ["today", "yesterday", "last_7d", "last_30d"],
                        "description": "The time period to query."
                    }
                },
                "required": ["period"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_hourly_sales",
            "description": "Get hourly breakdown of sales for today or yesterday.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "enum": ["today", "yesterday"],
                        "description": "Date to query hourly sales."
                    }
                },
                "required": ["date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_products",
            "description": "Get merchant's top selling products with current price and stock levels.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {"type": "string", "default": "last_7d"},
                    "n": {"type": "integer", "default": 5}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_settlements",
            "description": "Get recent Paytm bank settlements and status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {"type": "string", "default": "last_7d"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_pending_settlement",
            "description": "Get currently pending settlement amount from Paytm.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_inventory_status",
            "description": "Get low stock inventory warnings and list of items needing reorder.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_periods",
            "description": "Compare sales performance between two periods (e.g. today vs yesterday).",
            "parameters": {
                "type": "object",
                "properties": {
                    "period_a": {"type": "string", "enum": ["today", "yesterday", "last_7d"]},
                    "period_b": {"type": "string", "enum": ["today", "yesterday", "last_7d"]}
                },
                "required": ["period_a", "period_b"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_whatif",
            "description": "Run decision support simulation for product price change or extended shop hours.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_type": {
                        "type": "string",
                        "enum": ["price_change", "extended_hours"],
                        "description": "Scenario type to simulate."
                    },
                    "product_name": {
                        "type": "string",
                        "description": "Name of the product (e.g. chai, sugar, tea) if scenario is price_change."
                    },
                    "delta_rupees": {
                        "type": "number",
                        "description": "Change in price in Rupees (e.g. 2.0 for +₹2)."
                    },
                    "extra_hours": {
                        "type": "integer",
                        "description": "Number of extra hours if scenario is extended_hours."
                    }
                },
                "required": ["scenario_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_group_orders",
            "description": "Find nearby pooled group buy opportunities (e.g. sugar, tea, atta, oil).",
            "parameters": {
                "type": "object",
                "properties": {
                    "product": {"type": "string", "description": "Optional product keyword, e.g. 'sugar' or 'cheeni'"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_credit_status",
            "description": "Get Instant Credit pre-approved limit, current outstanding, and repayment terms.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_savings_report",
            "description": "Get total measured and illustrative savings achieved through group buying.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

async def execute_tool(name: str, args: Dict[str, Any], merchant_id: str) -> Dict[str, Any]:
    """Executes deterministic tool calls. Merchant_id is strictly server-injected."""
    if name == "get_sales_summary":
        period = args.get("period", "today")
        return await get_sales_summary(merchant_id, period)

    elif name == "get_hourly_sales":
        date = args.get("date", "today")
        return {"hourly": await get_hourly_sales(merchant_id, date)}

    elif name == "get_top_products":
        n = args.get("n", 5)
        period = args.get("period", "last_7d")
        return {"products": await get_top_products(merchant_id, period, n)}

    elif name == "get_settlements":
        period = args.get("period", "last_7d")
        return {"settlements": await get_settlements(merchant_id, period)}

    elif name == "get_pending_settlement":
        return await get_pending_settlement(merchant_id)

    elif name == "get_inventory_status":
        return await get_inventory_status(merchant_id)

    elif name == "compare_periods":
        a = args.get("period_a", "today")
        b = args.get("period_b", "yesterday")
        return await compare_periods(merchant_id, a, b)

    elif name == "run_whatif":
        sc_type = args.get("scenario_type", "price_change")
        if sc_type == "extended_hours":
            extra_h = args.get("extra_hours", 2)
            return await simulate_extended_hours(merchant_id, extra_hours=extra_h)
        else:
            p_name = args.get("product_name", "chai")
            delta = float(args.get("delta_rupees", 2.0))
            return await simulate_price_change(merchant_id, product_name_query=p_name, delta_rupees=delta)

    elif name == "find_group_orders":
        prod = args.get("product")
        # Map common Hindi/Hinglish terms
        if prod:
            if "cheeni" in prod.lower() or "chini" in prod.lower():
                prod = "sugar"
            elif "chai" in prod.lower():
                prod = "tea"
            elif "tel" in prod.lower():
                prod = "oil"
        return {"group_orders": await find_eligible_group_orders(merchant_id, prod)}

    elif name == "get_credit_status":
        return await mock_nbfc.get_eligibility_offer(merchant_id)

    elif name == "get_savings_report":
        return await get_merchant_savings_report(merchant_id)

    else:
        return {"error": f"Unknown tool: {name}"}

