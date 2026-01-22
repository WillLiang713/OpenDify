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
const logoutButton = document.getElementById("logout-btn");
const toast = document.getElementById("toast");
const langToggle = document.getElementById("lang-toggle");

const TOKEN_STORAGE_KEY = "opendify-admin-token";

let api = null;
let configItems = [];
const originalValues = new Map();
let currentLang = "en";
let isAuthenticated = false;

const translations = {
  en: {
    "brand.subtitle": "Configure, validate, and apply in one place.",
    "login.title": "Admin access",
    "login.subtitle": "Enter your admin key to continue.",
    "login.tokenLabel": "Admin Key",
    "login.tokenPlaceholder": "Key",
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
    "actions.logout": "Sign Out",
    "toast.welcome": "Welcome to the admin console.",
    "toast.noChanges": "No changes to save.",
    "toast.saved": "Configuration saved.",
    "toast.refresh": "Configuration refreshed.",
    "toast.saveFailed": "Save failed.",
    "toast.refreshFailed": "Refresh failed.",
    "toast.sessionExpired": "Session expired. Please sign in again.",
    "toast.signedOut": "Signed out.",
    "error.tokenRequired": "Key is required.",
    "error.loginFailed": "Login failed.",
    "error.invalidFields": "Please fix invalid fields before saving.",
    "error.sessionExpired": "Session expired. Please enter the admin key again.",
    "confirm.save": "Save these changes now?",
  },
  zh: {
    "brand.subtitle": "\u5728\u4e00\u4e2a\u754c\u9762\u5b8c\u6210\u914d\u7f6e\u3001\u6821\u9a8c\u4e0e\u751f\u6548\u3002",
    "login.title": "管理员访问",
    "login.subtitle": "请输入以继续。",
    "login.tokenLabel": "",
    "login.tokenPlaceholder": "密钥",
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
    "actions.logout": "退出登录",
    "toast.welcome": "欢迎进入管理控制台。",
    "toast.noChanges": "没有需要保存的改动。",
    "toast.saved": "配置已保存。",
    "toast.refresh": "配置已刷新。",
    "toast.saveFailed": "保存失败。",
    "toast.refreshFailed": "刷新失败。",
    "toast.sessionExpired": "登录已失效，请重新输入密钥。",
    "toast.signedOut": "已退出登录。",
    "error.tokenRequired": "请输入密钥。",
    "error.loginFailed": "登录失败。",
    "error.invalidFields": "请先修正无效字段。",
    "error.sessionExpired": "登录已失效，请重新输入密钥。",
    "confirm.save": "确认保存当前更改？",
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
        label: "密钥",
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
}

function showToast(message, variant = "info") {
  toast.textContent = message;
  toast.classList.add("show");
  toast.dataset.variant = variant;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function persistToken(token) {
  try {
    if (!token) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    // Ignore storage failures (e.g. privacy mode).
  }
}

function getPersistedToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function handleUnauthorized(error) {
  if (!error || error.status !== 401) {
    return false;
  }
  persistToken("");
  api = null;
  isAuthenticated = false;
  logoutButton.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  appPanel.classList.add("hidden");
  tokenInput.value = "";
  loginError.textContent = t("error.sessionExpired");
  showToast(t("toast.sessionExpired"), "error");
  return true;
}

function handleLogout() {
  persistToken("");
  api = null;
  isAuthenticated = false;
  logoutButton.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  appPanel.classList.add("hidden");
  tokenInput.value = "";
  loginError.textContent = "";
  showToast(t("toast.signedOut"));
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
    persistToken(token);
    logoutButton.classList.remove("hidden");
    loginPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    showToast(t("toast.welcome"));
  } catch (error) {
    if (handleUnauthorized(error)) {
      return;
    }
    api = null;
    isAuthenticated = false;
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

    if (!window.confirm(t("confirm.save"))) {
      return;
    }

    saveButton.disabled = true;
    await api.updateConfig(updates);
    showToast(t("toast.saved"));
    await loadConfig();
  } catch (error) {
    if (handleUnauthorized(error)) {
      return;
    }
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
    if (handleUnauthorized(error)) {
      return;
    }
    showToast(error.message || t("toast.refreshFailed"), "error");
  }
}

loginButton.addEventListener("click", handleLogin);
tokenToggle.addEventListener("click", toggleLoginVisibility);
refreshButton.addEventListener("click", handleRefresh);
saveButton.addEventListener("click", handleSave);
logoutButton.addEventListener("click", handleLogout);
langToggle.addEventListener("click", () => {
  currentLang = currentLang === "zh" ? "en" : "zh";
  localStorage.setItem("opendify-lang", currentLang);
  applyTranslations();
  if (configItems.length) {
    renderConfig(configItems);
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !appPanel.classList.contains("hidden")) {
    return;
  }
  if (event.key === "Enter") {
    handleLogin();
  }
});

async function restoreSession() {
  const token = getPersistedToken();
  if (!token) {
    return;
  }
  tokenInput.value = token;
  api = createApiClient(token);
  try {
    await loadConfig();
    isAuthenticated = true;
    logoutButton.classList.remove("hidden");
    loginPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
  } catch (error) {
    if (handleUnauthorized(error)) {
      return;
    }
    api = null;
    isAuthenticated = false;
    loginError.textContent = error.message || t("error.loginFailed");
  }
}

const savedLang = localStorage.getItem("opendify-lang");
if (savedLang) {
  currentLang = savedLang;
} else if (navigator.language && navigator.language.toLowerCase().includes("zh")) {
  currentLang = "zh";
}
applyTranslations();
restoreSession();
