import { ReactNode } from 'react';

export function TypographySmall({ children }: { children: ReactNode }) {
  return <small className="text-sm font-medium leading-none">{children}</small>;
}
