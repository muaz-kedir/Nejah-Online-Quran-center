import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QURAN_SURAHS, formatSurahLabel } from '@/lib/quran-surahs';

interface SurahSelectProps {
  value?: number;
  onChange: (surahNumber: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SurahSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Select surah...',
}: SurahSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? QURAN_SURAHS.find((s) => s.number === value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? formatSurahLabel(selected) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search surah..." />
          <CommandList className="max-h-64">
            <CommandEmpty>No surah found.</CommandEmpty>
            <CommandGroup>
              {QURAN_SURAHS.map((surah) => (
                <CommandItem
                  key={surah.number}
                  value={`${surah.number} ${surah.englishName} ${surah.arabicName}`}
                  onSelect={() => {
                    onChange(surah.number);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === surah.number ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {formatSurahLabel(surah)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
