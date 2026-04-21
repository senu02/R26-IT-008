'use client';

import React, { useState } from 'react';
import { useThemeColors } from '@/context/adminTheme';
import { Search, Plus, Download, UserPlus, UserCheck, UserX, Shield } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => {
  const { colors } = useThemeColors();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="rounded-xl p-6 transition-all duration-200 cursor-pointer"
      style={{
        background: colors.surface.primary,
        border: `1px solid ${colors.border.primary}`,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
            {value}
          </p>
        </div>
        <div
          className="rounded-full p-3"
          style={{ background: `${color}20`, color: color }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

interface StatsBarProps {
  stats: {
    total: number;
    active: number;
    suspended: number;
    admins: number;
  };
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onAddUser: () => void;
  onExport: () => void;
}

export default function StatsBar({
  stats,
  searchTerm,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  onAddUser,
  onExport,
}: StatsBarProps) {
  const { colors } = useThemeColors();
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);
  
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={UserPlus}
          color={colors.primary.main}
        />
        <StatCard
          title="Active Users"
          value={stats.active}
          icon={UserCheck}
          color={colors.status.success}
        />
        <StatCard
          title="Suspended"
          value={stats.suspended}
          icon={UserX}
          color={colors.status.error}
        />
        <StatCard
          title="Administrators"
          value={stats.admins}
          icon={Shield}
          color={colors.accent.purple}
        />
      </div>
      
      {/* Filters and Actions */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{
          background: colors.surface.primary,
          border: `1px solid ${colors.border.primary}`,
        }}
      >
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                size={18}
                style={{ color: colors.text.tertiary }}
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: colors.surface.secondary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.primary.main}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.border.primary}
              />
            </div>
          </div>
          
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
            style={{
              background: colors.surface.secondary,
              border: `1px solid ${colors.border.primary}`,
              color: colors.text.primary,
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
          </select>
          
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer"
            style={{
              background: colors.surface.secondary,
              border: `1px solid ${colors.border.primary}`,
              color: colors.text.primary,
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          
          {/* Action Buttons */}
          <button
            onClick={onAddUser}
            onMouseEnter={() => setIsAddHovered(true)}
            onMouseLeave={() => setIsAddHovered(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: isAddHovered ? colors.primary.dark : colors.primary.main,
              color: colors.primary.contrast,
              transform: isAddHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <Plus size={18} />
            Add User
          </button>
          
          <button
            onClick={onExport}
            onMouseEnter={() => setIsExportHovered(true)}
            onMouseLeave={() => setIsExportHovered(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              background: colors.surface.secondary,
              border: `1px solid ${colors.border.primary}`,
              color: colors.text.primary,
              transform: isExportHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>
    </>
  );
}