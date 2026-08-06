from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash

from app.utils.auth import admin_user

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")

    admin_username = current_app.config["ADMIN_USERNAME"]
    admin_password_hash = current_app.config["ADMIN_PASSWORD_HASH"]

    if not admin_password_hash or username != admin_username:
        return jsonify({"error": "帳號或密碼錯誤"}), 401

    if not check_password_hash(admin_password_hash, password):
        return jsonify({"error": "帳號或密碼錯誤"}), 401

    login_user(admin_user, remember=True)
    return jsonify({"username": admin_username})


@bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"ok": True})


@bp.get("/me")
def me():
    if current_user.is_authenticated:
        return jsonify({"username": current_app.config["ADMIN_USERNAME"]})
    return jsonify({"username": None})
