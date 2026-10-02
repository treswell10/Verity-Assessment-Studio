"""SQLAlchemy models per spec.md > Data Model."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Memorandum(Base):
    __tablename__ = "memoranda"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="draft")  # "draft" | "confirmed"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    questions: Mapped[list["MemoQuestion"]] = relationship(
        back_populates="memorandum", cascade="all, delete-orphan", order_by="MemoQuestion.order"
    )


class MemoQuestion(Base):
    __tablename__ = "memo_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    memorandum_id: Mapped[int] = mapped_column(ForeignKey("memoranda.id"), nullable=False)
    question_number: Mapped[str] = mapped_column(String, nullable=False)
    expected_answer: Mapped[str] = mapped_column(Text, nullable=False)
    max_mark: Mapped[float] = mapped_column(Float, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    memorandum: Mapped["Memorandum"] = relationship(back_populates="questions")


class LearnerScript(Base):
    __tablename__ = "learner_scripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    memorandum_id: Mapped[int] = mapped_column(ForeignKey("memoranda.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="ready")  # "ready" | "marking" | "finalized"
    final_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    final_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    signed_off_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    answers: Mapped[list["ScriptAnswer"]] = relationship(
        back_populates="script", cascade="all, delete-orphan"
    )
    results: Mapped[list["MarkingResult"]] = relationship(
        back_populates="script", cascade="all, delete-orphan"
    )


class ScriptAnswer(Base):
    __tablename__ = "script_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    script_id: Mapped[int] = mapped_column(ForeignKey("learner_scripts.id"), nullable=False)
    question_number: Mapped[str] = mapped_column(String, nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)

    script: Mapped["LearnerScript"] = relationship(back_populates="answers")


class MarkingResult(Base):
    __tablename__ = "marking_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    script_id: Mapped[int] = mapped_column(ForeignKey("learner_scripts.id"), nullable=False)
    question_number: Mapped[str] = mapped_column(String, nullable=False)
    proposed_mark: Mapped[float] = mapped_column(Float, nullable=False)
    max_mark: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    final_mark: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="proposed")  # "proposed" | "confirmed" | "changed"

    script: Mapped["LearnerScript"] = relationship(back_populates="results")
