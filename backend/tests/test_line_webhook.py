import base64
import hashlib
import hmac
import json

from app.services.line_sales import SAFE_SALES_REPLY, SALES_INSTRUCTIONS, generate_sales_reply


def _signed_post(client, payload, secret="line-test-secret"):
    body = json.dumps(payload, separators=(",", ":")).encode()
    signature = base64.b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).decode()
    return client.post(
        "/api/webhooks/line",
        data=body,
        content_type="application/json",
        headers={"X-Line-Signature": signature},
    )


def test_rejects_invalid_signature(client, app):
    app.config["LINE_CHANNEL_SECRET"] = "line-test-secret"
    response = client.post("/api/webhooks/line", data=b'{"events":[]}', headers={"X-Line-Signature": "bad"})
    assert response.status_code == 401


def test_text_message_generates_reply_and_emits_lead(client, app, monkeypatch):
    app.config.update(
        LINE_CHANNEL_SECRET="line-test-secret",
        LINE_CHANNEL_ACCESS_TOKEN="line-token",
        OPENAI_API_KEY="openai-key",
        OPENAI_MODEL="test-model",
    )
    calls = {}

    class Sink:
        def record(self, inquiry):
            calls["lead"] = inquiry

    app.extensions["line_lead_sink"] = Sink()
    monkeypatch.setattr("app.routes.line_webhook.generate_sales_reply", lambda text, api_key, model: "您好，想先了解您的需求數量？")
    monkeypatch.setattr("app.routes.line_webhook.reply_to_line", lambda token, text, access_token: calls.update(reply=(token, text, access_token)))
    payload = {"events": [{
        "type": "message", "webhookEventId": "event-1", "replyToken": "reply-token", "timestamp": 123,
        "source": {"type": "user", "userId": "U123"},
        "message": {"type": "text", "id": "m1", "text": "請問價格？"},
    }]}

    response = _signed_post(client, payload)

    assert response.status_code == 200
    assert calls["reply"] == ("reply-token", "您好，想先了解您的需求數量？", "line-token")
    assert calls["lead"].line_user_id == "U123"
    assert calls["lead"].webhook_event_id == "event-1"
    assert calls["lead"].message_id == "m1"
    assert calls["lead"].message == "請問價格？"


def test_ignores_non_text_events(client, app, monkeypatch):
    app.config["LINE_CHANNEL_SECRET"] = "line-test-secret"
    monkeypatch.setattr("app.routes.line_webhook.generate_sales_reply", lambda *args: (_ for _ in ()).throw(AssertionError()))
    response = _signed_post(client, {"events": [{"type": "follow", "replyToken": "token"}]})
    assert response.status_code == 200


def test_ai_request_reserves_output_tokens_for_reply(monkeypatch):
    captured = {}

    def fake_post(url, payload, headers, timeout):
        captured.update(url=url, payload=payload, headers=headers, timeout=timeout)
        return {"output": [{"content": [{"type": "output_text", "text": "您好，請問怎麼稱呼您？"}]}]}

    monkeypatch.setattr("app.services.line_sales._post_json", fake_post)

    reply = generate_sales_reply("我想購買", "test-key", "gpt-5-mini")

    assert reply == "您好，請問怎麼稱呼您？"
    assert captured["payload"]["reasoning"] == {"effort": "low"}
    assert captured["payload"]["max_output_tokens"] == 800


def test_sales_prompt_uses_official_product_name():
    assert "正式產品名稱是「BE-BIKE」" in SALES_INSTRUCTIONS
    assert "不要稱為 BE100 或 B100" in SALES_INSTRUCTIONS
    assert "您是指 BE-BIKE 嗎？" in SALES_INSTRUCTIONS


def test_sales_prompt_forbids_unverified_product_claims():
    assert "不得依一般電動車常識推測" in SALES_INSTRUCTIONS
    assert "目前資料待確認" in SALES_INSTRUCTIONS


def test_incomplete_ai_response_uses_safe_fallback(monkeypatch):
    def fake_post(url, payload, headers, timeout):
        return {
            "status": "incomplete",
            "incomplete_details": {"reason": "max_output_tokens"},
            "output_text": "如需我幫你確認具",
        }

    monkeypatch.setattr("app.services.line_sales._post_json", fake_post)

    assert generate_sales_reply("請介紹特色", "test-key", "gpt-5-mini") == SAFE_SALES_REPLY
