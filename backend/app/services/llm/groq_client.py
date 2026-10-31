import json
import re
from typing import Dict, Any, List, Optional
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import logger
from app.services.llm.prompts import SYSTEM_PROMPT
from app.services.llm.tools import TOOL_DEFINITIONS, execute_tool
from app.services.llm.language import (
    detect_language_semantic,
    is_greeting,
    is_finance_or_merchant_query,
    OUT_OF_SCOPE_RESPONSES,
    GREETING_RESPONSES,
)

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
    """Graceful, language-aware deterministic fallback."""
    q = user_query.lower().strip()
    lang = detect_language_semantic(user_query)
    lang_key = "en" if lang == "en" else ("hi_devanagari" if lang == "hi_devanagari" else "hinglish")
    detected_lang_code = "en" if lang == "en" else "hi"

    # 1. Check for Greetings
    if is_greeting(user_query):
        resp = dict(GREETING_RESPONSES[lang_key])
        resp["ui_actions"] = []
        resp["detected_language"] = detected_lang_code
        return resp

    # 2. Scope Guardrail: If NOT finance/merchant related, decline politely
    if not is_finance_or_merchant_query(user_query):
        resp = dict(OUT_OF_SCOPE_RESPONSES[lang_key])
        resp["ui_actions"] = []
        resp["detected_language"] = detected_lang_code
        return resp

    # 3. In-scope: Classify intent
    is_yesterday = any(
        k in q
        for k in [
            "kal ki bikri", "kal ke", "yesterday", "kal sales", "kal ki sale",
            "kal kitni", "kal kitna", "कल की बिक्री", "कल कितना"
        ]
    ) or (("kal" in q or "कल" in q) and any(k in q for k in ["bikri", "sale", "sales", "kitni", "transaction", "बिक्री"]))

    is_today = (not is_yesterday) and any(
        k in q for k in ["aaj ki bikri", "aaj ke", "today", "aaj kitni", "aaj kitna", "आज की बिक्री", "आज कितना"]
    )

    is_price = any(
        k in q
        for k in [
            "chai", "tea", "mehngi", "mehnga", "price", "badha", "badhaun", "badhaye",
            "whatif", "what if", "daam", "rate", "₹2", "2 rup", "चाय", "दाम"
        ]
    )

    is_pool = any(
        k in q
        for k in ["cheeni", "sugar", "group", "pool", "wholesale", "bachat", "order", "चीनी", "ग्रुप"]
    ) and not is_price

    is_credit = any(
        k in q
        for k in ["credit", "udhaar", "loan", "5000", "5,000", "advance", "paise chahiye", "chahiye", "कर्ज", "उधार"]
    )

    is_stock = any(
        k in q
        for k in ["stock", "inventory", "maal", "samaan", "low stock", "स्टॉक", "माल", "सामान"]
    )

    is_settlement = any(
        k in q
        for k in ["settlement", "settle", "khata", "settlements", "सेटलमेंट"]
    )

    # A. Yesterday Sales
    if is_yesterday or (("bikri" in q or "sale" in q or "बिक्री" in q) and "aaj" not in q and "आज" not in q and not is_price and not is_pool and not is_credit and not is_stock):
        summary = await execute_tool("get_sales_summary", {"period": "yesterday"}, merchant_id)
        amt = summary.get("total_sales_rupees", 8400.0)
        cnt = summary.get("transaction_count", 34)

        if lang_key == "en":
            spoken = f"Yesterday's Paytm transactions totaled {amt:,.0f} rupees across {cnt} sales."
            display = f"Yesterday's total sales: ₹{amt:,.2f} ({cnt} transactions). Peak sales hour was 6:00 PM - 7:00 PM."
        elif lang_key == "hi_devanagari":
            spoken = f"कल के पेटीएम ट्रांजैक्शन्स {amt:,.0f} रुपये थे, जिसमें कुल {cnt} बिक्री हुई थीं।"
            display = f"कल की कुल बिक्री: ₹{amt:,.2f} ({cnt} ट्रांजैक्शन्स)। सबसे ज़्यादा बिक्री शाम 6:00 से 7:00 बजे हुई।"
        else:
            spoken = f"Kal ke Paytm transactions {amt:,.0f} rupaye the, jisme kul {cnt} bikriyan hui thi."
            display = f"Kal ki kul bikri: ₹{amt:,.2f} ({cnt} transactions). Sabse zyada bikri shaam 6:00 - 7:00 baje hui."

        return {
            "spoken_text": spoken,
            "display_text": display,
            "ui_actions": [{"type": "show_card", "target": "sales_summary", "payload": summary}],
            "detected_language": detected_lang_code,
        }

    # B. Price change / What-If Simulator
    if is_price:
        whatif = await execute_tool(
            "run_whatif",
            {"scenario_type": "price_change", "product_name": "chai", "delta_rupees": 2.0},
            merchant_id,
        )
        outcomes = whatif.get("outcomes", {})
        low_m = outcomes.get("conservative", {}).get("daily_gross_margin_rupees", 1050)
        high_m = outcomes.get("optimistic", {}).get("daily_gross_margin_rupees", 1360)

        if lang_key == "en":
            spoken = f"Increasing tea price by 2 rupees is estimated to bring daily gross profit between {low_m:,.0f} and {high_m:,.0f} rupees."
            display = f"What-If Simulator (Tea +₹2): Daily margin ₹{low_m:,.0f} - ₹{high_m:,.0f}. Higher margin per cup with an estimated 5-8% drop in customers."
        elif lang_key == "hi_devanagari":
            spoken = f"चाय ₹2 बढ़ाने पर आपका रोज़ाना मुनाफ़ा ₹{low_m:,.0f} से ₹{high_m:,.0f} के बीच रहने का अनुमान है।"
            display = f"What-If सिमुलेटर (चाय +₹2): रोज़ाना मुनाफ़ा ₹{low_m:,.0f} - ₹{high_m:,.0f}। मार्जिन बढ़ेगा, पर 5-8% ग्राहक कम हो सकते हैं।"
        else:
            spoken = f"Chai 2 rupaye badhane par aapka rozana munafa {low_m:,.0f} se {high_m:,.0f} rupaye ke beech rehne ka anuman hai."
            display = f"What-If Simulator (Chai +₹2): Rozana munafa ₹{low_m:,.0f} - ₹{high_m:,.0f}. Margin badhega, par lagbhag 5-8% grahak kam ho sakte hain."

        return {
            "spoken_text": spoken,
            "display_text": display,
            "ui_actions": [{"type": "open_screen", "target": "simulator", "payload": whatif}],
            "detected_language": detected_lang_code,
        }

    # C. Pooled Buying / Group Orders
    if is_pool:
        pools = await execute_tool("find_group_orders", {"product": "sugar"}, merchant_id)
        if lang_key == "en":
            spoken = "The sugar group order is active. 9 shops have joined, unlocking 45 rupees savings per bag."
            display = "Sugar Pooled Buy: 9/12 shops joined (72/100 bags met). Estimated Savings: ₹45/bag."
        elif lang_key == "hi_devanagari":
            spoken = "चीनी का ग्रुप आर्डर खुला है। 9 दुकानें जुड़ चुकी हैं, और ₹45 प्रति बैग की बचत होगी।"
            display = "चीनी पूल्ड बाई: 9/12 दुकानें जुड़ीं (72/100 बैग्स)। अनुमानित बचत: ₹45 प्रति बैग।"
        else:
            spoken = "Cheeni ka group order khula hai. Nau dukane jud chuki hain, aur 45 rupaye per bag bachat hogi."
            display = "Cheeni Pooled Buy: 9/12 dukaane jud chuki hain (72/100 bags). Estimated Bachat: ₹45/bag."

        return {
            "spoken_text": spoken,
            "display_text": display,
            "ui_actions": [{"type": "open_screen", "target": "pool", "payload": pools}],
            "detected_language": detected_lang_code,
        }

    # D. Instant Credit / Working Capital
    if is_credit:
        credit = await execute_tool("get_credit_status", {}, merchant_id)
        if lang_key == "en":
            spoken = "You have a 5000 rupees Instant Credit offer pre-approved, automatically repaying in about 3 days."
            display = "Instant Credit Offer: ₹5,000 pre-approved. Repayment: 20% auto-deduction from daily QR sales. Estimated settlement: ~3 days."
        elif lang_key == "hi_devanagari":
            spoken = "आपके लिए ₹5,000 का इंस्टेंट क्रेडिट प्री-अप्रूव्ड है, जो अगले 3 दिनों में चुकता हो जाएगा।"
            display = "इंस्टेंट क्रेडिट ऑफ़र: ₹5,000 प्री-अप्रूव्ड लिमिट। चुकता: रोज़ाना 20% पेमेंट्स से ऑटो-कटौती। अनुमानित अवधि: ~3 दिन।"
        else:
            spoken = "Aapke liye 5000 rupaye ka Instant Credit pre-approved hai, jo agle 3 dino me chukta ho jayega."
            display = "Instant Credit Offer: ₹5,000 pre-approved limit. Repayment: 20% auto-deduction. Estimated settlement: ~3 din."

        return {
            "spoken_text": spoken,
            "display_text": display,
            "ui_actions": [{"type": "open_screen", "target": "credit", "payload": credit}],
            "detected_language": detected_lang_code,
        }

    # E. Inventory / Stock
    if is_stock:
        inv = await execute_tool("get_inventory_status", {}, merchant_id)
        low_count = inv.get("low_stock_count", 0)
        items = ", ".join([it.get("product_name", "") for it in inv.get("low_stock_items", [])[:2]])
        if lang_key == "en":
            spoken = f"You have {low_count} items running low on stock, including {items}."
            display = f"Inventory Alert: {low_count} items below reorder level ({items}). Recommended to place pooled wholesale order."
        elif lang_key == "hi_devanagari":
            spoken = f"आपकी दुकान में {low_count} सामान रीऑर्डर लेवल से कम हैं, जैसे {items}।"
            display = f"स्टॉक अलर्ट: {low_count} सामान कम हैं ({items})। ग्रुप आर्डर में तुरंत स्टॉक मंगवा सकते हैं।"
        else:
            spoken = f"Aapki dukaan me {low_count} items stock me kam hain, jaise {items}."
            display = f"Stock Alert: {low_count} items reorder level se kam hain ({items}). Pooled order se stock mangwa sakte hain."

        return {
            "spoken_text": spoken,
            "display_text": display,
            "ui_actions": [{"type": "show_card", "target": "inventory", "payload": inv}],
            "detected_language": detected_lang_code,
        }

    # F. Pending Settlement
    if is_settlement:
        settlement = await execute_tool("get_pending_settlement", {}, merchant_id)
        amt = settlement.get("amount_rupees", 8400.0)
        if lang_key == "en":
            spoken = f"Your pending settlement of {amt:,.0f} rupees will be credited to your bank by 12:00 PM."
            display = f"Pending Settlement: ₹{amt:,.2f} scheduled for bank credit by 12:00 PM today."
        elif lang_key == "hi_devanagari":
            spoken = f"आपका ₹{amt:,.0f} का पेंडिंग सेटलमेंट दोपहर 12:00 बजे तक बैंक खाते में आ जाएगा।"
            display = f"पेंडिंग सेटलमेंट: ₹{amt:,.2f} आज दोपहर 12:00 बजे तक बैंक में क्रेडिट होगा।"
        else:
            spoken = f"Aapka {amt:,.0f} rupaye ka pending settlement dopahar 12 baje tak bank account me aayega."
            display = f"Pending Settlement: ₹{amt:,.2f} dopahar 12:00 baje tak account me credit ho jayega."

        return {
            "spoken_text": spoken,
            "display_text": display,
            "ui_actions": [{"type": "show_card", "target": "settlement", "payload": settlement}],
            "detected_language": detected_lang_code,
        }

    # G. Today Sales (Default when asked about today or general shop performance)
    today_summary = await execute_tool("get_sales_summary", {"period": "today"}, merchant_id)
    amt = today_summary.get("total_sales_rupees", 3240.0)
    cnt = today_summary.get("transaction_count", 15)

    if lang_key == "en":
        spoken = f"Today so far on Paytm, you have total collections of {amt:,.0f} rupees across {cnt} transactions."
        display = f"Today's Sales: ₹{amt:,.2f} ({cnt} transactions). All systems active and collecting."
    elif lang_key == "hi_devanagari":
        spoken = f"आज अब तक पेटीएम पर कुल {amt:,.0f} रुपये की बिक्री हुई है।"
        display = f"आज की कुल बिक्री: ₹{amt:,.2f} ({cnt} ट्रांजैक्शन्स)। सब ठीक चल रहा है!"
    else:
        spoken = f"Aaj ab tak Paytm par {amt:,.0f} rupaye ki bikri hui hai."
        display = f"Aaj ki bikri: ₹{amt:,.2f} ({cnt} transactions). Sab theek chal raha hai!"

    return {
        "spoken_text": spoken,
        "display_text": display,
        "ui_actions": [{"type": "show_card", "target": "today_summary", "payload": today_summary}],
        "detected_language": detected_lang_code,
    }


async def run_agent_loop(
    user_query: str,
    merchant_id: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    user_lang: Optional[str] = None
) -> Dict[str, Any]:
    """Runs the Groq tool-calling agent loop, capped at 4 turns."""
    detected_semantic_lang = detect_language_semantic(user_query)
    detected_lang_code = "en" if detected_semantic_lang == "en" else "hi"

    # Quick pre-filter: If definitely a greeting or definitely out of scope, fallback instantly
    if is_greeting(user_query) or not is_finance_or_merchant_query(user_query):
        return await run_deterministic_fallback(user_query, merchant_id)

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
        for turn in range(max_turns):
            create_kwargs = {
                "model": settings.GROQ_MODEL_MAIN,
                "messages": messages,
                "tools": TOOL_DEFINITIONS,
                "tool_choice": "auto",  # Let model decide whether to call tools or decline
                "temperature": 0.2,
                "max_tokens": 800,
            }
            response = await groq_c.chat.completions.create(**create_kwargs)

            msg = response.choices[0].message
            messages.append(msg)

            if not msg.tool_calls:
                content = (msg.content or "").strip()
                if content.startswith("```"):
                    content = re.sub(r"^```(?:json)?\s*", "", content)
                    content = re.sub(r"\s*```$", "", content)
                try:
                    parsed = json.loads(content or "{}")
                except json.JSONDecodeError:
                    parsed = {
                        "spoken_text": content[:280],
                        "display_text": content,
                        "ui_actions": [],
                    }
                if not isinstance(parsed, dict):
                    parsed = {
                        "spoken_text": str(parsed),
                        "display_text": str(parsed),
                        "ui_actions": [],
                    }

                # Ensure required fields
                spoken = str(parsed.get("spoken_text") or parsed.get("display_text") or "")
                spoken = spoken.replace("₹", "rupees ").replace("???", "").strip()
                parsed["spoken_text"] = spoken
                parsed.setdefault("display_text", spoken)
                parsed.setdefault("ui_actions", [])
                parsed["tools_called"] = tools_called_list
                parsed["detected_language"] = detected_lang_code
                return parsed

            for t_call in msg.tool_calls:
                fn_name = t_call.function.name
                fn_args = json.loads(t_call.function.arguments or "{}")
                tools_called_list.append(fn_name)
                tool_result = await execute_tool(fn_name, fn_args, merchant_id)
                messages.append({
                    "role": "tool",
                    "tool_call_id": t_call.id,
                    "name": fn_name,
                    "content": json.dumps(tool_result, default=str),
                })

        return await run_deterministic_fallback(user_query, merchant_id)

    except Exception as e:
        logger.error(f"Error in Groq agent loop: {e}. Falling back to deterministic response.")
        return await run_deterministic_fallback(user_query, merchant_id)
