'use client';

import React, { useState, useEffect } from 'react';
import { useThemeColors } from '@/context/adminTheme';
import StatsBar from '@/components/Admin/UserManagement/StatsBar';
import UsersTable, { User } from '@/components/Admin/UserManagement/UsersTable';
import UserModal from '@/components/Admin/UserManagement/UserModal';
import { userAPI } from '@/lib/api';

// Define types for API responses
interface ApiUser {
  id: number;
  email: string;
  full_name: string | null;
  mobile_number: string | null;
  role: string;
  account_status: string;
  date_joined: string;
  last_login: string | null;
  last_active: string;
}

interface UserStatsResponse {
  total_users?: number;
  active_users?: number;
  suspended_users?: number;
  banned_users?: number;
  by_role?: {
    user?: number;
    moderator?: number;
    admin?: number;
    super_admin?: number;
  };
  recent_users?: any[];
}

interface UsersListResponse {
  count?: number;
  users?: ApiUser[];
}

// Star component for space theme
const StarField: React.FC = () => {
  const { theme } = useThemeColors();
  const [stars, setStars] = useState<Array<{ id: number; left: string; top: string; size: string; delay: string; duration: string; opacity: number }>>([]);

  useEffect(() => {
    if (theme === 'space') {
      const starCount = 150;
      const newStars = Array.from({ length: starCount }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 3 + 1}px`,
        delay: `${Math.random() * 5}s`,
        duration: `${Math.random() * 3 + 2}s`,
        opacity: Math.random() * 0.5 + 0.3,
      }));
      setStars(newStars);
    } else {
      setStars([]);
    }
  }, [theme]);

  if (theme !== 'space') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            backgroundColor: '#fbbf24',
            opacity: star.opacity,
            animationDelay: star.delay,
            animationDuration: star.duration,
            boxShadow: `0 0 ${parseFloat(star.size) * 2}px #fbbf24`,
          }}
        />
      ))}
      {/* Shooting stars */}
      <div className="absolute top-10 left-[20%] animate-shoot-star" style={{ animationDelay: '2s' }}>
        <div className="w-[100px] h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
      </div>
      <div className="absolute top-[30%] left-[60%] animate-shoot-star" style={{ animationDelay: '5s' }}>
        <div className="w-[120px] h-[2px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
      </div>
      <div className="absolute top-[60%] left-[10%] animate-shoot-star" style={{ animationDelay: '8s' }}>
        <div className="w-[80px] h-[1.5px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
      </div>
      <div className="absolute top-[80%] left-[70%] animate-shoot-star" style={{ animationDelay: '11s' }}>
        <div className="w-[90px] h-[2px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
      </div>
    </div>
  );
};

// Helper function to convert backend user to frontend User type
const convertBackendUser = (backendUser: ApiUser): User => ({
  id: String(backendUser.id),
  name: backendUser.full_name || backendUser.email.split('@')[0],
  email: backendUser.email,
  role: (backendUser.role === 'super_admin' ? 'admin' : backendUser.role) as any,
  status: backendUser.account_status === 'active' ? 'active' : 
          backendUser.account_status === 'suspended' ? 'suspended' : 'inactive',
  phone: backendUser.mobile_number || 'N/A',
  createdAt: backendUser.date_joined?.split('T')[0] || new Date().toISOString().split('T')[0],
  lastLogin: backendUser.last_login || backendUser.last_active || new Date().toISOString(),
});

export default function UserManagement() {
  const { colors, theme } = useThemeColors();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    admins: 0,
  });
  
  const itemsPerPage = 5;
  
  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await userAPI.getAllUsers()) as UsersListResponse | ApiUser[];
      
      let usersList: ApiUser[] = [];
      
      // Handle different response formats
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response && 'users' in response && Array.isArray(response.users)) {
        usersList = response.users;
      } else if (response && 'results' in response && Array.isArray((response as any).results)) {
        usersList = (response as any).results;
      }
      
      const convertedUsers = usersList.map(convertBackendUser);
      setUsers(convertedUsers);
      
      // Calculate stats from fetched users
      setStats({
        total: convertedUsers.length,
        active: convertedUsers.filter(u => u.status === 'active').length,
        suspended: convertedUsers.filter(u => u.status === 'suspended').length,
        admins: convertedUsers.filter(u => u.role === 'admin').length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const statsData = (await userAPI.getUserStats()) as UserStatsResponse;
      
      if (statsData) {
        setStats({
          total: statsData.total_users ?? stats.total,
          active: statsData.active_users ?? stats.active,
          suspended: statsData.suspended_users ?? stats.suspended,
          admins: (statsData.by_role?.admin ?? 0) + (statsData.by_role?.super_admin ?? 0),
        });
      }
    } catch (err) {
      // Stats already set from users list, so this is optional
    }
  };
  
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);
  
  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handlers
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };
  
  const handleDelete = async (user: User) => {
    // Delete functionality requires backend implementation. Use ban/suspend instead.
  };
  
  const handleToggleStatus = async (user: User) => {
    const userId = parseInt(user.id);
    try {
      if (user.status === 'active') {
        await userAPI.suspendUser(userId, 30, 'Suspended by admin');
      } else if (user.status === 'suspended') {
        await userAPI.unsuspendUser(userId);
      }
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      // Error handling without console logs
    }
  };
  
  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (editingUser) {
        const userId = parseInt(editingUser.id);
        await userAPI.updateUserByAdmin(userId, {
          full_name: userData.name,
          email: userData.email,
          mobile_number: userData.phone,
          role: userData.role,
        });
      }
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      // Error handling without console logs
    }
  };
  
  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Phone', 'Created At', 'Last Login'];
    const csvData = filteredUsers.map(user => [
      user.name,
      user.email,
      user.role,
      user.status,
      user.phone,
      user.createdAt,
      new Date(user.lastLogin).toLocaleDateString(),
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center relative" style={{ background: colors.background.primary }}>
        <StarField />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" style={{ borderColor: colors.primary.main }}></div>
          <p className="mt-4" style={{ color: colors.text.secondary }}>Loading users...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 min-h-screen relative" style={{ background: colors.background.primary }}>
        <StarField />
        <div className="rounded-xl p-6 text-center relative z-10" style={{ background: colors.surface.primary, border: `1px solid ${colors.border.primary}` }}>
          <p style={{ color: colors.status.error }}>Error: {error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ background: colors.primary.main, color: colors.primary.contrast }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 min-h-screen relative" style={{ background: colors.background.primary }}>
      {/* Star field for space theme */}
      <StarField />
      
      {/* Main content with higher z-index */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>User Management</h1>
          <p style={{ color: colors.text.secondary }}>Manage your users, roles, and permissions</p>
        </div>
        
        {/* Stats and Filters Component */}
        <StatsBar
          stats={stats}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onAddUser={() => { setEditingUser(null); setShowModal(true); }}
          onExport={handleExport}
        />
        
        {/* Users Table Component */}
        <UsersTable
          users={paginatedUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 mt-4 rounded-xl"
            style={{ background: colors.surface.primary, border: `1px solid ${colors.border.primary}` }}>
            <p style={{ color: colors.text.secondary }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                style={{ 
                  background: colors.surface.secondary,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.primary}`
                }}>
                Previous
              </button>
              <span className="px-4 py-1 rounded-lg" style={{ background: colors.primary.main, color: colors.primary.contrast }}>
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                style={{ 
                  background: colors.surface.secondary,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.primary}`
                }}>
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* User Modal Component */}
        {showModal && (
          <UserModal user={editingUser} onClose={() => { setShowModal(false); setEditingUser(null); }} onSave={handleSaveUser} />
        )}
      </div>
    </div>
  );
}