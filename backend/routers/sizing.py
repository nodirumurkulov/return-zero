import os
from fastapi import APIRouter
from pydantic import BaseModel
from services.sizing import get_all_products_summary, get_product_detail
from services.llm import chat_with_tools
from tools.sizing_tools import SIZING_TOOLS, SIZING_TOOLS_ANTHROPIC, handle_tool_call

router = APIRouter()


@router.get("/products")
def products():
    return get_all_products_summary()


@router.get("/products/{product_id}")
def product_detail(product_id: str):
    return get_product_detail(product_id)


class ChatRequest(BaseModel):
    messages: list[dict]
    product_id: str


@router.post("/chat")
async def chat(req: ChatRequest):
    detail = get_product_detail(req.product_id)
    title = detail.get("title", "this product")
    rate  = detail.get("sizing_return_rate", 0)
    bias  = detail.get("size_bias", "unknown")
    s_sm  = detail.get("size_too_small", 0)
    s_lg  = detail.get("size_too_large", 0)
    sout  = detail.get("stockout_sizes", [])

    bias_line = {
        "runs_small":   f"it runs small ({s_sm} customers returned it for being too small vs {s_lg} too large)",
        "runs_large":   f"it runs large ({s_lg} customers returned it for being too large vs {s_sm} too small)",
        "true_to_size": "it is true to size",
        "unknown":      "the sizing pattern is unclear from return data",
    }.get(bias, "the sizing pattern is unclear")

    stockout_line = f"These sizes are currently out of stock: {', '.join(sout)}." if sout else ""

    system = f"""You are the sizing assistant for Pretty Fly, a premium London streetwear brand.
You help customers find their correct size before ordering — before they make an expensive mistake.

Current product: {title} (product_id: {req.product_id})
Sizing return rate: {rate}% — {'high, needs careful guidance' if rate > 10 else 'low, fairly true to size'}
Direction: {bias_line}.
{stockout_line}

You have access to the get_product_sizing tool for exact data. Always call it before answering.

Rules:
- Be specific: cite the actual return rate and customer counts
- Be brief: 2–3 sentences maximum
- Be direct: give a clear size recommendation, not a hedge
- Reference real numbers: "501 customers found this ran small" beats "it tends to run small"
- If a size is out of stock, mention it
- Never say "I don't know" — you have the data, use it"""

    provider = os.getenv("LLM_PROVIDER", "openai")
    tools = SIZING_TOOLS_ANTHROPIC if provider == "anthropic" else SIZING_TOOLS

    return await chat_with_tools(
        req.messages,
        tools,
        handle_tool_call,
        system=system,
        extra_context={"product_id": req.product_id},
    )
