import re
from typing import Dict, Any

DEVANAGARI_REGEX = re.compile(r'[\u0900-\u097F]')

# Unambiguous Hinglish words (Hindi written in Roman/Latin script)
DISTINCT_HINGLISH_WORDS = {
    # Interrogatives & Pronouns
    "kya", "kyu", "kyun", "kaise", "kaisa", "kaisi", "kitna", "kitni", "kitne",
    "kaha", "kahan", "kab", "kaun", "mera", "meri", "mere", "aap", "aapka",
    "aapki", "aapke", "tum", "tumhara", "tumhari", "hum", "humara", "apna", "apni",
    "yeh", "woh", "isko", "usko", "inhe", "unhe", "kisko",
    # Verbs & Auxiliaries
    "hai", "hain", "tha", "thi", "hoga", "hogi", "hoge", "karein", "karo",
    "karna", "kiya", "kiye", "batao", "bataiye", "bata", "poochho", "poochhein",
    "chahiye", "dekhna", "bolo", "bolein", "aayega", "aayegi",
    "aaye", "gaya", "gayi", "gaye", "raha", "rahi", "rahe", "sakta", "sakti", "sakte",
    # Merchant & Commerce in Hinglish
    "dukaan", "dokan", "bikri", "kamai", "daam", "bhav", "munafa", "faida",
    "nuksan", "ghata", "bachat", "cheeni", "chai", "doodh", "chawal", "maal",
    "samaan", "udhaar", "karz", "paisa", "paise", "rupaye", "rupay", "rupya",
    "mehnga", "mehngi", "sasta", "sasti", "badha", "badhana", "badhaun", "badhaye",
    "ghatana", "zyada", "khata", "bahi",
    # Time & Connectors
    "aaj", "kal", "parso", "subah", "shaam", "dopahar", "raat", "mahina",
    "mein", "par", "se", "bhi", "toh", "mat",
    "nahi", "nahin", "theek", "shukriya", "dhanyawad", "namaste", "namaskar",
    "bhai", "sahab", "saheb"
}

# Dedicated merchant & finance core concepts
CORE_FINANCE_KEYWORDS = {
    "sales", "sale", "sold", "bikri", "bika", "kamai", "revenue", "collection",
    "collections", "transaction", "transactions", "settlement", "settlements",
    "earning", "earnings", "income", "turnover", "paytm", "soundbox", "qr",
    "khata", "bahi", "paisa", "paise", "rupee", "rupees", "rupaye", "₹", "hisaab",
    "account", "stock", "inventory", "maal", "samaan", "sugar", "cheeni", "tea",
    "chai", "atta", "oil", "tel", "dal", "rice", "chawal", "doodh", "milk",
    "packet", "bag", "bori", "reorder", "low stock", "khatam", "shortage",
    "price", "daam", "bhav", "rate", "cost", "margin", "munafa", "profit",
    "faida", "loss", "nuksan", "ghata", "mehnga", "mehngi", "sasta", "sasti",
    "expensive", "cheap", "badha", "badhana", "badhaun", "simulator", "whatif",
    "what if", "pool", "pooled", "wholesale", "bachat", "moq", "supplier",
    "credit", "loan", "udhaar", "karz", "advance", "kfs", "repayment", "chukta",
    "working capital", "dukaan", "dokan", "store", "shop"
}

GREETING_KEYWORDS = {
    "namaste", "namaskar", "hello", "hi", "hey", "good morning", "good evening",
    "good afternoon", "kaise ho", "kya haal hai", "shukriya", "dhanyawad",
    "help", "madad", "नमस्ते", "नमस्कार", "हेलो", "हाय"
}

OUT_OF_SCOPE_RESPONSES = {
    "hi_devanagari": {
        "spoken_text": "माफ़ कीजिए, मैं इसका उत्तर नहीं दे सकता। मैं केवल आपकी दुकान, बिक्री, स्टॉक और बिज़नेस फाइनेंस से जुड़े सवालों में सहायता कर सकता हूँ।",
        "display_text": "माफ़ कीजिए, मैं इसका उत्तर नहीं दे सकता।\nमैं केवल आपकी दुकान की बिक्री, स्टॉक, मुनाफ़ा और बिज़नेस फाइनेंस से जुड़े सवालों में सहायता कर सकता हूँ।",
    },
    "hinglish": {
        "spoken_text": "Maaf kijiye, main iska uttar nahi de sakta. Main sirf aapki dukaan, sales, stock aur business finance se jude sawalon me madad kar sakta hoon.",
        "display_text": "Maaf kijiye, main iska uttar nahi de sakta.\nMain sirf aapki dukaan ki sales, stock, munafa aur business finance se jude sawalon me madad kar sakta hoon.",
    },
    "en": {
        "spoken_text": "I cannot answer this question. I can only assist with your shop's sales, inventory, pricing, and business finance.",
        "display_text": "I cannot answer this question.\nI can only assist with your shop's sales, inventory, pricing, and business finance.",
    }
}

GREETING_RESPONSES = {
    "hi_devanagari": {
        "spoken_text": "नमस्ते शर्मा जी! मैं मुनीम जी हूँ। आपकी दुकान की बिक्री, स्टॉक या फाइनेंस में क्या सहायता करूँ?",
        "display_text": "नमस्ते शर्मा जी! मैं आपका मुनीम जी हूँ।\nआप कल की बिक्री, चाय का दाम बदलने का असर, या चीनी के ग्रुप आर्डर के बारे में पूछ सकते हैं।",
    },
    "hinglish": {
        "spoken_text": "Namaste Sharma ji! Main Munim Ji hoon. Aapki dukaan ki sales, stock ya finance me kya madad karun?",
        "display_text": "Namaste Sharma ji! Main aapka Munim Ji hoon.\nAap kal ki bikri, chai ka daam badhane ka asar, ya cheeni ke group order ke baare me poochh sakte hain.",
    },
    "en": {
        "spoken_text": "Hello Sharma ji! I am Munim Ji, your business copilot. How can I assist with your sales, stock, or shop finances today?",
        "display_text": "Hello Sharma ji! I am Munim Ji, your business copilot.\nYou can ask about yesterday's sales, price change simulations, stock alerts, or group orders.",
    }
}


def detect_language_semantic(text: str) -> str:
    """
    Detects the semantic language and script of the user query:
    - 'hi_devanagari': Hindi written in Devanagari script.
    - 'hinglish': Hindi colloquial phrasing written in Latin/Roman script.
    - 'en': English query.
    """
    if not text or not text.strip():
        return "hinglish"

    # Check for Devanagari script
    if DEVANAGARI_REGEX.search(text):
        return "hi_devanagari"

    # Extract words
    words = [w.lower() for w in re.findall(r'[a-zA-Z]+', text)]
    if not words:
        return "hinglish"

    # Count distinct Hinglish tokens
    hinglish_count = sum(1 for w in words if w in DISTINCT_HINGLISH_WORDS)
    if hinglish_count > 0:
        return "hinglish"

    return "en"


def is_greeting(text: str) -> bool:
    """Checks if the query is purely or primarily a greeting."""
    clean = text.lower().strip()
    words = set(re.findall(r'[\w]+', clean))
    if any(g in clean for g in GREETING_KEYWORDS):
        if len(words) <= 4:
            return True
    return False


def is_finance_or_merchant_query(text: str) -> bool:
    """
    Returns True if the query is relevant to shop operations, business finance,
    sales, inventory, wholesale, or store credit.
    """
    clean = text.lower().strip()
    words = set(re.findall(r'[\w]+', clean))

    # Reject clearly non-financial sports/politics/celebrity/weather/jokes
    non_business_phrases = [
        "prime minister", "president", "cricket", "virat", "capital of",
        "weather", "mausam", "binary search", "joke", "chutkula", "movie", "film",
        "मौसम", "विराट", "क्रिकेट", "प्रधान मंत्री", "फ़िल्म", "गाना"
    ]
    if any(p in clean for p in non_business_phrases):
        return False

    # Check against core merchant & finance keywords
    for kw in CORE_FINANCE_KEYWORDS:
        if " " in kw:
            if kw in clean:
                return True
        elif kw in words or kw in clean:
            return True

    # Check Devanagari common merchant terms
    devanagari_terms = [
        "बिक्री", "बिका", "कमाई", "रुपये", "दुकान", "चीनी", "चाय", "स्टॉक",
        "दाम", "मुनाफ़ा", "फ़ायदा", "नुकसान", "ग्रुप", "ऑर्डर", "उधार", "कर्ज", "पेटीएम",
        "सेटलमेंट"
    ]
    for term in devanagari_terms:
        if term in clean:
            return True

    return False
