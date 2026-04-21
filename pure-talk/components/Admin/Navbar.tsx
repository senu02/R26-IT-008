import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Search, 
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { useThemeColors, type ThemeMode } from '@/context/adminTheme';

const Navbar: React.FC = () => {
  const { theme, colors, toggleTheme, setTheme } = useThemeColors();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Refs for dropdowns
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New user registered', time: '5 min ago', read: false },
    { id: 2, title: 'System update completed', time: '1 hour ago', read: false },
    { id: 3, title: 'Weekly report ready', time: '2 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get theme icon
  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="h-5 w-5" />;
    if (theme === 'dark') return <Moon className="h-5 w-5" />;
    return <Sparkles className="h-5 w-5" />;
  };

  // Get theme display name
  const getThemeName = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'Space';
  };

  return (
    <nav 
      className="sticky top-0 z-50 shadow-md border-b transition-all duration-300"
      style={{ 
        backgroundColor: colors.surface.primary,
        borderBottomColor: colors.border.primary
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
      

          {/* Search Bar - Facebook Style */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300" 
                style={{ color: colors.text.tertiary }}
                size={16}
              />
              <input
                type="text"
                placeholder="Search admin panel..."
                className="w-full pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 transition-all duration-300"
                style={{ 
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.primary,
                  '--tw-ring-color': colors.primary.main,
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surface.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                }}
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-all duration-300 hover:scale-110"
              style={{ 
                backgroundColor: colors.background.tertiary,
                color: colors.text.secondary
              }}
              title={`Switch theme (current: ${getThemeName()})`}
            >
              {getThemeIcon()}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-full transition-all duration-200"
                style={{ color: colors.text.secondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                  e.currentTarget.style.color = colors.primary.main;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span 
                    className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center animate-pulse"
                    style={{ backgroundColor: colors.status.error }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border overflow-hidden z-50 transition-all duration-200"
                  style={{ 
                    backgroundColor: colors.surface.primary,
                    borderColor: colors.border.primary
                  }}
                >
                  <div 
                    className="p-3 border-b"
                    style={{ borderBottomColor: colors.border.primary }}
                  >
                    <h3 className="font-semibold" style={{ color: colors.text.primary }}>Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 cursor-pointer transition-colors duration-200 ${
                          !notification.read ? 'bg-opacity-10' : ''
                        }`}
                        style={{
                          backgroundColor: !notification.read ? `${colors.primary.main}10` : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.background.tertiary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = !notification.read ? `${colors.primary.main}10` : 'transparent';
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{notification.title}</p>
                        <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>{notification.time}</p>
                      </div>
                    ))}
                  </div>
                  <div 
                    className="p-2 border-t"
                    style={{ borderTopColor: colors.border.primary }}
                  >
                    <button 
                      className="w-full text-center text-sm py-1 transition-colors duration-200"
                      style={{ color: colors.primary.main }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.primary.light;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.primary.main;
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;