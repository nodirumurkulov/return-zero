from services.sizing import get_product_detail

SIZING_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_product_sizing",
            "description": (
                "Get real sizing return rate, directional bias (runs_small / runs_large / "
                "true_to_size), and inventory by size for a specific Pretty Fly product. "
                "Always call this before making any size recommendation — never guess."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "The product_id to look up, e.g. prod_00004",
                    }
                },
                "required": ["product_id"],
            },
        },
    },
]

# Anthropic-format tools (different schema)
SIZING_TOOLS_ANTHROPIC = [
    {
        "name": "get_product_sizing",
        "description": (
            "Get real sizing return rate, directional bias, and inventory by size "
            "for a specific Pretty Fly product. Always call this before recommending a size."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "The product_id to look up, e.g. prod_00004",
                }
            },
            "required": ["product_id"],
        },
    },
]


def handle_tool_call(name: str, args: dict, extra_context: dict | None = None) -> dict:
    if name == "get_product_sizing":
        pid = args.get("product_id") or (extra_context or {}).get("product_id", "")
        return get_product_detail(pid)
    return {"error": f"Unknown tool: {name}"}
