import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import { Search, Percent, AlertCircle } from 'lucide-react';
import subscriberService from '../../../services/subscriber.service';

export const AssignDirectDiscountModal = ({
  isOpen,
  onClose,
  onAssignSuccess,
}) => {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(25);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchSubscribers = async () => {
      setLoadingUsers(true);
      try {
        const res = await subscriberService.getSubscribers({
          search: userSearch,
          limit: 10,
        });
        if (res && res.subscribers) {
          setSubscribers(res.subscribers);
          if (!selectedUser && res.subscribers.length > 0) {
            setSelectedUser(res.subscribers[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to search subscribers:', err.message);
      } finally {
        setLoadingUsers(false);
      }
    };

    const timer = setTimeout(fetchSubscribers, 300);
    return () => clearTimeout(timer);
  }, [userSearch, isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedUser) {
      setError('Please select a subscriber to assign concession.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAssignSuccess({
        userId: selectedUser._id,
        email: selectedUser.email,
        discountType,
        discountValue,
        endDate,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign concession.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Direct Subscriber Concession"
      description="Issue a personalized discount voucher directly tied to a designated subscriber."
      confirmLabel="Assign Concession"
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* User Search & Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">
            Beneficiary Subscriber Account
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subscriber by name, email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#E76120]"
            />
          </div>

          <div className="max-h-28 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white mt-1">
            {loadingUsers ? (
              <p className="p-3 text-slate-400 text-center">Searching subscribers...</p>
            ) : subscribers.length === 0 ? (
              <p className="p-3 text-slate-400 text-center">No matching subscribers found.</p>
            ) : (
              subscribers.map((sub) => (
                <div
                  key={sub._id}
                  onClick={() => setSelectedUser(sub)}
                  className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedUser?._id === sub._id
                      ? 'bg-blue-50/70 border-l-4 border-[#284661]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{sub.name}</span>
                    <span className="text-[10px] text-slate-400">{sub.email}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] uppercase font-bold">
                    {sub.userType}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Concession Type & Value */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700">Concession Mode</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120]"
            >
              <option value="percentage">Percentage (%) Concession</option>
              <option value="fixed_amount">Fixed Amount (₹) Off</option>
            </select>
          </div>

          <InputField
            id="val"
            label={discountType === 'percentage' ? 'Percentage Value (%)' : 'Fixed Amount (₹)'}
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            required
          />
        </div>

        <InputField
          id="endDate"
          label="Concession Expiry Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />

        <InputField
          id="notes"
          label="Administrative Remarks / Justification"
          placeholder="e.g. Approved academic scholarship concession..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </AdminModal>
  );
};

export default AssignDirectDiscountModal;
