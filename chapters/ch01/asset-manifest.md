# 第一章视觉资产总账 V5.0

状态：**CURRENT / 与纪实小说母版一致**

## 当前正式视觉资产

| ID | 叙事位置 | 内容 | 类型 | 本地文件 | 状态 |
|---|---|---|---|---|---|
| G01 | 第一节 · 分配讨论 | 高校毕业分配 | image2 编辑复原 | assets/ch01/generated/distribution-1985.webp | 🟢 |
| G02 | 第一节 · 单位解释 | 单位生活半径 | image2 编辑复原 | assets/ch01/generated/unit-life-radius.webp | 🟢 |
| H01 | 第二节 · 建军做买卖 | 城市生活时代影像 | 历史照片 | assets/ch01/historical/beijing-1988.jpg | 🟢 |
| G03 | 第二节 · 一万元 | 万元户收入尺度 | image2 编辑视觉 | assets/ch01/generated/wanyuan-1985.webp | 🟢 |
| H02 | 第三节 · 红裙子 | 青年服装色彩 | 历史照片 | assets/ch01/historical/youth-fashion-1982.jpg | 🟢 |
| H03 | 第三节 · 约会与公共空间 | 自行车生活 | 历史照片 | assets/ch01/historical/bicyclists-1987.jpg | 🟢 |
| H04 | 第四节 · 宿舍听歌 | 录音机实物 | 历史实物照片 | assets/ch01/historical/cassette-recorder.jpg | 🟢 |
| H05 | 第四节 · 美国来信 | 航空信封 | 原始史料 / 实物 | assets/ch01/historical/airmail-envelope-1978.jpg | 🟢 |
| G04 | 第六节 · 四种人生 | 夜读书桌 | image2 场景复原 | assets/ch01/generated/four-paths-1985.webp | 🟢 |

## V5 使用方式变化

- 不再给视觉资产分配固定“独立页码”；
- 视觉资产全部嵌入正文流；
- “时代XX”不再作为独立页面类型；
- 三个制度 / 信息解释改为右下时代旁注；
- 所有图片仍为仓库本地路径；
- 真实史料与编辑复原继续明确区分。

## 使用边界

- `distribution-1985.webp`：编辑复原，不是档案原件。
- `unit-life-radius.webp`：解释性复原，不代表所有单位配置完全相同。
- `wanyuan-1985.webp`：比较收入尺度，不做今天购买力换算。
- `four-paths-1985.webp`：场景复原，不是历史现场照片；无“你还没有选。”与四个路径标签。
- 1988北京照片仅作为近年代城市生活背景，不声称是1985故事现场。
- 航空信封不冒充故事中的那封美国来信。

详细版权信息继续以：
- `assets/ch01/historical/README.md`
- `sources/copyright.md`
为准。


## V5.2
- “四种人生”正式视觉切换为 `assets/ch01/generated/four-paths-1985.webp`，用于解决旧 AVIF 在浏览器中未正常显示的问题。


## V5.5｜AI 视觉横幅化
四张正式 AI / 编辑视觉全部重制为 3:2 横幅 WebP：
- `distribution-1985.webp`
- `unit-life-radius.webp`
- `wanyuan-1985.webp`
- `four-paths-1985.webp`

目的：让 AI 视觉从素材源头适配正文右栏，不再依赖米色底板或竖幅留白。


## V5.6｜有效 WebP 与排版复核
- 四张正式 AI 横幅资源重新以有效 WebP 二进制写入仓库；
- 第一节双图组和“万元户”视觉位置重新规划，避免与时代旁注抢占同一页右侧空间。
