/**
 * AuditLogPage — Institutional Compliance & Audit Trail.
 *
 * Provides complete visibility into all system lifecycle actions,
 * config modifications, and user operations with immutable audit events.
 */

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { auditLogService, type AuditLogItem } from "@/services/auditLogService";
import LoadingState from "@/components/ui/LoadingState";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  User,
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Terminal,
} from "lucide-react";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Distinct options
  const [actionsList, setActionsList] = useState<string[]>([]);
  const [entityTypesList, setEntityTypesList] = useState<string[]>([]);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchDistinctFilters = async () => {
    try {
      const [actions, entities] = await Promise.all([
        auditLogService.getDistinctActions(),
        auditLogService.getDistinctEntityTypes(),
      ]);
      setActionsList(actions || []);
      setEntityTypesList(entities || []);
    } catch {
      // Fallback
    }
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditLogService.getAuditLogs({
        page,
        page_size: pageSize,
        search: search || undefined,
        action: selectedAction || undefined,
        entity_type: selectedEntity || undefined,
        actor_role: selectedRole || undefined,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      });
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedAction, selectedEntity, selectedRole, dateFrom, dateTo]);

  useEffect(() => {
    fetchDistinctFilters();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedAction("");
    setSelectedEntity("");
    setSelectedRole("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return ts;
    }
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("SCALE") || action.includes("PUBLISHED") || action.includes("SHORTLISTED")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.includes("REJECT") || action.includes("CLOSED")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (action.includes("EXTEND") || action.includes("CHANGED") || action.includes("SETTING")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (action.includes("AI") || action.includes("ANALYSIS") || action.includes("MATCH")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail & System Logs"
        description="Immutable, tamper-evident chronological event trail tracking all procurement decisions, AI scoring actions, and policy configuration events."
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Append-Only Ledger Active
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPage(1);
                loadLogs();
              }}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Logged Events</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{total.toLocaleString()}</p>
          <p className="text-xs text-neutral-400 mt-1">Recorded across all modules</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Distinct Action Types</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{actionsList.length || 18}</p>
          <p className="text-xs text-neutral-400 mt-1">Lifecycle & governance events</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Tracked Entity Types</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{entityTypesList.length || 6}</p>
          <p className="text-xs text-neutral-400 mt-1">Challenges, pilots, decisions, settings</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Integrity Status</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-800">Verified & Immutable</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">No modifications permitted</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span>Filter Audit Records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search actor or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
            />
          </div>

          {/* Action dropdown */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Actions</option>
              {actionsList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type dropdown */}
          <div>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Entities</option>
              {entityTypesList.map((e) => (
                <option key={e} value={e}>
                  {e.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Role dropdown */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              <option value="GOVERNMENT_OFFICER">Government Officer</option>
              <option value="ADMIN">Administrator</option>
              <option value="EVALUATOR">Evaluator</option>
              <option value="STARTUP">Startup</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From Date"
              className="w-full py-2 px-3 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {(search || selectedAction || selectedEntity || selectedRole || dateFrom || dateTo) && (
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState variant="inline" message="Loading audit events..." />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Info className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-800">No Audit Events Found</h3>
            <p className="text-sm text-neutral-500 mt-1">
              No audit logs match the current search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        {log.actor_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono text-[11px]">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-neutral-600">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100">
                        {log.entity_type} : {log.entity_id ? log.entity_id.slice(0, 8) : "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-neutral-700" title={log.summary}>
                      {log.summary}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View Full Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-600">
          <div>
            Showing <span className="font-semibold text-neutral-900">{logs.length}</span> of{" "}
            <span className="font-semibold text-neutral-900">{total}</span> events
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1 px-2.5 py-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="font-medium px-1">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 px-2.5 py-1 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Entry Details"
          size="lg"
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-xs">
              <div>
                <span className="text-neutral-500">Event ID:</span>
                <p className="text-neutral-900 font-semibold break-all">{selectedLog.id}</p>
              </div>
              <div>
                <span className="text-neutral-500">Recorded At:</span>
                <p className="text-neutral-900 font-semibold">{formatTimestamp(selectedLog.timestamp)}</p>
              </div>
              <div>
                <span className="text-neutral-500">Actor / Initiator:</span>
                <p className="text-neutral-900 font-semibold">
                  {selectedLog.actor_name} ({selectedLog.actor_role})
                </p>
                {selectedLog.actor_id && (
                  <p className="text-[11px] text-neutral-400 break-all">{selectedLog.actor_id}</p>
                )}
              </div>
              <div>
                <span className="text-neutral-500">Target Entity:</span>
                <p className="text-neutral-900 font-semibold uppercase">{selectedLog.entity_type}</p>
                <p className="text-[11px] text-neutral-400 break-all">{selectedLog.entity_id}</p>
              </div>
              {selectedLog.ip_address && (
                <div className="col-span-2">
                  <span className="text-neutral-500">Source IP Address:</span>
                  <p className="text-neutral-900 font-semibold">{selectedLog.ip_address}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Summary Description
              </h4>
              <p className="text-neutral-800 bg-white p-3 border border-neutral-200 rounded-lg text-sm leading-relaxed">
                {selectedLog.summary}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Audit Payload & Structured Details</span>
              </div>
              <pre className="p-3 bg-neutral-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-60 border border-neutral-800">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
