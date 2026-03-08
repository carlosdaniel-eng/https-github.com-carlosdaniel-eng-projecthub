from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. "created", "updated", "deleted"
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "project", "task"
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # relationships
    user: Mapped["User"] = relationship("User", back_populates="activity_logs")  # noqa: F821
    project: Mapped["Project | None"] = relationship("Project", back_populates="activity_logs")  # noqa: F821
