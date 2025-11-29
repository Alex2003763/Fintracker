import React, { useState, useRef } from 'react';
import { User } from '../types';
import { UserIcon, SettingsIcon } from './icons';
import Card, { CardHeader, CardTitle, CardContent } from './Card';

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
      if (file.size > 10 * 1024 * 1024) {
        setUsernameMessage({ text: 'File size must be less than 10MB.', type: 'error' });
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
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <header className="text-center pb-6 border-b border-[rgb(var(--color-border-rgb))]">
        <div className="inline-flex items-center justify-center p-3 bg-primary-subtle rounded-full mb-4">
          <UserIcon className="w-8 h-8 text-[rgb(var(--color-primary-rgb))]" />
        </div>
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Account Settings</h1>
        <p className="text-[rgb(var(--color-text-muted-rgb))] mt-2">Manage your profile and security preferences</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[rgb(var(--color-card-rgb))] shadow-lg bg-[rgb(var(--color-card-muted-rgb))]">
                  {avatar ? (
                    <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-16 h-16 text-[rgb(var(--color-text-muted-rgb))]" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading.avatar}
                  className="absolute bottom-0 right-0 p-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-full shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors disabled:opacity-50"
                  aria-label="Upload new profile picture"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              {isLoading.avatar && <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Uploading...</p>}
            </div>

            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading.username}
                  className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all"
                  placeholder="Enter your username"
                />
              </div>
              {usernameMessage.text && (
                <p className={`text-sm ${usernameMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} role="alert">
                  {usernameMessage.text}
                </p>
              )}
              <button
                type="submit"
                disabled={isLoading.username}
                className="w-full px-4 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-colors font-medium"
              >
                {isLoading.username ? 'Updating...' : 'Update Username'}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="current-password" className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading.password}
                    className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading.password}
                    className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={isLoading.password}
                    className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
                {passwordMessage.text && (
                  <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} role="alert">
                    {passwordMessage.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isLoading.password}
                  className="w-full px-4 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading.password ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </CardContent>
          </Card>

          <button
            onClick={() => setActiveItem('Settings')}
            className="w-full flex items-center justify-between p-4 bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:border-[rgb(var(--color-primary-rgb))] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary-subtle rounded-lg group-hover:bg-[rgb(var(--color-primary-rgb))] group-hover:text-white transition-colors">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[rgb(var(--color-text-rgb))]">App Preferences</p>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Theme, notifications, and more</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;