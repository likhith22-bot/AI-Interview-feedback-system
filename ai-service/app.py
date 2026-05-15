"""
AI Interview Assessment — Flask microservice.
Heavy deps (Whisper, spaCy model, LanguageTool) load lazily so /health works after a minimal pip install.
"""
from __future__ import annotations

import io
import json
import logging
import os
import re
import tempfile
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

SKILL_KEYWORDS = [
    "Java",
    "Python",
    "JavaScript",
    "TypeScript",
    "React",
    "Spring Boot",
    "Node.js",
    "SQL",
    "MySQL",
    "Machine Learning",
    "Docker",
    "Kubernetes",
    "AWS",
    "Git",
    "REST API",
    "GraphQL",
    "HTML",
    "CSS",
    "Tailwind",
    "Flask",
    "Django",
    "FastAPI",
    "C++",
    "Go",
    "Redis",
    "MongoDB",
]

QUESTION_BANK: dict[str, list[str]] = {
    "Java": [
        "Explain the four pillars of OOP and give a Java example for each.",
        "How does the JVM manage memory, and what is the difference between stack and heap?",
        "Compare abstract classes and interfaces in Java.",
    ],
    "Python": [
        "What are Python decorators and when would you use them?",
        "Explain generators vs iterators with a practical example.",
        "How does the GIL affect concurrency in Python?",
    ],
    "React": [
        "Explain useEffect cleanup and common pitfalls.",
        "What is the difference between controlled and uncontrolled components?",
        "How would you optimize a large list render in React?",
    ],
    "Spring Boot": [
        "Describe Spring Security filter chain at a high level.",
        "How do you configure a REST controller and exception handling globally?",
        "Explain dependency injection in Spring with an example.",
    ],
    "SQL": [
        "What is the difference between INNER JOIN and LEFT JOIN?",
        "How do indexes help queries, and when can they hurt performance?",
        "Explain normalization vs denormalization trade-offs.",
    ],
    "Machine Learning": [
        "Explain bias–variance tradeoff in simple terms.",
        "What is cross-validation and why use it?",
        "Compare supervised vs unsupervised learning with examples.",
    ],
    "default": [
        "Walk me through a challenging project you led and your specific contributions.",
        "How do you prioritize tasks when deadlines overlap?",
        "Describe how you handle disagreements in a team setting.",
    ],
}

SKILL_PATTERNS = {
    skill: re.compile(rf'(?<!\w){re.escape(skill)}(?!\w)', re.I)
    for skill in SKILL_KEYWORDS
}


def _load_spacy():
    try:
        import spacy

        return spacy.load("en_core_web_sm")
    except Exception as e:
        log.warning("spaCy model unavailable: %s", e)
        return None


def _extract_text_pdf(file_storage) -> str:
    import pdfplumber

    raw = file_storage.read()
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(raw)) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            text_parts.append(t)
    return "\n".join(text_parts)


def _skills_from_text(text: str, nlp) -> list[str]:
    found: list[str] = []
    for skill, pattern in SKILL_PATTERNS.items():
        if pattern.search(text):
            found.append(skill)

    if nlp:
        try:
            doc = nlp(text[:50000])
            for ent in doc.ents:
                if ent.label_ in ("ORG", "PRODUCT", "SKILL") and len(ent.text.strip()) > 2:
                    normalized = ent.text.strip()
                    if normalized not in found and len(found) < 40:
                        found.append(normalized)
        except Exception:
            pass

    return list(dict.fromkeys(found))


def generate_questions(skills: list[str]) -> list[str]:
    out: list[str] = []
    for s in skills:
        key = next((k for k in QUESTION_BANK if k.lower() == s.lower()), None)
        if key:
            out.extend(QUESTION_BANK[key][:2])
    if len(out) < 5:
        out.extend(QUESTION_BANK["default"])
    seen = set()
    uniq = []
    for q in out:
        if q not in seen:
            seen.add(q)
            uniq.append(q)
    return uniq[:12]


_FILLER_RE = re.compile(r"\b(um|uh|like|you know|actually|basically)\b", re.I)


def _filler_penalty(text: str) -> int:
    return len(_FILLER_RE.findall(text))


def _keyword_overlap(answer: str, keywords: list[str]) -> float:
    if not keywords:
        return 0.5
    a = answer.lower()
    hits = sum(1 for k in keywords if k.lower() in a)
    return min(1.0, hits / max(1, len(keywords)))


def _grammar_score(text: str) -> int:
    try:
        import language_tool_python

        tool = language_tool_python.LanguageToolPublicAPI("en-US")
        matches = tool.check(text[:8000])
        mistakes = len(matches)
        if mistakes == 0:
            return 10
        if mistakes < 4:
            return 8
        if mistakes < 10:
            return 6
        return 4
    except Exception as e:
        log.warning("language_tool: %s", e)
        words = max(1, len(text.split()))
        return min(10, 4 + min(6, words // 40))


def _confidence_from_text(answer: str) -> int:
    fillers = _filler_penalty(answer)
    words = len(answer.split())
    base = 6
    if words > 35:
        base += 2
    elif words < 12:
        base -= 2
    base -= min(3, fillers)
    return max(1, min(10, base))


def _technical_score(question: str, answer: str, keywords: list[str]) -> int:
    overlap = _keyword_overlap(answer, keywords)
    depth = 0
    if len(answer.split()) > 25:
        depth += 2
    if any(x in answer.lower() for x in ("because", "therefore", "example", "step")):
        depth += 2
    score = int(4 + overlap * 5 + min(2, depth))
    return max(1, min(10, score))


def run_interview_analysis(question: str, answer: str, keywords: list[str]) -> dict[str, Any]:
    if not answer.strip():
        return {
            "technical_score": 1,
            "grammar_score": 1,
            "english_score": 1,
            "confidence_score": 1,
            "overall_score": 5,
            "feedback": "No answer detected. Try speaking or typing a longer response.",
            "weak_topics": "Answer completeness",
        }
    tech = _technical_score(question, answer, keywords)
    gram = _grammar_score(answer)
    conf = _confidence_from_text(answer)
    english = int(round((gram * 0.5 + min(10, len(answer.split()) // 5) * 0.5)))
    english = max(1, min(10, english))
    overall = int(round((tech + gram + conf + english) / 4 * 10))
    overall = max(5, min(100, overall))

    feedback_parts: list[str] = []
    if tech < 6:
        feedback_parts.append("Add more technical depth and tie answers to your resume keywords.")
    if gram < 7:
        feedback_parts.append("Review grammar; shorter clear sentences often score better.")
    if conf < 6:
        feedback_parts.append("Reduce filler words (um, like) and structure your answer: situation → action → result.")
    if not feedback_parts:
        feedback_parts.append("Solid answer — add one concrete metric or example to stand out.")

    weak = []
    if tech < 6:
        weak.append("technical depth")
    if gram < 7:
        weak.append("grammar")
    if conf < 6:
        weak.append("delivery")

    return {
        "technical_score": tech,
        "grammar_score": gram,
        "english_score": english,
        "confidence_score": conf,
        "overall_score": overall,
        "feedback": " ".join(feedback_parts),
        "weak_topics": ", ".join(weak) if weak else "none noted",
    }


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/parse-resume")
def parse_resume():
    if "resume" not in request.files:
        return jsonify({"error": "missing file field resume"}), 400
    f = request.files["resume"]
    nlp = _load_spacy()
    try:
        text = _extract_text_pdf(f)
    except Exception as e:
        log.exception("pdf parse")
        return jsonify({"skills": [], "text": "", "error": str(e)}), 400
    skills = _skills_from_text(text, nlp)
    return jsonify({"skills": skills, "text": text[:12000]})


@app.post("/generate-questions")
def gen_questions():
    data = request.get_json(force=True, silent=True) or {}
    skills = data.get("skills") or []
    if isinstance(skills, str):
        skills = [skills]
    qs = generate_questions(list(skills))
    return jsonify({"questions": qs})


@app.post("/analyze-interview")
def analyze():
    data = request.get_json(force=True, silent=True) or {}
    q = (data.get("question") or "").strip()
    a = (data.get("answer") or "").strip()
    kws = data.get("keywords") or []
    if isinstance(kws, str):
        kws = [kws]
    result = run_interview_analysis(q, a, list(kws))
    return jsonify(result)


@app.post("/transcribe")
def transcribe():
    """Optional Whisper transcription (CPU-heavy)."""
    if "audio" not in request.files:
        return jsonify({"error": "missing audio"}), 400
    try:
        import whisper

        audio = request.files["audio"]
        suffix = os.path.splitext(audio.filename or "clip")[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            audio.save(tmp.name)
            path = tmp.name
        model_name = os.environ.get("WHISPER_MODEL", "base")
        model = whisper.load_model(model_name)
        r = model.transcribe(path)
        os.unlink(path)
        return jsonify({"text": r.get("text", "").strip()})
    except Exception as e:
        log.warning("whisper: %s", e)
        return jsonify({"text": "", "error": str(e)}), 500


@app.post("/confidence-audio")
def confidence_audio():
    """Basic audio metrics using librosa (optional)."""
    if "audio" not in request.files:
        return jsonify({"error": "missing audio"}), 400
    try:
        import librosa
        import numpy as np

        audio = request.files["audio"]
        suffix = os.path.splitext(audio.filename or "clip")[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            audio.save(tmp.name)
            path = tmp.name
        y, sr = librosa.load(path, sr=None, mono=True)
        os.unlink(path)
        duration = float(librosa.get_duration(y=y, sr=sr))
        rms = float(np.mean(librosa.feature.rms(y=y)))
        # crude score 1–10 from duration + energy
        score = 5
        if 15 < duration < 120:
            score += 2
        if rms > 0.02:
            score += 2
        score = max(1, min(10, score))
        return jsonify(
            {
                "duration_sec": round(duration, 2),
                "rms_energy": round(rms, 5),
                "confidence_audio_score": score,
            }
        )
    except Exception as e:
        log.warning("librosa: %s", e)
        return jsonify({"confidence_audio_score": 5, "error": str(e)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
