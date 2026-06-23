// EmptyState.jsx
import { Inbox } from 'lucide-react';
export const EmptyState = ({ title = 'No data', description, icon: Icon = Inbox, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <div className="rounded-full bg-muted p-4 mb-4"><Icon className="h-8 w-8 text-muted-fg" /></div>
    <h3 className="font-semibold">{title}</h3>
    {description && <p className="text-sm text-muted-fg mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);