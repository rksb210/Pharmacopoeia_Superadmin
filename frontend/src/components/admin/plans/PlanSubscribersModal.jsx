import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { Badge } from '../../ui/badge';
import { Search, UserCheck, Calendar, ShoppingBag } from 'lucide-react';
import planService from '../../../services/plan.service';

export const PlanSubscribersModal = ({
  isOpen,
  onClose,
  plan,
}) => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!plan || !isOpen) return;

    const fetchSubscribers = async () => {
      setLoading(true);
      try {
        const res = await planService.getPlanSubscribers(plan._id, { search });
        if (res && res.subscriptions) {
          setSubscribers(res.subscriptions);
          setTotal(res.pagination?.total || 0);
        }
      } catch (err) {
        console.warn('Failed to load plan subscribers:', err.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSubscribers, 300);
    return () => clearTimeout(timer);
  }, [plan, search, isOpen]);

  if (!plan) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enrolled Subscribers: ${plan.name}`}
      description={`Displaying ${subscribers.length} of ${total} active subscribers holding this pass.`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-3.5 text-xs select-none font-sans">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search enrolled subscribers by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#E76120]"
          />
        </div>

        {/* Subscribers Table */}
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-2xs">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Loading plan subscribers...</p>
          ) : subscribers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
              <p className="font-semibold text-xs">No active subscribers found for this plan.</p>
            </div>
          ) : (
            subscribers.map((sub) => (
              <div
                key={sub._id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#284661] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {sub.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{sub.user?.name}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold px-1 py-0">
                        {sub.user?.userType || 'User'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {sub.user?.email} {sub.user?.phoneNumber ? `· ${sub.user.phoneNumber}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto text-right">
                  <div>
                    <span className="font-mono text-slate-400 text-[10px] block">
                      {sub.subscriptionId}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      Expires: {new Date(sub.endDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <Badge
                    variant={sub.status === 'active' ? 'nfiNavy' : 'secondary'}
                    className="text-[9px] uppercase font-bold"
                  >
                    {sub.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminModal>
  );
};

export default PlanSubscribersModal;
