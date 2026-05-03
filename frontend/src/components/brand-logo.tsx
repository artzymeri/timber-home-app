import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * The Timber Home triangle mark. Renders the PNG from /public so it stays
 * sharp at any size and respects the original color (teal/navy gradient).
 */
export function BrandLogo({ size = 32, className, alt = 'Timber Home' }: BrandLogoProps) {
  return (
    <Image
      src="/timber-home-logo.png"
      alt={alt}
      width={size}
      height={size}
      priority
      className={cn('object-contain', className)}
    />
  );
}
