import React, { useState, useRef } from 'react';
import { User } from '../types';
import { UserIcon, UploadIcon, SettingsIcon, CheckCircleIcon } from './icons';

interface AccountPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onChangePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  setActiveItem: (item: string) => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onChangePassword, setActiveItem }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [usernameMessage, setUsernameMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState({ avatar: false, username: false, password: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setUsernameMessage({ text: 'File size must be less than 2MB.', type: 'error' });
        return;
      }

      setIsLoading(prev => ({ ...prev, avatar: true }));

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        onUpdateUser({ ...user, avatar: base64String });
        setIsLoading(prev => ({ ...prev, avatar: false }));
      };
      reader.onerror = () => {
        setUsernameMessage({ text: 'Failed to upload image. Please try again.', type: 'error' });
        setIsLoading(prev => ({ ...prev, avatar: false }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMessage({ text: '', type: '' });

    if (username.length < 3) {
      setUsernameMessage({ text: 'Username must be at least 3 characters.', type: 'error' });
      return;
    }

    if (username === user.username) {
      setUsernameMessage({ text: 'Username is already up to date.', type: 'error' });
      return;
    }

    setIsLoading(prev => ({ ...prev, username: true }));

    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onUpdateUser({ ...user, username });
      setUsernameMessage({ text: 'Username updated successfully!', type: 'success' });
      setTimeout(() => setUsernameMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setUsernameMessage({ text: 'Failed to update username. Please try again.', type: 'error' });
    } finally {
      setIsLoading(prev => ({ ...prev, username: false }));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setIsLoading(prev => ({ ...prev, password: true }));

    try {
      const success = await onChangePassword(currentPassword, newPassword);
      if (success) {
        setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPasswordMessage({ text: '', type: '' }), 3000);
      } else {
        setPasswordMessage({ text: 'Current password is incorrect or an error occurred.', type: 'error' });
      }
    } catch (error) {
      setPasswordMessage({ text: 'An error occurred while changing password. Please try again.', type: 'error' });
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }));
    }
  };

  return (
    <div className="bg-[rgb(var(--color-background-rgb))] p-6 space-y-8 max-w-3xl mx-auto">
      {/* Enhanced Header */}
      <div className="text-center pb-8 border-b border-[rgb(var(--color-border-rgb))]">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-2xl">
            <UserIcon className="w-8 h-8 text-[rgb(var(--color-primary-rgb))]" />
          </div>
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-3"> Account Settings</h1>
        </div>
       
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Picture Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))] mb-4">Profile Picture</h2>
            <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 flex items-center justify-center overflow-hidden border-2 border-[rgb(var(--color-border-rgb))] shadow-sm">
                    {avatar ? (
                      <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-[rgb(var(--color-text-muted-rgb))]" />
                    )}
                  </div>
                  {isLoading.avatar && (
                    <div className="absolute inset-0 bg-[rgb(var(--color-card-rgb))]/80 rounded-2xl flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--color-primary-rgb))]"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading.avatar}
                      className="w-full px-4 py-3 text-sm bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading.avatar ? 'Uploading...' : 'Upload New Picture'}
                    </button>
                  </div>
                  <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">JPG, PNG or GIF. Max size 2MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Username Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))] mb-4">Username</h2>
            <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">
                    Current Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading.username}
                    className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200 placeholder:text-[rgb(var(--color-text-muted-rgb))]"
                    placeholder="Enter your username"
                  />
                </div>
                {usernameMessage.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    usernameMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {usernameMessage.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading.username}
                  className="w-full px-4 py-3 text-sm bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading.username ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[rgb(var(--color-primary-text-rgb))] opacity-70"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Username'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* App Settings Navigation */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">App Preferences</h2>
        <button
          onClick={() => setActiveItem('Settings')}
          className="w-full group bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] p-6 hover:shadow-md hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-xl">
                <SettingsIcon className="w-6 h-6 text-[rgb(var(--color-primary-rgb))]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">App Settings</p>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Themes, notifications, and preferences</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Password Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Security</h2>
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading.password}
                className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200 placeholder:text-[rgb(var(--color-text-muted-rgb))]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading.password}
                className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200 placeholder:text-[rgb(var(--color-text-muted-rgb))]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading.password}
                className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200 placeholder:text-[rgb(var(--color-text-muted-rgb))]"
              />
            </div>
            {passwordMessage.text && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordMessage.text}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading.password}
              className="w-full px-4 py-3 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading.password ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white opacity-70"></div>
                  <span>Changing Password...</span>
                </div>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;