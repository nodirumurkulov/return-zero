from fastapi import APIRouter
from services.stats import compute_stats, compute_trend

router = APIRouter()


@router.get("")
def stats():
    return compute_stats()


@router.get("/trend")
def trend():
    return compute_trend()
