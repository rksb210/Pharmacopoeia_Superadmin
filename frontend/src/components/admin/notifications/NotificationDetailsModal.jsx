import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Edit2,
  Users,
  Calendar,
} from 'lucide-react';
import notificationService from '../../../services/notification.service';

export const NotificationDetailsModal = ({
  isOpen,
  onClose,
  notification,
  onEdit,
  onPreview,
  onDispatch,
}) => {
  const [detailedNotif, setDetailedNotif] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notification || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await notificationService.getNotificationById(notification._id);
        if (res && res.notification) {
          setDetailedNotif(res.notification);
        }
      } catch (err) {
        console.warn('Failed to load notification details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [notification, isOpen]);

  if (!notification) return null;
  const n = detailedNotif || notification;

  const target = n.deliveryStats?.targetCount || 0;
  const delivered = n.deliveryStats?.deliveredCount || 0;
  const read = n.deliveryStats?.readCount || 0;
  const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Campaign Details & Delivery Tracking"
      description={`Multi-channel telemetry and delivery metrics for "${n.title}".`}
      confirmLabel="Close"
      onConfirm={onClose}
      size="lg"
    >
      <div className="space-y-4 text-xs select-none font-sans overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <NotificationCategoryBadge category={n.category} />
              <NotificationPriorityBadge priority={n.priority} />
              <Badge variant="outline" className="text-[9px] font-bold uppercase">
                {n.status}
              </Badge>
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1 break-words">{n.title}</h3>
            <p className="text-slate-500 text-xs mt-0.5 break-words">{n.message}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                if (onPreview) onPreview(n);
              }}
              className="h-8 rounded-xl font-bold text-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>Preview</span>
            </Button>

            {n.status !== 'sent' && (
              <Button
                type="button"
                variant="nfiYellow"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onDispatch) onDispatch(n);
                }}
                className="h-8 rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Dispatch Now</span>
              </Button>
            )}
          </div>
        </div>

        {/* 4 Metric Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">
              Target Audience
            </span>
            <span className="text-lg font-black text-slate-900 block truncate">{target}</span>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center min-w-0">
            <span className="text-[10px] font-bold text-[#284661] uppercase block truncate">
              Delivered
            </span>
            <span className="text-lg font-black text-slate-900 block truncate">{delivered}</span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center min-w-0">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block truncate">
              Read / Opened
            </span>
            <span className="text-lg font-black text-emerald-900 block truncate">{read}</span>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-center min-w-0">
            <span className="text-[10px] font-bold text-purple-700 uppercase block truncate">
              Engagement Rate
            </span>
            <span className="text-lg font-black text-purple-900 block truncate">{readRate}%</span>
          </div>
        </div>

        {/* Channel Breakdown Cards */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Multi-Channel Telemetry Summary
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* In-App */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-[#284661]">
                <Bell className="w-4 h-4" />
                <span>In-App Center</span>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Dispatched:</span>
                <strong className="text-slate-900">
                  {n.deliveryStats?.channelsSummary?.in_app?.sent || 0}
                </strong>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Read Receipts:</span>
                <strong className="text-emerald-700">
                  {n.deliveryStats?.channelsSummary?.in_app?.read || 0}
                </strong>
              </div>
            </div>

            {/* Email */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                <Mail className="w-4 h-4" />
                <span>HTML Email</span>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Dispatched:</span>
                <strong className="text-slate-900">
                  {n.deliveryStats?.channelsSummary?.email?.sent || 0}
                </strong>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Opens:</span>
                <strong className="text-emerald-700">
                  {n.deliveryStats?.channelsSummary?.email?.opened || 0}
                </strong>
              </div>
            </div>

            {/* SMS */}
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-[#E76120]">
                <MessageSquare className="w-4 h-4" />
                <span>SMS Gateway</span>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Dispatched:</span>
                <strong className="text-slate-900">
                  {n.deliveryStats?.channelsSummary?.sms?.sent || 0}
                </strong>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Delivered:</span>
                <strong className="text-emerald-700">
                  {n.deliveryStats?.channelsSummary?.sms?.delivered || 0}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminModal>
  );
};

export default NotificationDetailsModal;
