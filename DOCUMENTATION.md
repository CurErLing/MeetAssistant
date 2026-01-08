
# 积木会议助手 - 项目代码说明文档

本文档详细介绍了项目的目录结构和各个文件的功能，旨在帮助开发者快速理解项目架构和业务逻辑。

## 1. 根目录文件

*   **`index.html`**: 项目的入口 HTML 文件。包含 Tailwind CSS CDN 链接、Google Fonts 引用以及 React 应用挂载点 (`<div id="root"></div>`)。
*   **`index.tsx`**: React 应用的入口文件。负责渲染 `<App />` 组件到 DOM 中。
*   **`App.tsx`**: 应用的主组件。
    *   管理全局路由状态 (`view`) 和导航逻辑。
    *   集成硬件同步 (`useHardwareSync`) 和全局模态框 (`GlobalModals`)。
    *   根据当前视图状态渲染不同的子视图（主页、列表、详情、管理页等）。
*   **`types.ts`**: TypeScript 类型定义文件。定义了核心数据模型，如 `MeetingFile` (会议), `Speaker` (发言人), `TranscriptSegment` (转写片段), `Template` (分析模板) 等。
*   **`metadata.json`**: 应用元数据配置，声明了需要的硬件权限（麦克风、蓝牙）。

## 2. 核心服务 (Services)

*   **`services/geminiService.ts`**: 集成 Google Gemini API 的服务。
    *   `transcribeAudio`: 处理音频转写，将音频文件发送给 Gemini 并获取结构化 JSON 结果。
    *   `generateMeetingSummary`: 基于转写内容和模板生成 AI 分析总结。
*   **`services/gemini/prompts.ts`**: 存储发给 LLM 的 Prompt 模板构建逻辑。
*   **`services/gemini/mockData.ts`**: 提供模拟的转写数据，用于无 API Key 时的降级展示。
*   **`services/audioUtils.ts`**: 纯前端音频处理工具。
    *   `sliceAudio`: 音频裁剪（保留选区）。
    *   `deleteAudioRange`: 音频删除（删除选区）。
    *   `convertToWav`: 音频格式转换与重采样。
    *   `getAudioDuration`: 获取音频时长。
*   **`services/storage.ts`**: 本地存储服务。
    *   使用 **IndexedDB** 存储大文件（音频 Blob）。
    *   使用 **LocalStorage** 存储轻量级元数据（虽然目前主要依赖 Supabase，但保留了本地存储能力）。
*   **`services/supabaseService.ts`**: Supabase 后端集成服务。负责数据的持久化（增删改查会议、文件夹、模板等）和文件上传。
*   **`services/ble/`**: 蓝牙硬件通信模块。
    *   `BluetoothService.ts`: 封装 Web Bluetooth API，管理设备连接、数据传输。
    *   `protocol.ts`: 定义自定义通信协议（包结构、命令字）。
    *   `crc16.ts`: CRC 校验算法实现。

## 3. 自定义 Hooks

*   **`hooks/useAppStore.ts`**: 全局状态管理 Hook。
    *   从 Supabase 加载初始化数据。
    *   提供对会议、文件夹、声纹、模板等数据的 CRUD 方法。
    *   管理当前视图状态 (`view`)。
*   **`hooks/useMeetingDetailLogic.ts`**: 会议详情页的业务逻辑 Hook。
    *   管理详情页的 UI 状态（Tab 切换、播放进度、编辑模式）。
    *   处理 AI 分析生成、发言人修改等复杂交互。
    *   包含防御性编程逻辑，防止数据异常导致的崩溃。
*   **`hooks/useHardwareSync.ts`**: 硬件同步逻辑 Hook。管理蓝牙连接状态机、文件列表获取和下载进度。
*   **`hooks/useMeetingModals.tsx`**: 封装会议列表页常用的操作模态框（重命名、移动、删除等）。
*   **`hooks/useFolderModals.tsx`**: 封装文件夹操作相关的模态框逻辑。
*   **`hooks/useClickOutside.ts`**: 通用 Hook，用于检测点击元素外部的事件（常用于关闭下拉菜单）。

## 4. UI 组件 (Components)

### 4.1 视图 (Views)

*   **`components/views/home/`**: 主页视图。
    *   `HomeHeader.tsx`: 欢迎语和顶部工具栏。
    *   `HomeFolderSection.tsx`: 文件夹卡片网格。
    *   `HomeDocumentList.tsx`: 最近访问/收藏的会议列表。
*   **`components/views/meeting-list/`**: 会议列表视图。
    *   `MeetingListView.tsx`: 列表页主容器。
    *   `DesktopTable.tsx`: 桌面端表格展示。
    *   `MobileCardList.tsx`: 移动端卡片展示。
*   **`components/views/meeting/`**: 会议详情视图。
    *   `index.tsx`: 详情页入口，组装各子模块。
    *   `TranscriptView.tsx`: 转写逐字稿视图，支持点击跳转音频。
    *   `TranscriptItem.tsx`: 单条转写记录组件，支持编辑和发言人修改。
    *   `AnalysisView.tsx`: AI 分析结果视图，支持 Markdown 渲染。
    *   `AudioEditor/`: 音频播放器与编辑器组件。
*   **`components/views/manager/`**: 管理视图。
    *   `VoiceprintManagerView.tsx`: 声纹管理。
    *   `HotwordManagerView.tsx`: 热词管理。
    *   `TemplateManagerView.tsx`: 模板管理。

### 4.2 模态框 (Modals)

*   **`components/modals/BaseModal.tsx`**: 基础模态框组件，提供遮罩、标题栏和关闭逻辑。
*   **`components/modals/hardware/`**: 硬件同步相关模态框。
*   **`components/modals/meeting/`**: 会议相关模态框（录音、上传预览、分享等）。
*   **`components/GlobalModals.tsx`**: 全局模态框容器，挂载在 App 根节点。

### 4.3 通用组件 (Common)

*   **`components/common/Button.tsx`**: 统一样式的按钮组件。
*   **`components/common/SearchBar.tsx`**: 搜索框组件。
*   **`components/common/MeetingIcon.tsx`**: 会议文件图标组件。
*   **`components/sidebar/`**: 侧边栏导航组件。

## 5. 数据与工具 (Data & Utils)

*   **`data/defaultTemplates.ts`**: 预置的 AI 分析模板数据。
*   **`data/mockSharedMeetings.ts`**: 模拟的共享会议数据。
*   **`utils/formatUtils.ts`**: 时间格式化工具 (秒 -> MM:SS)。
*   **`utils/fileUtils.ts`**: 文件处理工具 (File -> Base64)。

---

**主要设计模式**：
*   **Container/Presenter**: 逻辑与视图分离（如 `useMeetingDetailLogic` 与 `MeetingDetailView`）。
*   **Optimistic UI**: 在 API 请求返回前先更新 UI，提升用户体验（如在 `useAppStore` 中）。
*   **Defensive Programming**: 在渲染层大量使用可选链和默认值，防止因数据缺失导致的白屏。
