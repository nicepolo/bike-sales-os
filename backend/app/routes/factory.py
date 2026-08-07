from datetime import date, datetime, timezone

from flask import Blueprint, jsonify, request
from flask_login import login_required

from app.extensions import db
from app.models.factory import FactoryCheckItem, FactoryVisit, ITEM_STATUSES, VERIFICATION_STATES

bp = Blueprint("factory", __name__, url_prefix="/api/factory-visits")

TEMPLATE = [
    ("車輛識別與外觀", "vehicle_full_views", "車輛前後左右與斜角全景"), ("車輛識別與外觀", "frame_number", "車架號碼與位置"), ("車輛識別與外觀", "condition", "顏色、外觀與配件狀況"),
    ("認證與標籤", "yellow_label", "小黃標完整與特寫"), ("認證與標籤", "cert_documents", "證書或官方文件"), ("認證與標籤", "legal_questions", "道路使用與分類待確認問題"),
    ("電池", "battery_label", "電池外觀、標籤與序號"), ("電池", "battery_removal", "拆裝、鎖具與接頭"), ("電池", "battery_condition", "損傷、膨脹、腐蝕與抽測"),
    ("馬達與控制器", "motor_label", "馬達位置與標籤"), ("馬達與控制器", "controller", "控制器位置、標籤與接線"),
    ("充電器與充電", "charger_label", "充電器標籤、輸入輸出與接頭"), ("充電器與充電", "charging_demo", "充電流程與指示燈"),
    ("操作測試", "power", "電源開啟與關閉"), ("操作測試", "display", "顯示器與指示資訊"), ("操作測試", "assist_modes", "輔助模式切換與反應"), ("操作測試", "throttle", "油門或加速控制（如有）"), ("操作測試", "brakes", "前後煞車與馬達斷電"), ("操作測試", "lights", "前後燈與指示燈"), ("操作測試", "bell_horn", "鈴鐺或喇叭"), ("操作測試", "adjustments", "折疊或調整功能（如有）"), ("操作測試", "faults", "異音、震動、警示碼或故障"),
    ("庫存抽樣", "factory_inventory", "工廠全量盤點清單與負責人"), ("庫存抽樣", "sample_method", "我方抽樣數量與選樣方法"), ("庫存抽樣", "sample_match", "抽樣車架／電池編號與清單比對"),
    ("零件與售後", "parts_supply", "主要零件供應、料號與交期"), ("零件與售後", "repair_process", "維修能力與診斷流程"),
    ("影音素材", "hero_shots", "橫式與直式乾淨主視覺"), ("影音素材", "operation_clips", "操作、電池、充電與試騎短片"),
    ("工廠問答", "stock_history", "庫存原因、保存與維護歷史"), ("工廠問答", "written_commitments", "全新品、隨附品與可書面支持說法"),
]


@bp.get("")
@login_required
def list_visits():
    return jsonify([visit.to_dict() for visit in FactoryVisit.query.order_by(FactoryVisit.created_at.desc()).all()])


@bp.post("")
@login_required
def create_visit():
    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        return jsonify({"error": "訪視名稱為必填"}), 400
    visit_date = None
    if data.get("visit_date"):
        try:
            visit_date = date.fromisoformat(data["visit_date"])
        except ValueError:
            return jsonify({"error": "訪視日期格式錯誤"}), 400
    visit = FactoryVisit(title=data["title"], factory_name=data.get("factory_name") or None, visit_date=visit_date, notes=data.get("notes") or None)
    for position, (section, key, label) in enumerate(TEMPLATE, 1):
        visit.items.append(FactoryCheckItem(section=section, item_key=key, label=label, position=position))
    db.session.add(visit)
    db.session.commit()
    return jsonify(visit.to_dict(include_items=True)), 201


@bp.get("/<int:visit_id>")
@login_required
def get_visit(visit_id):
    return jsonify(db.get_or_404(FactoryVisit, visit_id).to_dict(include_items=True))


@bp.put("/<int:visit_id>")
@login_required
def update_visit(visit_id):
    visit = db.get_or_404(FactoryVisit, visit_id)
    data = request.get_json(silent=True) or {}
    title_value = data.get("title", visit.title)
    if not isinstance(title_value, str) or not title_value.strip():
        return jsonify({"error": "訪視名稱為必填"}), 400
    title = title_value.strip()
    if len(title) > 120:
        return jsonify({"error": "訪視名稱不可超過 120 字"}), 400
    factory_name = data.get("factory_name", visit.factory_name)
    if factory_name is not None and not isinstance(factory_name, str):
        return jsonify({"error": "工廠名稱格式錯誤"}), 400
    factory_name = factory_name.strip() if factory_name else None
    if factory_name and len(factory_name) > 120:
        return jsonify({"error": "工廠名稱不可超過 120 字"}), 400
    visit_date = visit.visit_date
    if "visit_date" in data:
        try:
            visit_date = date.fromisoformat(data["visit_date"]) if data["visit_date"] else None
        except (TypeError, ValueError):
            return jsonify({"error": "訪視日期格式錯誤"}), 400
    visit.title = title
    visit.factory_name = factory_name
    visit.visit_date = visit_date
    if "notes" in data:
        if data["notes"] is not None and not isinstance(data["notes"], str):
            return jsonify({"error": "整體備註格式錯誤"}), 400
        visit.notes = data["notes"].strip() if data["notes"] else None
    db.session.commit()
    return jsonify(visit.to_dict(include_items=True))


@bp.put("/<int:visit_id>/items/<int:item_id>")
@login_required
def update_item(visit_id, item_id):
    item = db.get_or_404(FactoryCheckItem, item_id)
    if item.visit_id != visit_id:
        return jsonify({"error": "檢查項目不屬於此訪視"}), 404
    data = request.get_json(silent=True) or {}
    for field in ("captured_value", "evidence_source", "notes", "follow_up_question"):
        if field in data and data[field] == "":
            data[field] = None
    if "status" in data and data["status"] not in ITEM_STATUSES:
        return jsonify({"error": "無效的檢查狀態"}), 400
    if "verification_state" in data and data["verification_state"] not in VERIFICATION_STATES:
        return jsonify({"error": "無效的驗證狀態"}), 400
    if data.get("verification_state") == "已驗證":
        return jsonify({"error": "照片／影片證據功能尚未完成，目前不可標記為已驗證"}), 400
    tracked_fields = ("status", "captured_value", "evidence_source", "notes", "follow_up_question", "verification_state")
    previous = {field: getattr(item, field) for field in tracked_fields if field in data and getattr(item, field) != data[field]}
    if previous:
        item.change_history = [*(item.change_history or []), {"changed_at": datetime.now(timezone.utc).isoformat(), "previous": previous}]
    for field in tracked_fields:
        if field in data:
            setattr(item, field, data[field] or None if field not in ("status", "verification_state") else data[field])
    db.session.commit()
    return jsonify(item.to_dict())
