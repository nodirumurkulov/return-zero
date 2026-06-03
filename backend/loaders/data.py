import json
import pandas as pd
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


@lru_cache(maxsize=1)
def load_all() -> dict:
    return {
        "orders":     pd.read_csv(DATA_DIR / "orders.csv",              parse_dates=["created_at"]),
        "line_items": pd.read_csv(DATA_DIR / "line_items.csv"),
        "products":   pd.read_csv(DATA_DIR / "products.csv"),
        "variants":   pd.read_csv(DATA_DIR / "variants.csv"),
        "refunds":    pd.read_csv(DATA_DIR / "refunds.csv",             parse_dates=["created_at"]),
        "customers":  pd.read_csv(DATA_DIR / "customers.csv",           parse_dates=["created_at"]),
        "support":    pd.read_csv(DATA_DIR / "support_tickets.csv"),
        "inventory":  pd.read_csv(DATA_DIR / "inventory_movements.csv", parse_dates=["date"]),
        "google_ads": pd.read_csv(DATA_DIR / "google_ads_daily.csv",    parse_dates=["date"]),
        "meta_ads":   pd.read_csv(DATA_DIR / "meta_ads_daily.csv",      parse_dates=["date"]),
    }


@lru_cache(maxsize=1)
def load_support_messages() -> list:
    with open(DATA_DIR / "support_messages.json") as f:
        return json.load(f)
