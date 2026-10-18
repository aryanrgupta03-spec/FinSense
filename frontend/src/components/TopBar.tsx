import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  Calendar,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Sparkles
} from 'lucide-react';
import { Badge } from './Badge';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onToggleMobileMenu: () => void;
  selectedPeriod: string;
  onChangePeriod: (period: string) => void;
  onResetDemo: () => Promise<void>;
  notifications?: any[];
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  onToggleMobileMenu,
  selectedPeriod,
  onChangePeriod,
  onResetDemo,
  notifications = []
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetDemo();
    } finally {
      setIsResetting(false);
      setShowProfileMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-3">
        {/* Date / Period Filter */}
        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
          <select
            value={selectedPeriod}
            onChange={(e) => onChangePeriod(e.target.value)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer text-slate-800"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
          </select>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="font-semibold text-sm text-slate-900">
                  AI Financial Notifications
                </div>
                <Badge variant="primary" size="sm">
                  {notifications.length} updates
                </Badge>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No alerts at this time</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {n.notification_type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                          {n.notification_type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {n.notification_type === 'info' && <Info className="w-3.5 h-3.5 text-blue-500" />}
                          {n.notification_type === 'recommendation' && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {n.source_technique}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Actions */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              AG
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">Aryan Gupta</div>
              <div className="text-[10px] text-emerald-600 font-medium">Demo Profile (INR)</div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <div className="text-sm font-semibold text-slate-900">Aryan R. Gupta</div>
                <div className="text-xs text-slate-500">demo@finsense.ai</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">Income: ₹1,25,000 / mo</div>
              </div>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Resetting Baseline...' : 'Reset Demonstration Dataset'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
