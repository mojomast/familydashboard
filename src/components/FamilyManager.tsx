import React, { useEffect, useState } from 'react';
import type { UserProfile } from '../types';
import { createDAL } from '../lib/dal';
import { getDefaultPermissions } from '../types';

const colorOptions = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
];

const avatarOptions = [
  '👨', '👩', '👧', '👦', '👶', '🧑', '👨‍👩‍👧', '👨‍👩‍👧‍👦',
  '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🌟', '🚀', '🎨', '⚽', '🎵', '📚', '🍕', '🎮'
];

export const FamilyManager: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const dal = createDAL();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const list = await dal.getUserProfiles();
      setProfiles(list);
    } catch (err) {
      console.warn('Failed to load profiles:', err);
    }
  };

  const handleCreate = async (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'lastActive'>) => {
    try {
      const newProfile = await dal.createUserProfile(profileData);
      setProfiles(prev => [...prev, newProfile]);
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create profile:', err);
    }
  };

  const handleUpdate = async (profile: UserProfile) => {
    try {
      const updated = await dal.updateUserProfile(profile.id, profile);
      setProfiles(prev => prev.map(p => p.id === profile.id ? updated : p));
      setEditing(null);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family member?')) return;

    try {
      await dal.deleteUserProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete profile:', err);
    }
  };

  const ProfileForm: React.FC<{
    profile?: UserProfile | null;
    onSave: (data: Omit<UserProfile, 'id' | 'createdAt' | 'lastActive'>) => void;
    onCancel: () => void;
  }> = ({ profile, onSave, onCancel }) => {
    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [avatar, setAvatar] = useState(profile?.avatar || '👤');
    const [color, setColor] = useState(profile?.color || colorOptions[0]);
    const [role, setRole] = useState<'parent' | 'child' | 'guest'>(profile?.role || 'child');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        name,
        email: email || undefined,
        avatar,
        color,
        role,
        permissions: getDefaultPermissions(role),
        preferences: profile?.preferences || {
          notifications: true,
          theme: 'light',
          weekStart: 'monday'
        }
      });
    };

    return (
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Avatar</label>
          <div className="avatar-selector">
            {avatarOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`avatar-option ${avatar === option ? 'selected' : ''}`}
                onClick={() => setAvatar(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Color</label>
          <div className="color-selector">
            {colorOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`color-option ${color === option ? 'selected' : ''}`}
                style={{ backgroundColor: option }}
                onClick={() => setColor(option)}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'parent' | 'child' | 'guest')}
            className="form-select"
          >
            <option value="parent">Parent</option>
            <option value="child">Child</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="family-manager">
      <div className="section-header">
        <h2>Family Members</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary"
        >
          Add Family Member
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-state">
          <p>No family members added yet.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-secondary"
          >
            Add Your First Family Member
          </button>
        </div>
      ) : (
        <div className="profiles-grid">
          {profiles.map((profile) => (
            <div key={profile.id} className="profile-card">
              <div className="profile-header">
                <div
                  className="profile-avatar"
                  style={{ backgroundColor: profile.color + '20', color: profile.color }}
                >
                  {profile.avatar}
                </div>
                <div className="profile-info">
                  <h3>{profile.name}</h3>
                  <span className="profile-role">{profile.role}</span>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  onClick={() => setEditing(profile)}
                  className="btn-sm btn-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="btn-sm btn-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Family Member</h3>
            <ProfileForm
              onSave={handleCreate}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Family Member</h3>
            <ProfileForm
              profile={editing}
              onSave={(data) => handleUpdate({ ...editing!, ...data })}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};