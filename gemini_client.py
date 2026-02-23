"""Gemini API wrapper with one-time retry for JSON parse failure."""

from __future__ import annotations

from typing import Any

from google import genai
from google.genai import types

from prompts import SYSTEM_INSTRUCTION
from utils import safe_json_loads, sanitize_quiz_payload


class GeminiClientError(Exception):
    """Custom error for user-friendly handling."""


def _generate_once(api_key: str, user_prompt: str, model: str) -> str:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.5,
            max_output_tokens=1800,
        ),
    )
    return response.text or ""


def generate_quiz_with_retry(
    api_key: str,
    user_prompt: str,
    model: str = "gemini-3-flash-preview",
) -> tuple[dict[str, Any], list[str]]:
    """Generate quiz JSON. Retry once when parsing fails."""
    logs: list[str] = []
    try:
        logs.append("1차 호출 시작")
        raw = _generate_once(api_key, user_prompt, model)
        data = safe_json_loads(raw)
        logs.append("1차 호출 JSON 파싱 성공")
        return sanitize_quiz_payload(data), logs
    except Exception as first_exc:  # noqa: BLE001 - intentionally broad for app resilience
        logs.append(f"1차 호출/파싱 실패: {first_exc}")
        try:
            repair_prompt = (
                user_prompt
                + "\n\nIMPORTANT: 이전 응답이 JSON 파싱에 실패했습니다. "
                + "반드시 올바른 JSON 객체만 출력하세요."
            )
            logs.append("2차 재시도 시작")
            raw2 = _generate_once(api_key, repair_prompt, model)
            data2 = safe_json_loads(raw2)
            logs.append("2차 호출 JSON 파싱 성공")
            return sanitize_quiz_payload(data2), logs
        except Exception as second_exc:  # noqa: BLE001
            logs.append(f"2차 호출/파싱 실패: {second_exc}")
            raise GeminiClientError("모델 응답을 읽지 못했어요. 잠시 후 다시 시도해 주세요.") from second_exc
