import type { ReactNode } from 'react';

interface SubcategorySectionShellProps {
  compact?: boolean;
  backgroundColor?: string | null;
  children: ReactNode;
  hasHeading?: boolean;
}

export default function SubcategorySectionShell({
  compact = false,
  backgroundColor,
  children,
  hasHeading = true,
}: SubcategorySectionShellProps) {
  if (!compact) return <>{children}</>;

  return (
    <div
      className={`w-full rounded-none border border-border px-4 md:px-6 shadow-sm ${
        hasHeading ? 'pt-3 pb-4' : 'py-4 md:py-6'
      }`}
      style={{ backgroundColor: backgroundColor || 'var(--card)' }}
    >
      {children}
    </div>
  );
}
