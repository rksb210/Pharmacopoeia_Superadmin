import React, { useState } from 'react';
import AdminModal from '../common/AdminModal';
import NotificationCategoryBadge from './NotificationCategoryBadge';
import NotificationPriorityBadge from './NotificationPriorityBadge';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Bell,
  Mail,
  MessageSquare,
  Megaphone,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const NotificationPreviewModal = ({
  isOpen,
  onClose,
  notification,
}) => {
  const [activeChannel, setActiveChannel] = useState('in_app'); // 'in_app' | 'email' | 'sms' | 'banner'

  if (!notification) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Multi-Channel Notification Live Preview"
      description={`Real-time simulation of how "${notification.title}" renders across digital touchpoints.`}
      confirmLabel="Close Preview"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Channel Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'in_app', label: 'In-App Drawer', icon: Bell },
            { id: 'email', label: 'HTML Email Client', icon: Mail },
            { id: 'sms', label: 'Mobile SMS Text', icon: MessageSquare },
            { id: 'banner', label: 'Top Broadcast Banner', icon: Megaphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeChannel === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChannel(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#284661] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. IN-APP PREVIEW */}
        {activeChannel === 'in_app' && (
          <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl space-y-2.5 animate-in fade-in-0 duration-150">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              In-App Notification Center (Drawer Mockup)
            </span>

            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2.5 max-w-lg mx-auto">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#284661] flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <NotificationCategoryBadge category={notification.category} />
                    <span className="text-[10px] text-slate-400 ml-1.5 font-medium">Just now</span>
                  </div>
                </div>

                <NotificationPriorityBadge priority={notification.priority} />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{notification.title}</h4>
                <p className="text-slate-600 text-xs leading-relaxed">{notification.message}</p>
              </div>

              {notification.actionUrl && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E76120] hover:underline cursor-pointer"
                  >
                    <span>{notification.actionLabel || 'View Details'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. EMAIL PREVIEW */}
        {activeChannel === 'email' && (
          <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl space-y-2.5 animate-in fade-in-0 duration-150">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Official IPC HTML Email Client Mockup
            </span>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden max-w-xl mx-auto">
              {/* Email Client Header Bar */}
              <div className="p-3 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 space-y-0.5 font-mono">
                <div>
                  <strong>From:</strong> National Formulary of India &lt;notifications@ipc.gov.in&gt;
                </div>
                <div>
                  <strong>Subject:</strong> {notification.title}
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-6 space-y-4 font-sans">
                {/* IPC Emblem Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#284661] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                    NFI
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-sm">
                      Indian Pharmacopoeia Commission
                    </h5>
                    <p className="text-slate-400 text-[10px]">Ministry of Health &amp; Family Welfare</p>
                  </div>
                </div>

                {/* Priority & Title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <NotificationCategoryBadge category={notification.category} />
                    <NotificationPriorityBadge priority={notification.priority} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {notification.title}
                  </h3>
                </div>

                {/* Message Body */}
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl text-slate-700 text-xs leading-relaxed">
                  {notification.message}
                </div>

                {/* Action CTA Button */}
                {notification.actionUrl && (
                  <div className="pt-2 text-center">
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="inline-block px-6 py-2.5 bg-[#284661] text-white font-bold rounded-xl text-xs shadow-2xs"
                    >
                      {notification.actionLabel || 'View Official Portal'}
                    </a>
                  </div>
                )}

                {/* Email Footer */}
                <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  <p>National Formulary of India (9th Edition) · Official Government Notification</p>
                  <p>Sector 23, Raj Nagar, Ghaziabad, Uttar Pradesh 201002</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SMS MOBILE PREVIEW */}
        {activeChannel === 'sms' && (
          <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl space-y-2.5 animate-in fade-in-0 duration-150">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mobile Smartphone SMS Preview
            </span>

            <div className="w-72 mx-auto bg-slate-900 p-3 rounded-[32px] shadow-lg border-4 border-slate-800">
              {/* Phone Speaker Notch */}
              <div className="w-16 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />

              <div className="bg-white rounded-[24px] p-4 min-h-[260px] flex flex-col justify-between">
                <div className="text-center border-b border-slate-100 pb-2 mb-3">
                  <span className="font-bold text-slate-800 text-[11px] block">IPC-NFI-ALERT</span>
                  <span className="text-[9px] text-slate-400 font-mono">Today 12:30 PM</span>
                </div>

                {/* SMS Bubble */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-xs text-[11px] text-slate-800 space-y-1 shadow-2xs">
                  <span className="font-bold text-[#284661] block leading-tight">
                    [NFI Alert] {notification.title}
                  </span>
                  <p className="leading-relaxed text-[10px] text-slate-600">{notification.message}</p>
                  {notification.actionUrl && (
                    <span className="text-[10px] font-mono text-[#E76120] block pt-1">
                      Link: ipc.gov.in/nfi/{notification._id?.slice(-6) || 'alert'}
                    </span>
                  )}
                </div>

                <div className="text-center pt-4 text-[9px] text-slate-400">
                  <span>Govt. of India Telecommunication Gateway</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. BROADCAST STICKY BANNER PREVIEW */}
        {activeChannel === 'banner' && (
          <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl space-y-2.5 animate-in fade-in-0 duration-150">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Platform-Wide Sticky Top Alert Banner Mockup
            </span>

            <div className="p-3.5 bg-gradient-to-r from-[#284661] to-[#E76120] text-white rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Megaphone className="w-3.5 h-3.5 text-[#FFD243]" />
                </div>
                <div className="min-w-0">
                  <span className="font-black text-xs block truncate">{notification.title}</span>
                  <span className="text-[10px] text-white/80 block truncate">{notification.message}</span>
                </div>
              </div>

              {notification.actionUrl && (
                <button
                  type="button"
                  className="px-3 py-1 bg-white text-[#284661] font-bold rounded-xl text-[10px] shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  {notification.actionLabel || 'Check Now'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default NotificationPreviewModal;
