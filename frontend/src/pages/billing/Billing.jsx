import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function Billing() {
    const qc = useQueryClient();
    const { user } = useAuthStore();
    const { data: plans = [], isLoading: lp } = useQuery({ queryKey: ['plans'], queryFn: subscriptionApi.plans });
    const { data: mySub, isLoading: ls } = useQuery({ queryKey: ['my-sub'], queryFn: subscriptionApi.me });
    const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: subscriptionApi.invoices });

    const cancelMut = useMutation({ mutationFn: subscriptionApi.cancel, onSuccess: () => { toast.success('Subscription cancelled'); qc.invalidateQueries({ queryKey: ['my-sub'] }); } });

    const subscribe = async (plan) => {
        try {
            const data = await subscriptionApi.checkout(plan.id);
            if (data.free) { toast.success(`Activated ${plan.name}`); qc.invalidateQueries({ queryKey: ['my-sub'] }); return; }

            const rzp = new window.Razorpay({
                key: data.key_id,
                subscription_id: data.subscription_id,
                name: 'CRM Platform',
                description: `${plan.name} subscription`,
                prefill: { email: user?.email, name: `${user?.first_name} ${user?.last_name}`, contact: user?.phone },
                theme: { color: '#2563eb' },
                handler: async (res) => {
                    try {
                        await subscriptionApi.verify({
                            subscription_id: res.razorpay_subscription_id,
                            payment_id: res.razorpay_payment_id,
                            signature: res.razorpay_signature,
                        });
                        toast.success('Subscription activated!');
                        qc.invalidateQueries({ queryKey: ['my-sub'] });
                        qc.invalidateQueries({ queryKey: ['invoices'] });
                    } catch (e) { toast.error('Payment verification failed'); }
                },
                modal: { ondismiss: () => toast.info('Payment cancelled') },
            });
            rzp.open();
        } catch { }
    };

    return (
        <>
            <PageHeader title="Billing & Plans" subtitle="Choose the plan that fits your business" />

            {/* Current subscription */}
            <Card className="mb-6">
                <CardBody>
                    {ls ? <Skeleton className="h-16" /> : mySub ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-fg">Current plan</p>
                                <h3 className="text-2xl font-bold mt-1">{mySub.plan?.name}</h3>
                                <Badge variant={mySub.status === 'active' ? 'success' : 'warning'} className="mt-2">{mySub.status}</Badge>
                                {mySub.current_period_end && <p className="text-sm text-muted-fg mt-2">Renews on {formatDate(mySub.current_period_end)}</p>}
                            </div>
                            {mySub.status === 'active' && (
                                <Button variant="danger" onClick={() => cancelMut.mutate()} loading={cancelMut.isPending}>Cancel subscription</Button>
                            )}
                        </div>
                    ) : <p className="text-sm text-muted-fg">No active subscription. Pick a plan below.</p>}
                </CardBody>
            </Card>

            {/* Plans grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {lp ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-96" />) : plans.map((p) => {
                    const current = mySub?.plan_id === p.id;
                    return (
                        <Card key={p.id} className={current ? 'ring-2 ring-[rgb(var(--primary))]' : ''}>
                            <CardBody>
                                <h3 className="font-bold text-lg">{p.name}</h3>
                                <p className="text-sm text-muted-fg mt-1">{p.description}</p>
                                <div className="my-6">
                                    <span className="text-3xl font-bold">{formatCurrency(p.price, p.currency)}</span>
                                    <span className="text-muted-fg text-sm">/{p.interval}</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {(p.features || []).map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />{f}</li>
                                    ))}
                                </ul>
                                <Button className="w-full" variant={current ? 'outline' : 'primary'} disabled={current} onClick={() => subscribe(p)}>
                                    {current ? 'Current Plan' : 'Subscribe'}
                                </Button>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>

            {/* Invoices */}
            <Card>
                <CardHeader><CardTitle>Invoice history</CardTitle></CardHeader>
                <CardBody className="p-0">
                    {invoices.length ? (
                        <Table>
                            <Thead><tr><Th>Number</Th><Th>Date</Th><Th>Amount</Th><Th>Status</Th></tr></Thead>
                            <tbody>
                                {invoices.map((i) => (
                                    <Tr key={i.id}>
                                        <Td className="font-mono text-xs">{i.invoice_number}</Td>
                                        <Td>{formatDate(i.created_at)}</Td>
                                        <Td>{formatCurrency(i.total, i.currency)}</Td>
                                        <Td><Badge variant={i.status === 'paid' ? 'success' : 'warning'}>{i.status}</Badge></Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : <p className="p-8 text-center text-sm text-muted-fg">No invoices yet</p>}
                </CardBody>
            </Card>
        </>
    );
}