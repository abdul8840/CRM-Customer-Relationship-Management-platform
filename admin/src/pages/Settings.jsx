import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { settingsApi } from '@/api/endpoints';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/shared/PageHeader';

const groups = [
  { title: 'Company', keys: ['company.name', 'company.email', 'company.address'] },
  { title: 'Branding', keys: ['branding.primary_color', 'branding.logo_url'] },
  { title: 'CRM Preferences', keys: ['crm.currency', 'crm.timezone'] },
];

export default function Settings() {
  const qc = useQueryClient();
  const { data: settings = [] } = useQuery({ queryKey: ['admin-settings'], queryFn: settingsApi.list });
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => {
    const map = Object.fromEntries(settings.map((s) => [s.key, typeof s.value === 'string' ? s.value : JSON.stringify(s.value)]));
    reset(map);
  }, [settings, reset]);

  const save = useMutation({
    mutationFn: async (data) => {
      await Promise.all(Object.entries(data).map(([k, v]) => settingsApi.update(k, v)));
    },
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['admin-settings'] }); },
  });

  return (
    <>
      <PageHeader title="System Settings" subtitle="Branding, company & CRM configuration" />
      <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-6">
        {groups.map((g) => (
          <Card key={g.title}>
            <CardHeader><CardTitle>{g.title}</CardTitle></CardHeader>
            <CardBody className="grid sm:grid-cols-2 gap-4">
              {g.keys.map((k) => (
                <FormField key={k} label={k}>
                  <Input {...register(k)} />
                </FormField>
              ))}
            </CardBody>
          </Card>
        ))}
        <Card>
          <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
          <CardBody>
            <p className="text-sm text-muted-fg">
              <strong>Brevo, Razorpay, Cloudinary</strong> are configured via backend <code>.env</code> file for security.
              Update those values and restart the API server to apply changes.
            </p>
          </CardBody>
        </Card>
        <div className="flex justify-end"><Button type="submit" loading={save.isPending}>Save all</Button></div>
      </form>
    </>
  );
}