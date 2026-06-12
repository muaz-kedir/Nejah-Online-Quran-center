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

export interface TopicOption {
  id: string;
  order: number;
  nameEn: string;
  nameAr: string;
  label: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isSuggested?: boolean;
}

interface TopicSelectProps {
  topics: TopicOption[];
  value?: string;
  onChange: (topicId: string) => void;
  disabled?: boolean;
  allowCompleted?: boolean;
  placeholder?: string;
}

export function TopicSelect({
  topics,
  value,
  onChange,
  disabled,
  allowCompleted = false,
  placeholder = 'Select topic...',
}: TopicSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = topics.find((t) => t.id === value);

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
          {selected ? (
            <span className="truncate text-left">
              {selected.order}. {selected.label}
              {selected.isSuggested && !allowCompleted ? (
                <span className="ml-2 text-xs text-primary">(Suggested)</span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search topics..." />
          <CommandList>
            <CommandEmpty>No topic found.</CommandEmpty>
            <CommandGroup>
              {topics.map((topic) => {
                const isDisabled = topic.isCompleted && !allowCompleted;
                return (
                  <CommandItem
                    key={topic.id}
                    value={`${topic.order} ${topic.nameEn} ${topic.nameAr}`}
                    disabled={isDisabled}
                    onSelect={() => {
                      if (isDisabled) return;
                      onChange(topic.id);
                      setOpen(false);
                    }}
                    className={cn(
                      topic.isSuggested && !allowCompleted && 'bg-primary/10 dark:bg-nejah-sapphire/30',
                      topic.isCompleted && 'opacity-60',
                    )}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', value === topic.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span>
                        {topic.order}. {topic.nameEn}
                        {topic.isCompleted ? ' ✓' : ''}
                        {topic.isSuggested && !topic.isCompleted ? ' · Next' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">{topic.nameAr}</span>
                    </div>
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
