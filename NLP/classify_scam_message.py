def classify_risk(score: int) -> str:
    if score >= 70:
        return "HIGH_RISK"
    elif score >= 40:
        return "WARNING"
    elif score > 0:
        return "BE CAUTIOUS"
    else:
        return "SAFE"