from datetime import datetime, timedelta
import importlib.util
from pathlib import Path

from app.extensions import db
from app.models.customer import Customer
from app.routes.customers import TAIPEI_TIMEZONE


def test_create_customer_with_crm_fields(app, authenticated_client):
    response = authenticated_client.post("/api/customers", json={
        "name": "測試客戶",
        "channel": "B2C",
        "status": "新詢問",
        "customer_segment": "外籍移工",
        "source": "Facebook",
        "language": "越南文",
        "interested_quantity": 2,
        "notes": "希望安排週末聯絡",
    })

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["customer_segment"] == "外籍移工"
    assert payload["source"] == "Facebook"
    assert payload["language"] == "越南文"
    assert payload["interested_quantity"] == 2
    assert payload["notes"] == "希望安排週末聯絡"
    assert payload["audience_segment"] == "外籍移工"
    assert payload["source_platform"] == "Facebook廣告"
    assert payload["preferred_language"] == "越南文"


def test_customer_filters_by_status_source_and_segment(app, authenticated_client):
    with app.app_context():
        db.session.add_all([
            Customer(name="符合", channel="B2C", status="已聯絡", source="TikTok", customer_segment="學生"),
            Customer(name="不同來源", channel="B2C", status="已聯絡", source="LINE", customer_segment="學生"),
            Customer(name="不同狀態", channel="B2C", status="新詢問", source="TikTok", customer_segment="學生"),
        ])
        db.session.commit()

    response = authenticated_client.get("/api/customers?status=已聯絡&source=TikTok&customer_segment=學生")
    assert response.status_code == 200
    assert [customer["name"] for customer in response.get_json()] == ["符合"]


def test_invalid_controlled_fields_and_quantity_are_rejected(authenticated_client):
    base = {"name": "測試客戶", "channel": "B2C"}
    cases = [
        ({"status": "已成交"}, "狀態"),
        ({"source": "未知"}, "來源"),
        ({"customer_segment": "未知"}, "客群"),
        ({"language": "英文"}, "語言"),
        ({"interested_quantity": 0}, "正整數"),
        ({"interested_quantity": 1.5}, "正整數"),
    ]
    for fields, message in cases:
        response = authenticated_client.post("/api/customers", json={**base, **fields})
        assert response.status_code == 400
        assert message in response.get_json()["error"]


def test_deal_date_and_dashboard_include_all_commercial_stages(app, authenticated_client):
    for status in ("已下訂", "已付款", "已交車"):
        response = authenticated_client.post("/api/customers", json={
            "name": status,
            "channel": "B2C",
            "status": status,
            "deal_amount": 1000,
        })
        assert response.status_code == 201
        assert response.get_json()["deal_date"] == datetime.now(TAIPEI_TIMEZONE).date().isoformat()

    summary = authenticated_client.get("/api/dashboard/summary").get_json()["B2C"]
    assert summary["total_deals"] == 3
    assert summary["today_deals"] == 3
    assert summary["total_deal_amount"] == 3000


def test_dashboard_excludes_non_commercial_stages_even_with_amount(app, authenticated_client):
    with app.app_context():
        db.session.add_all([
            Customer(name="新詢問", channel="B2C", status="新詢問", deal_amount=9000),
            Customer(name="流失", channel="B2C", status="流失", deal_amount=8000),
        ])
        db.session.commit()

    summary = authenticated_client.get("/api/dashboard/summary").get_json()["B2C"]
    assert summary["total_deals"] == 0
    assert summary["total_deal_amount"] == 0


def test_deal_date_is_preserved_across_status_transitions(app, authenticated_client):
    original_date = datetime.now(TAIPEI_TIMEZONE).date() - timedelta(days=5)
    with app.app_context():
        customer = Customer(name="日期測試", channel="B2C", status="已下訂", deal_amount=1000, deal_date=original_date)
        db.session.add(customer)
        db.session.commit()
        customer_id = customer.id

    paid = authenticated_client.put(f"/api/customers/{customer_id}", json={"status": "已付款"}).get_json()
    assert paid["deal_date"] == original_date.isoformat()

    reopened = authenticated_client.put(f"/api/customers/{customer_id}", json={"status": "已聯絡"}).get_json()
    assert reopened["deal_date"] == original_date.isoformat()
    summary = authenticated_client.get("/api/dashboard/summary").get_json()["B2C"]
    assert summary["total_deals"] == 0
    assert summary["today_deals"] == 0
    assert summary["total_deal_amount"] == 0

    reordered = authenticated_client.put(f"/api/customers/{customer_id}", json={"status": "已下訂"}).get_json()
    assert reordered["deal_date"] == original_date.isoformat()
    summary = authenticated_client.get("/api/dashboard/summary").get_json()["B2C"]
    assert summary["total_deals"] == 1
    assert summary["today_deals"] == 0
    assert summary["total_deal_amount"] == 1000


def test_migration_has_explicit_safe_legacy_status_mapping():
    migration_path = Path(__file__).parents[1] / "migrations" / "versions" / "d4f6a8c2e190_expand_customer_sales_funnel.py"
    spec = importlib.util.spec_from_file_location("customer_funnel_migration", migration_path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)

    assert migration.LEGACY_STATUS_MAPPING == {
        "詢問中": "新詢問",
        "預約試騎": "預約試騎",
        "已試騎": "預約試騎",
        "已成交": "已下訂",
        "未成交": "流失",
    }


def test_updating_canonical_fields_keeps_legacy_api_fields_consistent(app, authenticated_client):
    with app.app_context():
        customer = Customer(name="舊資料", channel="B2C", status="新詢問")
        db.session.add(customer)
        db.session.commit()
        customer_id = customer.id

    response = authenticated_client.put(f"/api/customers/{customer_id}", json={
        "customer_segment": "銀髮族",
        "source": "LINE",
        "language": "中文",
    })
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["customer_segment"] == payload["audience_segment"] == "銀髮族"
    assert payload["source"] == payload["source_platform"] == "LINE"
    assert payload["language"] == payload["preferred_language"] == "中文"


def test_customer_changes_do_not_change_vehicle_status(app, authenticated_client):
    from app.models.vehicle import Vehicle

    with app.app_context():
        vehicle = Vehicle(vehicle_code="BE100-TEST", source_type="全新", condition_grade="全新", status="已上架")
        db.session.add(vehicle)
        db.session.commit()
        vehicle_id = vehicle.id

    response = authenticated_client.post("/api/customers", json={
        "name": "購車客戶",
        "channel": "B2C",
        "status": "已付款",
        "vehicle_id": vehicle_id,
    })
    assert response.status_code == 201

    with app.app_context():
        assert db.session.get(Vehicle, vehicle_id).status == "已上架"
