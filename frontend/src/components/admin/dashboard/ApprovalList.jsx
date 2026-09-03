import React from 'react';
import { CheckCircle, Eye, GitPullRequest, ArrowRight } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { NavLink } from 'react-router-dom';

export const ApprovalList = ({
  title = 'Pending Committee Approvals',
  subtitle = 'Monographs requiring editorial / committee action',
  items = [],
  roleType = 'admin',
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4 select-none font-sans overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            <Badge variant="nfiYellow" className="text-[9px] px-1.5 py-0 font-bold uppercase">
              {items.length} Pending
            </Badge>
          </div>
          <p className="text-slate-400 text-xs truncate block">{subtitle}</p>
        </div>

        <NavLink
          to="/admin/content-workflow"
          className="text-xs font-bold text-[#E76120] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Open Workflow</span>
          <ArrowRight className="w-3 h-3" />
        </NavLink>
      </div>

      {/* Approvals List */}
      <div className="space-y-2.5 min-w-0">
        {items.length === 0 ? (
          <div className="p-6 sm:p-8 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
            <GitPullRequest className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
            <p className="text-xs font-semibold">Workflow inbox is clear! No pending items.</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 sm:p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:border-slate-200 transition-colors min-w-0"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-bold text-slate-900 text-xs truncate block max-w-full" title={item.title}>
                    {item.title}
                  </span>
                  {item.priority && (
                    <Badge
                      variant={item.priority === 'High' ? 'destructive' : 'secondary'}
                      className="text-[9px] px-1.5 py-0 uppercase font-bold shrink-0"
                    >
                      {item.priority}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[10px] sm:text-[11px] text-slate-400">
                  <span>ID: <strong className="text-slate-600 font-mono">{item.id}</strong></span>
                  {item.author && <span>Author: <strong className="text-slate-600">{item.author}</strong></span>}
                  {item.verifiedBy && <span>Verified: <strong className="text-slate-600">{item.verifiedBy}</strong></span>}
                  {item.submittedAt && <span>Submitted: {item.submittedAt}</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
                <NavLink to="/admin/content-workflow">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 rounded-lg text-[11px] font-semibold"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    <span>Inspect</span>
                  </Button>
                </NavLink>

                {(roleType === 'approver' || roleType === 'superadmin') && (
                  <NavLink to="/admin/content-workflow">
                    <Button
                      variant="nfiYellow"
                      size="sm"
                      className="h-7 px-2.5 rounded-lg text-[11px] font-bold shadow-2xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span>Sign &amp; Approve</span>
                    </Button>
                  </NavLink>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalList;
