
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, LayoutTemplate, AudioLines, Tag } from 'lucide-react';
import { ViewState } from '../../types';
import { SidebarNavItem } from './SidebarNavItem';

interface KnowledgeSectionProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

export const KnowledgeSection: React.FC<KnowledgeSectionProps> = ({
  currentView,
  onChangeView,
  isOpen,
  onToggle
}) => {
  const items = [
    { view: 'templates', label: '模板管理', icon: <LayoutTemplate size={18} /> },
    { view: 'voiceprints', label: '声纹管理', icon: <AudioLines size={18} /> },
    { view: 'hotwords', label: '热词管理', icon: <Tag size={18} /> },
  ];

  // Automatically open section if a child is active
  useEffect(() => {
    if (items.some(i => i.view === currentView)) {
      if (!isOpen) onToggle(true);
    }
  }, [currentView, isOpen, onToggle]);

  return (
    <div className="mt-8">
      <div 
        className="flex items-center justify-between px-3 py-2 group cursor-pointer mb-1" 
        onClick={() => onToggle(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-slate-500">知识库</span>
          {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="space-y-1 animate-fade-in pl-1">
          {items.map(item => (
            <SidebarNavItem 
              key={item.view} 
              icon={item.icon} 
              label={item.label} 
              isActive={currentView === item.view} 
              onClick={() => onChangeView(item.view as ViewState)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
