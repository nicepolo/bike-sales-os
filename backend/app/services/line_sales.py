import base64
import hashlib
import hmac
import json
import logging
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


logger = logging.getLogger(__name__)

SALES_INSTRUCTIONS = """你是 Be-Bike BE100 的銷售助理，使用繁體中文，語氣親切、精簡並引導下一步。
不可自行聲稱或猜測道路合法性、認證、續航、馬達、電池、保固、駕照需求、價格或庫存；沒有已驗證資料時請明確說「待確認」，並請真人業務後續說明。
先回答使用者的問題，再自然詢問一項有助於跟進的資料，例如稱呼、聯絡方式、需求數量、所在地、預算或方便聯絡時間。不可一次索取過多個資。
不要說自己已建立訂單、保留庫存或完成付款。"""


class IntegrationError(RuntimeError):
    pass


def verify_signature(body: bytes, signature: str, channel_secret: str) -> bool:
    if not signature or not channel_secret:
        return False
    digest = hmac.new(channel_secret.encode("utf-8"), body, hashlib.sha256).digest()
    expected = base64.b64encode(digest).decode("ascii")
    return hmac.compare_digest(expected, signature)


def _post_json(url: str, payload: dict, headers: dict, timeout: int = 15) -> dict:
    request = Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            content = response.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise IntegrationError(f"upstream returned HTTP {exc.code}: {detail}") from exc
    except (URLError, TimeoutError) as exc:
        raise IntegrationError("upstream request failed") from exc
    try:
        return json.loads(content) if content else {}
    except json.JSONDecodeError as exc:
        raise IntegrationError("upstream returned an invalid JSON response") from exc


def generate_sales_reply(message: str, api_key: str, model: str) -> str:
    if not api_key:
        raise IntegrationError("OPENAI_API_KEY is not configured")
    result = _post_json(
        "https://api.openai.com/v1/responses",
        {"model": model, "instructions": SALES_INSTRUCTIONS, "input": message, "max_output_tokens": 300},
        {"Authorization": f"Bearer {api_key}"},
        timeout=25,
    )
    text = result.get("output_text")
    if not text:
        for item in result.get("output", []):
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    text = content.get("text")
                    break
    if not text:
        raise IntegrationError("AI response contained no text")
    return text.strip()[:5000]


def reply_to_line(reply_token: str, message: str, access_token: str) -> None:
    if not access_token:
        raise IntegrationError("LINE_CHANNEL_ACCESS_TOKEN is not configured")
    _post_json(
        "https://api.line.me/v2/bot/message/reply",
        {"replyToken": reply_token, "messages": [{"type": "text", "text": message}]},
        {"Authorization": f"Bearer {access_token}"},
    )


@dataclass(frozen=True)
class LeadInquiry:
    webhook_event_id: str | None
    message_id: str | None
    line_user_id: str | None
    message: str
    ai_reply: str
    event_timestamp: int | None


class LeadSink:
    """Replace this adapter when LINE enquiries are ready to be persisted in CRM."""

    def record(self, inquiry: LeadInquiry) -> None:
        logger.info("LINE lead received; persistence adapter is not configured")


def get_lead_sink(app):
    # Tests or a future CRM adapter can set app.extensions["line_lead_sink"].
    return app.extensions.get("line_lead_sink") or LeadSink()
