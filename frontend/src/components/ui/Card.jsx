import { cn } from '@/lib/utils';
export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border border-base bg-card', className)} {...p} />;
export const CardHeader = ({ className, ...p }) => <div className={cn('flex items-center justify-between p-5 border-b border-base', className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h3 className={cn('text-base font-semibold', className)} {...p} />;
export const CardBody = ({ className, ...p }) => <div className={cn('p-5', className)} {...p} />;