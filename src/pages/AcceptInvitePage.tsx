import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import { Building2, KeyRound, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';

const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

export function AcceptInvitePage() {
  const params = useParams();
  const rawParamToken = params.token || params['*'];
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  let token = rawParamToken || '';
  if (!token || token.includes('/')) {
    const match = pathname.match(/\/(?:invitations|accept-invite)\/(.+?)(?:\/accept)?$/);
    if (match && match[1]) {
      token = match[1];
    }
  }
  if (token) {
    token = token.replace(/[/\s]/g, '');
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordVal = watch('password') || '';
  const confirmVal = watch('confirmPassword') || '';

  // Strength check criteria
  const hasMinLength = passwordVal.length >= 8;
  const hasLetter = /[A-Za-z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);
  const passwordsMatch = passwordVal.length > 0 && passwordVal === confirmVal;

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!token) {
      setErrorMessage('Missing invitation token in URL.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await axios.post(
        `/api/v1/auth/invitations/${token}/accept`,
        { password: data.password },
        { withCredentials: true }
      );

      setIsSuccess(true);
      toast({
        title: 'Account activated',
        message: 'Your password has been configured. Welcome to RealCRM!',
        type: 'success',
      });

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: unknown) {
      let msg = 'This invitation link has expired or has already been used.';
      if (axios.isAxiosError(err)) {
        const backendCode = err.response?.data?.error?.code;
        const backendMsg = err.response?.data?.error?.message;
        if (backendCode === 'INVALID_INVITATION_TOKEN' || err.response?.status === 400) {
          msg = 'This invitation link has expired or has already been used. Please contact your platform administrator for a new invite.';
        } else if (backendMsg) {
          msg = backendMsg;
        }
      }

      setErrorMessage(msg);
      toast({
        title: 'Activation failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-center">
      {/* App Branding Icon */}
      <div className="mx-auto w-10 h-10 bg-[#0A0A0A] text-white rounded-[8px] flex items-center justify-center mb-3">
        <Building2 className="w-5 h-5" />
      </div>

      <div className="flex flex-col items-center justify-center mb-2">
        <StatusBadge status="ACTIVE" label="Client invite" />
        <h1 className="text-[24px] font-semibold tracking-tight text-[#0A0A0A] mt-2">
          Set up your workspace
        </h1>
      </div>

      <p className="text-[14px] text-[#525252] mb-6 max-w-xs mx-auto">
        Set a secure password to activate your agency account and access the platform.
      </p>

      {/* Success Banner */}
      {isSuccess && (
        <div className="mb-6 border border-[#E5E5E5] rounded-[10px] bg-[#FAFAFA] p-6 text-left">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[15px] font-semibold text-[#0A0A0A]">
                Account activated successfully
              </h3>
              <p className="text-[13px] text-[#525252] mt-1">
                Your workspace credentials are confirmed. Redirecting to workspace login...
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  Sign in now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner for Invalid / Expired Tokens */}
      {errorMessage && (
        <div className="mb-6 border border-[#FEE2E2] rounded-[10px] bg-[#FEF2F2] p-5 text-left">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-semibold text-[#B91C1C]">
                Invalid or expired invitation
              </h3>
              <p className="text-[13px] text-[#B91C1C] mt-1">
                {errorMessage}
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  Return to sign in
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activation Form */}
      {!isSuccess && !errorMessage && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <div>
            <Input
              label="New account password"
              type="password"
              placeholder="••••••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div>
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          {/* Password Strength Checklist */}
          <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[8px] text-left space-y-1.5">
            <span className="text-[12px] font-medium text-[#737373] block mb-1">
              Security requirements:
            </span>
            <div className="flex items-center space-x-2 text-[12px]">
              <span className={hasMinLength ? 'text-[#15803D] font-medium' : 'text-[#737373]'}>
                {hasMinLength ? '✓' : '○'} At least 8 characters
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[12px]">
              <span className={hasLetter ? 'text-[#15803D] font-medium' : 'text-[#737373]'}>
                {hasLetter ? '✓' : '○'} At least one letter (a-z, A-Z)
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[12px]">
              <span className={hasNumber ? 'text-[#15803D] font-medium' : 'text-[#737373]'}>
                {hasNumber ? '✓' : '○'} At least one number (0-9)
              </span>
            </div>
            {confirmVal.length > 0 && (
              <div className="flex items-center space-x-2 text-[12px] pt-1 border-t border-[#E5E5E5]">
                <span className={passwordsMatch ? 'text-[#15803D] font-medium' : 'text-[#B91C1C]'}>
                  {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting || !hasMinLength || !hasLetter || !hasNumber || !passwordsMatch}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              <span>Activate account</span>
            </Button>
          </div>
        </form>
      )}

      {/* Footer Navigation */}
      <p className="text-[13px] text-[#525252] mt-6">
        Already set your password?{' '}
        <Link to="/login" className="font-medium text-[#0A0A0A] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
