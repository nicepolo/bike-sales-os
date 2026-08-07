from app.extensions import db
from app.models.factory import FactoryCheckItem, FactoryVisit


def seed_visit(app):
    with app.app_context():
        visit = FactoryVisit(id=1, title="原始訪視")
        visit.items.append(FactoryCheckItem(id=1, section="電池", item_key="battery_label", label="電池標籤", position=1))
        db.session.add(visit)
        db.session.commit()


def test_factory_routes_require_login(client):
    assert client.get("/api/factory-visits").status_code == 401
    assert client.put("/api/factory-visits/1", json={"title": "不可更新"}).status_code == 401


def test_update_visit_details_preserves_checklist(app, authenticated_client):
    seed_visit(app)
    response = authenticated_client.put("/api/factory-visits/1", json={
        "title": "BE100 現場抽樣",
        "factory_name": "測試工廠",
        "visit_date": "2026-08-15",
        "notes": "由工廠全量盤點，我方抽樣。",
    })
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["title"] == "BE100 現場抽樣"
    assert payload["visit_date"] == "2026-08-15"
    assert len(payload["items"]) == 1
    assert payload["items"][0]["item_key"] == "battery_label"


def test_update_visit_rejects_null_title_without_changing_data(app, authenticated_client):
    seed_visit(app)
    response = authenticated_client.put("/api/factory-visits/1", json={"title": None})
    assert response.status_code == 400
    with app.app_context():
        assert db.session.get(FactoryVisit, 1).title == "原始訪視"


def test_item_history_ignores_equivalent_empty_value(app, authenticated_client):
    seed_visit(app)
    response = authenticated_client.put("/api/factory-visits/1/items/1", json={"notes": ""})
    assert response.status_code == 200
    assert response.get_json()["change_history"] == []


def test_item_cannot_be_verified_before_evidence_upload(app, authenticated_client):
    seed_visit(app)
    response = authenticated_client.put("/api/factory-visits/1/items/1", json={"verification_state": "已驗證"})
    assert response.status_code == 400
    assert "照片" in response.get_json()["error"]
