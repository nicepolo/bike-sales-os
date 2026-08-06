from datetime import date

from flask import Blueprint, jsonify, request
from flask_login import login_required

from app.extensions import db
from app.models.customer import CHANNELS, CUSTOMER_STATUSES, Customer
from app.models.vehicle import Vehicle

bp = Blueprint("customers", __name__, url_prefix="/api/customers")

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
    return None


def _resolve_deal_date(customer, data, previous_status):
    # 手動指定 deal_date（例如補登歷史成交紀錄）優先
    if "deal_date" in data:
        customer.deal_date = data["deal_date"]
        return
    if customer.status == "已成交" and previous_status != "已成交":
        customer.deal_date = date.today()
    elif customer.status != "已成交":
        customer.deal_date = None


@bp.get("")
@login_required
def list_customers():
    channel = request.args.get("channel")
    status = request.args.get("status")
    query = Customer.query
    if channel:
        query = query.filter_by(channel=channel)
    if status:
        query = query.filter_by(status=status)
    customers = query.order_by(Customer.created_at.desc()).all()
    return jsonify([c.to_dict() for c in customers])


@bp.get("/<int:customer_id>")
@login_required
def get_customer(customer_id):
    customer = db.get_or_404(Customer, customer_id)
    return jsonify(customer.to_dict())


@bp.post("")
@login_required
def create_customer():
    data = request.get_json(silent=True) or {}
    error = _validate(data)
    if error:
        return jsonify({"error": error}), 400

    if data.get("vehicle_id") and not db.session.get(Vehicle, data["vehicle_id"]):
        return jsonify({"error": "找不到對應車輛"}), 400

    customer = Customer(**{field: data.get(field) for field in EDITABLE_FIELDS if field in data})
    if not customer.status:
        customer.status = "詢問中"
    customer.is_batch_deal = bool(customer.is_batch_deal)

    _resolve_deal_date(customer, data, previous_status=None)

    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201


@bp.put("/<int:customer_id>")
@login_required
def update_customer(customer_id):
    customer = db.get_or_404(Customer, customer_id)
    data = request.get_json(silent=True) or {}
    error = _validate(data, partial=True)
    if error:
        return jsonify({"error": error}), 400

    if data.get("vehicle_id") and not db.session.get(Vehicle, data["vehicle_id"]):
        return jsonify({"error": "找不到對應車輛"}), 400

    previous_status = customer.status

    for field in EDITABLE_FIELDS:
        if field in data:
            setattr(customer, field, data[field])

    _resolve_deal_date(customer, data, previous_status)

    db.session.commit()
    return jsonify(customer.to_dict())


@bp.delete("/<int:customer_id>")
@login_required
def delete_customer(customer_id):
    customer = db.get_or_404(Customer, customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"ok": True})
