
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../common/Button';
import { UserProfile } from './UserProfile';

interface SidebarFooterProps {
  isHardwareConnecting: boolean;
  onConnectHardware: () => void;
  onCloseMobileMenu?: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isHardwareConnecting,
  onConnectHardware,
  onCloseMobileMenu
}) => {
  return (
    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
       {/* Hardware Status Card */}
       <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center space-x-2">
               <div className={`w-2 h-2 rounded-full ${isHardwareConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-slate-300'}`}></div>
               <span className="text-xs font-medium text-slate-600">硬件设备</span>
             </div>
             <Settings size={14} className="text-slate-400" />
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full text-xs justify-center h-8" 
            onClick={() => { 
              onConnectHardware(); 
              onCloseMobileMenu?.(); 
            }} 
            isLoading={isHardwareConnecting}
          >
            {isHardwareConnecting ? '搜索中...' : '连接设备'}
          </Button>
       </div>
       
       {/* User Profile Component */}
       <UserProfile 
         name="邱" 
         role="Pro 版本" 
         onLogout={() => console.log("Logout clicked")} 
       />
    </div>
  );
};
