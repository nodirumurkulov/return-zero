import ast
import pandas as pd
from functools import lru_cache
from loaders.data import load_all

# ── Colour hex map (used by frontend swatches) ────────────────────────────
COLOUR_HEX = {
    "Washed Black":  "#2A2A2A",
    "Vintage Cream": "#F0EAD6",
    "Charcoal":      "#555555",
    "Sage":          "#8A9E8A",
    "Off-White":     "#F5F5F0",
    "Deep Navy":     "#1B2A4A",
    "Faded Olive":   "#7A8A60",
    "Burgundy":      "#7D2020",
}

DEMO_ORDER = [
    "prod_00005",   # Court Trainer      — Grade F, 22.5%
    "prod_00026",   # Mid Runner Trainer — Grade F, 22.1%
    "prod_00036",   # Canvas Trainer     — Grade F, 21.4%
    "prod_00039",   # Tech Runner        — Grade F, 19.9%
    "prod_00010",   # Heavyweight Hoodie — Grade B
    "prod_00015",   # Track Hoodie       — Grade B
    "prod_00009",   # Arch Logo Tee      — Grade B
    "prod_00001",   # Essential Tee      — Grade A
]


@lru_cache(maxsize=1)
def compute_sizing_signals() -> pd.DataFrame:
    """
    Returns a DataFrame (one row per product) with:
      - sizing_return_rate  (%)
      - size_bias           (runs_small / runs_large / true_to_size / unknown)
      - size_too_small / size_too_large counts
      - inventory_by_size   (dict: size → qty)
      - stockout_sizes      (list of size labels in negative stock)
      - colours             (list of colour names)
    Cached after first call.
    """
    d = load_all()
    refunds    = d["refunds"].copy()
    variants   = d["variants"]
    products   = d["products"]
    line_items = d["line_items"]

    # Explode refund line items (stored as JSON string list of variant_ids)
    refunds["vlist"] = refunds["refund_line_items"].apply(
        lambda x: ast.literal_eval(x) if pd.notna(x) else []
    )
    r = refunds.explode("vlist").rename(columns={"vlist": "variant_id"})
    r = r.merge(
        variants[["variant_id", "product_id", "option1_value"]],
        on="variant_id",
        how="left",
    )

    # Sizing refunds per product, pivoted by reason
    sizing = r[r["reason"].isin(["size_too_small", "size_too_large"])]
    sz = (
        sizing.groupby(["product_id", "reason"])["refund_id"]
        .count()
        .unstack(fill_value=0)
        .reset_index()
    )
    sz.columns.name = None
    sz["size_too_small"] = sz.get("size_too_small", 0)
    sz["size_too_large"] = sz.get("size_too_large", 0)
    sz["total_sizing_refunds"] = sz["size_too_small"] + sz["size_too_large"]

    # Units sold per product
    sales = (
        line_items.groupby("product_id")["quantity"]
        .sum()
        .reset_index()
        .rename(columns={"quantity": "units_sold"})
    )

    # Colours per product
    colours = (
        variants.groupby("product_id")["option2_value"]
        .apply(lambda x: [c for c in x.dropna().unique() if c])
        .reset_index()
        .rename(columns={"option2_value": "colours"})
    )

    # Inventory per product per size
    inv_by_prod = (
        variants.groupby(["product_id", "option1_value"])["inventory_quantity"]
        .sum()
        .reset_index()
    )

    def inv_dict(pid: str) -> dict:
        rows = inv_by_prod[inv_by_prod["product_id"] == pid]
        return dict(zip(rows["option1_value"], rows["inventory_quantity"].astype(int)))

    def stockout_list(inv: dict) -> list:
        return [s for s, q in inv.items() if q < 0]

    # Base join
    df = (
        products[["product_id", "title", "product_type", "gender_segment"]]
        .merge(sz, on="product_id", how="left")
        .merge(sales, on="product_id", how="left")
        .merge(colours, on="product_id", how="left")
    )
    df = df.fillna({"size_too_small": 0, "size_too_large": 0,
                    "total_sizing_refunds": 0, "units_sold": 0})

    # Min price per product
    price_map = (
        variants.groupby("product_id")["price"]
        .min()
        .reset_index()
        .rename(columns={"price": "price"})
    )
    df = df.merge(price_map, on="product_id", how="left")

    # Return rate
    df["sizing_return_rate"] = (
        df["total_sizing_refunds"] / df["units_sold"].replace(0, 1) * 100
    ).round(1)

    # Directional bias
    def bias(row) -> str:
        s, l = row["size_too_small"], row["size_too_large"]
        if s == 0 and l == 0:
            return "unknown"
        ratio = s / max(s + l, 1)
        if ratio > 0.52:
            return "runs_small"
        if ratio < 0.48:
            return "runs_large"
        return "true_to_size"

    df["size_bias"] = df.apply(bias, axis=1)

    # Inventory + stockouts
    df["inventory_by_size"] = df["product_id"].apply(inv_dict)
    df["stockout_sizes"]    = df["inventory_by_size"].apply(stockout_list)

    # Ensure colours is always a list
    df["colours"] = df["colours"].apply(lambda x: x if isinstance(x, list) else [])

    return df


def _grade(rate: float) -> str:
    if rate <= 2.0:  return "A"
    if rate <= 5.0:  return "B"
    if rate <= 10.0: return "C"
    if rate <= 18.0: return "D"
    return "F"


def get_all_products_summary() -> list[dict]:
    """Lightweight list for the storefront grid — ordered for the demo."""
    df = compute_sizing_signals()

    # Build ordered list: demo products first, then rest by revenue
    result = []
    seen = set()

    for pid in DEMO_ORDER:
        row = df[df["product_id"] == pid]
        if not row.empty:
            r = row.iloc[0]
            result.append(_serialise_summary(r))
            seen.add(pid)

    for _, r in df.iterrows():
        if r["product_id"] not in seen:
            result.append(_serialise_summary(r))

    return result


def _serialise_summary(r) -> dict:
    return {
        "product_id":         r["product_id"],
        "title":              r["title"],
        "product_type":       r["product_type"],
        "gender_segment":     r["gender_segment"],
        "price":              float(r["price"]) if pd.notna(r.get("price")) else 0,
        "colours":            r["colours"],
        "colour_hexes":       [COLOUR_HEX.get(c, "#999") for c in r["colours"]],
        "sizing_return_rate": float(r["sizing_return_rate"]),
        "fit_score":          _grade(r["sizing_return_rate"]),
        "size_bias":          r["size_bias"],
        "stockout_count":     len(r["stockout_sizes"]),
    }


def get_product_detail(product_id: str) -> dict:
    """Full detail for a single product — used by the PDP and sizing widget."""
    df = compute_sizing_signals()
    row = df[df["product_id"] == product_id]
    if row.empty:
        return {"error": f"Product {product_id} not found"}
    r = row.iloc[0]
    return {
        "product_id":          r["product_id"],
        "title":               r["title"],
        "product_type":        r["product_type"],
        "gender_segment":      r["gender_segment"],
        "price":               float(r["price"]) if pd.notna(r.get("price")) else 0,
        "colours":             r["colours"],
        "colour_hexes":        [COLOUR_HEX.get(c, "#999") for c in r["colours"]],
        "sizing_return_rate":  float(r["sizing_return_rate"]),
        "fit_score":           _grade(r["sizing_return_rate"]),
        "size_bias":           r["size_bias"],
        "size_too_small":      int(r["size_too_small"]),
        "size_too_large":      int(r["size_too_large"]),
        "total_sizing_refunds":int(r["total_sizing_refunds"]),
        "units_sold":          int(r["units_sold"]),
        "inventory_by_size":   r["inventory_by_size"],
        "stockout_sizes":      r["stockout_sizes"],
    }
