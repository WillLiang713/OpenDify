from flask import Blueprint

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/opendify",
    static_folder="static",
    static_url_path="/static",
)

from . import routes  # noqa: E402,F401
