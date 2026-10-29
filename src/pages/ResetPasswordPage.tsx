import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import { Building2, ArrowLeft, KeyRound } from 'lucide-react';
import axios from 'axios';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast({
        title: 'Missing Reset Token',
        message: 'Invalid password reset URL. Please request a new recovery link.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/v1/auth/reset-password', {
        token,
        password: data.password,
      });

      setIsSuccess(true);
      toast({
        title: 'Password Updated',
        message: 'Your account password has been reset successfully. Please log in.',
        type: 'success',
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      let message = 'Failed to reset password. The token may be expired or invalid.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      }
      toast({
        title: 'Reset Failed',
        message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-center">
      <div className="mx-auto w-10 h-10 bg-[#0A0A0A] text-white rounded-[8px] flex items-center justify-center mb-4">
        <Building2 className="w-5 h-5" />
      </div>

      <h1 className="text-[24px] font-semibold tracking-tight text-[#0A0A0A]">
        Set new password
      </h1>

      <p className="text-[14px] text-[#525252] mt-1 mb-6">
        {email
          ? `Create a secure new password for ${email}`
          : 'Choose a strong password to secure your workspace account'}
      </p>

      {isSuccess ? (
        <div className="border border-[#E5E5E5] rounded-[8px] p-4 bg-[#F5F5F5] text-left my-4 space-y-3">
          <p className="text-[14px] font-semibold text-[#0A0A0A] flex items-center">
            <KeyRound className="w-4 h-4 mr-1.5 text-[#0A0A0A]" />
            Password changed successfully
          </p>
          <p className="text-[13px] text-[#525252]">
            Your credentials have been securely updated. Redirecting to workspace sign in...
          </p>
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Go to sign in now
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <div>
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div>
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Update password
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <Link
          to="/login"
          className="inline-flex items-center text-[13px] font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
