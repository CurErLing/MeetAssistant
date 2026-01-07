import React from 'react';

export const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'processing') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></span>
        处理中
      </span>
    );
  } else if (status === 'error') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        失败
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800 border border-green-200">
      已完成
    </span>
  );
};