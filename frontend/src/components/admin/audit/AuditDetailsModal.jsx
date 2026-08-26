import React from 'react';
import AdminModal from '../common/AdminModal';
import AuditStatusBadge from './AuditStatusBadge';
import AuditModuleBadge from './AuditModuleBadge';
import { Badge } from '../../ui/badge';
import {
  ShieldCheck,
  User,
  Clock,
  Laptop,
  Globe,
  FileCode,
  AlertCircle,
  Database,
  ArrowRight,
} from 'lucide-react';

export const AuditDetailsModal = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!log) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Event Dossier"
      description={`Tamper-evident system log recorded on ${new Date(log.createdAt).toLocaleString('en-IN')}.`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {log.action}
              </span>
              <AuditStatusBadge status={log.status} />
              <AuditModuleBadge module={log.module} />
            </div>
            <p className="text-slate-500 text-xs mt-1 truncate">
              {log.details || 'Administrative action logged to immutable audit ledger.'}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {new Date(log.createdAt).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Operator Profile & Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Operator Details */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-[#284661]" />
              <span>Operator Identity</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <strong className="text-slate-900">{log.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-700">{log.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <Badge variant="outline" className="text-[8px] uppercase font-bold">
                  {log.userRole}
                </Badge>
              </div>
            </div>
          </div>

          {/* Client Telemetry */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Globe className="w-3.5 h-3.5 text-[#284661]" />
              <span>Network &amp; Client Telemetry</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Client IP:</span>
                <span className="font-mono font-bold text-slate-900">{log.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HTTP Endpoint:</span>
                <span className="font-mono text-slate-700 truncate max-w-[180px]">
                  {log.requestMethod} {log.requestUrl || '/'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">User Agent:</span>
                <span className="text-slate-600 truncate max-w-[180px]" title={log.userAgent}>
                  {log.userAgent}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Entity Specs */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Target Entity Type</span>
            <strong className="text-slate-900 font-mono text-xs">{log.entity}</strong>
          </div>

          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Entity Reference ID</span>
            <strong className="text-slate-900 font-mono text-xs">{log.entityId || 'N/A'}</strong>
          </div>
        </div>

        {/* Error Message (if failed) */}
        {log.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-red-900">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Execution Error Telemetry</span>
            </div>
            <p className="text-[11px] font-mono">{log.errorMessage}</p>
          </div>
        )}

        {/* Before / After Diff Inspector */}
        {(log.oldValues || log.newValues) && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <FileCode className="w-3.5 h-3.5 text-[#E76120]" />
              <span>State Mutation Snapshot (Before vs After)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Old Values */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  1. Previous State (Old Values)
                </span>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] overflow-x-auto max-h-40 border border-slate-800">
                  {log.oldValues ? JSON.stringify(log.oldValues, null, 2) : '// No previous state recorded'}
                </pre>
              </div>

              {/* New Values */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                  2. Updated State (New Values)
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[10px] overflow-x-auto max-h-40 border border-slate-800">
                  {log.newValues ? JSON.stringify(log.newValues, null, 2) : '// No new state snapshot'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default AuditDetailsModal;
