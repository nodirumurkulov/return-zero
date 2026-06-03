import os
import json
from typing import Callable


async def chat_with_tools(
    messages: list[dict],
    tools: list[dict],
    handle_tool_call: Callable,
    system: str,
    extra_context: dict | None = None,
) -> dict:
    provider = os.getenv("LLM_PROVIDER", "openai")

    if provider == "anthropic":
        return await _anthropic(messages, tools, handle_tool_call, system, extra_context)
    return await _openai(messages, tools, handle_tool_call, system, extra_context)


async def _openai(messages, tools, handle_tool_call, system, extra_context):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": system}] + messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.3,
    )
    msg = response.choices[0].message

    if msg.tool_calls:
        tool_results = []
        for tc in msg.tool_calls:
            result = handle_tool_call(
                tc.function.name,
                json.loads(tc.function.arguments),
                extra_context,
            )
            tool_results.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result),
            })
        followup = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": system}] + messages + [msg] + tool_results,
            temperature=0.3,
        )
        return {"reply": followup.choices[0].message.content}

    return {"reply": msg.content}


async def _anthropic(messages, tools, handle_tool_call, system, extra_context):
    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    response = await client.messages.create(
        model="claude-opus-4-5",
        max_tokens=512,
        system=system,
        messages=messages,
        tools=tools,
    )

    if response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = handle_tool_call(block.name, block.input, extra_context)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })
        followup = await client.messages.create(
            model="claude-opus-4-5",
            max_tokens=512,
            system=system,
            messages=messages
                + [{"role": "assistant", "content": response.content}]
                + [{"role": "user", "content": tool_results}],
        )
        return {"reply": followup.content[0].text}

    return {"reply": response.content[0].text}


async def simple_completion(prompt: str, max_tokens: int = 80) -> str:
    """Single-turn completion — used for AI fix generation."""
    provider = os.getenv("LLM_PROVIDER", "openai")
    if provider == "anthropic":
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        r = await client.messages.create(
            model="claude-opus-4-5",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return r.content[0].text.strip()

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    r = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.4,
    )
    return r.choices[0].message.content.strip()
