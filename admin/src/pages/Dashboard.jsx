import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Briefcase, Trophy, CreditCard, IndianRupee, LifeBuoy, Server } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { adminApi } from '@/api/endpoints';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';

const colors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const Kpi = ({ icon: Icon, label, value, hint, tint = 'bg-blue-100 text-blue-600' }) => (
  <Card><CardBody className="flex items-center gap-4">
    <div className={`h-12 w-12 rounded-lg ${tint} flex items-center justify-center`}><Icon className="h-5 w-5" /></div>
    <div>
      <p className="text-xs text-muted-fg uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-fg mt-0.5">{hint}</p>}
    </div>
  </CardBody></Card>
);

export default function Dashboard() {
  const { data: d, isLoading } = useQuery({ queryKey: ['admin-dash'], queryFn: adminApi.dashboard });
  const { data: signups = [] } = useQuery({ queryKey: ['admin-signups'], queryFn: () => adminApi.signups(30) });
  const { data: rev = [] } = useQuery({ queryKey: ['admin-revenue'], queryFn: () => adminApi.revenue(12) });
  const { data: planDist = [] } = useQuery({ queryKey: ['admin-plan-dist'], queryFn: adminApi.planDist });
  const { data: health } = useQuery({ queryKey: ['admin-health'], queryFn: adminApi.health, refetchInterval: 30_000 });

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  return (
    <>
      <PageHeader title="System Dashboard" subtitle="Platform-wide overview & KPIs" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={Users} label="Total Users" value={d?.totalUsers} hint={`${d?.activeUsers} active`} />
        <Kpi icon={UserPlus} label="New (30d)" value={d?.newUsers30} tint="bg-purple-100 text-purple-600" />
        <Kpi icon={CreditCard} label="Active Subs" value={d?.activeSubs} tint="bg-green-100 text-green-600" />
        <Kpi icon={IndianRupee} label="MRR" value={formatCurrency(d?.mrr)} hint={`Last 30d: ${formatCurrency(d?.revenue30)}`} tint="bg-amber-100 text-amber-600" />
        <Kpi icon={Briefcase} label="Leads" value={d?.totalLeads} />
        <Kpi icon={Trophy} label="Won Deals" value={d?.wonDeals} hint={`Of ${d?.totalDeals} total`} tint="bg-green-100 text-green-600" />
        <Kpi icon={LifeBuoy} label="Open Tickets" value={d?.ticketsOpen} tint="bg-red-100 text-red-600" />
        <Kpi icon={Server} label="System" value={health?.db === 'ok' ? '🟢 Online' : '🔴 Down'} hint={`Uptime ${Math.floor((health?.uptime || 0) / 60)}m`} tint="bg-slate-100 text-slate-700" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue (last 12 months)</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rev}>
                <XAxis dataKey="month" stroke="rgb(var(--muted-fg))" fontSize={12} />
                <YAxis stroke="rgb(var(--muted-fg))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Plan Distribution</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={planDist} dataKey="count" nameKey="plan.name" cx="50%" cy="50%" outerRadius={80} label>
                  {planDist.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Signups (last 30 days)</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={signups}>
              <XAxis dataKey="date" stroke="rgb(var(--muted-fg))" fontSize={11} />
              <YAxis stroke="rgb(var(--muted-fg))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </>
  );
}