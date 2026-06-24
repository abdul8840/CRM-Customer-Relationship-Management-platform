import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { adminApi } from '@/api/endpoints';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/shared/PageHeader';

export default function Analytics() {
  const { data: signups = [] } = useQuery({ queryKey: ['an-signups'], queryFn: () => adminApi.signups(90) });
  const { data: rev = [] } = useQuery({ queryKey: ['an-rev'], queryFn: () => adminApi.revenue(12) });
  return (
    <>
      <PageHeader title="Analytics" subtitle="Deep platform analytics" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Signups (90d)</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}><LineChart data={signups}><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={12} /><Tooltip /><Line dataKey="count" stroke="#2563eb" strokeWidth={2} /></LineChart></ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue per month</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}><BarChart data={rev}><XAxis dataKey="month" fontSize={11} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="revenue" fill="#16a34a" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Deals per month</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}><BarChart data={rev}><XAxis dataKey="month" fontSize={11} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </>
  );
}