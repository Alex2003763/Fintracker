import React, { useState, useRef } from 'react';
import { User } from '../types';
import { UserIcon, UploadIcon, SettingsIcon } from './icons';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        onUpdateUser({ ...user, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setUsernameMessage({ text: 'Username must be at least 3 characters.', type: 'error' });
      return;
    }
    onUpdateUser({ ...user, username });
    setUsernameMessage({ text: 'Username updated successfully!', type: 'success' });
    setTimeout(() => setUsernameMessage({ text: '', type: '' }), 3000);
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
  };

  const inputClasses = "w-full px-4 py-2 rounded-lg bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors";
  const buttonClasses = "px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors";

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-6 rounded-lg shadow space-y-8 max-w-2xl mx-auto transition-colors">
      <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Account Information</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Profile Picture</h2>
        <div className="flex items-center space-x-6 p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg">
          <div className="w-24 h-24 rounded-full bg-[rgb(var(--color-card-muted-rgb))] flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-[rgb(var(--color-text-muted-rgb))]" />
            )}
          </div>
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
              className={`flex items-center ${buttonClasses}`}
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Image
            </button>
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-2">Square image, &lt; 2MB</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Username</h2>
        <form onSubmit={handleUpdateUsername} className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClasses}
          />
          {usernameMessage.text && (
            <p className={`text-sm ${usernameMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {usernameMessage.text}
            </p>
          )}
          <button type="submit" className={buttonClasses}>
            Save Username
          </button>
        </form>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">App Settings & Data</h2>
        <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg">
            <button
                onClick={() => setActiveItem('Settings')}
                className="flex items-center justify-between w-full text-left text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] p-2 -m-2 rounded-md transition-colors"
            >
                <div className="flex items-center">
                    <SettingsIcon className="h-6 w-6 mr-3 text-[rgb(var(--color-text-muted-rgb))]"/>
                    <div>
                        <p className="font-semibold">App Settings</p>
                        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Change theme, manage data, and sign out.</p>
                    </div>
                </div>
                <span className="text-lg font-bold text-[rgb(var(--color-text-muted-rgb))]">&gt;</span>
            </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Change Password</h2>
        <form onSubmit={handleChangePassword} className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg space-y-3">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClasses}
            required
          />
          <input
            type="password"
            placeholder="New Password (min. 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClasses}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className={inputClasses}
            required
          />
          {passwordMessage.text && (
            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {passwordMessage.text}
            </p>
          )}
          <button type="submit" className={buttonClasses}>
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountPage;