import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import { Building2, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import axios from 'axios';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await axios.post('/api/v1/auth/forgot-password', { email: data.email });
      setIsSent(true);
      toast({
        title: 'Recovery Link Dispatched',
        message: `Password reset instructions sent to ${data.email}`,
        type: 'info',
      });
    } catch (err: unknown) {
      let message = 'Failed to dispatch reset instructions';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      }
      toast({
        title: 'Request Failed',
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
        Reset your password
      </h1>

      <p className="text-[14px] text-[#525252] mt-1 mb-6">
        Enter your work email to receive password recovery instructions
      </p>

      {isSent ? (
        <div className="border border-[#E5E5E5] rounded-[8px] p-4 bg-[#F5F5F5] text-left my-4 space-y-2">
          <p className="text-[14px] font-semibold text-[#0A0A0A]">
            Instructions sent
          </p>
          <p className="text-[13px] text-[#525252]">
            If an account exists for that email, a secure reset token has been dispatched.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setIsSent(false)}
            >
              Try another email
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <div>
            <Input
              label="Work email address"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register('email')}
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
              Send recovery link
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
