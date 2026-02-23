from __future__ import annotations

import streamlit as st

from gemini_client import GeminiClientError, generate_quiz_with_retry
from prompts import build_quiz_prompt
from utils import (
    adjust_difficulty,
    badge_for_xp,
    evaluate_answer,
    validate_api_key,
    xp_for_answer,
)

st.set_page_config(page_title="재미있는 학습 챌린지", page_icon="🎮", layout="wide")


def init_state() -> None:
    defaults = {
        "GEMINI_API_KEY": "",
        "subject": "영어(기초)",
        "grade": "",
        "difficulty": 1,
        "diagnostic_done": False,
        "diagnostic_score": 0,
        "quiz_data": None,
        "current_index": 0,
        "score": 0,
        "xp": 0,
        "streak_correct": 0,
        "streak_wrong": 0,
        "recent_wrong_pattern": "",
        "logs": [],
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def sidebar_key_input() -> bool:
    st.sidebar.header("🔐 Gemini 설정")
    api_key = st.sidebar.text_input(
        "Gemini API Key",
        type="password",
        value=st.session_state.get("GEMINI_API_KEY", ""),
        help="키는 세션에만 저장돼요. 브라우저를 닫으면 사라져요.",
    )
    st.session_state["GEMINI_API_KEY"] = api_key

    ok, msg = validate_api_key(api_key)
    if api_key and ok:
        st.sidebar.success("API Key 형식 확인 완료")
    elif api_key:
        st.sidebar.warning(msg)
    else:
        st.sidebar.info("API Key를 입력하면 퀴즈를 생성할 수 있어요.")

    return ok


def render_header() -> None:
    st.title("🎯 성적이 낮은 학생을 위한 재미있는 학습 사이트")
    st.caption("짧게 배우고, 바로 칭찬받고, 다시 도전해요!")


def render_setup() -> None:
    col1, col2 = st.columns(2)
    with col1:
        st.session_state.subject = st.selectbox(
            "과목 선택",
            ["영어(기초)", "수학(기초)", "국어(기초)", "과학(기초)"],
            index=0,
        )
    with col2:
        st.session_state.grade = st.selectbox("학년(선택)", ["", "초5", "초6", "중1", "중2", "중3"])


def run_diagnostic() -> None:
    st.subheader("1) 가벼운 진단 (3문항)")
    questions = [
        ("I ___ a student.", ["am", "is", "are"], "am"),
        ("apple의 뜻은?", ["사과", "바나나", "포도"], "사과"),
        ("He ___ to school.", ["go", "goes", "going"], "goes"),
    ]
    score = 0
    for idx, (q, choices, ans) in enumerate(questions, start=1):
        pick = st.radio(f"Q{idx}. {q}", choices, key=f"diag_{idx}")
        if pick == ans:
            score += 1

    if st.button("진단 완료", type="primary"):
        st.session_state.diagnostic_done = True
        st.session_state.diagnostic_score = score
        st.session_state.difficulty = min(5, max(1, score + 1))
        st.success(f"진단 완료! 현재 추천 난이도는 {st.session_state.difficulty} 단계예요.")


def request_quiz() -> None:
    question_plan = ["multiple_choice", "multiple_choice", "fill_blank", "multiple_choice", "short_answer"]
    prompt = build_quiz_prompt(
        subject=st.session_state.subject,
        grade=st.session_state.grade,
        level=st.session_state.difficulty,
        recent_wrong_pattern=st.session_state.recent_wrong_pattern,
        question_plan=question_plan,
        num_questions=5,
    )
    try:
        quiz_data, logs = generate_quiz_with_retry(st.session_state["GEMINI_API_KEY"], prompt)
        st.session_state.quiz_data = quiz_data
        st.session_state.current_index = 0
        st.session_state.logs = logs
        st.success("퀴즈 생성 완료! 시작해볼까요?")
    except GeminiClientError as exc:
        st.error(str(exc))
    except Exception:
        st.error("API Key 오류/네트워크/쿼터 문제일 수 있어요. 잠시 뒤 다시 시도해 주세요.")


def render_quiz() -> None:
    quiz = st.session_state.quiz_data
    if not quiz:
        return

    questions = quiz.get("questions", [])
    if not questions:
        st.warning("생성된 문제가 없어요. 다시 생성해 주세요.")
        return

    idx = st.session_state.current_index
    if idx >= len(questions):
        st.balloons()
        st.success("학습 완료! 정말 잘했어요! 🎉")
        st.metric("점수", f"{st.session_state.score}/{len(questions)}")
        st.metric("XP", st.session_state.xp)
        st.metric("배지", badge_for_xp(st.session_state.xp))
        st.info(quiz.get("encouragement", "좋아요! 내일 또 5문항 도전해요."))
        if st.button("새 퀴즈 받기"):
            st.session_state.quiz_data = None
            st.session_state.score = 0
            st.session_state.current_index = 0
        return

    q = questions[idx]
    st.subheader(f"2) 게임형 퀴즈 {idx+1}/{len(questions)}")
    st.progress((idx + 1) / len(questions))
    st.write(q.get("question", ""))

    q_type = q.get("type", "multiple_choice")
    if q_type == "multiple_choice":
        user_answer = st.radio("정답 선택", q.get("choices", []), key=f"ans_{idx}")
    elif q_type == "fill_blank":
        user_answer = st.text_input("빈칸에 들어갈 말을 입력하세요", key=f"ans_{idx}")
    else:
        user_answer = st.text_input("짧게 답해보세요", key=f"ans_{idx}")

    if st.button("제출", key=f"submit_{idx}", type="primary"):
        result = evaluate_answer(q, user_answer)

        if result.is_correct:
            st.success("정답! 정말 잘했어요! 👏")
            st.session_state.score += 1
            st.session_state.streak_correct += 1
            st.session_state.streak_wrong = 0
        else:
            st.warning("아쉬워요. 다시 도전해볼까요?")
            st.info(f"힌트: {result.hint}")
            st.session_state.streak_wrong += 1
            st.session_state.streak_correct = 0
            st.session_state.recent_wrong_pattern = q.get("question", "")

        st.write(f"해설: {result.explanation}")

        gain = xp_for_answer(result.is_correct, st.session_state.difficulty)
        st.session_state.xp += gain
        st.caption(f"+{gain} XP 획득!")

        st.session_state.difficulty = adjust_difficulty(
            st.session_state.difficulty,
            st.session_state.streak_correct,
            st.session_state.streak_wrong,
        )
        st.caption(f"현재 난이도: {st.session_state.difficulty} 단계")

        st.session_state.current_index += 1
        st.rerun()


def render_logs() -> None:
    with st.expander("디버그 로그(수동 테스트용)"):
        for line in st.session_state.logs:
            st.write(f"- {line}")


def main() -> None:
    init_state()
    key_ok = sidebar_key_input()
    render_header()
    render_setup()

    if not key_ok:
        st.warning("API Key가 없으면 퀴즈 생성/피드백 기능을 사용할 수 없어요.")

    run_diagnostic()

    st.subheader("2) 퀴즈 생성")
    if st.button("학습 시작(퀴즈 5문항 생성)", disabled=(not key_ok or not st.session_state.diagnostic_done)):
        request_quiz()

    render_quiz()
    render_logs()


if __name__ == "__main__":
    main()
