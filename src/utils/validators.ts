import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number')
      .optional()
      .or(z.literal('')),
    address: z.string().max(120).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const beneficiarySchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60),
    accountNumber: z
      .string()
      .regex(/^\d{9,18}$/, 'Account number must be 9 to 18 digits'),
    confirmAccountNumber: z.string(),
    ifscCode: z
      .string()
      .toUpperCase()
      .regex(ifscRegex, 'Invalid IFSC code (e.g. NEXT0001001 or HDFC0000128)'),
    bankName: z.string().min(2, 'Bank name is required'),
    accountType: z.enum(['SAVINGS', 'CURRENT']),
  })
  .refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: 'Account numbers do not match',
    path: ['confirmAccountNumber'],
  });

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

export const transferSchema = z
  .object({
    sourceAccountId: z.string().min(1, 'Please select a source account'),
    transferMode: z.enum(['SAVED', 'NEW']),
    beneficiaryId: z.string().optional(),
    recipientName: z.string().optional(),
    recipientAccount: z.string().optional(),
    recipientIfsc: z.string().optional(),
    amount: z
      .number({ invalid_type_error: 'Please enter a valid amount' })
      .positive('Amount must be greater than zero')
      .min(10, 'Minimum transfer amount is ₹10.00'),
    remarks: z.string().min(1, 'Please add a brief remark or note').max(60),
    category: z.string().default('Transfer'),
    scheduledDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.transferMode === 'SAVED') {
        return !!data.beneficiaryId;
      }
      return (
        !!data.recipientName &&
        !!data.recipientAccount &&
        !!data.recipientIfsc &&
        ifscRegex.test(data.recipientIfsc.toUpperCase())
      );
    },
    {
      message: 'Please complete all recipient details',
      path: ['beneficiaryId'],
    }
  );

export type TransferFormData = z.infer<typeof transferSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(150),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Calculates password strength score (0 to 100) and criteria met.
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: 'At least 8 characters', passed: password.length >= 8 },
    { label: 'Contains uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', passed: /[a-z]/.test(password) },
    { label: 'Contains a number', passed: /[0-9]/.test(password) },
    { label: 'Contains a special character', passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = (passedCount / checks.length) * 100;

  let label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong' = 'Very Weak';
  let color = 'bg-red-500';

  if (passedCount <= 1) {
    label = 'Very Weak';
    color = 'bg-red-500';
  } else if (passedCount === 2) {
    label = 'Weak';
    color = 'bg-orange-500';
  } else if (passedCount === 3 || passedCount === 4) {
    label = 'Medium';
    color = 'bg-amber-500';
  } else if (passedCount === 5 && password.length >= 10) {
    label = 'Very Strong';
    color = 'bg-emerald-500';
  } else {
    label = 'Strong';
    color = 'bg-teal-500';
  }

  return { score, label, color, checks };
}
