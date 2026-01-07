
import React from 'react';
import { Calendar, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { MeetingFile } from '../../../types';
import { Button } from '../../common/Button';
import { MeetingIcon } from '../../common/MeetingIcon';

interface RecycleBinTableProps {
  deletedMeetings: MeetingFile[];
  onRestore: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  calculateDaysLeft: (deletedAt?: Date) => number;
}

export const RecycleBinTable: React.FC<RecycleBinTableProps> = ({
  deletedMeetings,
  onRestore,
  onConfirmDelete,
  calculateDaysLeft
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">会议名称</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">删除时间</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">自动清理倒计时</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deletedMeetings.map((meeting) => {
              const daysLeft = calculateDaysLeft(meeting.deletedAt);
              return (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <MeetingIcon 
                        format={meeting.format} 
                        size={20} 
                        className="w-10 h-10 bg-slate-100 text-slate-400 border-slate-200 grayscale opacity-70"
                      />
                      <div>
                        <div className="font-medium text-sm text-slate-600 line-through decoration-slate-300 decoration-2">{meeting.name}</div>
                        <div className="text-xs text-slate-400 uppercase font-mono mt-0.5">{meeting.format}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <div className="flex items-center space-x-2">
                       <Calendar size={14} className="text-slate-300" />
                       <span>{meeting.deletedAt?.toLocaleDateString()}</span>
                       <span className="text-xs text-slate-400 ml-1">{meeting.deletedAt?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className={`flex items-center space-x-2 font-medium ${daysLeft <= 1 ? 'text-red-600 bg-red-50 inline-flex px-2 py-0.5 rounded' : 'text-slate-600'}`}>
                       <Clock size={14} />
                       <span>{daysLeft} 天</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => onRestore(meeting.id)}
                        icon={<RotateCcw size={14} />}
                        title="还原"
                        className="bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                      >
                        还原
                      </Button>
                      <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => onConfirmDelete(meeting.id)}
                        icon={<Trash2 size={14} />}
                        title="彻底删除"
                        className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        彻底删除
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
