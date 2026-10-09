import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  GraduationCap, LogOut, X, ChevronDown, LayoutDashboard, Crown, Sparkles, Shield
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Sidebar = ({ menuItems, onClose, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Auto-expand group if current route is inside it
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(sub =>
          location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path))
        );
        if (hasActiveChild) {
          setExpandedGroup(item.label);
        }
      }
    });
  }, [location.pathname, menuItems]);

  const toggleGroup = (label) => {
    if (expandedGroup === label) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(label);
    }
  };

  return (
    <div className={`bg-gradient-to-b from-[#041E42] via-[#062B63] to-[#0A3575] text-slate-200 shadow-2xl flex flex-col z-20 sticky top-0 h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center h-[72px] bg-black/10 backdrop-blur-xs">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="../../public/NEW_WHITE_SCHOOL1.png" />

          {/* </div> */}
          {/* <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 text-slate-950 font-black"> */}
          {/* <Crown className="w-5 h-5 fill-slate-950 text-slate-950" /> */}
          {/* </div> */}
          {/* {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-black text-white tracking-tight leading-tight truncate">Bright Future</span>
              <span className="text-[10px] text-blue-200/70 font-semibold tracking-wider truncate">International School</span>
            </div>
          )} */}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl lg:hidden cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-1.5 px-3 custom-scrollbar">
        {menuItems.map((item, index) => {
          const Icon = item.icon || LayoutDashboard;

          if (item.subItems) {
            const isExpanded = expandedGroup === item.label;
            const hasActiveChild = item.subItems.some(sub =>
              location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path))
            );

            return (
              <div key={index} className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[12px] text-xs font-semibold transition-all duration-200 cursor-pointer ${hasActiveChild && !isCollapsed
                    ? 'bg-[#2563EB] text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)]'
                    : 'text-slate-300 hover:bg-[#2563EB]/80 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 shrink-0 ${hasActiveChild ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {isExpanded && !isCollapsed && (
                  <div className="pl-6 flex flex-col gap-1 mt-1 border-l border-white/10 ml-5 py-1">
                    {item.subItems.map((sub, sIndex) => {
                      const isSubActive = location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path));
                      return (
                        <Link
                          key={sIndex}
                          to={sub.path}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 ${isSubActive
                            ? 'bg-[#2563EB] text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-blue-600/40'
                            }`}
                        >
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Flat Link
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={index}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-[12px] transition-all duration-200 text-xs font-semibold ${isActive
                ? 'bg-[#2563EB] text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)]'
                : 'text-slate-300 hover:bg-[#2563EB]/80 hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom Card (Matching Reference Image) */}
      {/* {!isCollapsed && (
        <div className="p-3 mx-3 mb-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-[11px] font-black text-white leading-tight">Better Learning</span>
          </div>
          <p className="text-[10px] font-semibold text-blue-200/80 leading-tight">Brighter Futures</p>
        </div>
      )} */}

      {/* Logout */}
      <div className="p-3 border-t border-white/10 bg-black/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-300 hover:bg-rose-600 hover:text-white transition-all duration-200 text-xs font-bold cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Logout</span>}
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
