from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import JSONB

from app.extensions import db

SOURCE_TYPES = ("全新", "退役車")
CONDITION_GRADES = ("全新", "9成新", "需維修")
VEHICLE_STATUSES = ("待上架", "已上架", "預約試騎", "已成交", "已交車")


def _utcnow():
    return datetime.now(timezone.utc)


class Vehicle(db.Model):
    __tablename__ = "vehicles"
    __table_args__ = (
        db.CheckConstraint(f"source_type IN {SOURCE_TYPES}", name="ck_vehicles_source_type"),
        db.CheckConstraint(f"condition_grade IN {CONDITION_GRADES}", name="ck_vehicles_condition_grade"),
        db.CheckConstraint(f"status IN {VEHICLE_STATUSES}", name="ck_vehicles_status"),
    )

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True)
    vehicle_code = db.Column(db.String(50), nullable=False, unique=True)
    battery_code = db.Column(db.String(100))
    battery_health = db.Column(db.String(100))
    source_type = db.Column(db.String(20), nullable=False)
    condition_grade = db.Column(db.String(20), nullable=False)
    suggested_price = db.Column(db.Numeric(10, 2))
    # 不加 CHECK 限制，價格層級策略未來會調整
    price_tier = db.Column(db.Integer)
    photo_urls = db.Column(db.JSON().with_variant(JSONB, "postgresql"), nullable=False, server_default="[]")
    status = db.Column(db.String(20), nullable=False, server_default="待上架")
    location = db.Column(db.String(100))
    listed_date = db.Column(db.Date)
    sold_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    customers = db.relationship("Customer", back_populates="vehicle")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_code": self.vehicle_code,
            "battery_code": self.battery_code,
            "battery_health": self.battery_health,
            "source_type": self.source_type,
            "condition_grade": self.condition_grade,
            "suggested_price": float(self.suggested_price) if self.suggested_price is not None else None,
            "price_tier": self.price_tier,
            "photo_urls": self.photo_urls or [],
            "status": self.status,
            "location": self.location,
            "listed_date": self.listed_date.isoformat() if self.listed_date else None,
            "sold_date": self.sold_date.isoformat() if self.sold_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
