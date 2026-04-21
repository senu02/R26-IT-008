'use client';

import React, { useState } from 'react';
import { useThemeColors } from '@/context/adminTheme';
import { XCircle } from 'lucide-react';
import type { User } from './UsersTable';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

export default function UserModal({ user, onClose, onSave }: UserModalProps) {
  const { colors } = useThemeColors();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    phone: user?.phone || '',
  });
  const [isCancelHovered, setIsCancelHovered] = useState(false);
  const [isSaveHovered, setIsSaveHovered] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-xl max-w-md w-full animate-in fade-in zoom-in duration-200"
        style={{ background: colors.surface.primary, border: `1px solid ${colors.border.primary}` }}
        onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: colors.border.primary }}>
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors">
            <XCircle size={20} style={{ color: colors.text.secondary }} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>Full Name</label>
            <input type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all"
              style={{ background: colors.surface.secondary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.primary.main}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.border.primary} />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>Email</label>
            <input type="email" required value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all"
              style={{ background: colors.surface.secondary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.primary.main}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.border.primary} />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>Phone Number</label>
            <input type="tel" value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all"
              style={{ background: colors.surface.secondary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.primary.main}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.border.primary} />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>Role</label>
            <select value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all cursor-pointer"
              style={{ background: colors.surface.secondary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              onMouseEnter={() => setIsCancelHovered(true)}
              onMouseLeave={() => setIsCancelHovered(false)}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
              style={{ 
                background: isCancelHovered ? colors.surface.tertiary : colors.surface.secondary,
                border: `1px solid ${colors.border.primary}`,
                color: colors.text.primary 
              }}>
              Cancel
            </button>
            <button type="submit"
              onMouseEnter={() => setIsSaveHovered(true)}
              onMouseLeave={() => setIsSaveHovered(false)}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
              style={{ 
                background: isSaveHovered ? colors.primary.dark : colors.primary.main,
                color: colors.primary.contrast,
                transform: isSaveHovered ? 'scale(1.05)' : 'scale(1)'
              }}>
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}