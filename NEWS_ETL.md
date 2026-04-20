# News ETL Blueprint

一站式梳理：从 InsightSentry WebSocket 拉取 → 经过 OpenAI 总结 → 入库 → API/WS 推送 → 前端渲染。

## 组件总览
- **入口 (WS)**: `back-end/insightsentry_news.py:NewsWebSocketClient.start`
- **过滤/节流**: `NewsWebSocketClient.should_process`
- **转换 (LLM)**: `NewsWebSocketClient.summarize_with_chatgpt`
- **入库**: `NewsWebSocketClient.save_news_to_db` / `save_title_only`
- **对外 API**: `back-end/routers/news_router.py` (`/api/news/*` + `/api/news/ws`)
- **前端消费**: `front-end/src/pages/News.jsx` (`fetch /api/news/latest` + `ws /api/news/ws`)

## 数据流步骤
1) **拉取 (Extract)**
   - `NewsWebSocketClient.start()` 连接 `wss://realtime.insightsentry.com/newsfeed`，接收消息。
   - `handle_news_message` 解析 `data`，逐条进入处理。

2) **过滤/防抖**
   - `should_process` 丢弃与目标标的无关的条目，使用 `symbol_filters` 限制范围。
   - 速率限制：`message_timestamps`/`summary_timestamps` 控制 WebSocket/LLM 的吞吐。

3) **转换 (Transform)**
   - `summarize_with_chatgpt` 调用 OpenAI，生成英文/中文摘要。
   - 当内容缺失时降级：调用 `save_title_only` 仅存标题。

4) **落库 (Load)**
   - `save_news_to_db` 将标准化字段写入 SQLite `financial_news` 表（见 `back-end/database.py` 初始化）。
   - 字段：`news_id`, `title`, `content`, `summary`, `summary_cn`, `source`, `url`, `published_at`, `symbols`, `sentiment`, `impact_level`, `raw_data`。

5) **对外服务**
   - **REST**: `back-end/routers/news_router.py`
     - `/api/news/latest`：支持 `important_limit`/`others_limit`，`search`，`symbol`，`sentiment`，`lang`。
     - `/api/news/by-symbol/{symbol}`：按标的检索。
     - `/api/news/{news_id}`：详情。
     - `/api/news/stats`：汇总统计。
   - **WebSocket**: `/api/news/ws`
     - 连接后发送欢迎 + 最新 5 条。
     - 广播新新闻：`broadcast_news_to_clients` 由 `NewsWebSocketClient.news_callback` 触发。

6) **前端消费**
   - 页面：`front-end/src/pages/News.jsx`
   - 获取：`fetch /api/news/latest`（带 `search/symbol/sentiment`）。
   - 实时：订阅 `/api/news/ws`，收到 `new_news` 时按当前过滤条件合并展示。
   - UI 过滤：标的、情感、搜索 + 本地关键词兜底（黄金/白银/比特币/以太坊/外汇）。

## 运行 & 调试
- 启动后端：`cd back-end && python fapi.py`（需要 `.env` 中 `OPENAI_API_KEY`）。
- 健康检查：`curl http://localhost:8000/api/news/stats`
- 拉取样例：`curl "http://localhost:8000/api/news/latest?important_limit=5&others_limit=5&lang=cn"`
- WS 监听：浏览器或 `wscat -c ws://localhost:8000/api/news/ws`

## 可优化项（按优先级）
1) **持久化队列**：WS → 本地持久队列（如 SQLite 队列表）再异步总结，避免 LLM 抖动影响入库。
2) **重放/补偿**：在 `NewsWebSocketClient` 增加断线重放或与 InsightSentry 的分页拉取补偿。
3) **LLM 限流/缓存**：对重复标题短期缓存摘要，减少重复开销。
4) **观测性**：增加 Prometheus 指标或日志计数（summaries per minute、ws reconnects、llm errors）。
5) **前端体验**: 添加“仅标题模式/仅摘要模式”切换；滚动加载更多。
6) **去重**：已在 ingestion 中按同标题+时间窗（10 分钟）过滤重复；现有库可运行 `python back-end/scripts/dedupe_financial_news.py --apply --tolerance 600` 清理历史重复。
