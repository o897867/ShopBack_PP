from datetime import datetime

from pydantic import BaseModel

from weekly.models import LinkType


class TagDetail(BaseModel):
    slug: str
    name: str
    color: str
    description: str | None = None
    parent_slug: str | None = None

    model_config = {"from_attributes": True}


class LinkDetail(BaseModel):
    id: str
    from_node_id: str
    to_node_id: str
    type: LinkType
    label: str | None = None
    strength: int
    ai_suggested: bool
    user_confirmed: bool
    ai_reasoning: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NodeDetail(BaseModel):
    id: str
    report_id: str
    order: int
    title: str
    subtitle: str | None = None
    summary: str | None = None
    body_markdown: str | None = None
    key_points: list[str] | None = None
    tags: list[str] | None = None
    color: str
    position_x: float | None = None
    position_y: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportSummary(BaseModel):
    id: str
    date: str
    title: str
    author: str
    source_url: str | None = None
    cover_image: str | None = None
    ai_generated: bool = False
    created_at: datetime
    updated_at: datetime
    node_count: int = 0

    model_config = {"from_attributes": True}


class ReportDetail(BaseModel):
    id: str
    date: str
    title: str
    author: str
    source_url: str | None = None
    cover_image: str | None = None
    raw_content: str | None = None
    ai_generated: bool = False
    created_at: datetime
    updated_at: datetime
    nodes: list[NodeDetail] = []

    model_config = {"from_attributes": True}
