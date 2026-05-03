'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepperItem {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepperItem[];
  current: number;
  orientation?: 'horizontal' | 'vertical';
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({ steps, current, orientation = 'horizontal', onStepClick, className }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <ol className={cn('flex flex-col gap-1', className)}>
        {steps.map((step, i) => {
          const status = i < current ? 'done' : i === current ? 'active' : 'pending';
          const Tag: any = onStepClick && i <= current ? 'button' : 'div';
          return (
            <li key={step.label} className="relative">
              <Tag
                type={onStepClick ? 'button' : undefined}
                onClick={onStepClick && i <= current ? () => onStepClick(i) : undefined}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors',
                  onStepClick && i <= current && 'cursor-pointer hover:bg-accent/40',
                  status === 'active' && 'bg-accent/40'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                    status === 'done' && 'border-primary bg-primary text-primary-foreground',
                    status === 'active' && 'border-primary bg-background text-primary',
                    status === 'pending' && 'border-muted-foreground/30 bg-background text-muted-foreground'
                  )}
                >
                  {status === 'done' ? <Check size={13} /> : i + 1}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      'text-sm font-medium leading-tight',
                      status === 'pending' && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{step.description}</p>
                  )}
                </div>
              </Tag>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[22px] top-[42px] h-3 w-px transition-colors',
                    status === 'done' ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={cn('flex items-center gap-2', className)}>
      {steps.map((step, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : 'pending';
        return (
          <li key={step.label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                status === 'done' && 'border-primary bg-primary text-primary-foreground',
                status === 'active' && 'border-primary bg-background text-primary',
                status === 'pending' && 'border-muted-foreground/30 bg-background text-muted-foreground'
              )}
            >
              {status === 'done' ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block',
                status === 'pending' && 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 transition-colors',
                  status === 'done' ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
