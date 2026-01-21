import os
import re
import shutil
from datetime import datetime
from urllib.parse import urlparse

MASK_VALUE = "********"

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
DEFAULT_ENV_PATH = os.path.join(BASE_DIR, ".env")

CONFIG_SCHEMA = [
    {
        "key": "DIFY_API_BASE",
        "label": "Dify API Base",
        "group": "API",
        "type": "url",
        "description": "Base URL for Dify API.",
        "required": True,
    },
    {
        "key": "DIFY_API_KEYS",
        "label": "Dify API Keys",
        "group": "API",
        "type": "string",
        "description": "Comma-separated Dify API keys.",
        "secret": True,
    },
    {
        "key": "VALID_API_KEYS",
        "label": "OpenAI Compatible Keys",
        "group": "API",
        "type": "string",
        "description": "Comma-separated keys for OpenAI compatible access.",
        "secret": True,
    },
    {
        "key": "SERVER_HOST",
        "label": "Server Host",
        "group": "Server",
        "type": "string",
        "description": "Host interface the service binds to.",
    },
    {
        "key": "SERVER_PORT",
        "label": "Server Port",
        "group": "Server",
        "type": "int",
        "description": "Internal server port.",
        "min": 1,
        "max": 65535,
    },
    {
        "key": "EXTERNAL_PORT",
        "label": "External Port",
        "group": "Server",
        "type": "int",
        "description": "Host mapped port for Docker.",
        "min": 1,
        "max": 65535,
    },
    {
        "key": "CONVERSATION_MEMORY_MODE",
        "label": "Conversation Memory Mode",
        "group": "Advanced",
        "type": "enum",
        "description": "Conversation memory strategy.",
        "options": [
            {"value": "1", "label": "history_message"},
            {"value": "2", "label": "zero_width"},
        ],
    },
    {
        "key": "HTTP_TIMEOUT",
        "label": "HTTP Timeout",
        "group": "Advanced",
        "type": "int",
        "description": "HTTP request timeout in seconds.",
        "min": 1,
        "max": 3600,
    },
    {
        "key": "HTTP_CONNECT_TIMEOUT",
        "label": "HTTP Connect Timeout",
        "group": "Advanced",
        "type": "int",
        "description": "HTTP connection timeout in seconds.",
        "min": 1,
        "max": 3600,
    },
    {
        "key": "ADMIN_TOKEN",
        "label": "Admin Key",
        "group": "Security",
        "type": "string",
        "description": "Bearer key for admin access.",
        "secret": True,
    },
]

_ENV_ASSIGN_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$")


def _split_value_and_comment(raw_value):
    raw = raw_value.rstrip()
    if not raw:
        return "", ""

    if raw[0] in ("\"", "'"):
        quote = raw[0]
        end = raw.find(quote, 1)
        if end != -1:
            value = raw[1:end]
            comment = raw[end + 1 :]
            return value, comment

    hash_index = raw.find("#")
    if hash_index != -1:
        before = raw[:hash_index]
        if before.rstrip() != before:
            return before.strip(), raw[hash_index:]

    return raw.strip(), ""


def _strip_quotes(raw_value):
    raw = raw_value.strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in ("\"", "'"):
        return raw[1:-1]
    return raw


def _format_env_value(value):
    if value is None:
        value = ""
    value_str = str(value)
    needs_quote = (
        value_str == ""
        or any(ch.isspace() for ch in value_str)
        or "#" in value_str
        or "\"" in value_str
    )
    if needs_quote:
        escaped = value_str.replace("\"", "\\\"")
        return f"\"{escaped}\""
    return value_str


def load_env_values(env_path=DEFAULT_ENV_PATH):
    values = {}
    lines = []
    newline = "\n"

    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as handle:
            content = handle.read()
        newline = "\r\n" if "\r\n" in content else "\n"
        lines = content.splitlines()
        for line in lines:
            match = _ENV_ASSIGN_RE.match(line)
            if not match:
                continue
            key = match.group(1)
            raw_value = match.group(2).strip()
            value, _comment = _split_value_and_comment(raw_value)
            value = _strip_quotes(value)
            values[key] = value

    return values, lines, newline


def get_config_items(env_path=DEFAULT_ENV_PATH):
    values, _lines, _newline = load_env_values(env_path)
    items = []
    for item in CONFIG_SCHEMA:
        key = item["key"]
        raw_value = values.get(key, "")
        is_secret = bool(item.get("secret"))
        display_value = raw_value
        items.append(
            {
                "key": key,
                "label": item.get("label", key),
                "group": item.get("group", "General"),
                "type": item.get("type", "string"),
                "description": item.get("description", ""),
                "options": item.get("options", []),
                "min": item.get("min"),
                "max": item.get("max"),
                "required": bool(item.get("required")),
                "isSecret": is_secret,
                "isSet": bool(raw_value),
                "value": display_value,
            }
        )
    return items


def _schema_map():
    return {item["key"]: item for item in CONFIG_SCHEMA}


def validate_updates(updates):
    errors = {}
    clean_updates = {}
    schema = _schema_map()

    for key, value in updates.items():
        item = schema.get(key)
        if not item:
            errors[key] = "Unknown configuration key."
            continue

        value_str = "" if value is None else str(value)
        value_type = item.get("type", "string")

        if value_type == "int":
            try:
                int_value = int(value)
            except (TypeError, ValueError):
                errors[key] = "Value must be an integer."
                continue
            min_value = item.get("min")
            max_value = item.get("max")
            if min_value is not None and int_value < min_value:
                errors[key] = f"Value must be >= {min_value}."
                continue
            if max_value is not None and int_value > max_value:
                errors[key] = f"Value must be <= {max_value}."
                continue
            clean_updates[key] = str(int_value)
            continue

        if value_type == "enum":
            allowed = {opt["value"] for opt in item.get("options", [])}
            if value_str not in allowed:
                errors[key] = "Value is not in allowed options."
                continue
            clean_updates[key] = value_str
            continue

        if value_type == "url":
            if value_str:
                parsed = urlparse(value_str)
                if not parsed.scheme or not parsed.netloc:
                    errors[key] = "Value must be a valid URL."
                    continue
            clean_updates[key] = value_str
            continue

        clean_updates[key] = value_str

    return errors, clean_updates


def update_env(updates, env_path=DEFAULT_ENV_PATH):
    if not updates:
        return {"updated": [], "backup": None}

    values, lines, newline = load_env_values(env_path)
    content = ""
    has_trailing_newline = False

    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as handle:
            content = handle.read()
        has_trailing_newline = content.endswith("\n") or content.endswith("\r\n")
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_path = f"{env_path}.bak-{timestamp}"
        shutil.copyfile(env_path, backup_path)
    else:
        backup_path = None

    updated_keys = set()
    existing_keys = set()
    output_lines = []

    for line in lines:
        match = _ENV_ASSIGN_RE.match(line)
        if not match:
            output_lines.append(line)
            continue
        key = match.group(1)
        existing_keys.add(key)
        if key in updates:
            raw_value = match.group(2)
            _current_value, comment = _split_value_and_comment(raw_value)
            formatted_value = _format_env_value(updates[key])
            output_lines.append(f"{key}={formatted_value}{comment}")
            updated_keys.add(key)
        else:
            output_lines.append(line)

    for key, value in updates.items():
        if key in existing_keys:
            continue
        formatted_value = _format_env_value(value)
        output_lines.append(f"{key}={formatted_value}")
        updated_keys.add(key)

    final_content = newline.join(output_lines)
    if has_trailing_newline or output_lines:
        final_content += newline

    with open(env_path, "w", encoding="utf-8") as handle:
        handle.write(final_content)

    return {"updated": sorted(updated_keys), "backup": backup_path}
