"""Quick local smoke test for Syn Diagnosis quiz API (run with Backend venv)."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000/api"
TEST_EMAIL = f"quiz-smoke-{int(time.time())}@localhost.test"
TEST_NAME = "Smoke Test User"
TEST_PHONE = "+92 3001234567"


def req(method: str, path: str, body: dict | None = None, timeout: int = 30) -> tuple[int, dict]:
    url = f"{BASE}{path}"
    data = None
    headers = {"Content-Type": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return exc.code, payload


def main() -> int:
    print("=== Syn Diagnosis local API smoke test ===\n")

    # 1) Health
    code, health = req("GET", "/health/")
    print(f"[1] GET /health/ -> {code}")
    if code != 200:
        print("FAIL: backend not healthy")
        return 1

    # 2) Quiz questions
    code, _ = req("GET", "/quiz-questions")
    print(f"[2] GET /quiz-questions -> {code}")
    if code != 200:
        print("FAIL: quiz questions")
        return 1

    # 3) Save lead (mid-quiz)
    lead_body = {
        "user": {"name": TEST_NAME, "email": TEST_EMAIL, "phone": TEST_PHONE},
    }
    code, lead = req("POST", "/save-quiz-lead", lead_body)
    print(f"[3] POST /save-quiz-lead -> {code}")
    if code != 200 or not lead.get("ok"):
        print("FAIL:", lead)
        return 1
    intake_ref = lead.get("intake_ref", "")
    print(f"    intake_ref={intake_ref}")

    # 4) Submit all 17 answers (fast — no OpenAI wait in response)
    answers = [{"question_id": i, "selected_option": "A"} for i in range(1, 18)]
    submit_body = {
        "user": {"name": TEST_NAME, "email": TEST_EMAIL, "phone": TEST_PHONE},
        "answers": answers,
    }
    t0 = time.time()
    code, submit = req("POST", "/submit-answers", submit_body, timeout=25)
    elapsed = round(time.time() - t0, 2)
    print(f"[4] POST /submit-answers -> {code} ({elapsed}s)")
    if code != 200:
        print("FAIL:", submit)
        return 1

    report_ready = submit.get("report_ready")
    score = submit.get("score")
    print(f"    score={score}, report_ready={report_ready}, ai_report_len={len(submit.get('ai_report') or '')}")
    if report_ready is not False:
        print("WARN: expected report_ready=false on fast submit (async report)")
    if elapsed > 15:
        print(f"WARN: submit took {elapsed}s — should be fast (<15s)")

    # 5) Poll quiz-result until ready
    print("[5] Polling GET /quiz-result ...")
    ready = False
    ai_len = 0
    for attempt in range(1, 49):
        code, poll = req("GET", f"/quiz-result?email={TEST_EMAIL}")
        if code != 200:
            print(f"    attempt {attempt}: HTTP {code}", poll)
            time.sleep(2.5)
            continue
        ready = bool(poll.get("report_ready"))
        ai_len = len(poll.get("ai_report") or "")
        if ready and ai_len > 100:
            print(f"    attempt {attempt}: report_ready=True, ai_report_len={ai_len}")
            break
        print(f"    attempt {attempt}: waiting... (ready={ready})")
        time.sleep(2.5)
    else:
        print("FAIL: report not ready after polling")
        return 1

    print("\n=== ALL CHECKS PASSED ===")
    print(f"Test user: {TEST_EMAIL}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
