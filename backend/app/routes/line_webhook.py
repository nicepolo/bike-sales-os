import logging
from concurrent.futures import ThreadPoolExecutor

from flask import Blueprint, current_app, jsonify, request

from app.services.line_rich import POSTBACK_INTENTS, build_sales_messages
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


def _process_text_event(app, event: dict, public_origin: str, user_text: str) -> None:
    message = event.get("message") or {}
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
        messages = build_sales_messages(user_text, ai_reply, public_origin)
        reply_to_line(event["replyToken"], messages, app.config["LINE_CHANNEL_ACCESS_TOKEN"])
    except IntegrationError:
        logger.exception("LINE webhook integration failed")
    except Exception:
        logger.exception("LINE webhook background processing failed")


def _submit_text_event(app, event: dict, public_origin: str, user_text: str) -> None:
    # LINE closes webhook requests quickly. Production work is dispatched to a
    # background worker so the callback can acknowledge immediately. Keep tests
    # synchronous so existing assertions remain deterministic.
    if app.testing:
        _process_text_event(app, event, public_origin, user_text)
        return
    _executor.submit(_process_text_event, app, event, public_origin, user_text)


@bp.post("")
def webhook():
    body = request.get_data(cache=True)
    if not verify_signature(body, request.headers.get("X-Line-Signature", ""), current_app.config["LINE_CHANNEL_SECRET"]):
        return jsonify({"error": "invalid signature"}), 401

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get("events"), list):
        return jsonify({"error": "invalid payload"}), 400

    app = current_app._get_current_object()
    # The webhook is signature-verified before we use its public host for media.
    # An explicit origin is supported for custom domains and proxy setups.
    public_origin = app.config.get("LINE_PUBLIC_BASE_URL") or f"https://{request.host}"
    for event in payload["events"]:
        if not event.get("replyToken"):
            continue
        if event.get("type") == "message":
            message = event.get("message") or {}
            if message.get("type") != "text":
                continue
            user_text = message.get("text", "").strip()
        elif event.get("type") == "postback":
            # Only our known Be-Bike actions are accepted. No arbitrary
            # postback data is passed to the sales agent.
            user_text = POSTBACK_INTENTS.get((event.get("postback") or {}).get("data"), "")
        else:
            continue
        if user_text:
            _submit_text_event(app, event, public_origin, user_text)

    return jsonify({"ok": True})
