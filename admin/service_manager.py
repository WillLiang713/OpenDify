import asyncio
import logging
import os
import sys
import time

from . import config_manager

START_TIME = time.time()
logger = logging.getLogger(__name__)


def is_docker():
    if os.path.exists("/.dockerenv"):
        return True
    if os.getenv("DOCKER_CONTAINER") == "true":
        return True
    cgroup_path = "/proc/1/cgroup"
    if os.path.exists(cgroup_path):
        try:
            with open(cgroup_path, "r", encoding="utf-8") as handle:
                content = handle.read()
            lowered = content.lower()
            if "docker" in lowered or "kubepods" in lowered or "containerd" in lowered:
                return True
        except OSError:
            pass
    return False


def get_status():
    mode = "docker" if is_docker() else "local"
    return {
        "status": "running",
        "mode": mode,
        "pid": os.getpid(),
        "uptimeSeconds": int(time.time() - START_TIME),
    }

def _get_runtime_module():
    for module_name in ("main", "__main__"):
        module = sys.modules.get(module_name)
        if module and hasattr(module, "model_manager"):
            return module
    return None


def _parse_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def reload_runtime_config():
    values, _lines, _newline = config_manager.load_env_values()
    for key, value in values.items():
        os.environ[key] = value

    runtime = _get_runtime_module()
    if runtime is None:
        logger.warning("Runtime module not found; skipped in-process config reload.")
        return {"reloaded": False, "reason": "runtime module not found"}

    runtime.DIFY_API_BASE = values.get("DIFY_API_BASE", "")
    runtime.VALID_API_KEYS = [
        key.strip()
        for key in values.get("VALID_API_KEYS", "").split(",")
        if key.strip()
    ]
    runtime.CONVERSATION_MEMORY_MODE = _parse_int(
        values.get("CONVERSATION_MEMORY_MODE", 1), 1
    )
    runtime.HTTP_TIMEOUT = _parse_int(values.get("HTTP_TIMEOUT", 30), 30)
    runtime.HTTP_CONNECT_TIMEOUT = _parse_int(
        values.get("HTTP_CONNECT_TIMEOUT", 10), 10
    )

    try:
        runtime.model_manager.load_api_keys()
        asyncio.run(runtime.model_manager.refresh_model_info())
    except RuntimeError as exc:
        logger.warning("Async refresh failed during reload: %s", exc)

    return {"reloaded": True}
