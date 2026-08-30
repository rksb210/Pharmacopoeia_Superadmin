import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import marqueeAlertService from '../../services/marqueeAlert.service';

const TYPE_STYLES = {
  info: {
    bg: 'bg-blue-50/90 border-blue-200 text-blue-950',
    tagBg: 'bg-[#284661] text-white',
    icon: Info,
    iconColor: 'text-[#284661]',
    btnStyle: 'bg-[#284661] text-white hover:bg-[#1e354a]',
  },
  warning: {
    bg: 'bg-amber-50/95 border-amber-200 text-amber-950',
    tagBg: 'bg-amber-600 text-white',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    btnStyle: 'bg-amber-600 text-white hover:bg-amber-700',
  },
  critical: {
    bg: 'bg-rose-50/95 border-rose-200 text-rose-950',
    tagBg: 'bg-rose-600 text-white',
    icon: Flame,
    iconColor: 'text-rose-600',
    btnStyle: 'bg-rose-600 text-white hover:bg-rose-700',
  },
  success: {
    bg: 'bg-emerald-50/95 border-emerald-200 text-emerald-950',
    tagBg: 'bg-emerald-600 text-white',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    btnStyle: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
};

export const MarqueeAlertBanner = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const userType = user?.userType || 'ALL';
        const res = await marqueeAlertService.getActiveAlerts(userType);
        if (res && res.alerts && res.alerts.length > 0) {
          setAlerts(res.alerts);
        } else {
          setAlerts([]);
        }
      } catch (err) {
        console.warn('Failed to load marquee alerts:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user]);

  if (loading || alerts.length === 0) return null;

  // We display the top priority or active alerts
  const primaryAlert = alerts[0];
  const style = TYPE_STYLES[primaryAlert.alertType] || TYPE_STYLES.info;
  const IconComponent = style.icon;

  const speedClass =
    primaryAlert.speed === 'slow'
      ? 'animate-nfi-marquee-slow'
      : primaryAlert.speed === 'fast'
      ? 'animate-nfi-marquee-fast'
      : 'animate-nfi-marquee';

  return (
    <div
      className={`relative w-full rounded-2xl border ${style.bg} px-3.5 py-2.5 shadow-2xs overflow-hidden select-none transition-all`}
    >
      <div className="flex items-center gap-3">
        {/* Left Fixed Badge / Icon */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider shadow-2xs bg-white border border-slate-200">
            <IconComponent className={`w-3.5 h-3.5 ${style.iconColor} shrink-0 animate-pulse`} />
            <span className="font-black text-slate-800">{primaryAlert.title}</span>
          </div>
          {primaryAlert.targetUserTypes && !primaryAlert.targetUserTypes.includes('ALL') && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/80 border border-slate-200/80 text-slate-600">
              {primaryAlert.targetUserTypes.join(', ')}
            </span>
          )}
        </div>

        {/* Middle Running Marquee Ticker */}
        <div className="flex-1 overflow-hidden relative cursor-pointer group">
          <div className={`${speedClass} pause-on-hover`}>
            {alerts.map((alert, idx) => (
              <span key={alert._id || idx} className="inline-flex items-center gap-3 mr-12 text-xs font-semibold">
                <span>{alert.message}</span>
                {alert.linkUrl && alert.linkLabel && (
                  <a
                    href={alert.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 border border-slate-300 hover:border-slate-400 text-slate-900 transition-colors"
                  >
                    <span>{alert.linkLabel}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {alerts.length > 1 && (
                  <span className="text-slate-300 font-bold ml-2">✦</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Right Action Button (if link present) */}
        {primaryAlert.linkUrl && (
          <div className="shrink-0 z-10 hidden sm:block">
            <a
              href={primaryAlert.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs transition-all ${style.btnStyle}`}
            >
              <span>{primaryAlert.linkLabel || 'View Details'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarqueeAlertBanner;
