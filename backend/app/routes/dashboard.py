from datetime import date

from flask import Blueprint, jsonify
from flask_login import login_required
from sqlalchemy import func

from app.extensions import db
from app.models.customer import CHANNELS, Customer

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@bp.get("/summary")
@login_required
def summary():
    today = date.today()
    result = {}

    for channel in CHANNELS:
        base = Customer.query.filter_by(channel=channel)

        total_inquiries = base.count()
        today_inquiries = base.filter(func.date(Customer.created_at) == today).count()

        deals = base.filter_by(status="已成交")
        total_deals = deals.count()
        today_deals = deals.filter(Customer.deal_date == today).count()

        total_deal_amount = (
            db.session.query(func.coalesce(func.sum(Customer.deal_amount), 0))
            .filter(Customer.channel == channel, Customer.status == "已成交")
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
