
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ containerClassName = "", className = "", ...props }) => {
  return (
    <div className={`relative ${containerClassName}`}>
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
       <input 
         type="text" 
         className={`w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all ${className}`}
         {...props}
       />
    </div>
  );
};
