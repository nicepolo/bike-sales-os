import os

from flask import Flask, jsonify, send_from_directory

from app.config import Config
from app.extensions import db, login_manager, migrate
from app.utils.auth import ADMIN_USER_ID, admin_user


def create_app():
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    from app import models  # noqa: F401  # 讓 Alembic / SQLAlchemy 註冊到 model

    @login_manager.user_loader
    def load_user(user_id):
        return admin_user if user_id == ADMIN_USER_ID else None

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "請先登入"}), 401

    from app.routes.auth import bp as auth_bp
    from app.routes.vehicles import bp as vehicles_bp
    from app.routes.customers import bp as customers_bp
    from app.routes.dashboard import bp as dashboard_bp
    from app.routes.factory import bp as factory_bp
    from app.routes.line_webhook import bp as line_webhook_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(factory_bp)
    app.register_blueprint(line_webhook_bp)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path == "api" or path.startswith("api/"):
            return jsonify({"error": "找不到 API 路由"}), 404

        static_dir = app.static_folder
        target = os.path.join(static_dir, path) if path else None
        if target and os.path.isfile(target):
            return send_from_directory(static_dir, path)
        return send_from_directory(static_dir, "index.html")

    return app
