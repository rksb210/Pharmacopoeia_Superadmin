import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const RecentOrders = ({ orders = [] }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4 select-none font-sans overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-sm">Recent Subscription Orders</h3>
          <p className="text-slate-400 text-xs truncate block">Commercial transactions &amp; licenses</p>
        </div>
        <NavLink
          to="/admin/subscriptions"
          className="text-xs font-bold text-[#E76120] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>All Orders</span>
          <ArrowRight className="w-3 h-3" />
        </NavLink>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5 min-w-0">
        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No recent subscription orders found.</p>
        ) : (
          orders.map((ord) => (
            <div
              key={ord.id}
              className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-2.5 sm:gap-3 hover:border-slate-200 transition-colors min-w-0"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold text-xs">
                  ₹
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="font-bold text-slate-900 text-xs truncate block max-w-full" title={ord.customer}>
                      {ord.customer}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">({ord.id})</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">{ord.type}</span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="font-black text-slate-900 text-xs">
                  ₹{ord.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {ord.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentOrders;
