from datetime import datetime, timezone

from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB

ITEM_STATUSES = ("未檢查", "已確認", "不適用", "有問題")
VERIFICATION_STATES = ("待確認", "已驗證")


def _utcnow():
    return datetime.now(timezone.utc)


class FactoryVisit(db.Model):
    __tablename__ = "factory_visits"

    id = db.Column(db.BigInteger, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    factory_name = db.Column(db.String(120))
    visit_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
    items = db.relationship("FactoryCheckItem", back_populates="visit", cascade="all, delete-orphan", order_by="FactoryCheckItem.position")

    def to_dict(self, include_items=False):
        result = {"id": self.id, "title": self.title, "factory_name": self.factory_name, "visit_date": self.visit_date.isoformat() if self.visit_date else None, "notes": self.notes, "created_at": self.created_at.isoformat()}
        counts = {status: 0 for status in ITEM_STATUSES}
        for item in self.items:
            counts[item.status] += 1
        result["counts"] = counts
        result["total_items"] = len(self.items)
        if include_items:
            result["items"] = [item.to_dict() for item in self.items]
        return result


class FactoryCheckItem(db.Model):
    __tablename__ = "factory_check_items"
    __table_args__ = (
        db.UniqueConstraint("visit_id", "item_key", name="uq_factory_check_items_visit_key"),
        db.CheckConstraint(f"status IN {ITEM_STATUSES}", name="ck_factory_check_items_status"),
        db.CheckConstraint(f"verification_state IN {VERIFICATION_STATES}", name="ck_factory_check_items_verification"),
    )

    id = db.Column(db.BigInteger, primary_key=True)
    visit_id = db.Column(db.BigInteger, db.ForeignKey("factory_visits.id", ondelete="CASCADE"), nullable=False, index=True)
    item_key = db.Column(db.String(80), nullable=False)
    section = db.Column(db.String(80), nullable=False)
    label = db.Column(db.String(200), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, server_default="未檢查")
    captured_value = db.Column(db.Text)
    evidence_source = db.Column(db.String(200))
    notes = db.Column(db.Text)
    follow_up_question = db.Column(db.Text)
    change_history = db.Column(JSONB, nullable=False, default=list)
    verification_state = db.Column(db.String(20), nullable=False, server_default="待確認")
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
    visit = db.relationship("FactoryVisit", back_populates="items")

    def to_dict(self):
        return {"id": self.id, "item_key": self.item_key, "section": self.section, "label": self.label, "position": self.position, "status": self.status, "captured_value": self.captured_value, "evidence_source": self.evidence_source, "notes": self.notes, "follow_up_question": self.follow_up_question, "change_history": self.change_history or [], "verification_state": self.verification_state}
