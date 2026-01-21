# OpenDify

OpenDify 是一个把 Dify API 转换为 OpenAI API 格式的轻量代理服务，让 OpenAI 客户端可直接调用 Dify 应用。

## 功能概览

- OpenAI 兼容接口（/v1/chat/completions、/v1/models）
- 支持流式输出
- 支持多应用 API Keys 自动映射为模型名
- 支持图片附件上传（取决于 Dify 应用和模型设置）
- 管理后台支持配置保存与热加载（端口类配置需重启）

## 快速开始

### 本地运行

```bash
pip install -r requirements.txt
python main.py
```

服务默认启动在 `http://127.0.0.1:5000`（可通过 `.env` 修改）。

### Docker 运行

```bash
docker compose up -d --build
```

默认映射端口来自 `.env` 中的 `EXTERNAL_PORT`。

## 配置

复制示例配置：

```bash
cp .env.example .env
```

常用配置项：

- `DIFY_API_BASE`：Dify API 基础地址（如 `https://your-dify/v1`）
- `DIFY_API_KEYS`：Dify 应用 API Keys（逗号分隔）
- `VALID_API_KEYS`：OpenAI 兼容接口访问密钥（逗号分隔）
- `SERVER_HOST` / `SERVER_PORT`：服务监听地址与端口
- `EXTERNAL_PORT`：Docker 对外映射端口

## 管理后台

访问 `http://<host>:<port>/opendify`，使用 `ADMIN_TOKEN` 作为管理密钥登录。

说明：
- 保存配置后会自动热加载（无需重启）
- 修改 `SERVER_HOST` / `SERVER_PORT` / `EXTERNAL_PORT` 仍需重启容器或进程
