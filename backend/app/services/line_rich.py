"""Be-Bike LINE Flex product cards using existing, verified real-bike photos.

No generated product renderings or claims are added. The caller must supply a
public HTTPS origin that serves frontend/public/be-bike/*.
"""
from urllib.parse import urlsplit

from app.services.line_sales import (
    FAQ_REPLY,
    OVERVIEW_REPLY,
    PRICE_REPLY,
    PURCHASE_PROCESS_REPLY,
)

PHOTO_ROOT = "/be-bike"
GREEN = "#175A58"
DARK = "#23383A"
MUTED = "#5F7171"

# Use postback actions for visual cards so a tap triggers a webhook event
# even when the client only displays a text preview. Never accept arbitrary
# postback data as instructions; the webhook maps these allowlisted keys.
POSTBACK_INTENTS = {
    "be-bike:price": "我想詢問 BE-BIKE 目前的價格與庫存",
    "be-bike:consult": "我想預約 BE-BIKE 購車諮詢",
    "be-bike:buy": "我要買 Be-Bike",
    "be-bike:human": "我需要真人客服協助",
}
INTENT_TO_POSTBACK = {message: key for key, message in POSTBACK_INTENTS.items()}


def _text(value, *, size="sm", color=DARK, weight=None):
    result = {"type": "text", "text": value, "size": size, "color": color, "wrap": True}
    if weight:
        result["weight"] = weight
    return result


def _action(label, *, message=None, uri=None):
    if message:
        return {
            "type": "postback",
            "label": label,
            "data": INTENT_TO_POSTBACK[message],
            "displayText": message,
        }
    return {"type": "uri", "label": label, "uri": uri}


def _button(label, *, action):
    return {"type": "button", "style": "primary", "color": GREEN, "height": "sm", "action": action}


def _bubble(origin, filename, heading, tag, lines, button_label, *, message=None, uri=None):
    # Images and description boxes were inert before this fix. Give all three
    # surfaces the same action, so tapping the photo, text, or CTA works.
    action = _action(button_label, message=message, uri=uri)
    return {
        "type": "bubble",
        "size": "mega",
        "hero": {
            "type": "image", "url": f"{origin}{PHOTO_ROOT}/{filename}",
            "size": "full", "aspectRatio": "20:13", "aspectMode": "cover",
            "action": action,
        },
        "body": {
            "type": "box", "layout": "vertical", "spacing": "md",
            "action": action,
            "contents": [
                _text(tag, size="xs", color=GREEN, weight="bold"),
                _text(heading, size="xl", weight="bold"),
                {"type": "separator", "margin": "sm"},
                *[_text(line, color=MUTED) for line in lines],
            ],
        },
        "footer": {
            "type": "box", "layout": "vertical",
            "contents": [_button(button_label, action=action)],
        },
    }


def _safe_origin(value):
    """Do not build public media URLs from unsafe or test-only HTTP origins."""
    if not value:
        return None
    parsed = urlsplit(value.strip())
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        return None
    if parsed.port not in (None, 443) or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        return None
    if parsed.hostname in {"localhost", "127.0.0.1"}:
        return None
    return f"https://{parsed.hostname}"


def build_sales_messages(customer_text: str, sales_reply: str, public_origin: str | None):
    """Return LINE Messaging API objects; text fallback for other questions."""
    fallback = [{"type": "text", "text": sales_reply}]
    origin = _safe_origin(public_origin)
    if not origin:
        return fallback

    info_url = f"{origin}/be-bike"
    consultation = "我想預約 BE-BIKE 購車諮詢"
    cards = None

    if sales_reply == OVERVIEW_REPLY:
        cards = [
            _bubble(origin, "be-bike-hero.jpg", "Be-Bike 全新庫存出清", "REAL BIKE · 實車照片",
                    ["每台 NT$12,800", "原始 100 台全新品，首批 20 台已售完，目前剩餘 80 台。"],
                    "詢問價格與庫存", message="我想詢問 BE-BIKE 目前的價格與庫存"),
            _bubble(origin, "be-bike-detail.jpg", "每天代步，輕鬆出發", "DAILY RIDE · 日常騎乘",
                    ["單次充電約 25 公里，實際依路況、載重與電池狀態而異。",
                     "最高輔助時速約 25 km/h。"],
                    "預約看車", message=consultation),
            _bubble(origin, "be-bike-side.jpg", "實車細節看得見", "PRODUCT DETAIL · 細節",
                    ["小黃標及合格證號，免駕照，依適用規定上路。",
                     "適合通勤、學生與短程代步，建議實際看車確認。"],
                    "看照片與影片", uri=info_url),
        ]

    elif sales_reply == PRICE_REPLY:
        cards = [
            _bubble(origin, "be-bike-hero.jpg", "Be-Bike 最新優惠", "LIMITED STOCK · 剩餘 80 台",
                    ["1 台｜NT$12,800", "2 台｜NT$24,000",
                     "3 台以上｜NT$10,800／台",
                     "購買 3 台以上，加贈第一代電輔車 1 台。"],
                    "我要購買", message="我要買 Be-Bike"),
            _bubble(origin, "be-bike-side.jpg", "先看實車再決定", "REAL PHOTOS · 實車展示",
                    ["首批 20 台已售完；目前剩餘 80 台，售完為止。",
                     "配送費依地區及數量由客服確認。"],
                    "預約看車", message=consultation),
        ]

    elif sales_reply == FAQ_REPLY:
        cards = [
            _bubble(origin, "be-bike-hero.jpg", "是全新車嗎？能上路嗎？", "FAQ 01 · 車況與上路",
                    ["本批為全新庫存出清，非退役二手車。",
                     "有小黃標及合格證號；免駕照，依相關規定合法上路。"],
                    "了解車款", uri=info_url),
            _bubble(origin, "be-bike-detail.jpg", "續航、速度怎麼看？", "FAQ 02 · 騎乘表現",
                    ["單次充電續航約 25 公里，最高輔助時速約 25 km/h。",
                     "實際續航受載重、路況、胎壓與電池狀態影響。"],
                    "看實拍影片", uri=info_url),
            _bubble(origin, "be-bike-side.jpg", "配送與售後怎麼安排？", "FAQ 03 · 交車及售後",
                    ["配送費由客服依縣市與數量確認。",
                     "本批原廠不提供一般新品商業保固；依法享有的消費者權利不受影響。",
                     "維修、電池更換可另洽客服確認。"],
                    "詢問真人客服", message="我需要真人客服協助"),
        ]

    elif sales_reply == PURCHASE_PROCESS_REPLY:
        cards = [
            _bubble(origin, "be-bike-hero.jpg", "購車只要 4 個步驟", "HOW TO BUY · 購買流程",
                    ["① 確認價格與剩餘數量",
                     "② 預約看車或確認購買",
                     "③ 與客服確認付款及配送",
                     "④ 完成交車與基本檢查"],
                    "開始預約諮詢", message=consultation),
        ]

    if not cards:
        return fallback
    return [{
        "type": "flex",
        "altText": (f"Be-Bike 圖文介紹｜{sales_reply}")[:400],
        "contents": {"type": "carousel", "contents": cards} if len(cards) > 1 else cards[0],
    }]
