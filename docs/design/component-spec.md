# QuantFlow 组件规格

状态：MVP P0 组件清单已确定｜具体 props 以实现后的组件 API 和 Storybook 为准

## 1. 实现顺序

先完成可复用组件，再组装官网、应用工作台与管理端页面。P0 顺序如下：

1. **基础交互**：Button、Card、Badge、RiskBadge、Modal / Dialog。
2. **通用状态**：EmptyState、LoadingState、ErrorState。
3. **数据展示**：MetricCard、DataTable、ChartCard、PageHeader。
4. **业务组件**：StrategyCard、SignalCard。
5. **布局组件**：MarketingLayout、UserAppLayout、BottomTabNav、SidebarLayout、AdminLayout。

PaperAccountCard、MembershipPlanCard、AuditLogDrawer、ReviewPanel 等在上述基础上按页面切片实现，不得阻塞基础组件基线。

## 2. 全局组件契约

所有组件必须：

- 只使用 `ui-guidelines.md` 的 v0 语义 tokens，不硬编码主题颜色。
- 覆盖 default、hover、focus-visible、active、disabled；异步组件还需 loading、empty、error。
- 满足 WCAG 2.2 AA 基本要求：文本对比度、键盘操作、可见焦点、语义标签、可读状态文本。
- 遵守 v0 token 的前景色限制；Profit、Warning、Info、Muted Text 未通过具体组合检测时不得直接作为白底小号正文颜色。
- 使用 v0 字体、间距、圆角、阴影、控件高度、断点、焦点和动效，不接受组件级自定义尺度。
- 支持窄屏、中等宽度和宽屏；不隐藏收益配对风险、权限或错误信息。
- 默认简体中文；图标不能代替唯一文本标签。
- 不包含真实下单、交易所连接、半自动或全自动交易动作。

## 3. 基础组件

### Button

变体：

- `primary`：`Primary Action` 背景 + `Primary Action Text`，每个区域通常只有一个。
- `secondary`：`Surface` 背景 + `Border` + `Primary Text`。
- `ghost` / `link`：透明背景；link 可使用 `Info`。
- `danger`：只用于真实危险操作，使用 `Loss` 语义。

要求：支持按钮/链接语义、图标前后位、loading、disabled reason；危险操作由 Dialog 二次确认。

### Card

使用 `Surface`、轻 `Border` 和极少/无阴影。支持 header、content、footer 和可选交互态。卡片嵌套不超过一层，不用卡片替代所有页面分组。

### Badge

用于非风险状态、会员等级和模拟盘状态。文字和背景需满足对比度，颜色不是唯一状态表达。

### RiskBadge

用于 low / medium / high / critical 风险。必须显示中文风险文本，可选原因 tooltip；不能只显示彩色圆点。Critical 主要用于管理端或阻断场景。

### Modal / Dialog

要求：语义标题、描述、初始焦点、焦点陷阱、Esc 关闭策略、关闭后焦点返回、窄屏不溢出。危险确认明确说明对象、影响和不可逆性；不得只写“确定吗”。

## 4. 状态组件

### EmptyState

包含标题、原因说明和最多一个主要下一步。无信号、无策略、无模拟盘和数据不足使用不同中文文案，不暗示未来收益。

### LoadingState

保持页面结构稳定，使用 `aria-busy` / 状态文本；骨架屏不得造成明显布局跳动。长任务提供进度或解释，不能无限旋转无反馈。

### ErrorState

显示用户可理解的错误、request ID（适用时）和可恢复动作。权限不足、行情延迟、策略异常、模拟计算失败必须区分，不泄露内部堆栈。

## 5. 数据与业务组件

### MetricCard

字段：标题、值、周期、数据来源、更新时间和风险配对指标。收益率必须绑定同周期最大回撤；胜率必须绑定交易次数和盈亏比。收益卡与风险卡视觉权重相同。

### StrategyCard

至少展示：名称、类型、支持币种、摘要、风险等级、同周期收益与最大回撤、胜率/交易次数、数据来源、模拟盘支持和访问权益。

动作仅为查看详情、订阅信号、开始模拟。暂停策略禁用新增操作；risk watch 展示 RiskBadge 和确认说明；delisted 不在用户列表展示。

### SignalCard

展示策略、币种、方向、触发/当前价格、建议仓位、止损/止盈、有效期、状态和风险等级。

动作仅为查看详情、加入模拟盘、收藏、提醒。过期/取消/策略暂停/风险阻断时禁用新增模拟并说明原因。

### DataTable

应用工作台和管理端共享数据能力，管理端使用高密度 variant。

必须支持：稳定表头、排序、筛选、服务端编号分页、loading/empty/error、列权限、数值右对齐、键盘可达操作和窄屏溢出策略。用户端默认 20 条并提供 10/20/50；管理端默认 50 条并提供 20/50/100。筛选或排序变化重置第 1 页，批量操作和导出经过权限控制；关键列不可因响应式布局永久丢失。

### ChartCard

组合标题、周期、数据来源、更新时间、图表、图例、状态和文本摘要。收益图表必须与回撤信息同卡或相邻；支持自适应宽度、合理最小高度和可访问数据表。

### PageHeader

包含标题、简短说明、面包屑（适用时）、状态/更新时间和页面级主要操作。窄屏时操作可换行或进入明确菜单，但不能隐藏关键操作。

## 6. 布局组件

### MarketingLayout

用于官网 `/`。提供轻量顶部导航、品牌区、锚点导航、右上角“进入应用”主 CTA、内容分区和页脚。官网移动端可以使用顶部导航 + 汉堡菜单。官网可以更有营销表达，但必须保留风险提示，不得使用收益承诺或暴富视觉。

### BottomTabNav

用于应用工作台 `/app` 移动端主导航。必须固定在底部，适配安全区，触控目标不低于 `44px`，仅放核心入口，避免过多项导致误触。

推荐入口：

1. 策略。
2. 信号。
3. 模拟盘。
4. 我的。

要求：

1. 不使用左上角汉堡菜单作为应用工作台移动端主导航。
2. 当前项状态清晰，图标必须配中文文本。
3. 不遮挡页面主操作按钮、风险提示、表单提交区和 Toast。
4. 页面内容底部预留导航高度和 safe-area。
5. 支持键盘和辅助技术可访问名称。

### SidebarLayout

提供侧边栏、顶部账户区和主内容区。主要用于管理端桌面布局；宽屏固定/粘性侧栏，窄屏可折叠为基础查看抽屉；打开时管理焦点和背景滚动。不得作为 `/app` 移动端主导航。

### UserAppLayout

用于 `/app`。使用 `Background` 画布、白色导航/内容表面和响应式内容容器。桌面端固定使用顶部导航，移动端使用 BottomTabNav。顶部区域用于页面标题、返回、通知、搜索等辅助操作。支持卡片网格自动换列；风险披露和全局通知位置稳定。访问 `/app` 必须重定向到 `/app/strategies`。

### AdminLayout

用于 `/admin`。基于 SidebarLayout，主内容为白色高密度工作区。优先 DataTable、筛选栏和详情抽屉，减少无意义统计卡片。管理端以桌面端为主，但移动端仍须支持必要查看和管理操作。

## 7. 后续业务组件

- PaperAccountCard：明确“模拟盘”，并列当前权益、累计收益和最大回撤。
- MembershipPlanCard：只展示访问、数据、提醒和模拟容量权益，不宣传收益。
- AuditLogDrawer：操作人、时间、对象、原因、前后数据、IP、request ID。
- ReviewPanel：策略风险、回撤、样本、适合/不适合行情和禁止文案检查。

## 8. 验收标准

1. P0 组件按实现顺序可独立演示并具备 Storybook 或等价用例。
2. v0 tokens、所有交互状态、WCAG 2.2 AA 基线和响应式行为均有验证。
3. 所有收益组件强制包含风险配对信息；颜色不是唯一信息渠道。
4. 官网、应用工作台和管理端复用基础组件与 design tokens，通过 layout、variant 与信息密度形成差异。
5. MVP 组件不存在实盘交易动作，也不为深色主题增加独立实现分支。
6. `/app` 移动端主导航使用 BottomTabNav，不使用汉堡菜单；官网移动端可使用汉堡菜单；管理端移动端保留必要查看和管理操作。
