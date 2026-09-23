# 没有剧透的中国

> 写给2000年以后出生年轻人的中国生活史。

本项目用于《没有剧透的中国》图书与 Web Book 的完整内容生产管理。

## 核心定位

时间范围：1978—1995（第一册）

核心写法：不是从大事记出发，而是让读者进入当时普通人的生活，在“不知道未来”的条件下理解他们的选择。

核心原则：

- 正文首先是故事，不是知识点集合。
- 历史细节只在影响人物理解和选择时进入正文。
- 年轻读者不理解的制度，由“时代翻译”承担。
- 真实史料优先于 AI 场景复原。
- HTML 只负责组装已经确认的文字与视觉资产，不在 HTML 阶段临时创造内容。- 正式 HTML 的所有图片必须先本地化到仓库，禁止运行时外链历史图片或图床。
- 真实史料与 AI 复原图必须明确区分。

## 工作流

全书统一生产流程以 **[WORKFLOW.md](WORKFLOW.md)** 为唯一基线。

简化阶段：

1. 章节策划
2. 正文 Draft
3. 历史考据 Research
4. Content Locked
5. Visual Script
6. Historical Assets + 版权审查
7. 图片本地化
8. image2 / 编辑视觉制作
9. Visual Locked
10. Page Script
11. HTML Assembly
12. 自动检查
13. Web Review
14. 反向修订
15. FINAL

> 后续章节默认连续执行到整章完成；只有重大内容取舍、历史争议、版权不可用或整体风格改变时才中途确认。

## 当前状态

- 图书策划：已完成 V0.1
- 第一章《如果你在1985年二十岁》：单页数字书版已完成，历史照片与 image2 视觉均已本地化
- 第一章状态：WEB COMPLETE / 待最终阅读审阅
- 下一步：用户审阅第一章 Web V2.0；确认后进入第二章生产

详见：
- [统一生产工作流](WORKFLOW.md)
- [项目说明](PROJECT.md)
- [全书目录](book/outline.md)
- [文字规范](book/style-guide.md)
- [视觉规范](book/visual-guide.md)
- [第一章正文](chapters/ch01/manuscript.md)
- [第一章视觉脚本](chapters/ch01/visual-script.md)
