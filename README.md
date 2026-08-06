# 電輔車銷售管理系統（bike-sales-os）

電輔車銷售管理後台 — 車輛管理、客戶管理、B2B / B2C / 經銷三條戰線儀表板。

## 技術棧

- 後端：Flask + SQLAlchemy + Flask-Migrate（Alembic）+ Flask-Login
- 資料庫：PostgreSQL
- 前端：React（Vite）
- 部署：Railway（單一 web service，Flask 直接 serve 前端 build 出來的靜態檔）

## 目錄結構

```
bike-sales-os/
├── backend/            # Flask API + migration
│   ├── app/
│   │   ├── models/     # vehicles / customers
│   │   ├── routes/     # auth / vehicles / customers / dashboard
│   │   └── static/     # 前端 build 產物會複製到這裡（部署時自動處理）
│   ├── migrations/     # Alembic migration
│   ├── wsgi.py
│   └── requirements.txt
├── frontend/           # React 管理後台
│   └── src/
├── nixpacks.toml       # Railway build/start 設定
└── README.md
```

## 本地啟動

### 1. 準備 PostgreSQL

安裝本機 PostgreSQL，建立一個資料庫，例如：

```bash
createdb bike_sales_os
```

### 2. 後端

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# 編輯 .env，填入 DATABASE_URL / SECRET_KEY / ADMIN_USERNAME / ADMIN_PASSWORD_HASH
```

**產生管理員密碼雜湊值：**

```bash
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('你的密碼'))"
```

把輸出結果貼到 `.env` 的 `ADMIN_PASSWORD_HASH`。

**建立資料表：**

```bash
flask --app wsgi.py db upgrade
```

**啟動後端（預設 http://localhost:5000）：**

```bash
flask --app wsgi.py run
```

### 3. 前端

另開一個終端機：

```bash
cd frontend
npm install
npm run dev
```

打開 http://localhost:5173，前端會透過 Vite proxy 把 `/api` 轉發到後端的 5000 埠。

登入帳號密碼就是你在 `.env` 設定的 `ADMIN_USERNAME` 和原始密碼（不是雜湊值）。

## 部署到 Railway

1. 在 Railway 建立新專案，加入一個 **PostgreSQL** plugin（會自動產生 `DATABASE_URL`）。
2. 新增一個 **Web Service**，指向這個 repo（root directory 保持專案根目錄，不用改）。
3. Railway 會讀到根目錄的 `railway.json`（`"builder": "DOCKERFILE"`），用根目錄的 `Dockerfile` build：
   - Stage 1（`node:20-slim`）：`npm ci` + `npm run build` 建置前端
   - Stage 2（`python:3.12-slim`）：安裝後端 Python 套件，並把 Stage 1 build 出來的靜態檔複製到 `app/static`
   - 啟動前先執行 `flask db upgrade`（自動套用 migration），再用 `gunicorn` 啟動

   > Railway 目前預設用 Railpack 當 builder，但這個專案是「同一次 build 要同時用到 Node 和 Python 兩種工具鏈」的 monorepo，用 Dockerfile 明確指定 multi-stage build 最穩定，不會受 Railway 之後又調整預設 builder 影響。

4. 在 Web Service 的環境變數設定：

   | 變數 | 說明 |
   |---|---|
   | `DATABASE_URL` | Railway 加了 Postgres plugin 後會自動注入，不用手動填 |
   | `SECRET_KEY` | 隨機字串，例如 `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `ADMIN_USERNAME` | 管理員帳號 |
   | `ADMIN_PASSWORD_HASH` | 用上面「產生管理員密碼雜湊值」的指令產生 |

5. 部署完成後，Railway 給的網域即為完整系統（前後端同一個網址，`/api/*` 是 API，其餘走前端）。

## 環境變數總覽

| 變數 | 必填 | 說明 |
|---|---|---|
| `DATABASE_URL` | 是 | PostgreSQL 連線字串 |
| `SECRET_KEY` | 是 | Flask session 加密金鑰 |
| `ADMIN_USERNAME` | 是 | 登入帳號 |
| `ADMIN_PASSWORD_HASH` | 是 | 登入密碼的雜湊值（用 werkzeug `generate_password_hash` 產生，不要直接放明文密碼） |

## 目前已知限制（設計取捨，非 bug）

- 「今日詢問數」以客戶建檔日期（`created_at`）認定；「今日成交數」以 `deal_date`（狀態轉為已成交時自動帶入當天日期，也可手動覆蓋，方便補登歷史成交）認定。
- 登入為單一帳號，沒有資料庫 `users` 表，帳密存在環境變數。之後若要多人登入需另外擴充。
- `price_tier` 沒有加資料庫層級的數值限制，前端目前也是自由輸入數字，方便未來調整價格策略。

## 第二階段（本次不做）

多租戶、Agent 自動化、文案生成 AI、LINE OA 串接。
