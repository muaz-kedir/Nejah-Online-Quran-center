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
  highlightSelected?: boolean;
  completedSurahs?: number[]; // Surahs that have been completed/ticked
}

export function SurahSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Select surah...',
  highlightSelected = true,
  completedSurahs = [],
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
          className={cn(
            "w-full justify-between font-normal",
            highlightSelected && selected && "ring-2 ring-primary/500 ring-offset-2 border-primary/300 dark:border-primary/700"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {selected && completedSurahs.includes(selected.number) && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
            <span className={cn("truncate", selected && "font-medium")}>
              {selected ? formatSurahLabel(selected) : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search surah..." />
          <CommandList className="max-h-96">
            <CommandEmpty>No surah found.</CommandEmpty>
            <CommandGroup>
              {QURAN_SURAHS.map((surah) => {
                const isCompleted = completedSurahs.includes(surah.number);
                const isSelected = value === surah.number;
                return (
                  <CommandItem
                    key={surah.number}
                    value={`${surah.number} ${surah.englishName} ${surah.arabicName}`}
                    onSelect={() => {
                      onChange(surah.number);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2",
                      isSelected && highlightSelected && "bg-primary/10 dark:bg-nejah-sapphire/30 border-primary/200 dark:border-nejah-border-blue"
                    )}
                  >
                    {isCompleted && (
                      <Check
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isSelected ? 'text-primary' : 'text-nejah-electric'
                        )}
                      />
                    )}
                    <div className={cn(
                      "flex-1 overflow-hidden",
                      isSelected && highlightSelected && "font-bold text-nejah-electric",
                      isCompleted && !isSelected && "text-primary text-nejah-electric"
                    )}>
                      {formatSurahLabel(surah)}
                    </div>
                    {isSelected && !isCompleted && highlightSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
