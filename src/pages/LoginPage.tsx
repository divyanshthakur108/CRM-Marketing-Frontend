import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import { Building2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import axios from 'axios';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleRedirectAfterAuth = (authUser: {
    isPlatformAdmin?: boolean;
    role?: string;
    onboardingStatus?: string;
  }) => {
    if (authUser.isPlatformAdmin || authUser.role === 'platform_admin') {
      navigate('/admin/organizations', { replace: true });
    } else if (authUser.onboardingStatus && authUser.onboardingStatus !== 'completed') {
      navigate('/onboarding', { replace: true });
    } else {
      navigate(from || '/dashboard', { replace: true });
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const authUser = await login(data.email, data.password);
      toast({
        title: 'Authentication Successful',
        message: `Signed in as ${data.email}`,
        type: 'success',
      });
      handleRedirectAfterAuth(authUser);
    } catch (err: unknown) {
      let message = 'Invalid credentials. Please check your email and password.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      }
      toast({
        title: 'Login Failed',
        message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-center">
      {/* 1. App Icon */}
      <div className="mx-auto w-10 h-10 bg-[#0A0A0A] text-white rounded-[8px] flex items-center justify-center mb-4">
        <Building2 className="w-5 h-5" />
      </div>

      {/* 2. Heading */}
      <h1 className="text-[24px] font-semibold tracking-tight text-[#0A0A0A]">
        Sign in to your account
      </h1>

      {/* 3. Subtitle */}
      <p className="text-[14px] text-[#525252] mt-1 mb-6">
        Welcome back to your RealCRM workspace
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Email Address */}
        <div>
          <Input
            label="Email address"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Password with Forgot? link */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-[12px] font-medium text-[#525252]"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[12px] text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        {/* Sign In Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>

      {/* "or" divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E5E5]" />
        </div>
        <div className="relative flex justify-center text-[12px]">
          <span className="bg-white px-3 text-[#737373]">or continue with</span>
        </div>
      </div>

      {/* "Continue with Google" */}
      <Button
        type="button"
        variant="secondary"
        size="md"
        className="w-full"
        onClick={async () => {
          const userEmail = prompt('Enter your Google email address to sign in:');
          if (!userEmail || !userEmail.includes('@')) return;
          try {
            const authUser = await googleLogin(userEmail, userEmail.split('@')[0]);
            toast({
              title: 'Google Sign In',
              message: `Signed in as ${userEmail}`,
              type: 'success',
            });
            handleRedirectAfterAuth(authUser);
          } catch {
            toast({
              title: 'Sign In Failed',
              message: 'Google authentication failed',
              type: 'error',
            });
          }
        }}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Google
      </Button>
    </div>
  );
}
