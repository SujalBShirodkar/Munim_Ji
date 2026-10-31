import pytest
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
    assert detect_language_semantic("कल की बिक्री कितनी थी?") == "hi_devanagari"
    assert detect_language_semantic("मौसम कैसा है?") == "hi_devanagari"
    assert detect_language_semantic("विराट कोहली कौन है?") == "hi_devanagari"

    # Hinglish
    assert detect_language_semantic("Kal ki bikri kitni thi?") == "hinglish"
    assert detect_language_semantic("Aaj kitna bika?") == "hinglish"
    assert detect_language_semantic("Chai ka daam badhaun toh kya hoga?") == "hinglish"
    assert detect_language_semantic("Aaj mausam kaisa hai?") == "hinglish"
    assert detect_language_semantic("kya haal hai?") == "hinglish"

    # English
    assert detect_language_semantic("What were yesterday's sales?") == "en"
    assert detect_language_semantic("How much did I sell today?") == "en"
    assert detect_language_semantic("Who is the prime minister of India?") == "en"
    assert detect_language_semantic("What is the weather today?") == "en"

def test_relevancy_filter():
    # In-scope finance / merchant
    assert is_finance_or_merchant_query("Kal ki bikri kitni thi?") is True
    assert is_finance_or_merchant_query("कल की बिक्री कितनी थी?") is True
    assert is_finance_or_merchant_query("What were yesterday's sales?") is True
    assert is_finance_or_merchant_query("Chai ₹2 mehngi karu toh?") is True
    assert is_finance_or_merchant_query("Cheeni ka group order hai kya?") is True
    assert is_finance_or_merchant_query("Mujhe ₹5,000 credit loan chahiye") is True
    assert is_finance_or_merchant_query("How much stock of tea is left?") is True
    assert is_finance_or_merchant_query("When will my settlement arrive?") is True

    # Out-of-scope non-finance / non-merchant
    assert is_finance_or_merchant_query("Who is Virat Kohli?") is False
    assert is_finance_or_merchant_query("Aaj mausam kaisa hai?") is False
    assert is_finance_or_merchant_query("मौसम कैसा है?") is False
    assert is_finance_or_merchant_query("Tell me a funny joke") is False
    assert is_finance_or_merchant_query("Who won the cricket match?") is False
    assert is_finance_or_merchant_query("What is the capital of France?") is False
    assert is_finance_or_merchant_query("Write code for binary search") is False

@pytest.mark.asyncio
async def test_out_of_scope_rejection():
    # English out of scope -> "cannot answer"
    en_res = await run_deterministic_fallback("Who is the prime minister of India?", "merchant_sharma_001")
    assert "cannot answer" in en_res["spoken_text"].lower() or "cannot answer" in en_res["display_text"].lower()
    assert en_res["detected_language"] == "en"

    # Hinglish out of scope -> "uttar nahi de sakta"
    hinglish_res = await run_deterministic_fallback("Aaj mausam kaisa hai bhai?", "merchant_sharma_001")
    assert "uttar nahi de sakta" in hinglish_res["spoken_text"].lower() or "uttar nahi de sakta" in hinglish_res["display_text"].lower()
    assert hinglish_res["detected_language"] == "hi"

    # Devanagari out of scope -> "उत्तर नहीं दे सकता"
    hi_res = await run_deterministic_fallback("मौसम कैसा है?", "merchant_sharma_001")
    assert "उत्तर नहीं दे सकता" in hi_res["spoken_text"] or "उत्तर नहीं दे सकता" in hi_res["display_text"]
    assert hi_res["detected_language"] == "hi"

@pytest.mark.asyncio
async def test_in_scope_language_answers():
    # Yesterday sales in English -> English response
    en_sales = await run_deterministic_fallback("What were yesterday's total sales?", "merchant_sharma_001")
    assert "yesterday" in en_sales["spoken_text"].lower() or "8400" in en_sales["spoken_text"]
    assert en_sales["detected_language"] == "en"

    # Yesterday sales in Hinglish -> Hinglish response
    hi_sales = await run_deterministic_fallback("Kal ki bikri kitni thi?", "merchant_sharma_001")
    assert "kal" in hi_sales["spoken_text"].lower()
    assert "8400" in hi_sales["spoken_text"]
    assert hi_sales["detected_language"] == "hi"

    # Yesterday sales in Devanagari -> Devanagari response
    dev_sales = await run_deterministic_fallback("कल की बिक्री कितनी थी?", "merchant_sharma_001")
    assert "कल" in dev_sales["spoken_text"]
    assert "8400" in dev_sales["spoken_text"]
    assert dev_sales["detected_language"] == "hi"

