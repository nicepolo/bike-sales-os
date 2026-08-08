from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_login import login_required
from sqlalchemy import or_

from app.extensions import db
from app.models.customer import (
    CHANNELS, CUSTOMER_SEGMENTS, CUSTOMER_STATUSES, LANGUAGES, SALES_OWNERS,
    SOURCES, SOURCE_PLATFORMS, Customer,
)
from app.models.vehicle import Vehicle

bp = Blueprint("customers", __name__, url_prefix="/api/customers")
TAIPEI_TIMEZONE = timezone(timedelta(hours=8))
ACTIVE_STATUSES = ("新詢問", "已聯絡", "預約試騎")
DEAL_STATUSES = ("已下訂", "已付款", "已交車")

EDITABLE_FIELDS = [
    "name",
    "contact",
    "channel",
    "vehicle_id",
    "status",
    "deal_amount",
    "is_batch_deal",
    "batch_note",
    "referrer",
    "sales_owner",
    "source_platform",
    "audience_segment",
    "preferred_language",
    "interested_price",
    "next_action",
    "next_action_due_date",
    "customer_segment",
    "source",
    "language",
    "interested_quantity",
    "notes",
]


def _validate(data, partial=False):
    if not partial and not data.get("name"):
        return "姓名為必填"
    if not partial and not data.get("channel"):
        return "來源通路為必填"
    if "channel" in data and data["channel"] not in CHANNELS:
        return f"來源通路需為 {CHANNELS}"
    if "status" in data and data["status"] not in CUSTOMER_STATUSES:
        return f"狀態需為 {CUSTOMER_STATUSES}"
    if data.get("sales_owner") and data["sales_owner"] not in SALES_OWNERS:
        return f"負責人必須為：{SALES_OWNERS}"
    if data.get("source_platform") and data["source_platform"] not in SOURCE_PLATFORMS:
        return f"來源平台必須為：{SOURCE_PLATFORMS}"
    if data.get("customer_segment") and data["customer_segment"] not in CUSTOMER_SEGMENTS:
        return f"客群必須為：{CUSTOMER_SEGMENTS}"
    if data.get("source") and data["source"] not in SOURCES:
        return f"來源必須為：{SOURCES}"
    if data.get("language") and data["language"] not in LANGUAGES:
        return f"語言必須為：{LANGUAGES}"
    return None


def _resolve_deal_date(customer, data):
    # 手動指定 deal_date（例如補登歷史成交紀錄）優先
    if "deal_date" in data:
        customer.deal_date = data["deal_date"]
        return
    if customer.status in DEAL_STATUSES and customer.deal_date is None:
        customer.deal_date = datetime.now(TAIPEI_TIMEZONE).date()


def _sync_legacy_sales_fields(data):
    """Keep legacy columns readable while canonical CRM fields are adopted."""
    if "customer_segment" in data:
        data["audience_segment"] = data["customer_segment"]
    if "language" in data:
        data["preferred_language"] = data["language"]
    if "source" in data:
        data["source_platform"] = "Facebook廣告" if data["source"] == "Facebook" else data["source"]


def _normalize_legacy_aliases(data):
    """Accept controlled legacy names without allowing canonical values to diverge."""
    aliases = (
        ("audience_segment", "customer_segment", CUSTOMER_SEGMENTS, "客群"),
        ("preferred_language", "language", LANGUAGES, "語言"),
    )
    for legacy_field, canonical_field, allowed_values, label in aliases:
        if legacy_field not in data:
            continue
        legacy_value = data[legacy_field] or None
        if legacy_value is None and canonical_field in data:
            # Current forms may still carry an empty legacy alias. Treat it as
            # unspecified so the canonical field remains authoritative.
            continue
        if legacy_value is not None and legacy_value not in allowed_values:
            return f"{label}必須為：{allowed_values}"
        if canonical_field in data:
            canonical_value = data[canonical_field] or None
            if canonical_value != legacy_value:
                return f"{label}的新舊欄位不可指定不同值"
        else:
            data[canonical_field] = legacy_value
    return None


def _normalize_sales_dates(data):
    value = data.get("next_action_due_date")
    if value:
        try:
            data["next_action_due_date"] = date.fromisoformat(value)
        except (TypeError, ValueError):
            return "下次追蹤日期格式錯誤"
    elif "next_action_due_date" in data:
        data["next_action_due_date"] = None
    return None


def _normalize_sales_fields(data):
    for field in ("sales_owner", "source_platform", "audience_segment", "preferred_language", "next_action", "customer_segment", "source", "language"):
        if field in data and data[field] == "":
            data[field] = None

    if data.get("interested_price") is not None:
        try:
            price = Decimal(str(data["interested_price"]))
        except (InvalidOperation, TypeError, ValueError):
            return "預算／有興趣價格格式錯誤"
        if price < 0:
            return "預算／有興趣價格不可小於 0"
        data["interested_price"] = price
    if data.get("interested_quantity") is not None:
        value = data["interested_quantity"]
        if isinstance(value, bool):
            return "預計購買台數必須為正整數"
        try:
            quantity = int(value)
        except (TypeError, ValueError):
            return "預計購買台數必須為正整數"
        if quantity <= 0 or str(value).strip() != str(quantity):
            return "預計購買台數必須為正整數"
        data["interested_quantity"] = quantity
    return None


@bp.get("")
@login_required
def list_customers():
    channel = request.args.get("channel")
    status = request.args.get("status")
    sales_owner = request.args.get("sales_owner")
    source_platform = request.args.get("source_platform")
    source = request.args.get("source")
    customer_segment = request.args.get("customer_segment")
    overdue = request.args.get("overdue") == "true"
    follow_up = request.args.get("follow_up")
    query = Customer.query
    if channel:
        query = query.filter_by(channel=channel)
    if status:
        query = query.filter_by(status=status)
    if sales_owner == "unassigned":
        query = query.filter(Customer.sales_owner.is_(None))
    elif sales_owner:
        query = query.filter_by(sales_owner=sales_owner)
    if source_platform:
        query = query.filter_by(source_platform=source_platform)
    if source:
        query = query.filter_by(source=source)
    if customer_segment:
        query = query.filter_by(customer_segment=customer_segment)
    taipei_today = datetime.now(TAIPEI_TIMEZONE).date()
    if overdue or follow_up == "overdue":
        query = query.filter(Customer.status.in_(ACTIVE_STATUSES), Customer.next_action_due_date < taipei_today)
    elif follow_up == "due_today":
        query = query.filter(Customer.status.in_(ACTIVE_STATUSES), Customer.next_action_due_date == taipei_today)
    elif follow_up == "no_next_action":
        query = query.filter(Customer.status.in_(ACTIVE_STATUSES), or_(Customer.next_action.is_(None), Customer.next_action == ""))
    customers = query.order_by(Customer.created_at.desc()).all()
    return jsonify([c.to_dict() for c in customers])


@bp.get("/workload")
@login_required
def sales_workload():
    taipei_today = datetime.now(TAIPEI_TIMEZONE).date()
    result = {label: {"active": 0, "due_today": 0, "overdue": 0, "no_next_action": 0} for label in (*SALES_OWNERS, "未指派")}
    active_query = Customer.query.with_entities(Customer.sales_owner, Customer.next_action, Customer.next_action_due_date).filter(Customer.status.in_(ACTIVE_STATUSES))
    if request.args.get("channel"):
        active_query = active_query.filter(Customer.channel == request.args["channel"])
    if request.args.get("source_platform"):
        active_query = active_query.filter(Customer.source_platform == request.args["source_platform"])
    if request.args.get("source"):
        active_query = active_query.filter(Customer.source == request.args["source"])
    if request.args.get("customer_segment"):
        active_query = active_query.filter(Customer.customer_segment == request.args["customer_segment"])
    active_customers = active_query.all()
    for owner, next_action, due_date in active_customers:
        label = owner if owner in SALES_OWNERS else "未指派"
        result[label]["active"] += 1
        result[label]["due_today"] += int(due_date == taipei_today)
        result[label]["overdue"] += int(due_date is not None and due_date < taipei_today)
        result[label]["no_next_action"] += int(not next_action)
    return jsonify(result)


@bp.get("/<int:customer_id>")
@login_required
def get_customer(customer_id):
    customer = db.get_or_404(Customer, customer_id)
    return jsonify(customer.to_dict())


@bp.post("")
@login_required
def create_customer():
    data = request.get_json(silent=True) or {}
    alias_error = _normalize_legacy_aliases(data)
    if alias_error:
        return jsonify({"error": alias_error}), 400
    date_error = _normalize_sales_dates(data)
    if date_error:
        return jsonify({"error": date_error}), 400
    sales_error = _normalize_sales_fields(data)
    if sales_error:
        return jsonify({"error": sales_error}), 400
    _sync_legacy_sales_fields(data)
    error = _validate(data)
    if error:
        return jsonify({"error": error}), 400

    if data.get("vehicle_id") and not db.session.get(Vehicle, data["vehicle_id"]):
        return jsonify({"error": "找不到對應車輛"}), 400

    customer = Customer(**{field: data.get(field) for field in EDITABLE_FIELDS if field in data})
    if not customer.status:
        customer.status = "新詢問"
    customer.is_batch_deal = bool(customer.is_batch_deal)

    _resolve_deal_date(customer, data)

    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201


@bp.put("/<int:customer_id>")
@login_required
def update_customer(customer_id):
    customer = db.get_or_404(Customer, customer_id)
    data = request.get_json(silent=True) or {}
    alias_error = _normalize_legacy_aliases(data)
    if alias_error:
        return jsonify({"error": alias_error}), 400
    date_error = _normalize_sales_dates(data)
    if date_error:
        return jsonify({"error": date_error}), 400
    sales_error = _normalize_sales_fields(data)
    if sales_error:
        return jsonify({"error": sales_error}), 400
    _sync_legacy_sales_fields(data)
    error = _validate(data, partial=True)
    if error:
        return jsonify({"error": error}), 400

    if data.get("vehicle_id") and not db.session.get(Vehicle, data["vehicle_id"]):
        return jsonify({"error": "找不到對應車輛"}), 400

    for field in EDITABLE_FIELDS:
        if field in data:
            setattr(customer, field, data[field])

    _resolve_deal_date(customer, data)

    db.session.commit()
    return jsonify(customer.to_dict())


@bp.delete("/<int:customer_id>")
@login_required
def delete_customer(customer_id):
    customer = db.get_or_404(Customer, customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"ok": True})
