import React, { useState } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUpIcon,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import ExportDropdown from '../common/ExportDropdown';
import subscriberService from '../../../services/subscriber.service';
import orderService from '../../../services/order.service';

const monthNamesMap = {
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
};

/**
 * Computes round, clean Y-axis tick marks
 */
const getNiceScale = (maxVal, isRev) => {
  const effectiveMax = Math.max(maxVal, isRev ? 5000 : 5);
  const roughStep = effectiveMax / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep))) || 1;
  const normalized = roughStep / magnitude;

  let niceMultiplier = 1;
  if (normalized <= 1) niceMultiplier = 1;
  else if (normalized <= 2) niceMultiplier = 2;
  else if (normalized <= 2.5) niceMultiplier = 2.5;
  else if (normalized <= 5) niceMultiplier = 5;
  else niceMultiplier = 10;

  const step = niceMultiplier * magnitude;
  const niceMax = Math.ceil(effectiveMax / step) * step;

  const ticks = [];
  for (let v = niceMax; v >= 0; v -= step) {
    ticks.push(Math.round(v));
  }
  if (ticks[ticks.length - 1] !== 0) {
    ticks.push(0);
  }

  return { niceMax, ticks, step };
};

const formatYTick = (val, isRev) => {
  if (val === 0) return '0';
  if (!isRev) {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return String(val);
  }
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `₹${val}`;
};

export const ChartCard = ({
  title = 'Subscriber Registrations & Revenue',
  subtitle = 'Financial Year Performance (April – March)',
  trendData = {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    monographViews: [0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0],
    revenueINR: [0, 0, 0, 0, 14004, 0, 0, 0, 0, 0, 0, 0],
    fiscalYearLabel: 'FY 2026-27 (April – March)',
  },
}) => {
  const [metric, setMetric] = useState('registrations'); // 'registrations' | 'revenue'
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const labels = trendData.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const dataValues =
    metric === 'registrations'
      ? trendData.monographViews || []
      : trendData.revenueINR || [];

  const totalSum = dataValues.reduce((acc, v) => acc + (Number(v) || 0), 0);
  const rawMax = Math.max(...dataValues, 0);

  const isRevenue = metric === 'revenue';
  const themeGradient = isRevenue
    ? 'from-[#E76120] to-[#f97316]'
    : 'from-[#284661] to-[#3b678e]';

  // Compute clean Y-axis scale and tick marks
  const { niceMax, ticks } = getNiceScale(rawMax, isRevenue);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // Fetch real records from backend for bulk export
  const fetchExportData = async () => {
    try {
      if (metric === 'registrations') {
        const res = await subscriberService.getSubscribers({
          page: 1,
          limit: 5000,
        });
        return res?.subscribers || [];
      } else {
        const res = await orderService.getOrders({
          page: 1,
          limit: 5000,
        });
        return res?.orders || [];
      }
    } catch (err) {
      console.error('[Export Fetch Error]:', err);
      showFeedback('Failed to fetch full records for export.', 'error');
      return [];
    }
  };

  // Real Data Export Columns for Registrations
  const registrationExportColumns = [
    { header: 'Full Name', key: 'name' },
    { header: 'Email Address', key: 'email' },
    { header: 'Contact No', key: 'phoneNumber' },
    { header: 'Healthcare Category', key: 'userType', format: (v) => v || 'OTHERS' },
    {
      header: 'License / Registration',
      key: 'dynamicFields',
      format: (v) => v?.registrationNo || v?.apaarId || v?.gstin || v?.universityCollegeName || '—',
    },
    {
      header: 'State / Council',
      key: 'dynamicFields',
      format: (v) => v?.stateCouncil || v?.registrationState || v?.state || '—',
    },
    {
      header: 'Subscription Plan',
      key: 'subscription',
      format: (v) => v?.planName || 'Universal Access Pass',
    },
    {
      header: 'Plan Status',
      key: 'subscription',
      format: (v) => (v?.status || 'Active').toUpperCase(),
    },
    {
      header: 'Account Status',
      key: 'isActive',
      format: (v) => (v ? 'ACTIVE' : 'DEACTIVATED'),
    },
    {
      header: 'Registration Date',
      key: 'createdAt',
      format: (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '—'),
    },
  ];

  // Real Data Export Columns for Revenue / Orders
  const revenueExportColumns = [
    { header: 'Order Number', key: 'orderNumber' },
    { header: 'Invoice Number', key: 'invoiceNumber' },
    { header: 'Subscriber Name', key: 'userName' },
    { header: 'Subscriber Email', key: 'userEmail' },
    { header: 'Healthcare Category', key: 'userType' },
    { header: 'Plan Name', key: 'planName' },
    { header: 'Tier', key: 'tier' },
    {
      header: 'Base Amount (₹)',
      key: 'pricing',
      format: (val) => val?.baseAmount || 0,
    },
    {
      header: 'GST 18% (₹)',
      key: 'pricing',
      format: (val) => val?.taxAmount || 0,
    },
    {
      header: 'Total Paid (₹)',
      key: 'pricing',
      format: (val) => val?.totalAmount || 0,
    },
    {
      header: 'Payment Mode',
      key: 'paymentMethod',
      format: (val) => val || 'ONLINE GATEWAY',
    },
    {
      header: 'Payment Status',
      key: 'paymentStatus',
      format: (val) => (val || 'COMPLETED').toUpperCase(),
    },
    {
      header: 'Order Status',
      key: 'orderStatus',
      format: (val) => (val || 'COMPLETED').toUpperCase(),
    },
    {
      header: 'Order Date',
      key: 'createdAt',
      format: (val) => (val ? new Date(val).toLocaleDateString('en-IN') : '—'),
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5 font-sans min-w-0">
      {/* Header with Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
            <Badge variant="nfiNavy" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
              {trendData.fiscalYearLabel || 'April – March'}
            </Badge>
          </div>
          <p className="text-slate-400 text-xs truncate block">
            {isRevenue
              ? 'Monthly total sales realization & verified transaction ledgers'
              : 'Monthly public & institutional subscriber enrollments'}
          </p>
        </div>

        {/* Controls Toolbar: Metric Selector Tabs + Export Dropdown */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setMetric('registrations');
                setHoveredIdx(null);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isRevenue
                  ? 'bg-white text-[#284661] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>Registrations</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMetric('revenue');
                setHoveredIdx(null);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isRevenue
                  ? 'bg-white text-[#E76120] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUpIcon className="w-3.5 h-3.5 text-[#E76120]" />
              <span>Revenue (₹)</span>
            </button>
          </div>

          {/* Export Data Button (Real Data Ledger) */}
          <ExportDropdown
            filename={
              isRevenue
                ? 'NFI_Revenue_Transactions_Ledger'
                : 'NFI_Subscriber_Registrations_Directory'
            }
            title={
              isRevenue
                ? 'Indian Pharmacopoeia Commission - Total Sales & Orders Ledger'
                : 'Indian Pharmacopoeia Commission - Registered Subscribers Directory'
            }
            subtitle={`Fiscal Year Performance · Real Data Ledger (${
              trendData.fiscalYearLabel || 'April – March'
            })`}
            metadata={[
              isRevenue
                ? `Total FY Realized Revenue: ₹${totalSum.toLocaleString('en-IN')}`
                : `Total FY Registrations: ${totalSum} Subscribers`,
              `Export Category: ${isRevenue ? 'Commercial Orders & Payments' : 'Subscribers Directory'}`,
              `Generated: ${new Date().toLocaleString('en-IN')}`,
            ]}
            columns={isRevenue ? revenueExportColumns : registrationExportColumns}
            onFetchData={fetchExportData}
            onFeedback={showFeedback}
            size="sm"
          />
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedback.message && (
        <div
          className={`text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 animate-in fade-in-0 duration-150 ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200/70'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}



      {/* Clean Chart Container with Y-Axis and Non-Clipping Tooltip */}
      <div className="pt-3 w-full">
        {/* Chart Frame (Y-Axis + Plot Area) */}
        <div className="flex items-stretch gap-2 w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 pb-2">
          {/* Y-Axis Tick Labels Column */}
          <div className="w-10 sm:w-12 flex flex-col justify-between items-end pr-2 font-mono text-[10px] sm:text-[11px] font-semibold text-slate-400 select-none pb-7 pt-2 shrink-0">
            {ticks.map((t, idx) => (
              <span key={`ytick-${idx}`} className="leading-none text-right">
                {formatYTick(t, isRevenue)}
              </span>
            ))}
          </div>

          {/* Plot Area with Grid Lines, Bars, and Centered Safe Tooltip */}
          <div className="relative flex-1 min-w-[340px] sm:min-w-0 h-60 sm:h-64">
            {/* Horizontal Dashed Grid Lines Matching Y-Axis Ticks */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-7 pt-2">
              {ticks.map((_, idx) => (
                <div key={`grid-${idx}`} className="w-full border-b border-dashed border-slate-200/80" />
              ))}
            </div>

            {/* Smart Floating Tooltip (Positioned safely inside the plot area at top-2 so it is NEVER cut off) */}
            {hoveredIdx !== null && (
              <div
                style={{
                  left: `${((hoveredIdx + 0.5) / labels.length) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
                className={`absolute top-2 z-30 pointer-events-none transition-all duration-150 ease-out animate-in fade-in-0 zoom-in-95 ${
                  hoveredIdx <= 1
                    ? '!left-2 !translate-x-0'
                    : hoveredIdx >= labels.length - 2
                    ? '!left-auto !right-2 !translate-x-0'
                    : ''
                }`}
              >
                <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-2xl border border-slate-700/80 min-w-[155px] font-sans">
                  {/* Tooltip Header: Month + FY */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1 mb-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRevenue ? 'bg-[#E76120]' : 'bg-sky-400'
                        }`}
                      />
                      {monthNamesMap[labels[hoveredIdx]] || labels[hoveredIdx]}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Month {hoveredIdx + 1}
                    </span>
                  </div>

                  {/* Tooltip Main Metric Value */}
                  <div className="text-sm font-black text-[#FFD243] font-mono tracking-tight my-0.5">
                    {isRevenue
                      ? `₹${Number(dataValues[hoveredIdx] || 0).toLocaleString('en-IN')}`
                      : `${Number(dataValues[hoveredIdx] || 0).toLocaleString('en-IN')} Subscribers`}
                  </div>

                  {/* Tooltip FY Share */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between gap-2 pt-0.5 border-t border-slate-800/60">
                    <span>Share of FY:</span>
                    <span className="font-bold text-white">
                      {totalSum > 0
                        ? `${((Number(dataValues[hoveredIdx] || 0) / totalSum) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* Downward Pointer Caret */}
                <div
                  className={`w-2.5 h-2.5 bg-slate-900/95 rotate-45 mx-auto -mt-1 border-r border-b border-slate-700/80 ${
                    hoveredIdx <= 1
                      ? 'ml-6'
                      : hoveredIdx >= labels.length - 2
                      ? 'mr-6 ml-auto'
                      : ''
                  }`}
                />
              </div>
            )}

            {/* Bar Columns Container (NO numbers on bars; purely clean bars) */}
            <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-2 pb-7 pt-2">
              {labels.map((monthLabel, idx) => {
                const rawVal = Number(dataValues[idx]) || 0;
                // Height percentage accurately calculated against the Y-axis niceMax
                const heightPercent = niceMax > 0 ? (rawVal / niceMax) * 100 : 0;
                const isHovered = hoveredIdx === idx;
                const hasData = rawVal > 0;

                return (
                  <div
                    key={monthLabel}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer z-10"
                  >
                    {/* Background Column Track */}
                    <div
                      className={`w-full max-w-[24px] sm:max-w-[28px] h-full flex items-end justify-center rounded-t-lg transition-colors p-0.5 ${
                        isHovered ? 'bg-slate-200/90 ring-1 ring-slate-300' : 'bg-slate-100/70'
                      }`}
                    >
                      {/* Active Velocity Bar Fill (Height exactly mapped to Y-axis) */}
                      <div
                        style={{
                          height: hasData ? `${Math.max(6, heightPercent)}%` : '3px',
                        }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          hasData
                            ? `bg-gradient-to-t ${themeGradient} shadow-xs`
                            : 'bg-slate-300/70'
                        } ${isHovered ? 'brightness-110 scale-x-105 shadow-md' : ''}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Month Labels Row */}
            <div className="absolute bottom-0 left-0 right-0 h-7 flex items-center justify-between gap-1 sm:gap-2 px-1 sm:px-2 border-t border-slate-200">
              {labels.map((monthLabel, idx) => {
                const isHovered = hoveredIdx === idx;
                const hasData = (Number(dataValues[idx]) || 0) > 0;
                return (
                  <div key={`xlabel-${monthLabel}`} className="flex-1 text-center">
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold transition-all block ${
                        isHovered
                          ? 'text-slate-900 scale-110 font-black'
                          : hasData
                          ? 'text-[#284661] font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legend / Real-Time Telemetry */}

    </div>
  );
};

export default ChartCard;
