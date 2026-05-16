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
      className="w-full rounded-2xl border border-border p-4 md:p-6 shadow-sm"
      style={{ backgroundColor: backgroundColor || 'var(--card)' }}
    >
      {children}
    </div>
  );
}
