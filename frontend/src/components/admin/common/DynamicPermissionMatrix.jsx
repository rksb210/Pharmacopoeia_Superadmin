import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Search, CheckSquare, Square, ShieldCheck, CheckCheck, XCircle } from 'lucide-react';
import { Badge } from '../../ui/badge';

export const DynamicPermissionMatrix = ({
  selectedPermissions = [],
  onChange,
  roleBaseline = null,
}) => {
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const res = await api.get('/rbac/permissions');
        if (res && res.permissions) {
          setPermissions(res.permissions);
          setGroupedPermissions(res.grouped || {});
        }
      } catch (err) {
        setError(err.message || 'Failed to load permissions catalog.');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleToggle = (code) => {
    const isChecked = selectedPermissions.includes(code);
    const updated = isChecked
      ? selectedPermissions.filter((p) => p !== code)
      : [...selectedPermissions, code];
    onChange(updated);
  };

  const handleToggleSection = (sectionPermissions) => {
    const sectionCodes = sectionPermissions.map((p) => p.code);
    const allSelected = sectionCodes.every((c) => selectedPermissions.includes(c));

    const updated = allSelected
      ? selectedPermissions.filter((c) => !sectionCodes.includes(c))
      : Array.from(new Set([...selectedPermissions, ...sectionCodes]));

    onChange(updated);
  };

  const handleToggleModule = (sections) => {
    const allModuleCodes = Object.values(sections).flatMap((perms) => perms.map((p) => p.code));
    const allSelected = allModuleCodes.every((c) => selectedPermissions.includes(c));

    const updated = allSelected
      ? selectedPermissions.filter((c) => !allModuleCodes.includes(c))
      : Array.from(new Set([...selectedPermissions, ...allModuleCodes]));

    onChange(updated);
  };

  const handleSelectAll = () => {
    const allCodes = permissions.map((p) => p.code);
    onChange(allCodes);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 select-none">
        <div className="w-8 h-8 border-3 border-[#FFD243] border-t-[#E76120] rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-semibold">Loading permission catalog from database...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter permissions..."
              className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E76120]"
            />
          </div>

          <span className="text-[11px] font-bold text-slate-600 shrink-0">
            {selectedPermissions.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] font-bold text-[#284661] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#284661]" />
            <span>Select All</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Grouped Permissions Matrix */}
      <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
        {Object.entries(groupedPermissions).map(([moduleName, sections]) => {
          // Filter matching permissions in search
          const filteredSections = {};
          let hasMatchingPerms = false;

          Object.entries(sections).forEach(([sectionName, perms]) => {
            const matches = perms.filter(
              (p) =>
                !searchFilter ||
                p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                p.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
                sectionName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                moduleName.toLowerCase().includes(searchFilter.toLowerCase())
            );
            if (matches.length > 0) {
              filteredSections[sectionName] = matches;
              hasMatchingPerms = true;
            }
          });

          if (!hasMatchingPerms) return null;

          const allModuleCodes = Object.values(sections).flatMap((perms) => perms.map((p) => p.code));
          const allModuleSelected = allModuleCodes.length > 0 && allModuleCodes.every((c) => selectedPermissions.includes(c));

          return (
            <div key={moduleName} className="border border-slate-200/80 rounded-2xl p-4 bg-white shadow-2xs space-y-3.5">
              {/* Module Header with Toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#284661] text-xs uppercase tracking-wider">
                    {moduleName} Management
                  </h4>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {Object.keys(sections).length} Sections
                  </Badge>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleModule(sections)}
                  className="text-[11px] font-bold text-[#E76120] hover:underline cursor-pointer"
                >
                  {allModuleSelected ? 'Deselect Module' : 'Select All in Module'}
                </button>
              </div>

              {/* Sections Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(filteredSections).map(([sectionName, perms]) => {
                  const sectionCodes = perms.map((p) => p.code);
                  const allSectionSelected = sectionCodes.every((c) => selectedPermissions.includes(c));

                  return (
                    <div
                      key={sectionName}
                      className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2 hover:border-slate-200 transition-colors"
                    >
                      {/* Section Title & Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">{sectionName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSection(perms)}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {allSectionSelected ? 'Clear' : 'All'}
                        </button>
                      </div>

                      {/* Actions Badges/Checkboxes */}
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((p) => {
                          const isChecked = selectedPermissions.includes(p.code);
                          return (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => handleToggle(p.code)}
                              className={`
                                px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer
                                ${
                                  isChecked
                                    ? 'bg-[#284661] text-white shadow-2xs ring-1 ring-[#284661]'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                }
                              `}
                              title={p.description}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-3 h-3 text-[#FFD243]" />
                              ) : (
                                <Square className="w-3 h-3 text-slate-400" />
                              )}
                              <span>{p.action}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicPermissionMatrix;
