import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Search, Check, Minus, CheckCheck, XCircle } from 'lucide-react';
import { Badge } from '../../ui/badge';

const DISPLAY_ACTIONS = [
  { key: 'VIEW', label: 'View' },
  { key: 'ADD', label: 'Add' },
  { key: 'EDIT', label: 'Edit' },
  { key: 'DELETE', label: 'Delete' },
  { key: 'APPROVE', label: 'Approve' },
  { key: 'REJECT', label: 'Reject' },
  { key: 'PUBLISH', label: 'Publish' },
  { key: 'EXPORT', label: 'Export' },
  { key: 'DOWNLOAD', label: 'Download' },
  { key: 'PRINT', label: 'Print' },
];

export const RolePermissionMatrix = ({
  selectedPermissions = [],
  onChange,
  readOnly = false,
}) => {
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isWildcardAll = selectedPermissions.includes('*');

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
        setError(err.message || 'Failed to load system permissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleToggle = (code) => {
    if (readOnly) return;
    const isChecked = selectedPermissions.includes(code);
    const updated = isChecked
      ? selectedPermissions.filter((p) => p !== code)
      : [...selectedPermissions, code];
    onChange(updated);
  };

  const handleToggleRow = (sectionPerms) => {
    if (readOnly) return;
    const sectionCodes = sectionPerms.map((p) => p.code);
    const allSelected = sectionCodes.every((c) => selectedPermissions.includes(c));

    const updated = allSelected
      ? selectedPermissions.filter((c) => !sectionCodes.includes(c))
      : Array.from(new Set([...selectedPermissions, ...sectionCodes]));

    onChange(updated);
  };

  const handleToggleModule = (sections) => {
    if (readOnly) return;
    const allModuleCodes = Object.values(sections).flatMap((perms) => perms.map((p) => p.code));
    const allSelected = allModuleCodes.every((c) => selectedPermissions.includes(c));

    const updated = allSelected
      ? selectedPermissions.filter((c) => !allModuleCodes.includes(c))
      : Array.from(new Set([...selectedPermissions, ...allModuleCodes]));

    onChange(updated);
  };

  const handleSelectAll = () => {
    if (readOnly) return;
    const allCodes = permissions.map((p) => p.code);
    onChange(allCodes);
  };

  const handleClearAll = () => {
    if (readOnly) return;
    onChange([]);
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 select-none">
        <div className="w-8 h-8 border-3 border-[#FFD243] border-t-[#E76120] rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-semibold">Loading RBAC Permission Matrix...</span>
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
    <div className="space-y-3.5 select-none font-sans">
      {/* Top Filter Bar */}
      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search modules / actions..."
                className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E76120]"
              />
            </div>

            <span className="text-[11px] font-bold text-slate-600 shrink-0">
              {isWildcardAll ? 'All Permissions (*)' : `${selectedPermissions.length} selected`}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-bold text-[#284661] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
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
      )}

      {/* High-Density Matrix Grid */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto max-h-[55vh] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead className="bg-slate-100/90 sticky top-0 z-10 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 min-w-[200px]">Module / Section</th>
                {DISPLAY_ACTIONS.map((act) => (
                  <th key={act.key} className="py-2.5 px-2 text-center min-w-[64px]">
                    <span className="text-[11px] uppercase tracking-wider">{act.label}</span>
                  </th>
                ))}
                {!readOnly && <th className="py-2.5 px-3 text-right">Row</th>}
              </tr>
            </thead>

            {/* Table Body Grouped by Module */}
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedPermissions).map(([moduleName, sections]) => {
                // Filter matching sections in search
                const matchingSections = Object.entries(sections).filter(([secName, perms]) => {
                  if (!searchFilter) return true;
                  const query = searchFilter.toLowerCase();
                  return (
                    moduleName.toLowerCase().includes(query) ||
                    secName.toLowerCase().includes(query) ||
                    perms.some((p) => p.action.toLowerCase().includes(query) || p.name.toLowerCase().includes(query))
                  );
                });

                if (matchingSections.length === 0) return null;

                const allModuleCodes = Object.values(sections).flatMap((perms) => perms.map((p) => p.code));
                const isModuleAll = allModuleCodes.length > 0 && allModuleCodes.every((c) => selectedPermissions.includes(c));

                return (
                  <React.Fragment key={moduleName}>
                    {/* Module Separator Row */}
                    <tr className="bg-slate-50/90 font-bold text-[#284661] text-[11px] uppercase tracking-wider border-y border-slate-200/60">
                      <td colSpan={DISPLAY_ACTIONS.length + (readOnly ? 1 : 2)} className="py-2 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{moduleName} MODULE</span>
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              {Object.keys(sections).length} Sections
                            </Badge>
                          </div>

                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => handleToggleModule(sections)}
                              className="text-[10px] font-bold text-[#E76120] hover:underline normal-case cursor-pointer"
                            >
                              {isModuleAll ? 'Clear Module' : 'Select All Module'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Section Rows */}
                    {matchingSections.map(([sectionName, perms]) => {
                      const sectionCodes = perms.map((p) => p.code);
                      const isRowAll = sectionCodes.every((c) => selectedPermissions.includes(c));

                      return (
                        <tr key={sectionName} className="hover:bg-slate-50/60 transition-colors">
                          {/* Section Title */}
                          <td className="py-2.5 px-4 font-semibold text-slate-800 text-xs">
                            <span className="capitalize">{sectionName.replace(/_/g, ' ').toLowerCase()}</span>
                          </td>

                          {/* Action Checkbox Cells */}
                          {DISPLAY_ACTIONS.map((act) => {
                            const perm = perms.find((p) => p.action === act.key);

                            if (!perm) {
                              // Action not available for this section
                              return (
                                <td key={act.key} className="py-2.5 px-2 text-center text-slate-300">
                                  <Minus className="w-3.5 h-3.5 mx-auto opacity-40" />
                                </td>
                              );
                            }

                            const isChecked = isWildcardAll || selectedPermissions.includes(perm.code);

                            return (
                              <td key={act.key} className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  disabled={readOnly || isWildcardAll}
                                  onClick={() => handleToggle(perm.code)}
                                  className={`
                                    w-6 h-6 rounded-md mx-auto flex items-center justify-center transition-all cursor-pointer
                                    ${
                                      isChecked
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-white border border-slate-300 text-transparent hover:border-slate-400'
                                    }
                                    ${readOnly ? 'cursor-default' : ''}
                                  `}
                                  title={`${act.label} ${sectionName}`}
                                >
                                  {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                                </button>
                              </td>
                            );
                          })}

                          {/* Row Quick Toggle */}
                          {!readOnly && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleRow(perms)}
                                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                              >
                                {isRowAll ? 'Clear' : 'All'}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionMatrix;
