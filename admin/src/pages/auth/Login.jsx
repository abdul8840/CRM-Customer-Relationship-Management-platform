import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export default function Login() {
  const { login } = useAuthStore();
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try { await login(data); toast.success('Welcome, admin'); nav('/'); }
    catch (e) { toast.error(e.message || 'Login failed'); }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Admin Sign In</h1>
      <p className="text-sm text-muted-fg mt-1">Restricted area — admin access only</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
        <FormField label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></FormField>
        <FormField label="Password" error={errors.password?.message}><Input type="password" {...register('password')} /></FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
      </form>
    </>
  );
}