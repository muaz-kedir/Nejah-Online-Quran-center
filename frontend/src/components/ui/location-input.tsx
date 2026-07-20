import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const COMMON_COUNTRIES = [
  'Afghanistan', 'Algeria', 'Bahrain', 'Bangladesh', 'Canada', 'Djibouti',
  'Egypt', 'Eritrea', 'Ethiopia', 'France', 'Germany', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Italy', 'Japan', 'Jordan',
  'Kenya', 'Kuwait', 'Lebanon', 'Libya', 'Malaysia', 'Maldives',
  'Mali', 'Mauritania', 'Morocco', 'Netherlands', 'Niger', 'Nigeria',
  'Oman', 'Pakistan', 'Palestine State', 'Qatar', 'Saudi Arabia',
  'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Sweden',
  'Syria', 'Tanzania', 'Tunisia', 'Turkey', 'Uganda',
  'United Arab Emirates', 'United Kingdom', 'United States of America',
  'Yemen',
];

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  suggestions?: string[];
  label?: string;
}

export function CountryInput({ value, onChange, placeholder = 'Type a country...', className, disabled }: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COMMON_COUNTRIES.filter(
    c => c.toLowerCase().includes(input.toLowerCase()) && c.toLowerCase() !== input.toLowerCase()
  );

  return (
    <div ref={ref} className="relative">
      <Input
        value={input}
        onChange={e => {
          setInput(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && input && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
          {filtered.map(c => (
            <button
              key={c}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
              onClick={() => {
                setInput(c);
                onChange(c);
                setOpen(false);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CityInput({ value, onChange, placeholder = 'Type a city...', className, disabled }: LocationInputProps) {
  return (
    <Input
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      autoComplete="off"
    />
  );
}
