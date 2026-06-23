import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export default function Login() {
  const { login } = useAuthStore();
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('Welcome back!');
      nav('/');
    } catch (e) {}
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-sm text-muted-fg mt-1">Welcome back, log in to your account</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@company.com" {...register('email')} />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...register('password')} />
        </FormField>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-[rgb(var(--primary))]">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
      </form>
      <p className="text-sm text-center mt-6">
        Don't have an account? <Link to="/register" className="text-[rgb(var(--primary))] font-medium">Sign up</Link>
      </p>
    </>
  );
}