import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt = '', fallback, size = 'md', className }: AvatarProps) {
  const sizes = { sm: 32, md: 40, lg: 56 };
  const dim = sizes[size];
  const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }[size];

  if (src) {
    return (
      <div className={cn('relative overflow-hidden rounded-full', sizeClass, className)}>
        <Image src={src} alt={alt} width={dim} height={dim} className="object-cover" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center rounded-full bg-brand/10 font-medium text-brand', sizeClass, className)}>
      {fallback ?? alt.charAt(0).toUpperCase()}
    </div>
  );
}
