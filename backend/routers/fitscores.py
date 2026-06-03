from fastapi import APIRouter
from services.fitscores import compute_fit_scores, get_fix_recommendation

router = APIRouter()


@router.get("")
def fitscores():
    return compute_fit_scores()


@router.get("/{product_id}/recommendation")
async def recommendation(product_id: str):
    fix = await get_fix_recommendation(product_id)
    return {"product_id": product_id, "recommendation": fix}
