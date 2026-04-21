## 1. 概述 (Summary)
本项目旨在开发一款为数字游牧民设计的 Web App，集成了行李重量管理、保养品追踪、Gmail 航班同步、冬夏行李分类以及视觉化的“穿搭连连看”功能。**新增的核心突破：完全集成用户专属的免费 Gemini AI（通过 BYOK - Bring Your Own Key 或 Chrome window.ai），实现零 Token 成本下的极度个人化智能推荐**，通过读取用户的行李、航班与所在国家，精准推送 Dropshipping 和全球电商的分润链接。

## 2. 当前状态分析 (Current State Analysis)
- 文档已全面更新，融合了“视觉连连看”、“季节分类管理”、“Dropshipping 商业模式”及“专属 Gemini AI 接入”。
- 架构确立为“纯前端 + 本地存储 + 外部免费 API”的模式，完美保护用户隐私并降低服务器成本。

## 3. 拟议变更与实施步骤 (Proposed Changes & Implementation Steps)

### 步骤 1：项目初始化与环境配置
- 初始化 Vite (React + TS) 项目。
- 安装必要的 UI 库（Tailwind CSS, Framer Motion）和数据库（Zustand, Dexie）。
- 安装拖拽/连线支持库。

### 步骤 2：数据模型与本地数据库增强
- 在 Dexie 配置中添加 `user_configs` 表，用于加密存储用户的 Gemini API Key。
- 增强 `items`（新增季节/类别）和 `outfit_matches` 表。

### 步骤 3：核心 AI 服务与辅助函数封装
- **操作**：
  - **Gemini Service**：编写与 `generativelanguage.googleapis.com` 交互的 API 请求工具，支持读取本地缓存的 Key 进行请求。
  - **Chrome Built-in AI 探测**：检测 `window.ai` 对象是否存在，若存在则提示用户可直接调用本地大模型。
  - **Prompt 组装器**：设计一套 Prompt 模版，将用户的 Geo-IP（当前国家）、下一航班时间、行李箱重量、缺失物品、穿搭连线数据序列化后传给 Gemini。

### 步骤 4：各个核心页面与交互的开发
- **操作**：
  - **设置页与授权**：增加“接入专属 AI”面板，引导获取 Google AI Studio 免费 Key；接入 Gmail OAuth。
  - **Dashboard 智能气泡**：调用专属 Gemini 给出“超重提醒”、“要丢弃的旧衣服”、“需补给的保养品”，并展示推荐的 Dropshipping 商品。
  - **行李与季节管理**：实现冬/夏季节的行李列表切换与容量显示。
  - **穿搭连连看**：实现左右分栏的拖拽连线（SVG/Canvas），结合 Gemini 给出诸如“此搭配不适合即将前往的热带国家”或“你还缺一条百搭的裙子（附带分润购买链接）”的智能点评。
  - **物品库管理**：分类展示与过期管理。

### 步骤 5：UI 与审美体验优化
- 引入时尚画报风格（Magazine Aesthetic），采用高质量排版和柔和动画，提升女性用户及穿搭爱好者的体验。
- 保证推荐商品（广告）的原生感（Native Ad），类似“好物分享”卡片。

## 4. 假设与决策 (Assumptions & Decisions)
- **AI Token 零成本策略**：由于我们是纯前端架构，不承担 AI 成本。所有智能解析和商业推荐均由用户绑定的 Gemini Key（免费额度足够个人日常使用）或设备本地 AI 运算。这符合游牧民注重隐私且依赖 Google 生态的特性。
- **商业推送触发点**：在 AI 提示中将 Affiliate Link（如亚马逊/虾皮全球站链接）硬编码在 Prompt 规则中，让 Gemini 以 JSON 格式返回“需推荐物品类型及链接库”，前端渲染成漂亮的分润卡片。

## 5. 验证步骤 (Verification Steps)
1. 检查设置页能否正确保存和读取 Gemini API Key。
2. 验证“穿搭连连看”交互是否顺畅。
3. 组合假数据（比如：设定目的地为日本，重量超标 2kg，有两件“旧衣服”），调用专属 Gemini 接口，验证其是否能准确给出“建议丢弃旧衣物，且推荐防晒霜（带分润链接）”的结果。
4. 测试无网或未设置 API Key 时，App 是否仍能正常作为基础版的行李清单记录工具运行。
