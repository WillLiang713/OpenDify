import os
import threading
from functools import wraps
from flask import jsonify, request, send_from_directory

from . import admin_bp
from . import config_manager
from . import service_manager

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


def require_admin_auth(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        token = os.getenv("ADMIN_TOKEN", "")
        if not token:
            return jsonify({"error": "Admin key is not configured."}), 500

        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header."}), 401

        if parts[1] != token:
            return jsonify({"error": "Invalid admin key."}), 401

        return handler(*args, **kwargs)

    return wrapper


@admin_bp.route("/")
def admin_index():
    return send_from_directory(STATIC_DIR, "index.html")


@admin_bp.route("/api/config", methods=["GET"])
@require_admin_auth
def get_config():
    items = config_manager.get_config_items()
    return jsonify({"items": items})


@admin_bp.route("/api/config", methods=["PUT"])
@require_admin_auth
def update_config():
    payload = request.get_json(silent=True) or {}

    if isinstance(payload, dict):
        updates = payload.get("updates", payload)
    elif isinstance(payload, list):
        updates = {item.get("key"): item.get("value") for item in payload if item.get("key")}
    else:
        updates = None

    if not isinstance(updates, dict):
        return jsonify({"error": "Invalid payload format."}), 400

    if not updates:
        return jsonify({"updated": [], "backup": None})

    errors, clean_updates = config_manager.validate_updates(updates)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 400

    result = config_manager.update_env(clean_updates)
    threading.Thread(target=service_manager.reload_runtime_config, daemon=True).start()
    return jsonify(
        {"updated": result["updated"], "backup": result["backup"], "reloaded": "scheduled"}
    )


@admin_bp.route("/api/service/status", methods=["GET"])
@require_admin_auth
def service_status():
    return jsonify(service_manager.get_status())
