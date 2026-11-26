import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  Download,
  Lock,
  Moon,
  RotateCcw,
  Sliders,
  Sun,
  User,
  WifiOff,
  X,
} from 'lucide-react';
import { authApi } from '../api';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useBank } from '../context/BankContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { exportDatabaseJson } from '../db';
import { formatPaiseToInr } from '../utils/formatCurrency';
import {
  calculatePasswordStrength,
  ChangePasswordFormData,
  changePasswordSchema,
  ProfileFormData,
  profileSchema,
} from '../utils/validators';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const {
    isNetworkFailureSimulated,
    toggleNetworkSimulation,
    resetDemoData,
  } = useBank();
  const { theme, toggleTheme } = useTheme();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'PREFERENCES' | 'DEMO'>(
    'PROFILE'
  );
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [dailyLimitPaise, setDailyLimitPaise] = useState(
    user?.settings?.dailyTransferLimitPaise || 5000000
  );

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '9876543210',
      address: user?.address || '',
    },
  });

  // Password Form
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const passwordStrength = calculatePasswordStrength(newPasswordVal);

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const updated = await authApi.updateProfile(data);
      updateUser(updated);
      success('Profile Updated', 'Your profile details have been saved.');
    } catch (err) {
      toastError('Update Failed', err instanceof Error ? err.message : 'Please check details.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPasswordForm();
      setNewPasswordVal('');
      success('Password Changed', 'Your security password has been updated.');
    } catch (err) {
      toastError(
        'Password Change Failed',
        err instanceof Error ? err.message : 'Current password incorrect.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateLimit = async (newValPaise: number) => {
    setDailyLimitPaise(newValPaise);
    try {
      await authApi.updateSettings({ dailyTransferLimitPaise: newValPaise });
      success('Transfer Limit Updated', `Daily limit set to ${formatPaiseToInr(newValPaise)}.`);
    } catch {
      toastError('Failed to save limit', 'Could not update transfer limit.');
    }
  };

  const handleExportDataJson = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NextBank-Data-Export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Data Exported', 'Full application database exported as JSON.');
  };

  const handleConfirmReset = async () => {
    await resetDemoData();
    setIsResetModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your account profile, security credentials, daily limits, and demo simulations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-navy-900 rounded-2xl border border-slate-200/80 dark:border-navy-800 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SECURITY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'SECURITY'
              ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PREFERENCES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'PREFERENCES'
              ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Preferences & Limits</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DEMO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'DEMO'
              ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Demo Controls</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'PROFILE' && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-navy-800">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-brand-500/20">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.name || 'Customer Name'}
              </h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
            <Input
              label="Full Name"
              error={profileErrors.name?.message}
              {...registerProfile('name')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address (Locked)"
                value={user?.email || ''}
                disabled
                helperText="Primary email cannot be modified in demo mode."
              />
              <Input
                label="Mobile Phone"
                error={profileErrors.phone?.message}
                {...registerProfile('phone')}
              />
            </div>

            <Input
              label="Registered Address"
              error={profileErrors.address?.message}
              {...registerProfile('address')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdatingProfile}
                className="text-xs font-bold"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'SECURITY' && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Change Password
            </h2>
            <p className="text-xs text-slate-400">
              Update your account login password. Client-side hashed for this demo.
            </p>
          </div>

          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              showPasswordToggle
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />

            <div className="space-y-1.5">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••••••"
                showPasswordToggle
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword', {
                  onChange: (e) => setNewPasswordVal(e.target.value),
                })}
              />

              {newPasswordVal && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Password Strength:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${Math.max(10, passwordStrength.score)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                    {passwordStrength.checks.map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1 ${
                          c.passed ? 'text-emerald-500 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {c.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              showPasswordToggle
              error={passwordErrors.confirmNewPassword?.message}
              {...registerPassword('confirmNewPassword')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isChangingPassword}
                className="text-xs font-bold"
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Preferences & Limits */}
      {activeTab === 'PREFERENCES' && (
        <div className="space-y-6">
          {/* Theme Card */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Interface Appearance
            </h2>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-brand-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Dark Mode Theme
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Switch between sleek dark mode and crisp light fintech theme.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="text-xs">
                Toggle to {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
            </div>
          </Card>

          {/* Daily Transfer Limit */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Transfer Limit
                </h2>
                <p className="text-xs text-slate-400">
                  Maximum total debit allowed across accounts per day.
                </p>
              </div>
              <Badge variant="brand" size="md">
                {formatPaiseToInr(dailyLimitPaise)} / day
              </Badge>
            </div>

            <div className="space-y-2 pt-2">
              <input
                type="range"
                min="1000000" // 10,000 INR
                max="20000000" // 2,00,000 INR
                step="500000" // 5,000 INR
                value={dailyLimitPaise}
                onChange={(e) => handleUpdateLimit(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Min: ₹10,000</span>
                <span>Default: ₹50,000</span>
                <span>Max: ₹2,00,000</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Demo Controls */}
      {activeTab === 'DEMO' && (
        <div className="space-y-6">
          {/* Network Failure Simulation Toggle */}
          <Card className="p-6 space-y-4 border-amber-500/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Simulate Network Failure
                    </h3>
                    {isNetworkFailureSimulated && (
                      <Badge variant="warning" size="sm">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    When enabled, API endpoints will randomly throw NetworkErrors to demonstrate how NextBank handles connectivity drops and displays retry UI.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isNetworkFailureSimulated}
                  onChange={(e) => toggleNetworkSimulation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </Card>

          {/* Export JSON and Reset Data */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Data Management & Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Export your simulated state or restore initial seed data anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export JSON */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Export My Data (JSON)
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Download a full JSON dump of your current accounts, beneficiaries, and transaction history.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleExportDataJson}
                  className="text-xs w-full"
                >
                  Export Data JSON
                </Button>
              </div>

              {/* Reset Data */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-3">
                <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Reset Demo Data
                </h4>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 leading-relaxed">
                  Clear all mutations and restore the factory seed data (2 accounts, 60+ transactions, 4 beneficiaries).
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-xs w-full"
                >
                  Reset to Seed Data
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsResetModalOpen(false)}
          title="Reset All Demo Data?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              This will erase all custom transfers, newly added beneficiaries, and settings changes, and restore the original seed data.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmReset}
                className="flex-1 text-xs font-bold"
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
