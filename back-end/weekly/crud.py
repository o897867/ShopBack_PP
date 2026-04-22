from sqlalchemy import or_
from sqlalchemy.orm import Session

from weekly.models import Link, Node, Report, Tag


def list_reports(db: Session) -> list[Report]:
    return db.query(Report).order_by(Report.id.desc()).all()


def get_report(db: Session, report_id: str) -> Report | None:
    return db.query(Report).filter(Report.id == report_id).first()


def list_nodes(db: Session, tag: str | None = None) -> list[Node]:
    nodes = db.query(Node).order_by(Node.report_id, Node.order).all()
    if tag is None:
        return nodes
    return [n for n in nodes if n.tags and tag in n.tags]


def get_node(db: Session, node_id: str) -> Node | None:
    return db.query(Node).filter(Node.id == node_id).first()


def list_links(db: Session, node_id: str | None = None) -> list[Link]:
    q = db.query(Link)
    if node_id is not None:
        q = q.filter(or_(Link.from_node_id == node_id, Link.to_node_id == node_id))
    return q.all()


def list_tags(db: Session) -> list[Tag]:
    return db.query(Tag).order_by(Tag.slug).all()


def get_link_index(db: Session) -> dict:
    """Aggregate all links into a frontend-consumable index."""
    all_links = db.query(Link).all()

    node_link_count: dict[str, int] = {}
    node_to_links: dict[str, list[str]] = {}
    links_by_id: dict[str, Link] = {}

    for link in all_links:
        links_by_id[link.id] = link
        node_link_count[link.from_node_id] = node_link_count.get(link.from_node_id, 0) + 1
        node_to_links.setdefault(link.from_node_id, []).append(link.id)
        node_link_count[link.to_node_id] = node_link_count.get(link.to_node_id, 0) + 1
        node_to_links.setdefault(link.to_node_id, []).append(link.id)

    return {
        "node_link_count": node_link_count,
        "node_to_links": node_to_links,
        "links_by_id": links_by_id,
    }


def get_tag_timeline(db: Session, slug: str) -> list[Node]:
    nodes = (
        db.query(Node)
        .join(Report, Node.report_id == Report.id)
        .order_by(Report.date.asc(), Node.order.asc())
        .all()
    )
    return [n for n in nodes if n.tags and slug in n.tags]
