import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import InputField from '../../common/InputField';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Building2,
  GraduationCap,
  Stethoscope,
  Pill,
  Plus,
  Trash2,
  Users,
  Table as TableIcon,
} from 'lucide-react';
import bulkImportService from '../../../services/bulkImport.service';
import planService from '../../../services/plan.service';

const STAKEHOLDER_TABS = [
  { id: 'UNIVERSITIES_COLLEGES', label: 'Universities / Colleges', icon: GraduationCap },
  { id: 'INDUSTRY', label: 'Industry / Corporate', icon: Building2 },
  { id: 'HOSPITALS', label: 'Hospitals / Clinics', icon: Stethoscope },
  { id: 'RETAIL_PHARMACIST', label: 'Retail Pharmacy', icon: Pill },
];

const createEmptyRow = () => ({
  id: Date.now() + Math.random(),
  name: '',
  email: '',
  phone: '',
  roleOrCategory: '',
  rollOrEmployeeId: '',
  department: '',
});

export const BulkUploadZone = ({
  onUploadSuccess,
  onDirectValidateSuccess,
  isProcessing,
}) => {
  const [stakeholderType, setStakeholderType] = useState('UNIVERSITIES_COLLEGES');
  const [entryMode, setEntryMode] = useState('excel'); // 'excel' | 'manual'
  const [file, setFile] = useState(null);

  // Institution & Coordinator Details
  const [institutionName, setInstitutionName] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [billingContact, setBillingContact] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [stateName, setStateName] = useState('');
  const [gstinOrPan, setGstinOrPan] = useState('');

  // Plans
  const [plans, setPlans] = useState([]);
  const [defaultPlanCode, setDefaultPlanCode] = useState('');

  // Direct Manual Roster Rows
  const [rows, setRows] = useState([createEmptyRow(), createEmptyRow(), createEmptyRow()]);

  const [error, setError] = useState('');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await planService.getPlans({ status: 'active' });
        if (res && res.plans && res.plans.length > 0) {
          setPlans(res.plans);
          // Default to Online digital plan for bulk subscriber enrollment
          const defaultOnlinePlan =
            res.plans.find((p) => p.deliveryType === 'ONLINE' || p.code.includes('ONLINE')) ||
            res.plans[0];
          setDefaultPlanCode(defaultOnlinePlan.code);
        }
      } catch (err) {
        console.warn('Failed to load plans for bulk upload:', err.message);
      }
    };
    fetchPlans();
  }, []);

  const selectedPlanObj = plans.find((p) => p.code === defaultPlanCode) || plans[0];

  // Dynamic Labels based on Stakeholder Type (Matched with User Portal)
  const isCollege = stakeholderType === 'UNIVERSITIES_COLLEGES';
  const isHospital = stakeholderType === 'HOSPITALS';
  const isRetail = stakeholderType === 'RETAIL_PHARMACIST';

  const rolePlaceholder = isCollege
    ? 'Student / Faculty'
    : isHospital
    ? 'Doctor / Nurse / Pharmacist'
    : isRetail
    ? 'Retail Pharmacist'
    : 'Research Scientist / Executive';

  const idLabel = isCollege
    ? 'Roll / Enrollment No.'
    : isHospital
    ? 'Staff ID / Reg No.'
    : isRetail
    ? 'Pharmacist Reg No.'
    : 'Employee ID';

  const deptLabel = isCollege
    ? 'Course / Department'
    : isHospital
    ? 'Ward / Speciality'
    : isRetail
    ? 'Branch / Store Location'
    : 'Division / R&D Dept';

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) => selected.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setError('Please select a valid Excel file (.xlsx, .xls) or .csv');
      setFile(null);
      return;
    }

    setFile(selected);
    setError('');
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await bulkImportService.downloadTemplate(stakeholderType);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NFI_Bulk_${stakeholderType}_Template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch {
      setError('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Manual Roster Row Handlers
  const handleAddRow = () => setRows((prev) => [...prev, createEmptyRow()]);
  const handleAddMultipleRows = (count = 3) =>
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => createEmptyRow())]);
  const handleRemoveRow = (idx) => {
    if (rows.length === 1) {
      setRows([createEmptyRow()]);
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleRowChange = (idx, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
    if (error) setError('');
  };

  const handleParseAndValidate = async () => {
    if (!institutionName.trim()) {
      setError('Please enter the Institution / Organization Name.');
      return;
    }
    if (!billingContact.trim()) {
      setError('Please enter the Coordinator Email Address.');
      return;
    }

    const coordinatorObj = {
      name: coordinatorName.trim() || institutionName.trim(),
      email: billingContact.trim(),
      phone: coordinatorPhone.trim(),
      state: stateName.trim(),
      gstin: gstinOrPan.trim().length === 15 ? gstinOrPan.trim().toUpperCase() : '',
      pan: gstinOrPan.trim().length === 10 ? gstinOrPan.trim().toUpperCase() : '',
    };

    setError('');

    if (entryMode === 'excel') {
      if (!file) {
        setError('Please upload an Excel (.xlsx, .xls) or CSV subscriber file.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('institutionName', institutionName.trim());
      formData.append('userType', stakeholderType);
      formData.append('billingContact', billingContact.trim());
      formData.append('coordinator', JSON.stringify(coordinatorObj));
      formData.append('defaultPlanCode', defaultPlanCode);

      try {
        await onUploadSuccess(formData);
      } catch (err) {
        setError(err.message || 'File validation failed.');
      }
    } else {
      const filledRows = rows.filter(
        (r) =>
          r.name.trim() ||
          r.email.trim() ||
          r.phone.trim() ||
          r.rollOrEmployeeId.trim()
      );

      if (filledRows.length === 0) {
        setError('Please enter at least one member row in the manual roster table.');
        return;
      }

      for (let i = 0; i < filledRows.length; i++) {
        const r = filledRows[i];
        if (!r.email.trim()) {
          setError(`Row #${i + 1}: Email Address is required.`);
          return;
        }
        if (!r.phone.trim()) {
          setError(`Row #${i + 1}: 10-digit Mobile Number is required.`);
          return;
        }
      }

      try {
        await onDirectValidateSuccess({
          rows: filledRows,
          institutionName: institutionName.trim(),
          userType: stakeholderType,
          billingContact: billingContact.trim(),
          coordinator: coordinatorObj,
          defaultPlanCode,
        });
      } catch (err) {
        setError(err.message || 'Manual roster validation failed.');
      }
    }
  };

  return (
    <div className="space-y-4 font-sans select-none text-xs">
      {/* 1. Stakeholder Category Selector */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">1. Select Institutional Stakeholder Type</h4>
            <p className="text-slate-500 text-xs">
              Choose the organization category to configure member roles and template headers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {STAKEHOLDER_TABS.map((t) => {
              const Icon = t.icon;
              const isSelected = stakeholderType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStakeholderType(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#284661] text-white border-[#284661] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* 2. Institution, Coordinator & Plan Selection */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3.5">
        <h4 className="font-bold text-slate-900 text-sm">
          2. Organization, Coordinator &amp; Formulary Plan Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <InputField
            id="institutionName"
            label="Institution / Organization Name *"
            placeholder={
              isCollege
                ? 'e.g. AIIMS New Delhi / NIPER'
                : isHospital
                ? 'e.g. Medanta - The Medicity'
                : isRetail
                ? 'e.g. Apollo Pharmacy Chain'
                : 'e.g. Sun Pharma Laboratories Ltd.'
            }
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            required
          />

          <InputField
            id="coordinatorName"
            label="Authorized Coordinator Name"
            placeholder="e.g. Dr. R. K. Sharma"
            value={coordinatorName}
            onChange={(e) => setCoordinatorName(e.target.value)}
          />

          <InputField
            id="billingContact"
            label="Coordinator Email Address *"
            placeholder="e.g. coordinator@institution.edu.in"
            value={billingContact}
            onChange={(e) => setBillingContact(e.target.value)}
            required
          />

          <InputField
            id="coordinatorPhone"
            label="Coordinator Mobile Number"
            placeholder="e.g. 9876543210"
            value={coordinatorPhone}
            onChange={(e) => setCoordinatorPhone(e.target.value)}
          />

          <InputField
            id="stateName"
            label="State / Jurisdiction"
            placeholder="e.g. Delhi, Maharashtra..."
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700">Target Formulary Plan *</label>
            <select
              value={defaultPlanCode}
              onChange={(e) => setDefaultPlanCode(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#E76120]"
            >
              {plans.map((p) => {
                const isPhysical = p.deliveryType === 'PHYSICAL' || p.isGstApplicable === false;
                const gstText = isPhysical ? '0% GST (Exempt)' : `+${p.gstRatePercent || 18}% GST`;
                const deliveryLabel =
                  p.deliveryType === 'PHYSICAL'
                    ? 'Hardcopy Book'
                    : p.deliveryType === 'ONLINE_PHYSICAL'
                    ? 'Online + Book'
                    : 'Digital Monograph';
                return (
                  <option key={p.code} value={p.code}>
                    {p.name} — ₹{p.priceINR?.toLocaleString('en-IN')} / seat ({deliveryLabel} • {gstText})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Display Active Bulk Volume Slabs for Selected Plan */}
        {selectedPlanObj?.bulkDiscountSlabs?.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              Volume Slab Discounts on {selectedPlanObj.name}:
            </span>
            {selectedPlanObj.bulkDiscountSlabs.map((slab, i) => (
              <Badge key={i} variant="outline" className="text-[10px] font-bold bg-emerald-50/70 text-emerald-800 border-emerald-200">
                {slab.minQty}
                {slab.maxQty ? `–${slab.maxQty}` : '+'} seats: {slab.discountPercent}% OFF
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 3. Entry Mode Switcher: Excel Upload vs Direct Manual Roster Table */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">3. Member Roster Input</h4>
            <p className="text-slate-500 text-xs">
              Upload a 6-column Excel/CSV spreadsheet OR enter member seats directly in the table below.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setEntryMode('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                entryMode === 'excel'
                  ? 'bg-white text-[#284661] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel / CSV Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                entryMode === 'manual'
                  ? 'bg-white text-[#284661] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Direct Manual Table ({rows.length})</span>
            </button>
          </div>
        </div>

        {entryMode === 'excel' ? (
          <div className="space-y-4">
            {/* Template Download Banner */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-[#284661] text-xs">
                  Official 6-Column Batch Template ({STAKEHOLDER_TABS.find((t) => t.id === stakeholderType)?.label})
                </h5>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Columns: Full Name, Email Address, Mobile Number (10 digits), Role/Designation, {idLabel}, {deptLabel}.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="rounded-xl text-xs font-bold shrink-0 bg-white border-blue-200 text-[#284661] hover:bg-blue-100/50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>{isDownloadingTemplate ? 'Generating...' : 'Download Sample Excel (.xlsx)'}</span>
              </Button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50
                ${file ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 hover:border-[#284661]'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mb-3">
                {file ? (
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-[#284661]" />
                )}
              </div>

              {file ? (
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{file.name}</span>
                  <span className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB · Click to change file
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    Click to select or drag and drop subscriber spreadsheet
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) up to 10MB
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Direct Manual Roster Entry Table (Matched with User Portal) */
          <div className="space-y-3">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 min-w-[160px]">Full Name</th>
                    <th className="p-2.5 min-w-[190px]">Email Address *</th>
                    <th className="p-2.5 min-w-[140px]">10-Digit Mobile *</th>
                    <th className="p-2.5 min-w-[150px]">Role / Category</th>
                    <th className="p-2.5 min-w-[140px]">{idLabel}</th>
                    <th className="p-2.5 min-w-[140px]">{deptLabel}</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                          placeholder="Full Name"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#E76120]"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="email"
                          value={r.email}
                          onChange={(e) => handleRowChange(idx, 'email', e.target.value)}
                          placeholder="member@domain.com"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#E76120]"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="tel"
                          maxLength={10}
                          value={r.phone}
                          onChange={(e) =>
                            handleRowChange(idx, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                          }
                          placeholder="9876543210"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#E76120]"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={r.roleOrCategory}
                          onChange={(e) => handleRowChange(idx, 'roleOrCategory', e.target.value)}
                          placeholder={rolePlaceholder}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#E76120]"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={r.rollOrEmployeeId}
                          onChange={(e) => handleRowChange(idx, 'rollOrEmployeeId', e.target.value)}
                          placeholder="ID / Reg No."
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#E76120]"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={r.department}
                          onChange={(e) => handleRowChange(idx, 'department', e.target.value)}
                          placeholder="Department"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#E76120]"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add 1 Row</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddMultipleRows(3)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 mr-1" />
                <span>+ Add 3 Rows</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Validate & Preview Action Button */}
      <div className="flex justify-end pt-1">
        <Button
          type="button"
          variant="nfiYellow"
          size="lg"
          onClick={handleParseAndValidate}
          disabled={(entryMode === 'excel' && !file) || isProcessing}
          className="rounded-xl font-bold px-6 shadow-2xs cursor-pointer text-xs"
        >
          <span>
            {isProcessing ? 'Validating Batch...' : 'Validate & Preview Subscriber Roster'}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default BulkUploadZone;
