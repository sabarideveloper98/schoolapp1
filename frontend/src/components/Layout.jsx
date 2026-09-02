import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Sun, ChevronDown, ExternalLink, User, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import Sidebar from './Sidebar';
import { toast } from 'react-toastify';
import useAuthStore from '../store/useAuthStore';

const Layout = ({ children, menuItems, title }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);

  const handleCacheClear = () => {
    toast.success("Cache Cleared successfully!");
  };

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProfilePath = () => {
    switch (user?.role) {
      case 'SuperAdmin': return '/super-admin/profile';
      case 'SchoolAdmin': return '/school-admin/profile';
      case 'Teacher': return '/teacher/profile';
      case 'Parent': return '/parent/profile';
      default: return '/school-admin/profile';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out z-30 lg:z-10 ${
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <Sidebar 
          menuItems={menuItems} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <nav className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] px-4 lg:px-8 py-3.5 flex justify-between items-center border-b border-slate-100 z-10 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">{title}</h1>
              {/* Optional Subtitle / Breadcrumb hint */}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cache Clear */}
            <button
              onClick={handleCacheClear}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Cache Clear
            </button>

            {/* Theme Toggle Sun Icon */}
            <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
              <Sun className="w-5 h-5" />
            </button>

            {/* User Profile Dropdown Menu */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-all cursor-pointer focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-[0_4px_10px_rgba(37,99,235,0.2)] border-2 border-white ring-1 ring-slate-100">
                  {(user?.email?.[0] || user?.role?.[0] || 'U').toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Popup */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base shrink-0">
                      {(user?.email?.[0] || user?.role?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-slate-800 truncate">
                        {user?.email || user?.phone || 'User Account'}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3" /> {user?.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="py-1">
                    <Link
                      to={getProfilePath()}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" /> My Account Profile
                    </Link>
                    
                    <Link
                      to={getProfilePath()}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" /> Security & Password
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

