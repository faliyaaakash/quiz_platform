import React, { useState, useEffect } from 'react';
import { BookOpen, LogOut, Bell, Menu, User as UserIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Open by default on large screens, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [user, setUser] = useState<User | null>(null);

  // Handle responsive behavior on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (error) {
        // Error handled silently or intercepted by global fetch
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { icon: BookOpen, label: 'My Quizzes', path: '/my-quizzes' },
    { icon: UserIcon, label: 'Profile', path: '/profile' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* 
        ==============================
        TOP HEADER (App Bar) 
        ==============================
      */}
      <header className="h-[70px] flex-shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 shadow-sm relative">
        <div className="flex items-center gap-3 md:gap-5">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 no-underline group select-none">
            <img src="/logo.png" alt="Logo" className="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105" />
            <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-800">
              Quiz<span className="text-indigo-600">Master</span>
            </h2>
          </Link>
        </div>

        {/* Right Side: Profile & Notifications */}
        <div className="flex items-center gap-2 md:gap-5">
          <button className="relative p-2 border-none bg-none cursor-pointer text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-[3px] right-[4px] w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>
          
          <Link to="/profile" className="flex items-center gap-3 no-underline group pl-2 sm:pl-4 sm:border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                {user?.fullName || 'Loading...'}
              </p>
              <p className="text-xs font-semibold text-slate-400">
                {user?.email || ''}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all overflow-hidden border-2 border-transparent group-hover:border-indigo-200 shadow-sm flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} strokeWidth={2.5} />
              )}
            </div>
          </Link>
        </div>
      </header>


      {/* 
        ==============================
        MAIN BODY (Sidebar + Content)
        ==============================
      */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Docked Below Header */}
        <aside 
          className={`
            absolute lg:relative top-0 left-0 h-full bg-[#0c1427] text-slate-400 flex flex-col z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl lg:shadow-[2px_0_8px_rgba(0,0,0,0.02)]
            ${isSidebarOpen 
              ? 'w-[260px] translate-x-0' 
              : 'w-[260px] -translate-x-full lg:w-0 lg:overflow-hidden lg:opacity-0'}
          `}
        >
          {/* Navigation Links */}
          <nav className="flex-1 flex flex-col py-4 px-4 gap-2 w-[260px]">
            {/* Hamburger Toggle (Inside Sidebar - visible when open) */}
            <div className="flex justify-end p-2 mb-2">
               <button
                 onClick={toggleSidebar}
                 className="p-2 text-slate-500 hover:text-white transition-colors"
               >
                 <Menu size={24} />
               </button>
            </div>

            <p className="text-[10px] uppercase tracking-widest font-black text-slate-500/60 mb-2 px-4">Menu</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all duration-300 group font-bold tracking-wide text-sm
                    ${isActive 
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-600/30' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
                  `}
                >
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} 
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Logout Area */}
          <div className="p-4 w-[260px] border-t border-slate-800/80">
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-black">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-200 truncate">{user.fullName}</p>
                 </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border border-transparent hover:border-rose-900/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 cursor-pointer text-sm font-bold rounded-xl transition-all group"
            >
              <LogOut size={20} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 w-full relative z-10 transition-all duration-300 scroll-smooth">
          {/* Hamburger Toggle (Visible when Sidebar is CLOSED) */}
          {!isSidebarOpen && (
            <div className="absolute top-4 left-4 z-40">
              <button
                onClick={toggleSidebar}
                className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl shadow-sm transition-all"
              >
                <Menu size={24} />
              </button>
            </div>
          )}
          
          <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;
