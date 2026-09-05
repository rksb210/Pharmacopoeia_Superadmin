import React, { useState, useEffect, useCallback } from 'react';
import AdminModal from '../common/AdminModal';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import { tokens } from '../../../theme/tokens';
import {
  Search,
  Percent,
  AlertCircle,
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

const USER_TYPE_TABS = [
  { id: 'DOCTOR', label: 'Doctors', icon: Stethoscope },
  { id: 'STUDENT', label: 'Students', icon: GraduationCap },
  { id: 'PHARMACIST', label: 'Pharmacists', icon: Pill },
  { id: 'NURSE', label: 'Nurses', icon: Stethoscope },
  { id: 'INDUSTRY', label: 'Industry', icon: Building2 },
  { id: 'OTHERS', label: 'Others', icon: User },
];

export const AssignDirectDiscountModal = ({
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

  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(25);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setUserSearch('');
      setSelectedIndustryCompany(null);
      setError('');
    }
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

  const handleNumberKeyDown = (e) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumberChange = (rawValue, options = {}) => {
    const { min = 0, max = null } = options;
    if (rawValue === '' || rawValue === undefined || rawValue === null) {
      setDiscountValue('');
      return;
    }

    let cleanStr = String(rawValue);
    if (/^0\d+/.test(cleanStr)) {
      cleanStr = cleanStr.replace(/^0+/, '');
      if (cleanStr === '') cleanStr = '0';
    }

    let num = Number(cleanStr);
    if (isNaN(num)) return;
    if (min !== null && num < min) num = min;
    if (max !== null && num > max) num = max;

    setDiscountValue(num);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (selectedUsers.length === 0) {
      setError('Please select at least one subscriber to assign concession.');
      return;
    }

    const numVal = discountValue === '' ? 0 : Number(discountValue);
    if (discountValue === '' || isNaN(numVal) || numVal <= 0) {
      setError('Valid positive discount value is required.');
      return;
    }
    if (discountType === 'percentage' && numVal > 100) {
      setError('Percentage discount cannot exceed 100%.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAssignSuccess({
        userId: selectedUsers[0]._id,
        userIds: selectedUsers.map((u) => u._id),
        email: selectedUsers[0].email,
        discountType,
        discountValue: numVal,
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
      description="Issue a personalized discount voucher directly tied to designated subscriber accounts."
      confirmLabel={
        selectedUsers.length > 1
          ? `Assign to ${selectedUsers.length} Subscribers`
          : 'Assign Concession'
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
          <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
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

        {/* Concession Type & Value */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 select-none text-left">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => {
                const newType = e.target.value;
                setDiscountType(newType);
                if (newType === 'percentage' && typeof discountValue === 'number' && discountValue > 100) {
                  setDiscountValue(100);
                }
              }}
              style={{
                height: tokens.dimensions.inputHeight,
                borderRadius: tokens.borderRadius.input,
                paddingLeft: tokens.dimensions.inputPaddingX,
                paddingRight: tokens.dimensions.inputPaddingX,
              }}
              className="w-full border border-slate-200 bg-white text-slate-800 text-sm font-medium transition-all duration-150 outline-none hover:border-slate-300 focus:border-[#E76120] focus:ring-2 focus:ring-[#E76120]/15 cursor-pointer"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed_amount">Fixed Amount (₹) Off</option>
            </select>
          </div>

          <InputField
            id="val"
            label={discountType === 'percentage' ? 'Percentage Value (%)' : 'Fixed Amount (₹)'}
            type="number"
            min={0}
            max={discountType === 'percentage' ? 100 : undefined}
            onKeyDown={handleNumberKeyDown}
            value={discountValue}
            onChange={(e) =>
              handleNumberChange(e.target.value, {
                min: 0,
                max: discountType === 'percentage' ? 100 : null,
              })
            }
            required
          />
        </div>

        <InputField
          id="endDate"
          label="Discount Expiry Date"
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

