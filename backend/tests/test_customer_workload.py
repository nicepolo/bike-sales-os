from datetime import datetime, timedelta

from app.extensions import db
from app.models.customer import Customer
from app.routes.customers import TAIPEI_TIMEZONE


def seed_customers(app):
    today = datetime.now(TAIPEI_TIMEZONE).date()
    with app.app_context():
        db.session.add_all([
            Customer(id=1, name="Polo 逾期", channel="B2C", status="詢問中", sales_owner="Polo", source_platform="TikTok", next_action="電話", next_action_due_date=today - timedelta(days=1)),
            Customer(id=2, name="Polo 今日", channel="B2C", status="預約試騎", sales_owner="Polo", source_platform="Facebook廣告", next_action="確認試騎", next_action_due_date=today),
            Customer(id=3, name="Daniel 未安排", channel="B2B", status="已試騎", sales_owner="Daniel", source_platform="TikTok"),
            Customer(id=4, name="未指派", channel="經銷", status="詢問中"),
            Customer(id=5, name="已成交不計", channel="B2C", status="已成交", sales_owner="Polo", next_action_due_date=today - timedelta(days=2)),
        ])
        db.session.commit()


def test_sales_workload_counts_only_active_customers(app, authenticated_client):
    seed_customers(app)
    response = authenticated_client.get("/api/customers/workload")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["Polo"] == {"active": 2, "due_today": 1, "overdue": 1, "no_next_action": 0}
    assert payload["Daniel"]["active"] == 1
    assert payload["Daniel"]["no_next_action"] == 1
    assert payload["未指派"]["active"] == 1


def test_unassigned_owner_filter(app, authenticated_client):
    seed_customers(app)
    response = authenticated_client.get("/api/customers?sales_owner=unassigned")
    assert response.status_code == 200
    assert [customer["name"] for customer in response.get_json()] == ["未指派"]


def test_overdue_filter_excludes_closed_customers(app, authenticated_client):
    seed_customers(app)
    response = authenticated_client.get("/api/customers?overdue=true")
    assert response.status_code == 200
    assert [customer["name"] for customer in response.get_json()] == ["Polo 逾期"]


def test_follow_up_queue_filters(app, authenticated_client):
    seed_customers(app)
    due_today = authenticated_client.get("/api/customers?follow_up=due_today").get_json()
    overdue = authenticated_client.get("/api/customers?follow_up=overdue").get_json()
    no_next_action = authenticated_client.get("/api/customers?follow_up=no_next_action").get_json()
    assert [customer["name"] for customer in due_today] == ["Polo 今日"]
    assert [customer["name"] for customer in overdue] == ["Polo 逾期"]
    assert {customer["name"] for customer in no_next_action} == {"Daniel 未安排", "未指派"}


def test_follow_up_queue_combines_with_owner_filter(app, authenticated_client):
    seed_customers(app)
    response = authenticated_client.get("/api/customers?sales_owner=Daniel&follow_up=no_next_action")
    assert [customer["name"] for customer in response.get_json()] == ["Daniel 未安排"]


def test_workload_respects_channel_and_source_context(app, authenticated_client):
    seed_customers(app)
    by_channel = authenticated_client.get("/api/customers/workload?channel=B2B").get_json()
    by_source = authenticated_client.get("/api/customers/workload?source_platform=TikTok").get_json()
    assert by_channel["Daniel"]["active"] == 1
    assert by_channel["Polo"]["active"] == 0
    assert by_source["Polo"]["active"] == 1
    assert by_source["Daniel"]["active"] == 1
