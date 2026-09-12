import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchAdminAuditLogs, type AdminAuditLog, type AdminAuditLogFilters } from '@/lib/api/adminAuditLogs';

export interface AdminAuditLogScope {
  title: string;
  entityTable: string;
}

export default function AdminAuditLog({ scope }: { scope?: AdminAuditLogScope | null }) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [filters, setFilters] = useState<AdminAuditLogFilters>(() => ({
    page: 1,
    pageSize: 20,
    ...(scope?.entityTable ? { entityTable: scope.entityTable } : {}),
  }));
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters({
      page: 1,
      pageSize: 20,
      ...(scope?.entityTable ? { entityTable: scope.entityTable } : {}),
    });
  }, [scope?.entityTable]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAdminAuditLogs(filters)
      .then((result) => {
        if (!mounted) return;
        setLogs(result.logs);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setError(null);
      })
      .catch((requestError) => mounted && setError(requestError instanceof Error ? requestError.message : 'Unable to load audit logs'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [filters]);

  return (
    <section className="max-w-7xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold">{scope?.title ? `${scope.title} Audit Log` : 'Audit Log'}</h2>
        <p className="text-sm text-muted-foreground">
          {scope?.title ? `${total} recorded ${scope.title.toLowerCase()} admin actions` : `${total} recorded admin actions`}
        </p>
      </div>

      {loading ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading audit logs...</div> : error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Time</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Entity</th></tr></thead>
            <tbody>
              {logs.map((log) => {
                return <tr key={log.id} className="border-b border-border/60 align-top last:border-0">
                  <td className="whitespace-nowrap p-3">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-3">{log.actor_name || log.actor_email || 'Unknown'}</td>
                  <td className="p-3 capitalize">{log.action}</td>
                  <td className="p-3">{log.description}</td>
                </tr>;
              })}
              {!logs.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No audit records found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm"><span>Page {filters.page} of {totalPages || 1}</span><div className="flex gap-2"><button type="button" className="rounded border border-border px-3 py-1.5 disabled:opacity-50" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><button type="button" className="rounded border border-border px-3 py-1.5 disabled:opacity-50" disabled={!totalPages || filters.page >= totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></div>
    </section>
  );
}
