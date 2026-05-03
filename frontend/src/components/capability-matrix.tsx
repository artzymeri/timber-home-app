'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import {
  AREA_LABEL_KEYS,
  CAPABILITIES,
  CAPABILITY_AREAS,
  type CapabilityArea,
  type CapabilityDef,
} from '@/lib/capabilities';
import { cn } from '@/lib/utils';

interface CapabilityMatrixProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function CapabilityMatrix({ value, onChange, disabled }: CapabilityMatrixProps) {
  const { t } = useI18n();
  const grouped: Record<CapabilityArea, CapabilityDef[]> = CAPABILITY_AREAS.reduce(
    (acc, a) => {
      acc[a] = [];
      return acc;
    },
    {} as Record<CapabilityArea, CapabilityDef[]>
  );
  for (const cap of CAPABILITIES) grouped[cap.area].push(cap);

  const toggle = (key: string, next: boolean) => {
    if (disabled) return;
    if (next) {
      if (!value.includes(key)) onChange([...value, key]);
    } else {
      onChange(value.filter((v) => v !== key));
    }
  };

  return (
    <div className={cn('space-y-5', disabled && 'opacity-60 pointer-events-none')}>
      {CAPABILITY_AREAS.map((area, idx) => {
        const caps = grouped[area];
        if (caps.length === 0) return null;
        return (
          <div key={area} className="space-y-3">
            {idx > 0 && <Separator />}
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(AREA_LABEL_KEYS[area])}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {caps.map((cap) => {
                const checked = value.includes(cap.key);
                const id = `cap-${cap.key}`;
                return (
                  <label
                    key={cap.key}
                    htmlFor={id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                      checked ? 'border-primary/40 bg-primary/5' : 'hover:bg-accent/40'
                    )}
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(next) => toggle(cap.key, next === true)}
                      disabled={disabled}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                        {t(cap.labelKey)}
                      </Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t(cap.descriptionKey)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
