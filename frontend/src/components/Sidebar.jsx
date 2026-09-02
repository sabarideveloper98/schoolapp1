import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, LogOut, X, ChevronDown, LayoutDashboard } from 'lucide-react';
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
    <div className={`bg-white shadow-[1px_0_10px_rgb(0,0,0,0.02)] border-r border-slate-100 flex flex-col z-10 sticky top-0 h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center h-[70px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/s1-logo.png"
            alt="S1 Logo"
            className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md shadow-blue-500/20"
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-black text-blue-700 tracking-tight leading-tight">S1</span>
              {/* <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager</span> */}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-500 hover:bg-slate-50 rounded-xl lg:hidden cursor-pointer"
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${hasActiveChild && !isCollapsed
                      ? 'text-blue-600 bg-blue-50/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 shrink-0 ${hasActiveChild ? 'text-blue-600' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {isExpanded && !isCollapsed && (
                  <div className="pl-6 flex flex-col gap-1 mt-0.5 border-l-2 border-slate-100 ml-5">
                    {item.subItems.map((sub, sIndex) => {
                      const isSubActive = location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path));
                      return (
                        <Link
                          key={sIndex}
                          to={sub.path}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${isSubActive
                              ? 'bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-500/5'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                            }`}
                        >
                          {sub.label}
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
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${isActive
                  ? 'bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-500/5'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-sm font-semibold cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
