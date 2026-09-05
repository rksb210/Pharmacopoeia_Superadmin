import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import {
  CreditCard,
  Clock,
  Gift,
  Percent,
  AlertCircle,
  Search,
  ShieldCheck,
  Stethoscope,
  GraduationCap,
  Pill,
  Building2,
  User,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ArrowLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import subscriberService from '../../../services/subscriber.service';
import planService from '../../../services/plan.service';

const USER_TYPE_TABS = [
  { id: 'DOCTOR', label: 'Doctors', icon: Stethoscope },
  { id: 'STUDENT', label: 'Students', icon: GraduationCap },
  { id: 'PHARMACIST', label: 'Pharmacists', icon: Pill },
  { id: 'NURSE', label: 'Nurses', icon: Stethoscope },
  { id: 'INDUSTRY', label: 'Industry', icon: Building2 },
  { id: 'OTHERS', label: 'Others', icon: User },
];

export const AssignSubscriptionModal = ({
  isOpen,
  onClose,
  onAssignSuccess,
}) => {
  const [activeCohortTab, setActiveCohortTab] = useState('DOCTOR');
  const [subscribers, setSubscribers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Industry Specific Grouping State
  const [industries, setIndustries] = useState([]);
  const [selectedIndustryCompany, setSelectedIndustryCompany] = useState(null);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  
  // Pagination & Lazy loading
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [subType, setSubType] = useState('paid'); // 'paid' | 'trial' | 'discounted'
  const [discountPercent, setDiscountPercent] = useState(20);
  const [trialDays, setTrialDays] = useState(14);
  const [paymentMethod, setPaymentMethod] = useState('UPI / BharatPay');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset selected users on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setUserSearch('');
      setSelectedIndustryCompany(null);
    }
  }, [isOpen]);

  // Fetch active plans from database
  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await planService.getPlans({ status: 'active' });
        if (res && res.plans && res.plans.length > 0) {
          const formattedPlans = res.plans.map((p) => ({
            name: p.name,
            code: p.code,
            tier: p.tier,
            amount: p.priceINR || 0,
            desc: p.description || 'Full digital monograph formulary access.',
            validityType: p.validityType,
            fixedDate: p.fixedDate,
          }));
          setPlans(formattedPlans);
          setSelectedPlan(formattedPlans[0]);
        }
      } catch (err) {
        console.warn('Failed to load active plans:', err.message);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [isOpen]);

  // Fetch distinct industries
  const fetchIndustries = useCallback(async (searchVal = '') => {
    setLoadingIndustries(true);
    try {
      const res = await subscriberService.getIndustries({ search: searchVal });
      if (res && res.industries) {
        setIndustries(res.industries);
      }
    } catch (err) {
      console.warn('Failed to load industries:', err.message);
    } finally {
      setLoadingIndustries(false);
    }
  }, []);

  // Lazy-load subscribers for the active tab (or specific industry company)
  const fetchSubscribers = useCallback(async (tab, searchVal, company = null, pageNum = 1, isAppend = false) => {
    if (pageNum === 1) {
      setLoadingUsers(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        userType: tab,
        search: searchVal,
        page: pageNum,
        limit: 15,
      };

      if (tab === 'INDUSTRY' && company) {
        params.companyName = company;
      }

      const res = await subscriberService.getSubscribers(params);

      if (res && res.subscribers) {
        if (isAppend) {
          setSubscribers((prev) => [...prev, ...res.subscribers]);
        } else {
          setSubscribers(res.subscribers);
        }
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.warn('Failed to search subscribers:', err.message);
    } finally {
      setLoadingUsers(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch when tab, search, or industry company changes (Debounced)
  useEffect(() => {
    if (!isOpen) return;
    setPage(1);

    const timer = setTimeout(() => {
      if (activeCohortTab === 'INDUSTRY' && !selectedIndustryCompany) {
        fetchIndustries(userSearch);
      } else {
        fetchSubscribers(activeCohortTab, userSearch, selectedIndustryCompany, 1, false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCohortTab, userSearch, selectedIndustryCompany, isOpen, fetchSubscribers, fetchIndustries]);

  // Load More Handler for Lazy-Loading
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSubscribers(activeCohortTab, userSearch, selectedIndustryCompany, nextPage, true);
    }
  };

  // Multi-Selection Helpers
  const isUserSelected = (userId) => selectedUsers.some((u) => u._id === userId);

  const toggleSelectUser = (sub) => {
    if (isUserSelected(sub._id)) {
      setSelectedUsers((prev) => prev.filter((u) => u._id !== sub._id));
    } else {
      setSelectedUsers((prev) => [...prev, sub]);
    }
  };

  const areAllLoadedSelected =
    subscribers.length > 0 &&
    subscribers.every((s) => isUserSelected(s._id));

  const handleToggleSelectAllInTab = () => {
    if (areAllLoadedSelected) {
      // Deselect all loaded subscribers of current tab
      const currentTabIds = new Set(subscribers.map((s) => s._id));
      setSelectedUsers((prev) => prev.filter((u) => !currentTabIds.has(u._id)));
    } else {
      // Add all loaded subscribers of current tab (avoid duplicates)
      setSelectedUsers((prev) => {
        const existingMap = new Map(prev.map((u) => [u._id, u]));
        subscribers.forEach((s) => existingMap.set(s._id, s));
        return Array.from(existingMap.values());
      });
    }
  };

  // Compute amounts
  const baseAmount = selectedPlan?.amount || 0;
  const validDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const calculatedDiscount =
    subType === 'discounted' ? Math.round((baseAmount * validDiscount) / 100) : 0;
  const finalPrice =
    subType === 'trial' ? 0 : Math.max(0, baseAmount - calculatedDiscount);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (selectedUsers.length === 0) {
      setError('Please select at least one subscriber to assign subscription.');
      return;
    }
    if (!selectedPlan) {
      setError('Please select a formulary plan tier.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAssignSuccess({
        userId: selectedUsers[0]._id,
        userIds: selectedUsers.map((u) => u._id),
        type: subType,
        planName: selectedPlan.name,
        planCode: selectedPlan.code,
        tier: selectedPlan.tier,
        amount: baseAmount,
        discountPercent: subType === 'discounted' ? validDiscount : 0,
        paymentMethod,
        transactionRef,
        notes,
        customDays: trialDays,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Provision &amp; Assign Subscription"
      description="Issue official digital formulary access with automatic dynamic fixed expiry enforcement."
      confirmLabel={
        selectedUsers.length > 1
          ? `Activate For ${selectedUsers.length} Subscribers`
          : 'Activate Subscription'
      }
      isConfirming={isSubmitting}
      onConfirm={handleSubmit}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Subscriber Selector with Tabs, Multi-Select & Lazy-Loading */}
        <div className="space-y-2 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#284661]" />
              <span>Subscriber <span className="text-red-500">*</span></span>
            </label>

            <div className="flex items-center gap-2">
              {selectedUsers.length > 0 && (
                <>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{selectedUsers.length} Selected</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedUsers([])}
                    className="text-[11px] font-semibold text-slate-500 hover:text-red-600 cursor-pointer underline"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Type Cohort Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200/60">
            {USER_TYPE_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeCohortTab === tab.id;
              const selectedCountInTab = selectedUsers.filter((u) => u.userType === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveCohortTab(tab.id);
                    setSelectedIndustryCompany(null);
                    setUserSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#284661] text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {selectedCountInTab > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${isActive ? 'bg-white text-[#284661]' : 'bg-[#284661] text-white'}`}>
                      {selectedCountInTab}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Industry Company Header Breadcrumb when drilled into a specific company */}
          {activeCohortTab === 'INDUSTRY' && selectedIndustryCompany && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200/80 px-3 py-2 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedIndustryCompany(null);
                  setUserSearch('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#284661] hover:text-[#E76120] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Companies</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 truncate">
                <Building2 className="w-3.5 h-3.5 text-[#284661] shrink-0" />
                <span className="truncate">{selectedIndustryCompany}</span>
              </div>
            </div>
          )}

          {/* Toolbar: Search bar + Select All in Tab */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeCohortTab === 'INDUSTRY' && !selectedIndustryCompany
                    ? 'Search company / industry by name...'
                    : activeCohortTab === 'INDUSTRY'
                    ? `Search employees in ${selectedIndustryCompany}...`
                    : `Search ${activeCohortTab.toLowerCase()} by name, email, registration...`
                }
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-xl outline-none text-xs focus:border-[#E76120]"
              />
            </div>

            {(activeCohortTab !== 'INDUSTRY' || selectedIndustryCompany) && subscribers.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAllInTab}
                className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  areAllLoadedSelected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={areAllLoadedSelected}
                  onChange={handleToggleSelectAllInTab}
                  className="w-3.5 h-3.5 rounded text-[#E76120] focus:ring-[#E76120] cursor-pointer"
                />
                <span>Select All ({subscribers.length})</span>
              </button>
            )}
          </div>

          {/* List Container */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
            {/* 1. Industry Companies List View */}
            {activeCohortTab === 'INDUSTRY' && !selectedIndustryCompany ? (
              loadingIndustries ? (
                <div className="p-4 text-slate-400 text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#284661]" />
                  <span>Loading industry directory...</span>
                </div>
              ) : industries.length === 0 ? (
                <p className="p-4 text-slate-400 text-center">
                  No industries / organizations found matching your search.
                </p>
              ) : (
                industries.map((ind) => {
                  const companyUsersSelected = selectedUsers.filter(
                    (u) => u.userType === 'INDUSTRY' && u.dynamicFields?.companyName === ind.companyName
                  ).length;

                  return (
                    <div
                      key={ind._id}
                      onClick={() => {
                        setSelectedIndustryCompany(ind.companyName);
                        setUserSearch('');
                      }}
                      className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-blue-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div className="w-8 h-8 rounded-xl bg-[#284661]/10 text-[#284661] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate block text-xs">
                              {ind.companyName}
                            </span>
                            {companyUsersSelected > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                                {companyUsersSelected} selected
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {ind.gstin ? `GST: ${ind.gstin}` : ind.pan ? `PAN: ${ind.pan}` : 'Registered Industry Partner'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#284661]" />
                          <span>{ind.subscribersCount} {ind.subscribersCount === 1 ? 'User' : 'Users'}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* 2. Subscribers List (Doctors, Students, or Selected Company) */
              loadingUsers ? (
                <div className="p-4 text-slate-400 text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#284661]" />
                  <span>
                    Loading {activeCohortTab === 'INDUSTRY' ? 'company subscribers' : `${activeCohortTab.toLowerCase()}s`}...
                  </span>
                </div>
              ) : subscribers.length === 0 ? (
                <p className="p-4 text-slate-400 text-center">
                  No {activeCohortTab === 'INDUSTRY' ? 'subscribers found in this company' : `${activeCohortTab.toLowerCase()}s found`}.
                </p>
              ) : (
                <>
                  {subscribers.map((sub) => {
                    const isSelected = isUserSelected(sub._id);
                    const dFields = sub.dynamicFields || {};
                    return (
                      <div
                        key={sub._id}
                        onClick={() => toggleSelectUser(sub)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 border-l-4 border-[#284661]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectUser(sub)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-[#E76120] focus:ring-[#E76120] cursor-pointer shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">{sub.name}</span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#284661] shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {sub.email} {sub.phoneNumber ? `· ${sub.phoneNumber}` : ''}
                            </p>
                            {/* Dynamic category credential */}
                            {(dFields.registrationNo || dFields.apaarId || dFields.companyName) && (
                              <span className="text-[10px] text-slate-500 font-medium truncate block">
                                {dFields.registrationNo ? `Reg: ${dFields.registrationNo}` : ''}
                                {dFields.stateCouncil ? ` (${dFields.stateCouncil})` : ''}
                                {dFields.apaarId ? `APAAR: ${dFields.apaarId}` : ''}
                                {dFields.companyName ? `Org: ${dFields.companyName}` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <Badge variant="outline" className="text-[9px] uppercase font-bold shrink-0">
                          {sub.userType}
                        </Badge>
                      </div>
                    );
                  })}

                  {/* Lazy-Load "Load More" Button if more pages exist */}
                  {page < totalPages && (
                    <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-[#284661] cursor-pointer inline-flex items-center gap-1 transition-all"
                      >
                        {loadingMore ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Loading more...</span>
                          </>
                        ) : (
                          <>
                            <span>Load More ({totalCount - subscribers.length} remaining)</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>

        {/* 2. Subscription Type Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">Subscription Category</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSubType('paid')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'paid'
                  ? 'bg-blue-50 border-[#284661] text-[#284661] shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Standard Paid</span>
            </button>

            <button
              type="button"
              onClick={() => setSubType('trial')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'trial'
                  ? 'bg-amber-50 border-[#E76120] text-[#E76120] shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Free Trial</span>
            </button>

            <button
              type="button"
              onClick={() => setSubType('discounted')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer ${
                subType === 'discounted'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Concession</span>
            </button>
          </div>
        </div>

        {/* 3. Plan Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-xs block">Select Formulary Tier</label>
          {loadingPlans ? (
            <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs text-slate-400">
              Loading active plans...
            </div>
          ) : (
            <select
              value={selectedPlan?.code || ''}
              onChange={(e) => {
                const p = plans.find((plan) => plan.code === e.target.value);
                if (p) setSelectedPlan(p);
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#E76120] cursor-pointer"
            >
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} — ₹{plan.amount.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          )}
          {selectedPlan?.desc && <p className="text-[11px] text-slate-400">{selectedPlan.desc}</p>}
        </div>

        {/* 4. Type Specific Settings */}
        {subType === 'paid' && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-900">
            <ShieldCheck className="w-4 h-4 text-[#284661] shrink-0" />
            <span>
              <strong>BRD Business Rule Active:</strong> This purchased subscription will be valid until{' '}
              <strong>
                {selectedPlan?.fixedDate
                  ? new Date(selectedPlan.fixedDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '31 December 2031'}
              </strong>.
            </span>
          </div>
        )}

        {subType === 'trial' && (
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Free Trial / Evaluation Duration</label>
            <select
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
              className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
            >
              <option value={7}>7 Days (1 Week Quick Evaluation)</option>
              <option value={14}>14 Days (Standard Evaluation)</option>
              <option value={30}>30 Days (1 Month Evaluation Pass)</option>
              <option value={90}>90 Days (3 Months Evaluation)</option>
              <option value={180}>180 Days (6 Months VIP Pass)</option>
              <option value={365}>365 Days (1 Year Full Access Pass)</option>
              <option value={730}>730 Days (2 Years Institutional Grant)</option>
            </select>
          </div>
        )}

        {subType === 'discounted' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Discount Concession Rate (%)</span>
                <span className="text-[10px] text-slate-400 font-normal">Min: 0% · Max: 100%</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Enter % (e.g. 15, 25, 78)"
                  value={discountPercent}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDiscountPercent('');
                    } else {
                      let cleanStr = String(val);
                      if (/^0\d+/.test(cleanStr)) {
                        cleanStr = cleanStr.replace(/^0+/, '');
                        if (cleanStr === '') cleanStr = '0';
                      }
                      const num = Number(cleanStr);
                      if (isNaN(num)) return;
                      if (num < 0) setDiscountPercent(0);
                      else if (num > 100) setDiscountPercent(100);
                      else setDiscountPercent(num);
                    }
                  }}
                  className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs pointer-events-none">
                  %
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Payable Amount</span>
                {calculatedDiscount > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Saved ₹{calculatedDiscount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <span className="text-sm font-black text-emerald-900 mt-0.5">
                ₹{finalPrice.toLocaleString('en-IN')}{' '}
                {calculatedDiscount > 0 && (
                  <span className="line-through text-xs text-slate-400 font-normal ml-1">
                    ₹{baseAmount.toLocaleString('en-IN')}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* 5. Invoicing & Payment Info */}
        {(subType === 'paid' || subType === 'discounted') && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Payment Gateway / Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              >
                <option value="UPI / BharatPay">UPI / BharatPay</option>
                <option value="NetBanking / NEFT">NetBanking / NEFT</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Government Treasury Challan">Government Treasury Challan</option>
              </select>
            </div>

            <InputField
              id="txnRef"
              label="Transaction / Reference ID"
              placeholder="e.g. TXN-894109823"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>
        )}

        {/* 6. Notes */}
        <InputField
          id="notes"
          label="Administrative Remarks (Optional)"
          placeholder="e.g. Approved via Directorate General order..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </AdminModal>
  );
};

export default AssignSubscriptionModal;
