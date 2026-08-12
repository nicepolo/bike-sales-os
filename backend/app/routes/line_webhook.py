import logging

from flask import Blueprint, current_app, jsonify, request

from app.services.line_sales import (
    IntegrationError,
    LeadInquiry,
    generate_sales_reply,
    get_lead_context,
    get_lead_sink,
    qualify_sales_message,
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
            line_user_id = (event.get("source") or {}).get("userId")
            qualification = qualify_sales_message(user_text, get_lead_context(line_user_id))
            ai_reply = generate_sales_reply(
                user_text,
                current_app.config["OPENAI_API_KEY"],
                current_app.config["OPENAI_MODEL"],
                qualification,
            )
            get_lead_sink(current_app).record(
                LeadInquiry(
                    webhook_event_id=event.get("webhookEventId"),
                    message_id=message.get("id"),
                    line_user_id=line_user_id,
                    message=user_text,
                    ai_reply=ai_reply,
                    event_timestamp=event.get("timestamp"),
                    high_intent=qualification.high_intent,
                    intent_reason=qualification.intent_reason,
                    quantity=qualification.quantity,
                    location=qualification.location,
                    purchase_purpose=qualification.purchase_purpose,
                    contact_time=qualification.contact_time,
                    name=qualification.name,
                )
            )
            reply_to_line(event["replyToken"], ai_reply, current_app.config["LINE_CHANNEL_ACCESS_TOKEN"])
    except IntegrationError:
        logger.exception("LINE webhook integration failed")
        return jsonify({"error": "integration unavailable"}), 502

    return jsonify({"ok": True})
