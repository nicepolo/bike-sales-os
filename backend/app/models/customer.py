from datetime import datetime, timezone

from app.extensions import db

CHANNELS = ("B2B", "B2C", "經銷")
CUSTOMER_STATUSES = ("新詢問", "已聯絡", "預約試騎", "已下訂", "已付款", "已交車", "流失")
CUSTOMER_SEGMENTS = ("學生", "外籍移工", "通勤族", "親子家庭", "銀髮族", "其他")
SOURCES = ("TikTok", "Facebook", "Instagram", "Facebook社團", "LINE", "朋友介紹", "現場", "其他")
LANGUAGES = ("中文", "越南文", "印尼文", "泰文", "其他")


def _utcnow():
    return datetime.now(timezone.utc)


SALES_OWNERS = ("Polo", "Daniel")
SOURCE_PLATFORMS = ("TikTok", "Facebook廣告", "Facebook社團", "Instagram", "移工社群", "LINE", "朋友介紹", "現場", "其他")


class Customer(db.Model):
    __tablename__ = "customers"
    __table_args__ = (
        db.CheckConstraint(f"channel IN {CHANNELS}", name="ck_customers_channel"),
        db.CheckConstraint(f"status IN {CUSTOMER_STATUSES}", name="ck_customers_status"),
        db.CheckConstraint(f"sales_owner IS NULL OR sales_owner IN {SALES_OWNERS}", name="ck_customers_sales_owner"),
        db.CheckConstraint(f"customer_segment IS NULL OR customer_segment IN {CUSTOMER_SEGMENTS}", name="ck_customers_segment"),
        db.CheckConstraint(f"source IS NULL OR source IN {SOURCES}", name="ck_customers_source"),
        db.CheckConstraint(f"language IS NULL OR language IN {LANGUAGES}", name="ck_customers_language"),
        db.CheckConstraint("interested_quantity IS NULL OR interested_quantity > 0", name="ck_customers_interested_quantity"),
    )

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(100))
    channel = db.Column(db.String(20), nullable=False)
    vehicle_id = db.Column(db.BigInteger, db.ForeignKey("vehicles.id", ondelete="SET NULL"))
    status = db.Column(db.String(20), nullable=False, server_default="新詢問")
    legacy_status = db.Column(db.String(20))
    deal_amount = db.Column(db.Numeric(10, 2))
    # 首次進入下訂／付款／交車階段時自動帶入日期，用來判斷「今日成交數」
    deal_date = db.Column(db.Date)
    is_batch_deal = db.Column(db.Boolean, nullable=False, server_default="false")
    batch_note = db.Column(db.Text)
    referrer = db.Column(db.String(100))
    sales_owner = db.Column(db.String(20))
    source_platform = db.Column(db.String(30))
    audience_segment = db.Column(db.String(50))
    preferred_language = db.Column(db.String(30))
    interested_price = db.Column(db.Numeric(10, 2))
    next_action = db.Column(db.String(200))
    next_action_due_date = db.Column(db.Date)
    customer_segment = db.Column(db.String(20))
    source = db.Column(db.String(30))
    language = db.Column(db.String(20))
    interested_quantity = db.Column(db.Integer)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    vehicle = db.relationship("Vehicle", back_populates="customers")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact": self.contact,
            "channel": self.channel,
            "vehicle_id": self.vehicle_id,
            "vehicle_code": self.vehicle.vehicle_code if self.vehicle else None,
            "status": self.status,
            "legacy_status": self.legacy_status,
            "deal_amount": float(self.deal_amount) if self.deal_amount is not None else None,
            "deal_date": self.deal_date.isoformat() if self.deal_date else None,
            "is_batch_deal": self.is_batch_deal,
            "batch_note": self.batch_note,
            "referrer": self.referrer,
            "sales_owner": self.sales_owner,
            "source_platform": self.source_platform,
            "audience_segment": self.audience_segment,
            "preferred_language": self.preferred_language,
            "interested_price": float(self.interested_price) if self.interested_price is not None else None,
            "next_action": self.next_action,
            "next_action_due_date": self.next_action_due_date.isoformat() if self.next_action_due_date else None,
            "customer_segment": self.customer_segment,
            "source": self.source,
            "language": self.language,
            "interested_quantity": self.interested_quantity,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
