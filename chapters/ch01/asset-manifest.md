# 第一章视觉资产总账 V3.1

状态：**CURRENT / 与 web/ch01/index.html 一致**

> 本文件只记录当前正式页面资产。旧版 V1/V2 SVG 与候选素材的历史决策见 Git 历史与 review.md。

## 1. 当前正式视觉资产

| ID | 页面 | 内容 | 类型 | 本地文件 | 状态 |
|---|---:|---|---|---|---|
| G01 | P04 | 包分配 | image2 编辑复原 | assets/ch01/generated/distribution-1985.avif | 🟢 |
| G02 | P06 | 单位生活半径 | image2 编辑复原 | assets/ch01/generated/unit-life-radius.avif | 🟢 |
| H01 | P08 | 城市生活时代影像 | 历史照片 | assets/ch01/historical/beijing-1988.jpg | 🟢 |
| G03 | P12 | 万元户收入尺度 | image2 编辑视觉 | assets/ch01/generated/wanyuan-1985.avif | 🟢 |
| H02 | P14 | 青年服装色彩 | 历史照片 | assets/ch01/historical/youth-fashion-1982.jpg | 🟢 |
| H03 | P17 | 公共空间与自行车 | 历史照片 | assets/ch01/historical/bicyclists-1987.jpg | 🟢 |
| H04 | P20 | 录音机实物 | 历史实物照片 | assets/ch01/historical/cassette-recorder.jpg | 🟢 |
| H05 | P25 | 航空信封 | 原始史料/实物 | assets/ch01/historical/airmail-envelope-1978.jpg | 🟢 |
| G04 | P29 | 四种人生 | image2 场景复原 | assets/ch01/generated/four-paths-1985-v4.avif | 🟢 |

## 2. 当前工程检查

- 正式图片总数：9
- 历史照片 / 实物：5
- image2 / 编辑视觉：4
- 远程图片热链：0
- 旧复杂 SVG 引用：0
- 正文页内嵌大图：0

## 3. image2 使用边界

- P04 “包分配”：通知书画面为编辑复原，不是档案原件。
- P06 “单位生活半径”：根据单位制史料制作的解释性复原。
- P12 “万元户”：1148元/年、约8.7年工资为已核验尺度；不是今天购买力换算。
- P29 “四种人生”：叙事收束用场景复原，不是历史现场照片。

## 4. 历史视觉使用边界

- 历史照片不暗示照片人物就是章节虚构角色。
- 1988北京照片作为近年代城市生活背景，不声称拍摄于1985。
- 航空信封用于解释邮政实物形态，不冒充故事中的那封美国来信。
- 详细原始 URL、作者与许可见：
  - assets/ch01/historical/README.md
  - sources/copyright.md

## 5. 当前废弃资产

以下类型不得重新接回正式 HTML：
- vs02_distribution_1985.svg
- vs03_danwei_system.svg
- vs05_wanyuan_scale.svg
- vs11_four_paths.svg
- unit-life-map.svg
- four-objects.svg
- 早期损坏 / 截断的 PNG、WebP image2 上传文件

## 6. 后续章节规则

后续章节资产管理统一遵循根目录：

**WORKFLOW.md**

正式 HTML 使用的每一张图片，都必须先进入对应章节的 historical / generated 本地目录，再进入页面。


## V4.0 视觉更新
- 四种人生场景改用 `assets/ch01/generated/four-paths-1985-v4.avif`；
- 新图已去掉“你还没有选。”及“单位稳定 / 市场风险 / 学习改变 / 远方世界”等四个标签；
- 旧 `four-paths-1985.avif` 保留为历史版本，不再被正式HTML引用。
