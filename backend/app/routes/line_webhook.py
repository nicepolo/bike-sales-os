import logging

from flask import Blueprint, current_app, jsonify, request

from app.services.line_sales import (
    IntegrationError,
    LeadInquiry,
    generate_sales_reply,
    get_lead_sink,
    reply_to_line,
    verify_signature,
)


logger = logging.getLogger(__name__)
bp = Blueprint("line_webhook", __name__, url_prefix="/api/webhooks/line")


@bp.post("")
def webhook():
    body = request.get_data(cache=True)
    if not verify_signature(body, request.headers.get("X-Line-Signature", ""), current_app.config["LINE_CHANNEL_SECRET"]):
        return jsonify({"error": "invalid signature"}), 401

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get("events"), list):
        return jsonify({"error": "invalid payload"}), 400

    try:
        for event in payload["events"]:
            message = event.get("message") or {}
            if event.get("type") != "message" or message.get("type") != "text" or not event.get("replyToken"):
                continue
            user_text = message.get("text", "").strip()
            if not user_text:
                continue
            ai_reply = generate_sales_reply(
                user_text,
                current_app.config["OPENAI_API_KEY"],
                current_app.config["OPENAI_MODEL"],
            )
            get_lead_sink(current_app).record(
                LeadInquiry(
                    webhook_event_id=event.get("webhookEventId"),
                    message_id=message.get("id"),
                    line_user_id=(event.get("source") or {}).get("userId"),
                    message=user_text,
                    ai_reply=ai_reply,
                    event_timestamp=event.get("timestamp"),
                )
            )
            reply_to_line(event["replyToken"], ai_reply, current_app.config["LINE_CHANNEL_ACCESS_TOKEN"])
    except IntegrationError:
        logger.exception("LINE webhook integration failed")
        return jsonify({"error": "integration unavailable"}), 502

    return jsonify({"ok": True})
