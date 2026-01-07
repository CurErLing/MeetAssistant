
import { Template } from "../types";

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "standard",
    name: "标准会议摘要",
    description: "生成标准的会议总结，包含背景、主要讨论点和结论。",
    category: "通用",
    tags: ["通用", "摘要"],
    icon: "FileText",
    prompt: "请生成一份标准的会议摘要。包含：1. 会议主题/背景；2. 主要讨论点；3. 结论。在提到关键观点时，请务必写出是哪位发言人（使用粗体显示人名）提出的。使用 Markdown 格式（H2 标题、列表等）。",
    usageCount: 120,
    isCustom: false,
    author: "积木官方",
    isStarred: false,
    isUserCreated: false
  },
  {
    id: "detailed",
    name: "详细会议纪要",
    description: "按时间顺序记录详细的讨论过程，保留关键观点和发言人。",
    category: "会议",
    tags: ["详细", "记录"],
    icon: "LayoutList",
    prompt: "请生成一份详细的会议纪要。按时间或逻辑顺序记录讨论过程。必须保留具体是谁说了什么关键观点（使用粗体显示人名）。使用 Markdown 格式，包含层级标题。",
    usageCount: 85,
    isCustom: false,
    author: "积木官方",
    isStarred: false,
    isUserCreated: false
  },
  {
    id: "action_items",
    name: "待办事项提取",
    description: "专注于提取会议中的任务分配、负责人和截止日期。",
    category: "会议",
    tags: ["GTD", "任务"],
    icon: "FileCheck",
    prompt: "请重点提取会议中的待办事项（Action Items），明确列出任务内容、提及的负责人（如果有）以及截止时间。格式为 Markdown 列表。同时简要总结会议背景。",
    usageCount: 200,
    isCustom: false,
    author: "积木官方",
    isStarred: true,
    isUserCreated: false
  },
  {
    id: "decisions",
    name: "关键决策记录",
    description: "忽略闲聊，仅记录会议中达成的共识和决策。",
    category: "会议",
    tags: ["决策", "高层"],
    icon: "Scale",
    prompt: "请忽略闲聊，只列出会议中达成的关键决策（Decisions）和共识。必须指明是谁提出或确认了这些决策。请使用清晰的 Markdown 列表格式。",
    usageCount: 45,
    isCustom: false,
    author: "积木官方",
    isStarred: false,
    isUserCreated: false
  },
  {
    id: "interview",
    name: "面试评估报告",
    description: "针对面试场景，分析候选人的表现、优缺点及录用建议。",
    category: "面试",
    tags: ["HR", "招聘"],
    icon: "MessageCircleQuestion",
    prompt: "你是一位资深面试官。请根据对话内容生成面试评估报告：1. 候选人基本情况；2. 主要优势（Strengths）；3. 待提升点（Weaknesses）；4. 关键问答摘要；5. 总体评价建议。使用 Markdown 格式。",
    usageCount: 30,
    isCustom: false,
    author: "积木官方",
    isStarred: false,
    isUserCreated: false
  },
  {
    id: "brainstorm",
    name: "头脑风暴整理",
    description: "整理创意发散会议中的点子，按主题归类。",
    category: "演讲",
    tags: ["创意", "产品"],
    icon: "Sparkles",
    prompt: "这是一场头脑风暴会议。请提取所有提出的创意点子（Ideas），并尝试将它们按主题或类别进行分类整理。忽略重复的或无效的讨论，提炼核心创新点。使用 Markdown 格式。",
    usageCount: 60,
    isCustom: false,
    author: "积木官方",
    isStarred: false,
    isUserCreated: false
  }
];
