import { createApiClient } from "./api.js";

const loginPanel = document.getElementById("login-panel");
const appPanel = document.getElementById("app-panel");
const tokenInput = document.getElementById("token-input");
const tokenToggle = document.getElementById("token-toggle");
const loginButton = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const configGroups = document.getElementById("config-groups");
const configMeta = document.getElementById("config-meta");
const saveButton = document.getElementById("save-btn");
const refreshButton = document.getElementById("refresh-btn");
const statusChip = document.getElementById("service-status");
const toast = document.getElementById("toast");
const langToggle = document.getElementById("lang-toggle");
const previewBase = document.getElementById("api-preview-base");
const previewChat = document.getElementById("api-preview-chat");
const previewModels = document.getElementById("api-preview-models");
const copyPreview = document.getElementById("copy-preview");

let api = null;
let configItems = [];
const originalValues = new Map();
let currentLang = "en";
let lastStatus = null;
let isAuthenticated = false;

const translations = {
  en: {
    "brand.subtitle": "Configure, validate, and apply in one place.",
    "login.title": "Admin access",
    "login.subtitle": "Key stays in memory for this session.",
    "login.tokenLabel": "Admin Key",
    "login.tokenPlaceholder": "Bearer key",
    "login.show": "Show",
    "login.hide": "Hide",
    "login.enter": "Enter Console",
    "config.title": "Configuration",
    "config.loading": "Loading...",
    "config.loaded": (count) => `Loaded ${count} items.`,
    "config.notSet": "Not set",
    "config.hiddenPlaceholder": "Hidden value. Enter to update.",
    "actions.refresh": "Refresh",
    "actions.save": "Save Changes",
    "preview.title": "API Preview",
    "preview.label": "OpenAI Compatible Base",
    "preview.copy": "Copy Base",
    "preview.copied": "Copied!",
    "preview.endpoint.chat": "Chat",
    "preview.endpoint.models": "Models",
    "status.unknown": "Unknown",
    "status.notLoggedIn": "Not logged in",
    "status.running": () => "Running",
    "status.other": (status) => `${status || "unknown"}`,
    "toast.welcome": "Welcome to the admin console.",
    "toast.noChanges": "No changes to save.",
    "toast.saved": "Configuration saved.",
    "toast.refresh": "Configuration refreshed.",
    "toast.saveFailed": "Save failed.",
    "toast.refreshFailed": "Refresh failed.",
    "error.tokenRequired": "Key is required.",
    "error.loginFailed": "Login failed.",
    "error.invalidFields": "Please fix invalid fields before saving.",
  },
  zh: {
    "brand.subtitle": "\u5728\u4e00\u4e2a\u754c\u9762\u5b8c\u6210\u914d\u7f6e\u3001\u6821\u9a8c\u4e0e\u751f\u6548\u3002",
    "login.title": "管理员访问",
    "login.subtitle": "管理密钥仅保存在当前会话内存中。",
    "login.tokenLabel": "管理密钥",
    "login.tokenPlaceholder": "Bearer 密钥",
    "login.show": "显示",
    "login.hide": "隐藏",
    "login.enter": "进入控制台",
    "config.title": "配置项",
    "config.loading": "正在加载...",
    "config.loaded": (count) => `已加载 ${count} 项配置。`,
    "config.notSet": "未设置",
    "config.hiddenPlaceholder": "已隐藏，如需修改请重新输入。",
    "actions.refresh": "刷新",
    "actions.save": "保存更改",
    "preview.title": "接口预览",
    "preview.label": "OpenAI 兼容基础地址",
    "preview.copy": "复制基础地址",
    "preview.copied": "已复制",
    "preview.endpoint.chat": "对话",
    "preview.endpoint.models": "模型",
    "status.unknown": "未知",
    "status.notLoggedIn": "未登录",
    "status.running": () => "运行中",
    "status.other": (status) => `${status || "未知"}`,
    "toast.welcome": "欢迎进入管理控制台。",
    "toast.noChanges": "没有需要保存的改动。",
    "toast.saved": "配置已保存。",
    "toast.refresh": "配置已刷新。",
    "toast.saveFailed": "保存失败。",
    "toast.refreshFailed": "刷新失败。",
    "error.tokenRequired": "请输入管理密钥。",
    "error.loginFailed": "登录失败。",
    "error.invalidFields": "请先修正无效字段。",
  },
};

const configTranslations = {
  zh: {
    groups: {
      API: "API 配置",
      Server: "服务器配置",
      Advanced: "高级设置",
      Security: "安全设置",
      General: "通用",
    },
    keys: {
      DIFY_API_BASE: {
        label: "Dify API 地址",
        description: "Dify API 的基础地址。",
      },
      DIFY_API_KEYS: {
        label: "Dify API 密钥",
        description: "多个密钥用英文逗号分隔。",
      },
      VALID_API_KEYS: {
        label: "OpenAI 兼容密钥",
        description: "用于 OpenAI 兼容接口的密钥列表。",
      },
      SERVER_HOST: {
        label: "服务绑定地址",
        description: "服务监听的主机地址。",
      },
      SERVER_PORT: {
        label: "服务端口",
        description: "服务内部监听端口。",
      },
      EXTERNAL_PORT: {
        label: "外部端口",
        description: "Docker 映射到主机的端口。",
      },
      CONVERSATION_MEMORY_MODE: {
        label: "会话记忆模式",
        description: "会话记忆的处理策略。",
      },
      HTTP_TIMEOUT: {
        label: "请求超时",
        description: "HTTP 请求超时时间（秒）。",
      },
      HTTP_CONNECT_TIMEOUT: {
        label: "连接超时",
        description: "HTTP 连接超时时间（秒）。",
      },
      ADMIN_TOKEN: {
        label: "管理密钥",
        description: "用于管理后台访问的密钥。",
      },
    },
    options: {
      CONVERSATION_MEMORY_MODE: {
        "1": "history_message（构造历史消息）",
        "2": "zero_width（零宽字符）",
      },
    },
  },
};

function getOptionLabel(item, option) {
  const translation =
    configTranslations[currentLang] &&
    configTranslations[currentLang].options &&
    configTranslations[currentLang].options[item.key];
  if (translation && translation[option.value]) {
    return translation[option.value];
  }
  return option.label || option.value;
}

function t(key, ...args) {
  const entry = translations[currentLang] && translations[currentLang][key];
  if (typeof entry === "function") {
    return entry(...args);
  }
  if (typeof entry === "string") {
    return entry;
  }
  const fallback = translations.en && translations.en[key];
  if (typeof fallback === "function") {
    return fallback(...args);
  }
  if (typeof fallback === "string") {
    return fallback;
  }
  return key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    node.setAttribute("placeholder", t(key));
  });
  tokenToggle.textContent =
    tokenInput.type === "password" ? t("login.show") : t("login.hide");
  langToggle.textContent = currentLang === "zh" ? "EN" : "中文";
  configMeta.textContent = configItems.length
    ? t("config.loaded", configItems.length)
    : t("config.loading");
  setStatus(lastStatus);
}

function showToast(message, variant = "info") {
  toast.textContent = message;
  toast.classList.add("show");
  toast.dataset.variant = variant;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setStatus(status) {
  lastStatus = status;
  if (!isAuthenticated) {
    statusChip.textContent = t("status.notLoggedIn");
    statusChip.classList.remove("ok", "warn");
    return;
  }
  if (!status) {
    statusChip.textContent = t("status.unknown");
    statusChip.classList.remove("ok", "warn");
    return;
  }
  if (status.status === "running") {
    statusChip.textContent = t("status.running");
    statusChip.classList.add("ok");
    statusChip.classList.remove("warn");
  } else {
    statusChip.textContent = t("status.other", status.status);
    statusChip.classList.add("warn");
    statusChip.classList.remove("ok");
  }
}

function toggleLoginVisibility() {
  const isPassword = tokenInput.type === "password";
  tokenInput.type = isPassword ? "text" : "password";
  tokenToggle.textContent = isPassword ? t("login.hide") : t("login.show");
}

function resetInvalidState() {
  document.querySelectorAll(".config-input").forEach((input) => {
    input.classList.remove("is-invalid");
  });
}

function buildInput(item) {
  let input;
  if (item.type === "enum") {
    input = document.createElement("select");
    item.options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = getOptionLabel(item, option);
      input.appendChild(opt);
    });
  } else {
    input = document.createElement("input");
    if (item.type === "int") {
      input.type = "number";
      if (item.min !== null && item.min !== undefined) {
        input.min = item.min;
      }
      if (item.max !== null && item.max !== undefined) {
        input.max = item.max;
      }
    } else if (item.type === "url") {
      input.type = "url";
      input.placeholder = "https://example.com/v1";
    } else {
      input.type = "text";
    }
  }

  if (item.isSecret) {
    input.type = "password";
    input.placeholder = item.isSet ? "" : t("config.notSet");
  }

  input.className = "config-input";
  input.dataset.key = item.key;
  input.dataset.secret = item.isSecret ? "true" : "false";
  input.value = item.value || "";
  if (item.required) {
    input.required = true;
  }

  input.addEventListener("input", () => {
    input.classList.remove("is-invalid");
    if (input.dataset.key === "SERVER_HOST" || input.dataset.key === "EXTERNAL_PORT") {
      updatePreviewFromInputs();
    }
  });
  return input;
}

function renderConfig(items) {
  configGroups.innerHTML = "";
  originalValues.clear();

  const groupOrder = [];
  const groups = new Map();

  items.forEach((item) => {
    if (!groups.has(item.group)) {
      groups.set(item.group, []);
      groupOrder.push(item.group);
    }
    groups.get(item.group).push(item);
  });

  let itemIndex = 0;

  groupOrder.forEach((groupName) => {
    const groupWrapper = document.createElement("div");
    groupWrapper.className = "config-group";

    const title = document.createElement("h3");
    const groupLabel =
      (configTranslations[currentLang] &&
        configTranslations[currentLang].groups &&
        configTranslations[currentLang].groups[groupName]) ||
      groupName;
    title.textContent = groupLabel;
    groupWrapper.appendChild(title);

    groups.get(groupName).forEach((item) => {
      const row = document.createElement("div");
      row.className = "config-item";
      row.style.setProperty("--i", itemIndex++);

      const meta = document.createElement("div");
      meta.className = "config-meta";

      const title = document.createElement("div");
      title.className = "config-title";
      const translation =
        configTranslations[currentLang] &&
        configTranslations[currentLang].keys &&
        configTranslations[currentLang].keys[item.key];
      title.textContent = (translation && translation.label) || item.label || item.key;

      const desc = document.createElement("div");
      desc.className = "config-desc";
      desc.textContent =
        (translation && translation.description) || item.description || item.key;

      meta.appendChild(title);
      meta.appendChild(desc);

      const control = document.createElement("div");
      control.className = "config-control";

      const input = buildInput(item);
      originalValues.set(item.key, input.value);
      control.appendChild(input);

      if (item.isSecret) {
        const toggle = document.createElement("button");
        toggle.className = "ghost toggle";
        toggle.type = "button";
        toggle.textContent = t("login.show");
        toggle.addEventListener("click", () => {
          const willShow = input.type === "password";
          input.type = willShow ? "text" : "password";
          toggle.textContent =
            input.type === "password" ? t("login.show") : t("login.hide");
        });
        control.appendChild(toggle);
      }

      row.appendChild(meta);
      row.appendChild(control);
      groupWrapper.appendChild(row);
    });

  configGroups.appendChild(groupWrapper);
  });
}

function buildBaseUrl(hostInputValue, portInputValue) {
  const rawHost = (hostInputValue || "").trim();
  const rawPort = (portInputValue || "").trim();
  const portValue = rawPort || "<EXTERNAL_PORT>";
  const browserHost = window.location.hostname || "localhost";

  if (!rawHost) {
    return `http://<SERVER_HOST>:${portValue}/v1/`;
  }

  let host = rawHost;
  if (host === "0.0.0.0" || host === "127.0.0.1" || host === "localhost") {
    host = browserHost;
  }
  let scheme = "http";
  let hostPort = host;

  if (host.startsWith("http://") || host.startsWith("https://")) {
    try {
      const url = new URL(host);
      scheme = url.protocol.replace(":", "");
      if (url.hostname === "0.0.0.0" || url.hostname === "127.0.0.1") {
        const resolvedHost = browserHost;
        hostPort = url.port ? `${resolvedHost}:${url.port}` : resolvedHost;
      } else {
        hostPort = url.host || host;
      }
    } catch (error) {
      hostPort = host;
    }
  } else if (hostPort.includes("/")) {
    hostPort = hostPort.split("/")[0];
  }

  const isIpv6 = hostPort.startsWith("[");
  const hasPort = isIpv6 ? hostPort.includes("]:") : hostPort.includes(":");

  if (!hasPort) {
    hostPort = `${hostPort}:${portValue}`;
  }

  return `${scheme}://${hostPort}/v1/`;
}

function updatePreviewFromInputs() {
  const hostInput = document.querySelector(".config-input[data-key='SERVER_HOST']");
  const portInput = document.querySelector(".config-input[data-key='EXTERNAL_PORT']");
  const hostValue = hostInput ? hostInput.value : "";
  const portValue = portInput ? portInput.value : "";
  const baseUrl = buildBaseUrl(hostValue, portValue);
  const baseTrim = baseUrl.replace(/\/+$/, "");
  previewBase.textContent = baseUrl;
  previewChat.textContent = `${baseTrim}/chat/completions`;
  previewModels.textContent = `${baseTrim}/models`;
}

function collectUpdates() {
  const updates = {};
  const inputs = Array.from(document.querySelectorAll(".config-input"));

  for (const input of inputs) {
    const key = input.dataset.key;
    const isSecret = input.dataset.secret === "true";
    const original = originalValues.get(key) ?? "";
    const value = input.value;
    if (!input.checkValidity()) {
      input.classList.add("is-invalid");
      throw new Error(t("error.invalidFields"));
    }

    if (isSecret) {
      if (value === original) {
        continue;
      }
    } else if (value === original) {
      continue;
    }

    updates[key] = value;
  }

  return updates;
}

async function loadConfig() {
  resetInvalidState();
  configMeta.textContent = t("config.loading");
  const response = await api.getConfig();
  configItems = response.items || [];
  renderConfig(configItems);
  configMeta.textContent = t("config.loaded", configItems.length);
  updatePreviewFromInputs();
}

async function refreshStatus() {
  try {
    const status = await api.getStatus();
    setStatus(status);
  } catch (error) {
    setStatus({ status: "unknown" });
  }
}

async function handleLogin() {
  const token = tokenInput.value.trim();
  loginError.textContent = "";
  if (!token) {
    loginError.textContent = t("error.tokenRequired");
    return;
  }

  api = createApiClient(token);

  try {
    await loadConfig();
    isAuthenticated = true;
    statusChip.classList.remove("hidden");
    await refreshStatus();
    loginPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    showToast(t("toast.welcome"));
    updatePreviewFromInputs();
  } catch (error) {
    api = null;
    isAuthenticated = false;
    statusChip.classList.add("hidden");
    loginError.textContent = error.message || t("error.loginFailed");
  }
}

async function handleSave() {
  if (!api) {
    return;
  }

  try {
    const updates = collectUpdates();
    if (!Object.keys(updates).length) {
      showToast(t("toast.noChanges"));
      return;
    }

    saveButton.disabled = true;
    await api.updateConfig(updates);
    showToast(t("toast.saved"));
    await loadConfig();
  } catch (error) {
    showToast(error.message || t("toast.saveFailed"), "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function handleRefresh() {
  if (!api) {
    return;
  }

  try {
    await loadConfig();
    showToast(t("toast.refresh"));
  } catch (error) {
    showToast(error.message || t("toast.refreshFailed"), "error");
  }
}

loginButton.addEventListener("click", handleLogin);
tokenToggle.addEventListener("click", toggleLoginVisibility);
refreshButton.addEventListener("click", handleRefresh);
saveButton.addEventListener("click", handleSave);
copyPreview.addEventListener("click", async () => {
  const text = previewBase.textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast(t("preview.copied"));
  } catch (error) {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      showToast(t("preview.copied"));
    } catch (fallbackError) {
      showToast(text);
    }
  }
});
langToggle.addEventListener("click", () => {
  currentLang = currentLang === "zh" ? "en" : "zh";
  localStorage.setItem("opendify-lang", currentLang);
  applyTranslations();
  if (configItems.length) {
    renderConfig(configItems);
  }
  refreshStatus();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !appPanel.classList.contains("hidden")) {
    return;
  }
  if (event.key === "Enter") {
    handleLogin();
  }
});

const savedLang = localStorage.getItem("opendify-lang");
if (savedLang) {
  currentLang = savedLang;
} else if (navigator.language && navigator.language.toLowerCase().includes("zh")) {
  currentLang = "zh";
}
applyTranslations();
