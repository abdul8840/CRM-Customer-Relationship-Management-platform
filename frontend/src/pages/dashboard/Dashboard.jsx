import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Users, Briefcase, Trophy, X, ListTodo, TrendingUp } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency, formatDate } from '@/lib/utils';

const colors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const KpiCard = ({ icon: Icon, label, value, hint, tint = 'bg-blue-100 text-blue-600' }) => (
  <Card>
    <CardBody className="flex items-center gap-4">
      <div className={`h-12 w-12 rounded-lg ${tint} flex items-center justify-center`}><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-xs text-muted-fg uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {hint && <p className="text-xs text-muted-fg mt-0.5">{hint}</p>}
      </div>
    </CardBody>
  </Card>
);

export default function Dashboard() {
  const { data: overview, isLoading } = useQuery({ queryKey: ['dash-overview'], queryFn: dashboardApi.overview });
  const { data: sales = [] } = useQuery({ queryKey: ['dash-sales'], queryFn: () => dashboardApi.salesChart(6) });
  const { data: sources = [] } = useQuery({ queryKey: ['dash-sources'], queryFn: dashboardApi.leadSources });
  const { data: activities = [] } = useQuery({ queryKey: ['dash-activities'], queryFn: dashboardApi.recent });

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome back, here's your sales snapshot" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard icon={Users} label="Total Leads" value={overview?.totalLeads ?? 0} tint="bg-blue-100 text-blue-600 dark:bg-blue-900/40" />
        <KpiCard icon={Briefcase} label="Active Deals" value={overview?.activeDeals ?? 0} tint="bg-purple-100 text-purple-600 dark:bg-purple-900/40" />
        <KpiCard icon={Trophy} label="Won Deals" value={overview?.wonDeals ?? 0} tint="bg-green-100 text-green-600 dark:bg-green-900/40" />
        <KpiCard icon={TrendingUp} label="Month Revenue" value={formatCurrency(overview?.monthRevenue)} hint={`Conv. rate: ${overview?.conversionRate}%`} tint="bg-amber-100 text-amber-600 dark:bg-amber-900/40" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sales (last 6 months)</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sales}>
                <XAxis dataKey="month" stroke="rgb(var(--muted-fg))" fontSize={12} />
                <YAxis stroke="rgb(var(--muted-fg))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Lead Sources</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={80} label>
                  {sources.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardBody className="p-0">
          {activities.length ? activities.slice(0, 10).map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-4 border-b border-base last:border-0">
              <Avatar src={a.user?.avatar_url} name={`${a.user?.first_name || ''} ${a.user?.last_name || ''}`} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm"><strong>{a.user?.first_name}</strong> {a.title}</p>
                <p className="text-xs text-muted-fg">{formatDate(a.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )) : <p className="p-12 text-center text-sm text-muted-fg">No recent activity</p>}
        </CardBody>
      </Card>
    </>
  );
}