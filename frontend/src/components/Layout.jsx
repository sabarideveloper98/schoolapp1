import { useState } from 'react';
import { Menu, Sun, ChevronDown, ExternalLink } from 'lucide-react';
import Sidebar from './Sidebar';
import { toast } from 'react-toastify';

const Layout = ({ children, menuItems, title }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleCacheClear = () => {
    toast.success("Cache Cleared successfully!");
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
            
            {/* Collapse Sidebar Button for Desktop */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb info */}
            <div className="hidden sm:block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {title}
            </div>
          </div>

          {/* Right side navigation items matching the screenshot */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Cache Clear Button */}
            <button
              onClick={handleCacheClear}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Cache Clear
            </button>

            {/* Branch Selector Dropdown */}
            <div className="relative hidden md:block">
              <button className="border border-blue-100 bg-blue-50/30 hover:bg-blue-50 text-blue-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Branch (Branch 1)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Session Selector Dropdown */}
            <div className="relative hidden md:block">
              <button className="border border-slate-200 hover:border-slate-300 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors bg-white">
                <span>Session (2024-2025)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme Toggle Sun Icon */}
            <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
              <Sun className="w-5 h-5" />
            </button>

            {/* User Profile Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_10px_rgba(37,99,235,0.1)] border-2 border-white ring-1 ring-slate-100">
              U
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

