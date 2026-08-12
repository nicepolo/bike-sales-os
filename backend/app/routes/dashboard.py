from datetime import date

from flask import Blueprint, jsonify
from flask_login import login_required
from sqlalchemy import func

from app.extensions import db
from app.models.customer import CHANNELS, Customer

DEAL_STATUSES = ("已下訂", "已付款", "已交車")

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@bp.get("/summary")
@login_required
def summary():
    today = date.today()
    line_leads = Customer.query.filter_by(source="LINE")
    high_intent = line_leads.filter(Customer.is_batch_deal.is_(True))
    result = {
        "sales_qualification": {
            "today_valid_inquiries": line_leads.filter(func.date(Customer.created_at) == today).count(),
            "today_high_intent": high_intent.filter(func.date(Customer.created_at) == today).count(),
            "total_high_intent": high_intent.count(),
            "pending_human_follow_up": high_intent.filter(Customer.status.in_(("新詢問", "已聯絡", "預約試騎"))).count(),
            "closed_deals": line_leads.filter(Customer.status.in_(DEAL_STATUSES)).count(),
        }
    }

    for channel in CHANNELS:
        base = Customer.query.filter_by(channel=channel)

        total_inquiries = base.count()
        today_inquiries = base.filter(func.date(Customer.created_at) == today).count()

        deals = base.filter(Customer.status.in_(DEAL_STATUSES))
        total_deals = deals.count()
        today_deals = deals.filter(Customer.deal_date == today).count()

        total_deal_amount = (
            db.session.query(func.coalesce(func.sum(Customer.deal_amount), 0))
            .filter(Customer.channel == channel, Customer.status.in_(DEAL_STATUSES))
            .scalar()
        )

        result[channel] = {
            "today_inquiries": today_inquiries,
            "total_inquiries": total_inquiries,
            "today_deals": today_deals,
            "total_deals": total_deals,
            "total_deal_amount": float(total_deal_amount or 0),
        }

    return jsonify(result)
