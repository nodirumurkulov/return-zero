"""
Compute headline stats + quarterly trend — served by /api/stats.
All values derived from the live dataset, cached after first call.
"""

from functools import lru_cache
import pandas as pd
from loaders.data import load_all


@lru_cache(maxsize=1)
def compute_stats() -> dict:
    d = load_all()
    refunds = d["refunds"]
    orders  = d["orders"]

    # ── Sizing refunds only ───────────────────────────────────────────────────
    sizing = refunds[
        refunds["refund_reason"].str.lower().str.contains("size|fit|small|large|tight|loose", na=False)
    ].copy()

    total_sizing_loss   = float(sizing["refund_amount"].sum())
    total_sizing_count  = int(len(sizing))

    # ── First-order share ─────────────────────────────────────────────────────
    # Join on customer_id to find which sizing refunds came from a customer's first order
    order_seq = (
        orders.sort_values("order_date")
              .groupby("customer_id")["order_id"]
              .first()
              .reset_index()
              .rename(columns={"order_id": "first_order_id"})
    )
    sizing_with_first = sizing.merge(order_seq, on="customer_id", how="left")
    first_order_mask  = sizing_with_first["order_id"] == sizing_with_first["first_order_id"]
    first_order_count = int(first_order_mask.sum())
    first_order_pct   = round(first_order_count / max(total_sizing_count, 1) * 100, 1)

    # ── YoY trend (Q4 to Q4) ─────────────────────────────────────────────────
    sizing["order_date"] = pd.to_datetime(sizing["order_date"], errors="coerce")
    q4_2024 = int(sizing[
        (sizing["order_date"] >= "2024-10-01") & (sizing["order_date"] < "2025-01-01")
    ].shape[0])
    q4_2025 = int(sizing[
        (sizing["order_date"] >= "2025-10-01") & (sizing["order_date"] < "2026-01-01")
    ].shape[0])
    yoy_pct = round((q4_2025 - q4_2024) / max(q4_2024, 1) * 100, 1) if q4_2024 else 0

    return {
        "total_sizing_loss":    round(total_sizing_loss, 0),
        "total_sizing_count":   total_sizing_count,
        "first_order_count":    first_order_count,
        "first_order_pct":      first_order_pct,
        "q4_2024_refunds":      q4_2024,
        "q4_2025_refunds":      q4_2025,
        "yoy_pct":              yoy_pct,
    }


@lru_cache(maxsize=1)
def compute_trend() -> list[dict]:
    """Quarterly sizing refund counts for the trend chart."""
    d = load_all()
    refunds = d["refunds"]

    sizing = refunds[
        refunds["refund_reason"].str.lower().str.contains("size|fit|small|large|tight|loose", na=False)
    ].copy()
    sizing["order_date"] = pd.to_datetime(sizing["order_date"], errors="coerce")
    sizing = sizing.dropna(subset=["order_date"])

    sizing["quarter"] = sizing["order_date"].dt.to_period("Q")
    trend = (
        sizing.groupby("quarter")
              .size()
              .reset_index(name="refunds")
              .sort_values("quarter")
    )

    return [
        {"quarter": str(row["quarter"]).replace("Q", " Q"), "refunds": int(row["refunds"])}
        for _, row in trend.iterrows()
    ]
