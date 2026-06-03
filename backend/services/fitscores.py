from functools import lru_cache
from services.sizing import compute_sizing_signals, _grade
from services.llm import simple_completion


@lru_cache(maxsize=1)
def compute_fit_scores() -> list[dict]:
    """
    All products with Fit Score grade, sorted F → A (worst first).
    Cached after first call.
    """
    df = compute_sizing_signals()
    results = []
    for _, r in df.iterrows():
        grade = _grade(r["sizing_return_rate"])
        results.append({
            "product_id":          r["product_id"],
            "title":               r["title"],
            "product_type":        r["product_type"],
            "gender_segment":      r["gender_segment"],
            "sizing_return_rate":  float(r["sizing_return_rate"]),
            "fit_score":           grade,
            "size_bias":           r["size_bias"],
            "size_too_small":      int(r["size_too_small"]),
            "size_too_large":      int(r["size_too_large"]),
            "units_sold":          int(r["units_sold"]),
            "stockout_sizes":      r["stockout_sizes"],
            "inventory_by_size":   r["inventory_by_size"],
        })

    grade_order = {"F": 0, "D": 1, "C": 2, "B": 3, "A": 4}
    return sorted(results, key=lambda x: (grade_order[x["fit_score"]], -x["sizing_return_rate"]))


async def get_fix_recommendation(product_id: str) -> str:
    scores = compute_fit_scores()
    product = next((p for p in scores if p["product_id"] == product_id), None)
    if not product:
        return ""
    if product["fit_score"] not in ("F", "D"):
        return ""

    bias_map = {
        "runs_small":   f"runs small — {product['size_too_small']} customers returned it for being too small vs {product['size_too_large']} too large",
        "runs_large":   f"runs large — {product['size_too_large']} customers returned it for being too large vs {product['size_too_small']} too small",
        "true_to_size": "is true to size despite a high overall return rate",
        "unknown":      "has an unclear sizing pattern",
    }
    bias_text = bias_map.get(product["size_bias"], "has an unclear sizing pattern")
    stockout_str = ", ".join(product["stockout_sizes"]) if product["stockout_sizes"] else "none"

    prompt = (
        f"Pretty Fly product: {product['title']}\n"
        f"Sizing return rate: {product['sizing_return_rate']}%\n"
        f"This product {bias_text}.\n"
        f"Sizes currently out of stock: {stockout_str}\n"
        f"Units sold: {product['units_sold']}\n\n"
        "Write a single sentence (max 20 words) for Pretty Fly's product page that honestly "
        "communicates the sizing. Start with the product name. Be specific and actionable. "
        "No marketing language."
    )
    return await simple_completion(prompt, max_tokens=60)
