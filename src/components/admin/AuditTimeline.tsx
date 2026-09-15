import { useEffect, useState } from 'react';
import { Loader2, History, ShieldAlert, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  fetchAuditLogs,
  type AuditLogDisplay,
  type AuditModule,
} from '@/lib/auditService';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const NO_SESSION_MESSAGES = new Set([
  'Sign in as admin to view audit history',
  'Admin access is required to view audit history',
]);

function formatDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getActionTone(action: string): { bg: string; fg: string; label: string } {
  switch (action) {
    case 'create':
      return { bg: 'bg-emerald-500/10', fg: 'text-emerald-600', label: 'Created' };
    case 'delete':
      return { bg: 'bg-red-500/10', fg: 'text-red-600', label: 'Deleted' };
    default:
      return { bg: 'bg-amber-500/10', fg: 'text-amber-600', label: 'Updated' };
  }
}

interface Props {
  module: AuditModule;
  adSlot?: 1 | 2 | 3;
}

export default function AuditTimeline({ module, adSlot }: Props) {
  const [logs, setLogs] = useState<AuditLogDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLogs(module);
      setLogs(adSlot ? data.filter((log) => log.ad_slot === adSlot) : data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit log';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [module, adSlot]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading audit history…</p>
      </div>
    );
  }

  if (error) {
    const isNoSession = NO_SESSION_MESSAGES.has(error);
    if (isNoSession) {
      return (
        <Card className="border-muted">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Info className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">Audit history not available</p>
            <p className="text-sm text-muted-foreground/80">{error}.</p>
            <button
              onClick={() => void load()}
              className="mt-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="font-medium text-destructive">Failed to load audit history</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <History className="h-10 w-10 text-muted-foreground/60" />
          <p className="font-medium text-muted-foreground">No activity yet</p>
          
        </CardContent>
      </Card>
    );
  }

  const groups = new Map<string, AuditLogDisplay[]>();
  for (const log of logs) {
    const key = formatDateKey(log.created_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Audit History</h2>
          <span className="text-xs text-muted-foreground">
            {logs.length} record{logs.length === 1 ? '' : 's'}
          </span>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      {Array.from(groups.entries()).map(([dateLabel, dayLogs]) => (
        <div key={dateLabel} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {dateLabel}
            </div>
            <Separator className="flex-1" />
          </div>
          <ol className="relative ml-4 border-l border-border pl-6">
            {dayLogs.map((log) => {
              const tone = getActionTone(log.action);
              return (
                <li key={log.id} className="relative mb-6 last:mb-0">
                  <span
                    className={`absolute -left-[34px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-background ring-2 ring-background ${tone.bg}`}
                  >
                    <span className={`block h-2 w-2 rounded-full ${tone.bg.replace('/10', '')}`} />
                  </span>
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums font-medium text-foreground/80">
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={log.actor_avatar ?? undefined} alt={log.actor_name ?? ''} />
                      <AvatarFallback className="text-[10px] font-semibold">
                        {getInitials(log.actor_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{log.actor_name ?? 'Unknown Admin'}</span>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <p className="text-sm leading-relaxed">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.bg} ${tone.fg} mr-2`}>
                        {tone.label}
                      </span>
                      {(log.description ?? `${tone.label} ${log.entity_name ?? 'audit entry'}`).replace(/^(Created|Updated|Deleted)\s*/, '')}
                    </p>
                    {log.hierarchy_path && (
                      <p className="pl-2 text-xs text-muted-foreground">
                        <span className="text-muted-foreground/70">in </span>
                        <span className="font-mono">{log.hierarchy_path}</span>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
