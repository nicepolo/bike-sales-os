import logging
from concurrent.futures import ThreadPoolExecutor

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
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="line-webhook")


def _process_text_event(app, event: dict) -> None:
    message = event.get("message") or {}
    user_text = message.get("text", "").strip()
    if not user_text:
        return

    try:
        ai_reply = generate_sales_reply(
            user_text,
            app.config["OPENAI_API_KEY"],
            app.config["OPENAI_MODEL"],
        )
        get_lead_sink(app).record(
            LeadInquiry(
                webhook_event_id=event.get("webhookEventId"),
                message_id=message.get("id"),
                line_user_id=(event.get("source") or {}).get("userId"),
                message=user_text,
                ai_reply=ai_reply,
                event_timestamp=event.get("timestamp"),
            )
        )
        reply_to_line(event["replyToken"], ai_reply, app.config["LINE_CHANNEL_ACCESS_TOKEN"])
    except IntegrationError:
        logger.exception("LINE webhook integration failed")
    except Exception:
        logger.exception("LINE webhook background processing failed")


def _submit_text_event(app, event: dict) -> None:
    # LINE closes webhook requests quickly. Production work is dispatched to a
    # background worker so the callback can acknowledge immediately. Keep tests
    # synchronous so existing assertions remain deterministic.
    if app.testing:
        _process_text_event(app, event)
        return
    _executor.submit(_process_text_event, app, event)


@bp.post("")
def webhook():
    body = request.get_data(cache=True)
    if not verify_signature(body, request.headers.get("X-Line-Signature", ""), current_app.config["LINE_CHANNEL_SECRET"]):
        return jsonify({"error": "invalid signature"}), 401

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get("events"), list):
        return jsonify({"error": "invalid payload"}), 400

    app = current_app._get_current_object()
    for event in payload["events"]:
        message = event.get("message") or {}
        if event.get("type") != "message" or message.get("type") != "text" or not event.get("replyToken"):
            continue
        if not message.get("text", "").strip():
            continue
        _submit_text_event(app, event)

    return jsonify({"ok": True})
