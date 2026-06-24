import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <p className="text-7xl font-bold text-[rgb(var(--primary))]">404</p>
      <h1 className="text-2xl font-bold mt-4">Page not found</h1>
      <p className="text-muted-fg mt-2">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6"><Button>Back to dashboard</Button></Link>
    </div>
  );
}