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
  first_name: z.string().min(2, 'Too short'),
  last_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need digit'),
});

export default function Register() {
  const { register: doRegister } = useAuthStore();
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await doRegister(data);
      toast.success('Account created. Check your email for OTP.');
      nav(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch {}
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="text-sm text-muted-fg mt-1">Start your free trial today</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" error={errors.first_name?.message} required>
            <Input {...register('first_name')} />
          </FormField>
          <FormField label="Last name" error={errors.last_name?.message}>
            <Input {...register('last_name')} />
          </FormField>
        </div>
        <FormField label="Email" error={errors.email?.message} required>
          <Input type="email" {...register('email')} />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message}>
          <Input {...register('phone')} />
        </FormField>
        <FormField label="Password" error={errors.password?.message} required>
          <Input type="password" {...register('password')} />
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>
      <p className="text-sm text-center mt-6">
        Already registered? <Link to="/login" className="text-[rgb(var(--primary))] font-medium">Sign in</Link>
      </p>
    </>
  );
}