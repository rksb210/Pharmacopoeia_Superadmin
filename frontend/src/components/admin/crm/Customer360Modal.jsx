import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import CRMSegmentBadge from './CRMSegmentBadge';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  User,
  CreditCard,
  Calendar,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  Ticket,
  Plus,
  Send,
  CheckCircle2,
  TrendingUp,
  Receipt,
  FileText,
  AlertCircle,
  Building,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import crmService from '../../../services/crm.service';

export const Customer360Modal = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'subscriptions' | 'timeline' | 'communications' | 'feedback' | 'discounts'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // CRM Note state
  const [newNote, setNewNote] = useState('');
  const [notePriority, setNotePriority] = useState('medium');
  const [addingNote, setAddingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState('');

  const fetchProfile = async () => {
    if (!customer?._id) return;
    setLoading(true);
    try {
      const res = await crmService.getCustomerProfile360(customer._id);
      if (res && res.profile) {
        setProfileData(res.profile);
      }
    } catch (err) {
      console.warn('Failed to load 360 profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer && isOpen) {
      fetchProfile();
      setActiveTab('overview');
      setNewNote('');
      setNoteFeedback('');
    }
  }, [customer, isOpen]);

  const handleAddNote = async (e) => {
    e?.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      await crmService.addCustomerNote(customer._id, newNote, notePriority);
      setNewNote('');
      setNoteFeedback('Note added to CRM history.');
      setTimeout(() => setNoteFeedback(''), 3000);
      fetchProfile();
    } catch (err) {
      setNoteFeedback(err.message || 'Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  };

  if (!customer) return null;
  const c = profileData?.customer || customer;
  const subs = profileData?.subscriptions || [];
  const tickets = profileData?.feedbackTickets || [];
  const notifs = profileData?.notificationsReceived || [];
  const timeline = profileData?.unifiedTimeline || [];

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customer 360 Dossier: ${c.name}`}
      description={`Unified relationship timeline and commercial ledger for ${c.email}.`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{c.name}</span>
              <CRMSegmentBadge segment={c.segment} />
              <Badge variant="outline" className="text-[9px] uppercase font-bold">
                {c.userType || 'Subscriber'}
              </Badge>
            </div>
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              {c.email} {c.phone ? `· ${c.phone}` : ''} · Registered{' '}
              {new Date(c.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Lifetime Spend (LTV)</span>
            <span className="text-xl font-black text-slate-900">
              ₹{(c.totalLTVSpendINR || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Overview & LTV' },
            { id: 'subscriptions', label: `2. Subscriptions (${subs.length})` },
            { id: 'timeline', label: `3. Unified Timeline (${timeline.length})` },
            { id: 'communications', label: `4. Communications (${notifs.length})` },
            { id: 'feedback', label: `5. Feedback & Tickets (${tickets.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#284661] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & LTV Summary */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5 animate-in fade-in-0 duration-150">
            {/* 4 Metric Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-xl min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">
                  Active Formulary Pass
                </span>
                <span className="text-xs font-black text-slate-900 block truncate mt-0.5">
                  {c.latestSubscription?.planName || 'None / Prospect'}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">
                  Pass Validity
                </span>
                <span className="text-xs font-black text-[#284661] block truncate mt-0.5">
                  {c.latestSubscription?.endDate
                    ? new Date(c.latestSubscription.endDate).toLocaleDateString('en-IN')
                    : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">
                  Total Orders
                </span>
                <span className="text-lg font-black text-slate-900 block truncate">
                  {c.totalOrders || 0}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl min-w-0">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block truncate">
                  Concessions Saved
                </span>
                <span className="text-lg font-black text-emerald-900 block truncate">
                  ₹{(c.totalConcessionsSavedINR || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Dynamic Healthcare Credentials Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <span className="font-bold text-slate-800 block">Verified Category Credentials</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] bg-white p-3 rounded-xl border border-slate-100">
                {c.userType === 'STUDENT' && (
                  <div>
                    <span className="text-slate-400 block">APAAR ID</span>
                    <span className="font-bold text-slate-900">{c.apaarId || 'N/A'}</span>
                  </div>
                )}

                {['DOCTOR', 'PHARMACIST', 'NURSE'].includes(c.userType) && (
                  <>
                    <div>
                      <span className="text-slate-400 block">Medical Registration No</span>
                      <span className="font-bold text-slate-900">{c.registrationNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">State of Council</span>
                      <span className="font-bold text-slate-900">{c.registrationState || 'N/A'}</span>
                    </div>
                  </>
                )}

                {c.userType === 'INDUSTRY' && (
                  <>
                    <div>
                      <span className="text-slate-400 block">GSTIN</span>
                      <span className="font-bold text-slate-900">{c.gstin || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">PAN</span>
                      <span className="font-bold text-slate-900">{c.pan || 'N/A'}</span>
                    </div>
                  </>
                )}

                {c.userType === 'OTHERS' && (
                  <div>
                    <span className="text-slate-400 block">Designation</span>
                    <span className="font-bold text-slate-900">{c.designation || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Administrative Staff CRM Notes Section */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-3">
              <span className="font-bold text-slate-800 block">Staff Relationship Notes &amp; Touchpoints</span>

              {noteFeedback && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                  {noteFeedback}
                </div>
              )}

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Record customer communication summary, phone interaction, or institutional preference..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">Priority:</span>
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNotePriority(p)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                          notePriority === p ? 'bg-[#284661] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    variant="nfiYellow"
                    size="sm"
                    loading={addingNote}
                    className="h-7 rounded-xl font-bold text-xs shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Note</span>
                  </Button>
                </div>
              </form>

              {/* Past Notes Stream */}
              {c.crmNotes && c.crmNotes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
                  {c.crmNotes.map((n, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{n.authorName} ({n.authorRole})</span>
                        <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-slate-700 text-xs">{n.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Subscription & Order History */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in-0 duration-150">
            {subs.length === 0 ? (
              <p className="text-center py-8 text-slate-400">No subscriptions or orders issued.</p>
            ) : (
              subs.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {s.subscriptionId}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold">
                        {s.tier}
                      </Badge>
                      <Badge variant={s.status === 'active' ? 'nfiNavy' : 'secondary'} className="text-[9px] font-bold uppercase">
                        {s.status}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-0.5">{s.planName}</h4>
                    <span className="text-[11px] text-slate-400">
                      Valid through: <strong className="text-slate-700">{new Date(s.endDate).toLocaleDateString('en-IN')}</strong> · Invoice: <span className="font-mono">{s.invoiceNumber || 'N/A'}</span>
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 block">
                      ₹{s.finalAmount?.toLocaleString('en-IN')}
                    </span>
                    {s.discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Saved ₹{s.discountAmount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Unified Multi-System Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in-0 duration-150">
            {timeline.length === 0 ? (
              <p className="text-center py-8 text-slate-400">No interactions recorded.</p>
            ) : (
              timeline.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#284661] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-slate-900 truncate">{evt.action}</span>
                        {evt.badge && (
                          <Badge variant="outline" className="text-[9px] uppercase font-semibold shrink-0">
                            {evt.badge}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 break-words">{evt.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Communications */}
        {activeTab === 'communications' && (
          <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in-0 duration-150">
            {notifs.length === 0 ? (
              <p className="text-center py-8 text-slate-400">No communication broadcasts dispatched to this user.</p>
            ) : (
              notifs.map((n, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[8px] uppercase font-bold">
                        {n.category}
                      </Badge>
                      <span className="font-bold text-slate-900">{n.title}</span>
                    </div>
                    <span>{new Date(n.sentAt || n.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{n.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Feedback & Inquiries */}
        {activeTab === 'feedback' && (
          <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in-0 duration-150">
            {tickets.length === 0 ? (
              <p className="text-center py-8 text-slate-400">No feedback tickets filed by this subscriber.</p>
            ) : (
              tickets.map((t, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">{t.ticketId}</span>
                      <Badge variant="outline" className="text-[8px] uppercase font-bold">
                        {t.status}
                      </Badge>
                    </div>
                    <span>{new Date(t.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs block">{t.subject}</span>
                  <p className="text-[11px] text-slate-600">{t.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default Customer360Modal;
