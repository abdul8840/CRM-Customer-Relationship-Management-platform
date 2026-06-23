import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/api/endpoints';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const email = params.get('email') || '';
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email } });

  const onSubmit = async (d) => {
    try { await authApi.verifyEmail(d); toast.success('Email verified! You can sign in.'); nav('/login'); } catch {}
  };
  const resend = async () => {
    try { await authApi.resendOtp({ email, purpose: 'email_verify' }); toast.success('OTP resent'); } catch {}
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Verify your email</h1>
      <p className="text-sm text-muted-fg mt-1">Enter the 6-digit code sent to {email}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
        <FormField label="Email"><Input {...register('email')} readOnly /></FormField>
        <FormField label="OTP code"><Input maxLength={6} placeholder="123456" {...register('code', { required: true })} /></FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>Verify</Button>
        <button type="button" onClick={resend} className="text-sm text-[rgb(var(--primary))] w-full">Resend code</button>
      </form>
    </>
  );
}