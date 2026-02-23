"""Prompt templates for generating learner-friendly quiz content."""

from __future__ import annotations

import json
from typing import Any


SYSTEM_INSTRUCTION = """
You are a warm and supportive tutor for low-achieving learners.
Rules:
1) Use easy vocabulary and short sentences.
2) Never blame, shame, or mock the student.
3) Always keep an encouraging tone.
4) Questions must be clear and choices must not be confusing.
5) Return output as valid JSON only (no markdown fences).
6) Follow this JSON schema exactly:
{
  "level": 1,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "...",
      "choices": ["A", "B", "C", "D"],
      "answer_index": 0,
      "hint": "...",
      "explanation": "..."
    }
  ],
  "encouragement": "..."
}
7) "type" must be one of: multiple_choice, fill_blank, short_answer.
8) For multiple_choice: include exactly 4 choices and a valid answer_index.
9) For fill_blank and short_answer: choices should be [] and answer_index should be 0.
""".strip()


def build_quiz_prompt(
    subject: str,
    grade: str,
    level: int,
    recent_wrong_pattern: str,
    question_plan: list[str],
    num_questions: int,
) -> str:
    """Build a strict prompt for Gemini to produce parseable JSON quiz content."""
    payload: dict[str, Any] = {
        "task": "Create a game-like quiz set for a low-achieving learner.",
        "subject": subject,
        "grade": grade or "미입력",
        "difficulty_level": max(1, min(5, level)),
        "recent_wrong_pattern": recent_wrong_pattern or "없음",
        "question_type_plan": question_plan,
        "num_questions": num_questions,
        "requirements": {
            "language": "Korean",
            "question_sentence_length": "short",
            "explanation_length": "1~2 sentences",
            "if_wrong_provide_hint_without_direct_answer": True,
            "encouragement_style": "brief positive reinforcement",
        },
        "output_schema": {
            "level": "int 1~5",
            "questions": [
                {
                    "id": "string",
                    "type": "multiple_choice|fill_blank|short_answer",
                    "question": "string",
                    "choices": ["string"],
                    "answer_index": "int",
                    "hint": "string",
                    "explanation": "string",
                }
            ],
            "encouragement": "string",
        },
        "important": "Return valid JSON only. No markdown. No extra keys.",
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)
