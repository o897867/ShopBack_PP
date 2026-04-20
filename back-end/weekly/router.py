from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from weekly import crud
from weekly.database import get_db
from weekly.schemas import (
    LinkDetail,
    NodeDetail,
    ReportDetail,
    ReportSummary,
    TagDetail,
)

router = APIRouter(prefix="/api/weekly", tags=["weekly"])


@router.get("/reports", response_model=list[ReportSummary])
def get_reports(db: Session = Depends(get_db)):
    reports = crud.list_reports(db)
    return [
        ReportSummary(
            id=r.id,
            date=r.date,
            title=r.title,
            author=r.author,
            source_url=r.source_url,
            cover_image=r.cover_image,
            created_at=r.created_at,
            updated_at=r.updated_at,
            node_count=len(r.nodes),
        )
        for r in reports
    ]


@router.get("/reports/{report_id}", response_model=ReportDetail)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = crud.get_report(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/nodes", response_model=list[NodeDetail])
def get_nodes(tag: str | None = Query(None), db: Session = Depends(get_db)):
    return crud.list_nodes(db, tag=tag)


@router.get("/nodes/{node_id}", response_model=NodeDetail)
def get_node(node_id: str, db: Session = Depends(get_db)):
    node = crud.get_node(db, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.get("/links", response_model=list[LinkDetail])
def get_links(node: str | None = Query(None), db: Session = Depends(get_db)):
    return crud.list_links(db, node_id=node)


@router.get("/tags", response_model=list[TagDetail])
def get_tags(db: Session = Depends(get_db)):
    return crud.list_tags(db)


@router.get("/tags/{slug}/timeline", response_model=list[NodeDetail])
def get_tag_timeline(slug: str, db: Session = Depends(get_db)):
    return crud.get_tag_timeline(db, slug)
