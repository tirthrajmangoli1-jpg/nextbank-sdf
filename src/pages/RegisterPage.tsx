import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Landmark, Lock, Mail, Phone, ShieldCheck, User, X } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  calculatePasswordStrength,
  RegisterFormData,
  registerSchema,
} from '../utils/validators';

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const strength = calculatePasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerAuth(data);
      success(
        'Account Registered!',
        'Welcome to NextBank. A demo Savings Account with ₹50,000 has been set up for you.'
      );
      navigate('/dashboard');
    } catch (err) {
      toastError(
        'Registration Failed',
        err instanceof Error ? err.message : 'Please check your details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-navy-950 dark:to-slate-950 text-slate-900 dark:text-slate-100 antialiased py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 to-teal-400 items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-2">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Open a <span className="text-brand-600 dark:text-brand-400">NextBank</span> Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instant digital simulated account setup with ₹50,000 demo welcome credit.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Legal Name"
              placeholder="e.g. Aditya Sharma"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. aditya@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div className="space-y-1.5">
              <Input
                label="Create Password"
                type="password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                showPasswordToggle
                error={errors.password?.message}
                {...register('password', {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
              />

              {/* Live Password Strength Meter */}
              {passwordValue && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Password Strength:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${Math.max(10, strength.score)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                    {strength.checks.map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1 ${
                          c.passed ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
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
              label="Confirm Password"
              type="password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              showPasswordToggle
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-4 font-bold"
            >
              Create Account
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Demo only. No real money or banking credentials involved.</span>
        </div>
      </div>
    </div>
  );
};
