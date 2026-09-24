# 第一章 Web Review V5.0

状态：**WEB ASSEMBLED / 待整章阅读审阅**

## 本轮完成

第一章已按 2026-09-24 确认的 `book/layout-standard.md` 全量重排。

### 已解决的历史问题
- 书名《如果你在1985年二十岁》固定单行；
- 场景标题下沉，标题上下留白形成稳定节奏；
- 普通正文使用统一首行线和末行线；
- 不再每页重复小标题；
- 不再出现独立“时代XX页”；
- 时代旁注固定为右下方式，上方正文保持通栏；
- 历史照片与编辑视觉直接融入正文；
- 行内重点词增加轻微左右呼吸；
- 不再用手工凑页方式控制文字多少。

## 工程方式

新增并使用：
- `web/shared/css/reader-v2.css`
- `web/shared/css/editorial-layout.css`
- `web/shared/js/chapter-paginator.js`
- `web/shared/js/editorial-layout.js`
- `web/shared/js/reader-v2.js`

分页由固定逻辑书页上的实际 DOM 高度计算。

## 后续审阅重点

1. 整章连续阅读时是否仍存在局部密度异常；
2. 视觉节点是否都自然地“长在正文里”；
3. 三处时代旁注是否在各自上下文中出现得恰当；
4. 最后一节的情绪推进是否被分页破坏；
5. 不同系统字体下是否有极端溢出情况。

如果本轮通过，可将第一章状态推进到 `WEB REVIEW` / `FINAL`。
