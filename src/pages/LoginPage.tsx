import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Landmark, Lock, Mail, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD_RAW } from '../db/seedData';
import { LoginFormData, loginSchema } from '../utils/validators';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setFormError(null);
    try {
      await login(data);
      success('Welcome Back', 'Securely logged in to NextBank demo environment.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setFormError(msg);
      toastError('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setValue('email', DEMO_USER_EMAIL);
    setValue('password', DEMO_USER_PASSWORD_RAW);
    setFormError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-navy-950 dark:to-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 to-teal-400 items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-2">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sign in to <span className="text-brand-600 dark:text-brand-400">NextBank</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive simulated banking platform for demonstration & learning.
          </p>
        </div>

        {/* Quick Demo Credentials Pill */}
        <div className="p-3.5 rounded-2xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2 text-brand-900 dark:text-brand-300">
            <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
            <div>
              <p className="font-bold">Pre-seeded Demo User</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {DEMO_USER_EMAIL}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillDemo}
            className="text-xs font-bold border-brand-300 dark:border-brand-700 bg-white dark:bg-navy-900 text-brand-700 dark:text-brand-300 hover:bg-brand-50"
          >
            Use Demo Account
          </Button>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. demo@novabank.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              showPasswordToggle
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-navy-700 dark:bg-navy-900"
                  {...register('rememberMe')}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Remember me</span>
              </label>

              <span className="text-xs text-slate-400 cursor-not-allowed">
                Forgot password?
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Register here
            </Link>
          </div>
        </Card>

        {/* Security / Demo Disclaimer Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Demo only. Passwords hashed client-side for simulation purposes.</span>
        </div>
      </div>
    </div>
  );
};
