"""Utility helpers for parsing, scoring, and adaptive difficulty."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass
class EvalResult:
    is_correct: bool
    explanation: str
    hint: str


def validate_api_key(key: str) -> tuple[bool, str]:
    if not key:
        return False, "API Key를 입력해 주세요."
    if len(key.strip()) < 20:
        return False, "API Key가 너무 짧아요. 키를 다시 확인해 주세요."
    return True, "사용 가능한 형식입니다."


def safe_json_loads(raw_text: str) -> dict[str, Any]:
    """Parse JSON robustly (supports accidental code fences)."""
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.replace("json\n", "", 1).strip()
    return json.loads(text)


def sanitize_quiz_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Enforce minimum schema safety for app rendering."""
    level = int(payload.get("level", 1))
    level = max(1, min(5, level))
    questions = payload.get("questions", [])
    if not isinstance(questions, list):
        questions = []

    clean_questions: list[dict[str, Any]] = []
    for i, q in enumerate(questions, start=1):
        if not isinstance(q, dict):
            continue
        q_type = q.get("type", "multiple_choice")
        choices = q.get("choices", []) if isinstance(q.get("choices", []), list) else []
        answer_index = q.get("answer_index", 0)
        try:
            answer_index = int(answer_index)
        except (TypeError, ValueError):
            answer_index = 0

        clean_questions.append(
            {
                "id": str(q.get("id", f"q{i}")),
                "type": q_type,
                "question": str(q.get("question", "문제가 준비 중이에요.")),
                "choices": [str(c) for c in choices],
                "answer_index": answer_index,
                "hint": str(q.get("hint", "핵심 단어를 다시 살펴보세요.")),
                "explanation": str(q.get("explanation", "좋아요! 한 번 더 확인해봐요.")),
            }
        )

    return {
        "level": level,
        "questions": clean_questions,
        "encouragement": str(payload.get("encouragement", "잘하고 있어요! 계속 도전해봐요!")),
    }


def evaluate_answer(question: dict[str, Any], user_answer: str) -> EvalResult:
    q_type = question.get("type", "multiple_choice")
    explanation = question.get("explanation", "좋아요! 다음 문제로 가요.")
    hint = question.get("hint", "힌트: 핵심 단어를 다시 보세요.")

    if q_type == "multiple_choice":
        choices = question.get("choices", [])
        idx = question.get("answer_index", 0)
        correct = False
        try:
            correct_choice = choices[int(idx)] if choices else ""
            correct = user_answer == correct_choice
        except (ValueError, TypeError, IndexError):
            correct = False
        return EvalResult(correct, explanation, hint)

    # fill_blank / short_answer
    expected = question.get("choices", [""])
    canonical = str(expected[0]).strip().lower() if expected else ""
    provided = user_answer.strip().lower()
    return EvalResult(provided == canonical and canonical != "", explanation, hint)


def xp_for_answer(is_correct: bool, level: int) -> int:
    if is_correct:
        return 10 + (level * 2)
    return 2


def badge_for_xp(xp: int) -> str:
    if xp >= 120:
        return "🏆 꾸준함 마스터"
    if xp >= 70:
        return "🥇 도전 배지"
    if xp >= 30:
        return "🌟 시작 배지"
    return "✨ 새싹 배지"


def adjust_difficulty(current_level: int, streak_correct: int, streak_wrong: int) -> int:
    level = current_level
    if streak_correct >= 2:
        level += 1
    elif streak_wrong >= 2:
        level -= 1
    return max(1, min(5, level))
