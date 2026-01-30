import { createApiClient } from "./api.js";

const loginPanel = document.getElementById("login-panel");
const appPanel = document.getElementById("app-panel");
const tokenInput = document.getElementById("token-input");
const tokenToggle = document.getElementById("token-toggle");
const loginButton = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const configNav = document.getElementById("config-nav");
const configGroups = document.getElementById("config-groups");
const configMeta = document.getElementById("config-meta");
const saveButton = document.getElementById("save-btn");
const refreshButton = document.getElementById("refresh-btn");
const logoutButton = document.getElementById("logout-btn");
const toast = document.getElementById("toast");
const langToggle = document.getElementById("lang-toggle");

const TOKEN_STORAGE_KEY = "opendify-admin-token";

const ICONS = {
  eye: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`,
  save: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  logout: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  languages: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,
};

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
    "brand.subtitle": "在一个界面完成配置、校验与生效。",
    "login.title": "管理员访问",
    "login.subtitle": "请输入以继续。",
    "login.tokenLabel": "管理员密钥",
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
      API: "API",
      Server: "服务器",
      Advanced: "高级",
      Security: "安全",
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

  // Set Icons
  const setIcon = (id, iconName) => {
    const btn = document.getElementById(id);
    if (btn) {
      const container = btn.querySelector(".icon-container");
      if (container) container.innerHTML = ICONS[iconName] || "";
    }
  };

  setIcon("lang-toggle", "languages");
  setIcon("logout-btn", "logout");
  setIcon("refresh-btn", "refresh");
  setIcon("save-btn", "save");

  const isPassword = tokenInput.type === "password";
  const tokenToggleIcon = isPassword ? "eye" : "eyeOff";
  const tokenToggleContainer = tokenToggle.querySelector(".icon-container");
  if (tokenToggleContainer) tokenToggleContainer.innerHTML = ICONS[tokenToggleIcon];
  const tokenToggleText = tokenToggle.querySelector(".btn-text");
  if (tokenToggleText) tokenToggleText.textContent = isPassword ? t("login.show") : t("login.hide");

  langToggle.querySelector(".btn-text").textContent = currentLang === "zh" ? "EN" : "中文";
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
  const icon = isPassword ? "eyeOff" : "eye";
  const container = tokenToggle.querySelector(".icon-container");
  if (container) container.innerHTML = ICONS[icon];
  const text = tokenToggle.querySelector(".btn-text");
  if (text) text.textContent = isPassword ? t("login.hide") : t("login.show");
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
  configNav.innerHTML = "";
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

  groupOrder.forEach((groupName, index) => {
    const groupLabel =
      (configTranslations[currentLang] &&
        configTranslations[currentLang].groups &&
        configTranslations[currentLang].groups[groupName]) ||
      groupName;

    // Create Navigation Item
    const navItem = document.createElement("button");
    navItem.className = `nav-item ${index === 0 ? "active" : ""}`;
    navItem.textContent = groupLabel;
    navItem.dataset.group = groupName;
    navItem.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
      document.querySelectorAll(".config-group").forEach((g) => g.classList.remove("active"));
      navItem.classList.add("active");
      groupWrapper.classList.add("active");
    });
    configNav.appendChild(navItem);

    // Create Group Wrapper
    const groupWrapper = document.createElement("div");
    groupWrapper.className = `config-group ${index === 0 ? "active" : ""}`;
    groupWrapper.dataset.group = groupName;

    const title = document.createElement("h3");
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
        toggle.className = "ghost toggle btn-with-icon";
        toggle.type = "button";
        toggle.innerHTML = `<span class="icon-container">${ICONS.eye}</span><span class="btn-text">${t("login.show")}</span>`;
        toggle.addEventListener("click", () => {
          const willShow = input.type === "password";
          input.type = willShow ? "text" : "password";
          const icon = willShow ? "eyeOff" : "eye";
          const text = willShow ? t("login.hide") : t("login.show");
          toggle.querySelector(".icon-container").innerHTML = ICONS[icon];
          toggle.querySelector(".btn-text").textContent = text;
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
    showToast(t("toast.saved"), "success");
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
    showToast(t("toast.refresh"), "success");
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
