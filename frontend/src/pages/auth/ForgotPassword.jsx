import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/api/endpoints';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const nav = useNavigate();
  const onSubmit = async (d) => {
    try { await authApi.forgotPassword(d); toast.success('Check your email for OTP'); nav(`/reset-password?email=${encodeURIComponent(d.email)}`); } catch {}
  };
  return (
    <>
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <p className="text-sm text-muted-fg mt-1">We'll send a reset code to your email</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
        <FormField label="Email"><Input type="email" {...register('email', { required: true })} /></FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>Send code</Button>
      </form>
      <p className="text-sm text-center mt-6"><Link to="/login" className="text-[rgb(var(--primary))]">← Back to sign in</Link></p>
    </>
  );
}