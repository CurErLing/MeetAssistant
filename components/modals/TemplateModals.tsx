
import React, { useState } from 'react';
import { 
  PlusCircle, Sparkles, Edit2, Trash2, FileText 
} from 'lucide-react';
import { Button } from '../common/Button';
import { BaseModal } from './BaseModal';
import { Template } from '../../types';
import { ICON_MAP, ICON_OPTIONS } from '../../constants/templateIcons';

// --- Template Create Modal ---

export const CreateTemplateModal = ({
  categories,
  onSave,
  onClose
}: {
  categories: string[],
  onSave: (tpl: Template) => void,
  onClose: () => void
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] || "通用");
  const [prompt, setPrompt] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);

  const handleSave = () => {
    onSave({
      id: `tpl_custom_${Date.now()}`,
      name,
      description,
      category,
      tags: [category],
      icon,
      prompt,
      usageCount: 0,
      isUserCreated: true,
      author: '我'
    });
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <>
          <PlusCircle size={20} className="text-blue-600" />
          <span>创建 AI 视角模板</span>
        </>
      }
      footer={
        <>
          <Button onClick={onClose} variant="secondary" className="flex-1">取消</Button>
          <Button onClick={handleSave} className="flex-1" disabled={!name || !prompt}>发布模板</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">模板名称</label>
            <input className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100" placeholder="例如：面试问题提取" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">分类</label>
            <select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">图标</label>
            <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto p-2 border border-slate-200 rounded-lg">
              {ICON_OPTIONS.map(opt => {
                const Icon = ICON_MAP[opt];
                return (
                  <button key={opt} onClick={() => setIcon(opt)} className={`p-2 rounded-lg transition-all ${icon === opt ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">简介</label>
          <textarea className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 h-20 resize-none" placeholder="简要说明此模板的用途..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">AI 指令 (Prompt)</label>
          <textarea className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 h-32 resize-none font-mono text-xs" placeholder="请从会议记录中提取..." value={prompt} onChange={e => setPrompt(e.target.value)} />
          <p className="mt-2 text-[10px] text-slate-400">我们将基于此指令，对转写内容进行深度提炼。</p>
        </div>
      </div>
    </BaseModal>
  );
};

// --- Template Detail Modal ---

export const TemplateDetailModal = ({
  template,
  categories,
  onSave,
  onDelete,
  onClose
}: {
  template: Template,
  categories: string[],
  onSave: (id: string, updates: Partial<Template>) => void,
  onDelete: (id: string) => void,
  onClose: () => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [prompt, setPrompt] = useState(template.prompt || "");

  const IconComponent = ICON_MAP[template.icon as string] || FileText;

  const handleUpdate = () => {
    onSave(template.id, { name, description, prompt });
    setIsEditing(false);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <IconComponent size={18} />
          </div>
          <span>{isEditing ? '编辑模板' : '模板详情'}</span>
        </div>
      }
      footer={
        <div className="w-full flex justify-between items-center gap-3">
          {template.isUserCreated ? (
            <>
              {isEditing ? (
                <>
                  <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>取消</Button>
                  <Button className="flex-1" onClick={handleUpdate}>保存修改</Button>
                </>
              ) : (
                <>
                  <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => { onDelete(template.id); onClose(); }}>删除</Button>
                  <div className="flex gap-2 flex-1 justify-end">
                    <Button variant="secondary" onClick={onClose}>关闭</Button>
                    <Button icon={<Edit2 size={16} />} onClick={() => setIsEditing(true)}>编辑模板</Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Button variant="secondary" className="w-full" onClick={onClose}>关闭</Button>
          )}
        </div>
      }
    >
        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">模板名称</label>
                  <input className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100" value={name} onChange={e => setName(e.target.value)} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">简介</label>
                  <textarea className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 h-24 resize-none" value={description} onChange={e => setDescription(e.target.value)} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">指令 (Prompt)</label>
                  <textarea className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 h-40 resize-none font-mono text-xs" value={prompt} onChange={e => setPrompt(e.target.value)} />
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{template.name}</h2>
                  <p className="text-slate-500 leading-relaxed">{template.description}</p>
               </div>
               <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} /> AI 核心指令
                  </h4>
                  <p className="text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                    {template.prompt || "暂无自定义指令"}
                  </p>
               </div>
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                     <div className="text-xs text-slate-400 mb-1">分类</div>
                     <div className="text-sm font-bold text-slate-700">{template.category}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                     <div className="text-xs text-slate-400 mb-1">作者</div>
                     <div className="text-sm font-bold text-slate-700">{template.author || '系统'}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                     <div className="text-xs text-slate-400 mb-1">使用数</div>
                     <div className="text-sm font-bold text-slate-700">{template.usageCount || 0}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
    </BaseModal>
  );
};
