import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  size?: 'narrow' | 'default' | 'wide' | 'full';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<PageContainerProps['size']>, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-6xl',
  wide: 'max-w-screen-2xl',
  full: 'max-w-none',
};

export function PageContainer({ children, size = 'default', className }: PageContainerProps) {
  return (
    <div className={cn('w-full mx-auto', SIZE_CLASS[size], className)}>
      {children}
    </div>
  );
}
