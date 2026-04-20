import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from weekly.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class LinkType(str, enum.Enum):
    evolution = "evolution"
    causation = "causation"
    contrast = "contrast"
    resonance = "resonance"


VALID_COLORS = {
    "c-amber", "c-blue", "c-teal", "c-purple", "c-coral",
    "c-pink", "c-gray", "c-green", "c-red",
}


class Report(Base):
    __tablename__ = "weekly_reports"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)  # YYYY-MM-DD
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    author: Mapped[str] = mapped_column(String(100), nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    nodes: Mapped[list["Node"]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Node(Base):
    __tablename__ = "weekly_nodes"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # node-XXX-slug
    report_id: Mapped[str] = mapped_column(
        ForeignKey("weekly_reports.id", ondelete="CASCADE"), nullable=False
    )
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(300), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="c-gray")
    position_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    position_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    report: Mapped["Report"] = relationship(back_populates="nodes")
    links_from: Mapped[list["Link"]] = relationship(
        foreign_keys="Link.from_node_id",
        back_populates="from_node",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    links_to: Mapped[list["Link"]] = relationship(
        foreign_keys="Link.to_node_id",
        back_populates="to_node",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Link(Base):
    __tablename__ = "weekly_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    from_node_id: Mapped[str] = mapped_column(
        ForeignKey("weekly_nodes.id", ondelete="CASCADE"), nullable=False
    )
    to_node_id: Mapped[str] = mapped_column(
        ForeignKey("weekly_nodes.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[LinkType] = mapped_column(Enum(LinkType), nullable=False)
    label: Mapped[str | None] = mapped_column(String(300), nullable=True)
    strength: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    ai_suggested: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    user_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ai_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    from_node: Mapped["Node"] = relationship(foreign_keys=[from_node_id], back_populates="links_from")
    to_node: Mapped["Node"] = relationship(foreign_keys=[to_node_id], back_populates="links_to")


class Tag(Base):
    __tablename__ = "weekly_tags"

    slug: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="c-gray")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_slug: Mapped[str | None] = mapped_column(
        ForeignKey("weekly_tags.slug", ondelete="CASCADE"), nullable=True
    )

    parent: Mapped["Tag | None"] = relationship(
        remote_side=[slug], back_populates="children"
    )
    children: Mapped[list["Tag"]] = relationship(
        back_populates="parent",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
