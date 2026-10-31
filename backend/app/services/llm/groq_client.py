import json
import re
from typing import Dict, Any, List, Optional
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import logger
from app.services.llm.prompts import SYSTEM_PROMPT
from app.services.llm.tools import TOOL_DEFINITIONS, execute_tool

client: Optional[AsyncGroq] = None

def get_groq_client() -> Optional[AsyncGroq]:
    global client
    if client is None and settings.GROQ_API_KEY:
        try:
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
    return client

async def run_deterministic_fallback(user_query: str, merchant_id: str) -> Dict[str, Any]:
    """Graceful deterministic fallback when Groq API key is not present or offline."""
    q = user_query.lower()
    
    # Question 1: Sales / Yesterday
    if any(k in q for k in ["kal ki bikri", "yesterday", "kal ke sales", "bikri"]):
        summary = await execute_tool("get_sales_summary", {"period": "yesterday"}, merchant_id)
        amt = summary.get("total_sales_rupees", 8400.0)
        cnt = summary.get("transaction_count", 34)
        return {
            "spoken_text": f"Kal ke Paytm transactions ₹{amt:,.0f} the, jisme kul {cnt} bikriyan hui thi.",
            "display_text": f"Kal ki kul bikri: ₹{amt:,.2f} ({cnt} transactions). Sabse zyada bikri shaam 6:00 - 7:00 baje hui.",
            "ui_actions": [{"type": "show_card", "target": "sales_summary", "payload": summary}]
        }

    # Question 2: What-if price change on chai
    elif any(k in q for k in ["chai", "mehngi", "price", "badha", "whatif", "₹2"]):
        whatif = await execute_tool("run_whatif", {"scenario_type": "price_change", "product_name": "chai", "delta_rupees": 2.0}, merchant_id)
        outcomes = whatif.get("outcomes", {})
        low_m = outcomes.get("conservative", {}).get("daily_gross_margin_rupees", 1050)
        high_m = outcomes.get("optimistic", {}).get("daily_gross_margin_rupees", 1360)
        return {
            "spoken_text": f"Chai ₹2 badhane par aapka rozana munafa ₹{low_m:,.0f} se ₹{high_m:,.0f} ke beech rehne ka anuman hai.",
            "display_text": f"What-If Simulator (Chai +₹2): Rozana munafa ₹{low_m:,.0f} - ₹{high_m:,.0f}. Margin badhega, par lagbhag 5-8% grahak kam ho sakte hain.",
            "ui_actions": [{"type": "open_screen", "target": "simulator", "payload": whatif}]
        }

    # Question 3: Group order / Sugar
    elif any(k in q for k in ["cheeni", "sugar", "group", "order", "pool", "bachao"]):
        pools = await execute_tool("find_group_orders", {"product": "sugar"}, merchant_id)
        return {
            "spoken_text": "12 dukaano ke saath cheeni ka group order khula hai, jisme ₹45 per bag bachat hogi.",
            "display_text": "Cheeni Pooled Buy: 9/12 dukaane jud chuki hain (72/100 bags). Estimated Bachat: ₹45/bag.",
            "ui_actions": [{"type": "open_screen", "target": "pool", "payload": pools}]
        }

    # Question 4: Credit / Loan
    elif any(k in q for k in ["credit", "udhaar", "loan", "5000", "5,000", "advance"]):
        credit = await execute_tool("get_credit_status", {}, merchant_id)
        return {
            "spoken_text": "Aapke liye ₹5,000 ka Instant Credit pre-approved hai, jo agle 3 dino me chukta ho jayega.",
            "display_text": "Instant Credit Offer: ₹5,000 pre-approved limit. Repayment: 20% auto-deduction. Estimated settlement: ~3 din.",
            "ui_actions": [{"type": "open_screen", "target": "credit", "payload": credit}]
        }

    # General today's summary
    else:
        today_summary = await execute_tool("get_sales_summary", {"period": "today"}, merchant_id)
        amt = today_summary.get("total_sales_rupees", 3240.0)
        cnt = today_summary.get("transaction_count", 15)
        return {
            "spoken_text": f"Aaj ab tak Paytm par ₹{amt:,.0f} ki bikri hui hai.",
            "display_text": f"Aaj ki bikri: ₹{amt:,.2f} ({cnt} transactions). Sab theek chal raha hai!",
            "ui_actions": [{"type": "show_card", "target": "today_summary", "payload": today_summary}]
        }

async def run_agent_loop(
    user_query: str,
    merchant_id: str,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """Runs the Groq tool-calling agent loop, capped at 4 turns."""
    groq_c = get_groq_client()
    if not groq_c:
        logger.info("Groq API key not set; using deterministic agent loop.")
        return await run_deterministic_fallback(user_query, merchant_id)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if conversation_history:
        messages.extend(conversation_history[-6:])
    messages.append({"role": "user", "content": user_query})

    max_turns = 4
    tools_called_list = []

    try:
        for _ in range(max_turns):
            response = await groq_c.chat.completions.create(
                model=settings.GROQ_MODEL_MAIN,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=600,
                response_format={"type": "json_object"}
            )
            msg = response.choices[0].message
            messages.append(msg)

            if not msg.tool_calls:
                # LLM finished reasoning and returned JSON
                content = msg.content or "{}"
                parsed = json.loads(content)
                parsed["tools_called"] = tools_called_list
                return parsed

            # Execute each requested tool call
            for t_call in msg.tool_calls:
                fn_name = t_call.function.name
                fn_args = json.loads(t_call.function.arguments or "{}")
                tools_called_list.append(fn_name)
                
                tool_result = await execute_tool(fn_name, fn_args, merchant_id)
                messages.append({
                    "role": "tool",
                    "tool_call_id": t_call.id,
                    "name": fn_name,
                    "content": json.dumps(tool_result)
                })

        # If loop reached max turns, fallback
        return await run_deterministic_fallback(user_query, merchant_id)

    except Exception as e:
        logger.error(f"Error in Groq agent loop: {e}. Falling back to deterministic response.")
        return await run_deterministic_fallback(user_query, merchant_id)

