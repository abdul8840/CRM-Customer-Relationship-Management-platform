import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  source: z.enum(['website', 'referral', 'social', 'email', 'cold_call', 'event', 'ads', 'other']).default('other'),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost']).default('new'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimated_value: z.coerce.number().min(0).optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const LeadForm = ({ defaultValues, onSubmit, onCancel, loading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: defaultValues || { source: 'other', status: 'new', priority: 'medium' } });
  useEffect(() => { reset(defaultValues || { source: 'other', status: 'new', priority: 'medium' }); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="First name" error={errors.first_name?.message} required><Input {...register('first_name')} /></FormField>
        <FormField label="Last name"><Input {...register('last_name')} /></FormField>
        <FormField label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></FormField>
        <FormField label="Phone"><Input {...register('phone')} /></FormField>
        <FormField label="Company"><Input {...register('company_name')} /></FormField>
        <FormField label="Job title"><Input {...register('job_title')} /></FormField>
        <FormField label="Source">
          <Select {...register('source')}>
            {['website', 'referral', 'social', 'email', 'cold_call', 'event', 'ads', 'other'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select {...register('status')}>
            {['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select {...register('priority')}>
            {['low', 'medium', 'high', 'urgent'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Estimated value"><Input type="number" step="0.01" {...register('estimated_value')} /></FormField>
      </div>
      <FormField label="Notes"><Textarea rows={3} {...register('notes')} /></FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  );
};