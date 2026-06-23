import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/shared/PageHeader';

export default function Profile() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm({ defaultValues: user });
  const pw = useForm();

  const update = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (u) => { setAuth({ user: u, accessToken, refreshToken }); toast.success('Profile updated'); qc.invalidateQueries(); },
  });
  const changePw = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => { toast.success('Password changed'); pw.reset(); },
  });
  const uploadAvatar = useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: (u) => { setAuth({ user: u, accessToken, refreshToken }); toast.success('Avatar updated'); },
  });

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your personal info & password" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar src={user?.avatar_url} name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={96} />
              <label className="absolute bottom-0 right-0 bg-[rgb(var(--primary))] text-white p-1.5 rounded-full cursor-pointer hover:opacity-90">
                <Camera className="h-3 w-3" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} />
              </label>
            </div>
            <h3 className="font-semibold mt-3">{user?.first_name} {user?.last_name}</h3>
            <p className="text-sm text-muted-fg">{user?.email}</p>
            <p className="text-xs mt-2 px-2 py-0.5 rounded-full bg-muted">{user?.role?.name}</p>
          </CardBody>
        </Card>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal info</CardTitle></CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="First name"><Input {...register('first_name')} /></FormField>
                  <FormField label="Last name"><Input {...register('last_name')} /></FormField>
                  <FormField label="Phone"><Input {...register('phone')} /></FormField>
                </div>
                <div className="flex justify-end"><Button type="submit" loading={update.isPending}>Save changes</Button></div>
              </form>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
            <CardBody>
              <form onSubmit={pw.handleSubmit((d) => changePw.mutate(d))} className="space-y-4">
                <FormField label="Current password"><Input type="password" {...pw.register('current', { required: true })} /></FormField>
                <FormField label="New password"><Input type="password" {...pw.register('next', { required: true, minLength: 8 })} /></FormField>
                <div className="flex justify-end"><Button type="submit" loading={changePw.isPending}>Update password</Button></div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}