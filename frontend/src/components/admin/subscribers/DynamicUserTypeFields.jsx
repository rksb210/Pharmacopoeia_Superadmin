import React from 'react';
import InputField from '../../common/InputField';
import { Badge } from '../../ui/badge';
import { FileBadge2, Building2, User, Stethoscope } from 'lucide-react';

export const DynamicUserTypeFields = ({
  userType = 'STUDENT',
  dynamicFields = {},
  onChange,
  errors = {},
}) => {
  const handleChange = (fieldKey, value) => {
    onChange({
      ...dynamicFields,
      [fieldKey]: value,
    });
  };

  const uType = (userType || 'STUDENT').toUpperCase();

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3.5 select-none font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          {uType === 'STUDENT' && <FileBadge2 className="w-4 h-4 text-sky-600" />}
          {(uType === 'DOCTOR' || uType === 'PHARMACIST' || uType === 'NURSE') && (
            <Stethoscope className="w-4 h-4 text-emerald-600" />
          )}
          {uType === 'INDUSTRY' && <Building2 className="w-4 h-4 text-[#E76120]" />}
          {uType === 'OTHERS' && <User className="w-4 h-4 text-[#284661]" />}

          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            {uType} Verification Credentials
          </h4>
        </div>

        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
          Dynamic Fields
        </Badge>
      </div>

      {/* Student Fields */}
      {uType === 'STUDENT' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InputField
            id="apaarId"
            name="apaarId"
            label="APAAR ID (Edu-Account)"
            placeholder="e.g. 1234-5678-9012"
            value={dynamicFields.apaarId || ''}
            onChange={(e) => handleChange('apaarId', e.target.value)}
            error={errors.apaarId}
            required
          />

          <InputField
            id="institution"
            name="institution"
            label="Medical / Pharmacy College"
            placeholder="e.g. AIIMS New Delhi"
            value={dynamicFields.institution || ''}
            onChange={(e) => handleChange('institution', e.target.value)}
            error={errors.institution}
          />
        </div>
      )}

      {/* Doctor, Pharmacist, Nurse Fields */}
      {(uType === 'DOCTOR' || uType === 'PHARMACIST' || uType === 'NURSE') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InputField
            id="registrationNo"
            name="registrationNo"
            label={`${uType} Registration Number`}
            placeholder={
              uType === 'DOCTOR'
                ? 'e.g. MCI-2023-89102'
                : uType === 'PHARMACIST'
                ? 'e.g. PCI-DL-9841'
                : 'e.g. INC-RN-4819'
            }
            value={dynamicFields.registrationNo || ''}
            onChange={(e) => handleChange('registrationNo', e.target.value)}
            error={errors.registrationNo}
            required
          />

          <InputField
            id="stateCouncil"
            name="stateCouncil"
            label="State Professional Council"
            placeholder="e.g. Delhi Medical Council / State Council"
            value={dynamicFields.stateCouncil || ''}
            onChange={(e) => handleChange('stateCouncil', e.target.value)}
            error={errors.stateCouncil}
            required
          />
        </div>
      )}

      {/* Industry Fields */}
      {uType === 'INDUSTRY' && (
        <div className="space-y-3">
          <InputField
            id="companyName"
            name="companyName"
            label="Industry / Company Name"
            placeholder="e.g. Cipla Healthcare Ltd"
            value={dynamicFields.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            error={errors.companyName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <InputField
              id="gstin"
              name="gstin"
              label="Company GSTIN (15 Characters)"
              placeholder="e.g. 22AAAAA0000A1Z5"
              value={dynamicFields.gstin || ''}
              onChange={(e) => handleChange('gstin', e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15))}
              error={errors.gstin}
              helperText="Format: 2 digits + 10-char PAN + 1 entity + Z + 1 check digit"
              maxLength={15}
              required
            />

            <InputField
              id="pan"
              name="pan"
              label="Corporate PAN (10 Characters)"
              placeholder="e.g. AAAAA9999A"
              value={dynamicFields.pan || ''}
              onChange={(e) => handleChange('pan', e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 10))}
              error={errors.pan}
              helperText="Format: 5 letters + 4 digits + 1 letter"
              maxLength={10}
              required
            />
          </div>
        </div>
      )}

      {/* Others Fields */}
      {uType === 'OTHERS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InputField
            id="designation"
            name="designation"
            label="Designation / Professional Title"
            placeholder="e.g. Health Policy Consultant"
            value={dynamicFields.designation || ''}
            onChange={(e) => handleChange('designation', e.target.value)}
            error={errors.designation}
            required
          />

          <InputField
            id="organization"
            name="organization"
            label="Organization / Institute"
            placeholder="e.g. Indian Council of Medical Research"
            value={dynamicFields.organization || ''}
            onChange={(e) => handleChange('organization', e.target.value)}
            error={errors.organization}
          />
        </div>
      )}
    </div>
  );
};

export default DynamicUserTypeFields;
