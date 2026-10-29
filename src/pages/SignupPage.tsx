import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import { Building2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import axios from 'axios';

const signupSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  organizationName: z.string().min(2, 'Agency name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      await signup(data);
      toast({
        title: 'Workspace Created',
        message: `Welcome to RealCRM, ${data.name}! Workspace initialized for ${data.organizationName}`,
        type: 'success',
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      let message = 'Failed to register workspace. An account with this email may already exist.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      }
      toast({
        title: 'Registration Failed',
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
        Create your workspace
      </h1>

      <p className="text-[14px] text-[#525252] mt-1 mb-6">
        Register your real estate agency or team
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div>
          <Input
            label="Full name"
            placeholder="e.g. Vikram Singhania"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div>
          <Input
            label="Work email address"
            type="email"
            placeholder="director@agency.in"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div>
          <Input
            label="Agency or company name"
            placeholder="e.g. Skyline Real Estate Group"
            error={errors.organizationName?.message}
            {...register('organizationName')}
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
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
            Create workspace
          </Button>
        </div>
      </form>

      <p className="text-[13px] text-[#525252] mt-6">
        Already have a workspace?{' '}
        <Link to="/login" className="font-medium text-[#0A0A0A] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
