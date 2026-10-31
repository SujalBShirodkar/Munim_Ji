import pytest
from unittest.mock import patch, AsyncMock
from app.services.llm.language import (
    detect_language_semantic,
    is_greeting,
    is_finance_or_merchant_query,
    OUT_OF_SCOPE_RESPONSES,
    GREETING_RESPONSES,
)
from app.services.llm.groq_client import run_deterministic_fallback

def test_language_detection():
    # Devanagari Hindi
    assert detect_language_semantic("\u0915\u0932 \u0915\u0940 \u092c\u093f\u0915\u094d\u0930\u0940 \u0915\u093f\u0924\u0928\u0940 \u0925\u0940?") == "hi_devanagari"
    assert detect_language_semantic("\u092e\u094c\u0938\u092e \u0915\u0948\u0938\u093e \u0939\u0948?") == "hi_devanagari"

    # Hinglish
    assert detect_language_semantic("Kal ki bikri kitni thi?") == "hinglish"
    assert detect_language_semantic("Aaj kitna bika?") == "hinglish"
    assert detect_language_semantic("Chai ka daam badhaun toh kya hoga?") == "hinglish"
    assert detect_language_semantic("kya haal hai?") == "hinglish"

    # English
    assert detect_language_semantic("What were yesterday's sales?") == "en"
    assert detect_language_semantic("How much did I sell today?") == "en"
    assert detect_language_semantic("Who is the prime minister of India?") == "en"
    assert detect_language_semantic("What is the weather today?") == "en"

def test_relevancy_filter():
    # In-scope finance / merchant
    assert is_finance_or_merchant_query("Kal ki bikri kitni thi?") is True
    assert is_finance_or_merchant_query("What were yesterday's sales?") is True
    assert is_finance_or_merchant_query("Chai ₹2 mehngi karu toh?") is True
    assert is_finance_or_merchant_query("Cheeni ka group order hai kya?") is True
    assert is_finance_or_merchant_query("Mujhe ₹5,000 credit loan chahiye") is True
    assert is_finance_or_merchant_query("How much stock of tea is left?") is True
    assert is_finance_or_merchant_query("When will my settlement arrive?") is True

    # Out-of-scope non-finance / non-merchant
    assert is_finance_or_merchant_query("Who is Virat Kohli?") is False
    assert is_finance_or_merchant_query("Aaj mausam kaisa hai?") is False
    assert is_finance_or_merchant_query("Tell me a funny joke") is False
    assert is_finance_or_merchant_query("Who won the cricket match?") is False
    assert is_finance_or_merchant_query("What is the capital of France?") is False
    assert is_finance_or_merchant_query("Write code for binary search") is False

@pytest.mark.asyncio
async def test_out_of_scope_rejection():
    with patch("app.services.llm.groq_client.execute_tool", new_callable=AsyncMock) as mock_exec:
        # English out of scope -> "cannot answer"
        en_res = await run_deterministic_fallback("Who is the prime minister of India?", "merchant_sharma_001")
        assert "cannot answer" in en_res["spoken_text"].lower() or "cannot answer" in en_res["display_text"].lower()
        assert en_res["detected_language"] == "en"

        # Hinglish out of scope -> "uttar nahi de sakta"
        hinglish_res = await run_deterministic_fallback("Aaj mausam kaisa hai?", "merchant_sharma_001")
        assert "uttar nahi de sakta" in hinglish_res["spoken_text"].lower() or "uttar nahi de sakta" in hinglish_res["display_text"].lower()
        assert hinglish_res["detected_language"] == "hi"

        # Devanagari out of scope
        hi_res = await run_deterministic_fallback("\u092e\u094c\u0938\u092e \u0915\u0948\u0938\u093e \u0939\u0948?", "merchant_sharma_001")
        assert "\u0909\u0924\u094d\u0924\u0930 \u0928\u0939\u0940\u0902 \u0926\u0947 \u0938\u0915\u0924\u093e" in hi_res["spoken_text"] or "\u0909\u0924\u094d\u0924\u0930 \u0928\u0939\u0940\u0902 \u0926\u0947 \u0938\u0915\u0924\u093e" in hi_res["display_text"]
        assert hi_res["detected_language"] == "hi"

        # Assert no database tool was called for out-of-scope queries
        assert mock_exec.call_count == 0

@pytest.mark.asyncio
async def test_in_scope_language_answers():
    mock_summary = {
        "period": "yesterday",
        "total_sales_rupees": 8400.0,
        "transaction_count": 34,
        "best_hour": "18:00 - 19:00"
    }
    with patch("app.services.llm.groq_client.execute_tool", new_callable=AsyncMock) as mock_exec:
        mock_exec.return_value = mock_summary

        # Yesterday sales in English -> English response
        en_sales = await run_deterministic_fallback("What were yesterday's total sales?", "merchant_sharma_001")
        assert "yesterday" in en_sales["spoken_text"].lower() or "8,400" in en_sales["spoken_text"] or "8400" in en_sales["spoken_text"]
        assert en_sales["detected_language"] == "en"

        # Yesterday sales in Hinglish -> Hinglish response
        hi_sales = await run_deterministic_fallback("Kal ki bikri kitni thi?", "merchant_sharma_001")
        assert "kal" in hi_sales["spoken_text"].lower()
        assert "8,400" in hi_sales["spoken_text"] or "8400" in hi_sales["spoken_text"]
        assert hi_sales["detected_language"] == "hi"
