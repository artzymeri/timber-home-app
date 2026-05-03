'use client';

import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ICON_OPTIONS, resolveIcon } from '@/lib/icon-resolver';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const Selected = resolveIcon(value);

  const filtered = ICON_OPTIONS.filter((opt) =>
    opt.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" type="button" className="h-10 gap-2 px-3">
            <Selected size={18} />
            <span className="text-sm">{value || t('role_icon_pick')}</span>
          </Button>
        }
      />
      <PopoverContent className="w-72 p-2" align="start">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('role_icon_pick')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-7"
          />
        </div>
        <div className="grid grid-cols-6 gap-1 max-h-64 overflow-y-auto">
          {filtered.map(({ name, component: Icon }) => {
            const active = name === value;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                title={name}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                )}
              >
                <Icon size={16} />
                {active && (
                  <Check size={10} className="absolute right-0.5 bottom-0.5" />
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-6 text-center text-xs text-muted-foreground py-3">No icons</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
