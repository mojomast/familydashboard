import React, { useEffect, useState } from 'react';
import type { UserProfile } from '../types';
import { createDAL } from '../lib/dal';

interface PermissionItem {
  key: keyof UserProfile['permissions'];
  label: string;
  description: string;
  roleDefaults: {
    parent: boolean;
    child: boolean;
    guest: boolean;
  };
}

const permissionItems: PermissionItem[] = [
  {
    key: 'canCreateTasks',
    label: 'Create Tasks',
    description: 'Can create new tasks and events',
    roleDefaults: { parent: true, child: true, guest: false }
  },
  {
    key: 'canEditAllTasks',
    label: 'Edit All Tasks',
    description: 'Can edit tasks created by anyone',
    roleDefaults: { parent: true, child: false, guest: false }
  },
  {
    key: 'canDeleteTasks',
    label: 'Delete Tasks',
    description: 'Can delete tasks and events',
    roleDefaults: { parent: true, child: false, guest: false }
  },
  {
    key: 'canAssignTasks',
    label: 'Assign Tasks',
    description: 'Can assign tasks to family members',
    roleDefaults: { parent: true, child: false, guest: false }
  },
  {
    key: 'canManageUsers',
    label: 'Manage Users',
    description: 'Can add/edit/remove family members',
    roleDefaults: { parent: true, child: false, guest: false }
  },
  {
    key: 'canViewAllTasks',
    label: 'View All Tasks',
    description: 'Can see all tasks, not just assigned ones',
    roleDefaults: { parent: true, child: true, guest: false }
  },
  {
    key: 'canEditSettings',
    label: 'Edit Settings',
    description: 'Can change app settings and preferences',
    roleDefaults: { parent: true, child: false, guest: false }
  }
];

export const PermissionsManager: React.FC = () => {
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const dal = createDAL();

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const members = await dal.getUserProfiles();
      setFamilyMembers(members);
      if (members.length > 0 && !selectedMember) {
        setSelectedMember(members[0]);
      }
    } catch (err) {
      console.warn('Failed to load family members:', err);
    }
  };

  const updatePermission = async (member: UserProfile, permission: keyof UserProfile['permissions'], value: boolean) => {
    try {
      const updatedPermissions = {
        ...member.permissions,
        [permission]: value
      };
      const updatedMember = await dal.updateUserProfile(member.id, {
        permissions: updatedPermissions
      });
      setFamilyMembers(prev => prev.map(m => m.id === member.id ? updatedMember : m));
      if (selectedMember?.id === member.id) {
        setSelectedMember(updatedMember);
      }
    } catch (err) {
      console.error('Failed to update permission:', err);
    }
  };

  const resetToDefaults = async (member: UserProfile) => {
    try {
      const defaultPerms = permissionItems.reduce((acc, item) => ({
        ...acc,
        [item.key]: item.roleDefaults[member.role]
      }), {} as UserProfile['permissions']);

      const updatedMember = await dal.updateUserProfile(member.id, {
        permissions: defaultPerms
      });
      setFamilyMembers(prev => prev.map(m => m.id === member.id ? updatedMember : m));
      if (selectedMember?.id === member.id) {
        setSelectedMember(updatedMember);
      }
    } catch (err) {
      console.error('Failed to reset permissions:', err);
    }
  };

  if (familyMembers.length === 0) {
    return (
      <div className="permissions-manager">
        <h2>Family Permissions</h2>
        <p>No family members added yet. Add family members first to manage their permissions.</p>
      </div>
    );
  }

  return (
    <div className="permissions-manager">
      <div className="section-header">
        <h2>Family Permissions</h2>
        <p>Customize what each family member can do in the app</p>
      </div>

      <div className="permissions-layout">
        {/* Family Member Selector */}
        <div className="member-selector">
          <h3>Family Members</h3>
          <div className="member-list">
            {familyMembers.map(member => (
              <button
                key={member.id}
                className={`member-item ${selectedMember?.id === member.id ? 'active' : ''}`}
                onClick={() => setSelectedMember(member)}
              >
                <div className="member-avatar" style={{ backgroundColor: member.color + '20', color: member.color }}>
                  {member.avatar}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="permissions-panel">
          {selectedMember && (
            <>
              <div className="panel-header">
                <h3>Permissions for {selectedMember.name}</h3>
                <button
                  onClick={() => resetToDefaults(selectedMember)}
                  className="btn-secondary"
                >
                  Reset to {selectedMember.role} defaults
                </button>
              </div>

              <div className="permissions-grid">
                {permissionItems.map(item => (
                  <div key={item.key} className="permission-item">
                    <div className="permission-info">
                      <label className="permission-label">
                        <strong>{item.label}</strong>
                      </label>
                      <p className="permission-description">{item.description}</p>
                    </div>
                    <div className="permission-control">
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={selectedMember.permissions[item.key]}
                          onChange={(e) => updatePermission(selectedMember, item.key, e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="permissions-summary">
                <h4>Current Role: {selectedMember.role}</h4>
                <p>These permissions determine what {selectedMember.name} can do in the Family Dashboard.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};