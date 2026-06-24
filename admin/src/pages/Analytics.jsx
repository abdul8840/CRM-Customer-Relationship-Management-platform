import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Users, IndianRupee, Briefcase, Calendar } from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';

const colors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const tooltipStyle = {
  background: 'rgb(var(--card))',
  border: '1px solid rgb(var(--border))',
  borderRadius: 8,
  fontSize: 12,
};

export default function Analytics() {
  const [signupRange, setSignupRange] = useState(90);
  const [revenueRange, setRevenueRange] = useState(12);

  const { data: dashboard, isLoading: ld } = useQuery({
    queryKey: ['analytics-dash'],
    queryFn: adminApi.dashboard,
  });

  const { data: signups = [], isLoading: ls } = useQuery({
    queryKey: ['analytics-signups', signupRange],
    queryFn: () => adminApi.signups(signupRange),
  });

  const { data: revenue = [], isLoading: lr } = useQuery({
    queryKey: ['analytics-revenue', revenueRange],
    queryFn: () => adminApi.revenue(revenueRange),
  });

  const { data: planDist = [], isLoading: lp } = useQuery({
    queryKey: ['analytics-plan-dist'],
    queryFn: adminApi.planDist,
  });

  // Format for charts
  const revenueChart = revenue.map((r) => ({
    month: r.month,
    revenue: Number(r.revenue || 0),
    count: Number(r.count || 0),
  }));

  const signupChart = signups.map((s) => ({
    date: s.date,
    count: Number(s.count || 0),
  }));

  // Derived stats
  const totalRevenue = revenueChart.reduce((s, r) => s + r.revenue, 0);
  const totalSignups = signupChart.reduce((s, r) => s + r.count, 0);
  const avgDailySignups = signupChart.length ? Math.round(totalSignups / signupChart.length) : 0;
  const peakDay = signupChart.reduce((max, r) => (r.count > (max?.count || 0) ? r : max), null);

  const KpiCard = ({ icon: Icon, label, value, hint, tint = 'bg-blue-100 text-blue-600' }) => (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-lg ${tint} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-fg uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {hint && <p className="text-xs text-muted-fg mt-0.5">{hint}</p>}
        </div>
      </CardBody>
    </Card>
  );

  return (
    <>
      <PageHeader title="Analytics" subtitle="Deep insights into platform performance" />

      {/* Top KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {ld ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              icon={Users}
              label="Total Users"
              value={dashboard?.totalUsers ?? 0}
              hint={`${dashboard?.newUsers30 ?? 0} new in last 30d`}
              tint="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <KpiCard
              icon={IndianRupee}
              label="Monthly Recurring Revenue"
              value={formatCurrency(dashboard?.mrr || 0)}
              hint={`30d: ${formatCurrency(dashboard?.revenue30 || 0)}`}
              tint="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <KpiCard
              icon={Briefcase}
              label="Total Deals"
              value={dashboard?.totalDeals ?? 0}
              hint={`${dashboard?.wonDeals ?? 0} won`}
              tint="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            />
            <KpiCard
              icon={TrendingUp}
              label="Active Subscriptions"
              value={dashboard?.activeSubs ?? 0}
              hint={`${dashboard?.totalLeads ?? 0} leads platform-wide`}
              tint="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            />
          </>
        )}
      </div>

      {/* Revenue chart */}
      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <p className="text-xs text-muted-fg mt-1">
              Total: {formatCurrency(totalRevenue)} • Avg: {formatCurrency(totalRevenue / (revenueChart.length || 1))}/mo
            </p>
          </div>
          <Select
            className="w-32"
            value={revenueRange}
            onChange={(e) => setRevenueRange(+e.target.value)}
          >
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={24}>24 months</option>
          </Select>
        </CardHeader>
        <CardBody>
          {lr ? (
            <Skeleton className="h-72" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="month" stroke="rgb(var(--muted-fg))" fontSize={11} />
                <YAxis stroke="rgb(var(--muted-fg))" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Signups */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>New Signups</CardTitle>
              <p className="text-xs text-muted-fg mt-1">
                Total: {totalSignups} • Avg: {avgDailySignups}/day
                {peakDay && <> • Peak: {peakDay.count} on {peakDay.date}</>}
              </p>
            </div>
            <Select
              className="w-28"
              value={signupRange}
              onChange={(e) => setSignupRange(+e.target.value)}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </Select>
          </CardHeader>
          <CardBody>
            {ls ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={signupChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="date" stroke="rgb(var(--muted-fg))" fontSize={10} />
                  <YAxis stroke="rgb(var(--muted-fg))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            {lp ? (
              <Skeleton className="h-64" />
            ) : planDist.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-fg">
                No active subscriptions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={planDist}
                    dataKey="count"
                    nameKey="plan.name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => `${entry.plan?.name}: ${entry.count}`}
                  >
                    {planDist.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Deals per month */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions per Month</CardTitle>
          <p className="text-xs text-muted-fg mt-1">Number of successful payments</p>
        </CardHeader>
        <CardBody>
          {lr ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="month" stroke="rgb(var(--muted-fg))" fontSize={11} />
                <YAxis stroke="rgb(var(--muted-fg))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </>
  );
}