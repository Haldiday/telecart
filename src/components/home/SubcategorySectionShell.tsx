import type { ReactNode } from 'react';

interface SubcategorySectionShellProps {
  compact?: boolean;
  backgroundColor?: string | null;
  children: ReactNode;
}

export default function SubcategorySectionShell({
  compact = false,
  backgroundColor,
  children,
}: SubcategorySectionShellProps) {
  if (!compact) return <>{children}</>;

  return (
    <div
      className="w-full rounded-none border border-border pt-3 pb-4 px-4 md:px-6 shadow-sm"
      style={{ backgroundColor: backgroundColor || 'var(--card)' }}
    >
      {children}
    </div>
  );
}
