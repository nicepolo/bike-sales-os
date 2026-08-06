from flask import Blueprint, jsonify, request
from flask_login import login_required
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.vehicle import CONDITION_GRADES, SOURCE_TYPES, VEHICLE_STATUSES, Vehicle

bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")

EDITABLE_FIELDS = [
    "vehicle_code",
    "battery_code",
    "battery_health",
    "source_type",
    "condition_grade",
    "suggested_price",
    "price_tier",
    "photo_urls",
    "status",
    "location",
    "listed_date",
    "sold_date",
]


def _validate(data, partial=False):
    if not partial:
        if not data.get("vehicle_code"):
            return "車身編號為必填"
        if not data.get("source_type"):
            return "來源類型為必填"
        if not data.get("condition_grade"):
            return "車況等級為必填"
    if "source_type" in data and data["source_type"] not in SOURCE_TYPES:
        return f"來源類型需為 {SOURCE_TYPES}"
    if "condition_grade" in data and data["condition_grade"] not in CONDITION_GRADES:
        return f"車況等級需為 {CONDITION_GRADES}"
    if "status" in data and data["status"] not in VEHICLE_STATUSES:
        return f"狀態需為 {VEHICLE_STATUSES}"
    if "photo_urls" in data and data["photo_urls"] is not None and not isinstance(data["photo_urls"], list):
        return "photo_urls 必須是陣列"
    return None


@bp.get("")
@login_required
def list_vehicles():
    status = request.args.get("status")
    query = Vehicle.query
    if status:
        query = query.filter_by(status=status)
    vehicles = query.order_by(Vehicle.created_at.desc()).all()
    return jsonify([v.to_dict() for v in vehicles])


@bp.get("/<int:vehicle_id>")
@login_required
def get_vehicle(vehicle_id):
    vehicle = db.get_or_404(Vehicle, vehicle_id)
    return jsonify(vehicle.to_dict())


@bp.post("")
@login_required
def create_vehicle():
    data = request.get_json(silent=True) or {}
    error = _validate(data)
    if error:
        return jsonify({"error": error}), 400

    vehicle = Vehicle(**{field: data.get(field) for field in EDITABLE_FIELDS if field in data})
    if not vehicle.status:
        vehicle.status = "待上架"
    if vehicle.photo_urls is None:
        vehicle.photo_urls = []

    db.session.add(vehicle)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "車身編號重複"}), 400

    return jsonify(vehicle.to_dict()), 201


@bp.put("/<int:vehicle_id>")
@login_required
def update_vehicle(vehicle_id):
    vehicle = db.get_or_404(Vehicle, vehicle_id)
    data = request.get_json(silent=True) or {}
    error = _validate(data, partial=True)
    if error:
        return jsonify({"error": error}), 400

    for field in EDITABLE_FIELDS:
        if field in data:
            setattr(vehicle, field, data[field])

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "車身編號重複"}), 400

    return jsonify(vehicle.to_dict())


@bp.delete("/<int:vehicle_id>")
@login_required
def delete_vehicle(vehicle_id):
    vehicle = db.get_or_404(Vehicle, vehicle_id)
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({"ok": True})
