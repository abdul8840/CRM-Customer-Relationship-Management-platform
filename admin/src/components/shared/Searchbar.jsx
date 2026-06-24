import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
export const Searchbar = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative w-full max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
    <Input className="pl-9" placeholder={placeholder} value={value || ''} onChange={(e) => onChange(e.target.value)} />
  </div>
);