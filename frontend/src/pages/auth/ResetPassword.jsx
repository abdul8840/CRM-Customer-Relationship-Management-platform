import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/api/endpoints';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: params.get('email') } });
  const onSubmit = async (d) => {
    try { await authApi.resetPassword(d); toast.success('Password reset successful'); nav('/login'); } catch {}
  };
  return (
    <>
      <h1 className="text-2xl font-bold">Reset password</h1>
      <p className="text-sm text-muted-fg mt-1">Enter the OTP and a new password</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
        <FormField label="Email"><Input {...register('email')} readOnly /></FormField>
        <FormField label="OTP code"><Input maxLength={6} {...register('code', { required: true })} /></FormField>
        <FormField label="New password"><Input type="password" {...register('password', { required: true })} /></FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>Reset password</Button>
      </form>
    </>
  );
}