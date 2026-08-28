import React, { useState } from 'react';
import { User, CreditCard, Calendar, Clock, Hash, Phone, Users, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { formatAadhaarNumber, computeFullEnrollmentNumber } from '../utils/uidaiEmail';

export default function AadhaarDetailsScreen({ initialDetails, onSubmitDetails, onNext, onBack }) {
  const [formData, setFormData] = useState(
    initialDetails || {
      name: '',
      aadhaarNumber: '',
      oldDob: '',
      newDob: '',
      fatherName: '',
      motherName: '',
      mobileNumber: '',
      enrollmentNumber: '',
      enrollmentDate: new Date().toISOString().slice(0, 10),
      enrollmentTime: '12:00:00',
    }
  );

  const [errors, setErrors] = useState({});

  const handleAadhaarChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 12);
    setFormData((prev) => ({ ...prev, aadhaarNumber: rawVal }));
    if (errors.aadhaarNumber) setErrors((prev) => ({ ...prev, aadhaarNumber: null }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Required: Name
    if (!formData.name.trim()) newErrors.name = 'Full Name is required';

    // Required: Aadhaar 12 digits
    const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      newErrors.aadhaarNumber = 'Valid 12-digit Aadhaar number required';
    }

    // Required: Enrollment Number (14 digits)
    const cleanEid = formData.enrollmentNumber.replace(/\D/g, '');
    if (!cleanEid || cleanEid.length !== 14) {
      newErrors.enrollmentNumber = 'Enrollment Number must be exactly 14 digits';
    }

    // Required: Enrollment Date
    if (!formData.enrollmentDate) newErrors.enrollmentDate = 'Enrollment Date required';

    // Required: Enrollment Time (with seconds)
    if (!formData.enrollmentTime) newErrors.enrollmentTime = 'Enrollment Time required';

    // Required: New DOB
    if (!formData.newDob) newErrors.newDob = 'Correct New DOB is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Compute full 28-digit enrollment number
    const fullEnrollmentNumber = computeFullEnrollmentNumber(
      formData.enrollmentNumber,
      formData.enrollmentDate,
      formData.enrollmentTime
    );

    const updatedFormData = {
      ...formData,
      fullEnrollmentNumber,
    };

    const handleProceed = onSubmitDetails || onNext;
    if (handleProceed) {
      handleProceed(updatedFormData);
    }
  };

  // Live preview of full enrollment number
  const cleanEidPreview = formData.enrollmentNumber.replace(/\D/g, '');
  const fullEIDPreview = cleanEidPreview.length === 14
    ? computeFullEnrollmentNumber(formData.enrollmentNumber, formData.enrollmentDate, formData.enrollmentTime)
    : '';

  return (
    <div className="flex-1 flex flex-col p-4 max-w-xl mx-auto w-full space-y-6">
      {/* Title */}
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          Aadhaar Update Details
        </h2>
        <p className="text-slate-400 text-sm">
          Fields marked * are required. Optional fields appear in email only when filled.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Name * */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-400" />
            <span>1. Customer Full Name *</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            className="w-full px-4 py-3.5 text-lg font-semibold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
          />
          {errors.name && (
            <span className="text-xs font-bold text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </span>
          )}
        </div>

        {/* 2. Aadhaar Number * */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>2. Aadhaar Number (12 Digits) *</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatAadhaarNumber(formData.aadhaarNumber)}
            onChange={handleAadhaarChange}
            placeholder="1234 - 5678 - 9012"
            className="w-full px-4 py-3.5 text-lg font-mono font-bold tracking-wider rounded-2xl bg-slate-800 border-2 border-slate-700 text-blue-300 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
          />
          {errors.aadhaarNumber && (
            <span className="text-xs font-bold text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.aadhaarNumber}
            </span>
          )}
        </div>

        {/* 3. Enrollment Number (14 digits) * */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-blue-400" />
            <span>3. Enrollment Number (14 Digits) *</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.enrollmentNumber}
            onChange={(e) => handleChange('enrollmentNumber', e.target.value)}
            placeholder="e.g. 00150333145600"
            maxLength={20}
            className="w-full px-4 py-3.5 text-lg font-mono font-bold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
          />
          <span className="text-[11px] text-slate-500">
            {cleanEidPreview.length}/14 digits entered
          </span>
          {errors.enrollmentNumber && (
            <span className="text-xs font-bold text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.enrollmentNumber}
            </span>
          )}
        </div>

        {/* 4 & 5. Enrollment Date & Time (with seconds) * */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>4. Enrollment Date *</span>
            </label>
            <input
              type="date"
              value={formData.enrollmentDate}
              onChange={(e) => handleChange('enrollmentDate', e.target.value)}
              className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white focus:border-blue-500 focus:outline-none transition-all"
            />
            {errors.enrollmentDate && (
              <span className="text-xs font-bold text-red-400">{errors.enrollmentDate}</span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>5. Enrollment Time (HH:MM:SS) *</span>
            </label>
            <input
              type="time"
              step="1"
              value={formData.enrollmentTime}
              onChange={(e) => handleChange('enrollmentTime', e.target.value)}
              className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white focus:border-blue-500 focus:outline-none transition-all"
            />
            {errors.enrollmentTime && (
              <span className="text-xs font-bold text-red-400">{errors.enrollmentTime}</span>
            )}
          </div>
        </div>

        {/* Full Enrollment URN Preview (28 digits) */}
        {fullEIDPreview && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-left space-y-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Full Enrollment URN (28 digits, auto-generated):
            </span>
            <p className="text-sm font-mono font-extrabold text-white tracking-wider break-all">
              {fullEIDPreview}
            </p>
            <span className="text-[10px] text-slate-500">
              = {cleanEidPreview} + {formData.enrollmentDate?.replace(/-/g, '') || 'YYYYMMDD'} + {(formData.enrollmentTime || '').replace(/:/g, '').slice(0, 6) || 'HHMMSS'}
            </span>
          </div>
        )}

        {/* 6. New DOB * */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-green-400" />
            <span>6. Correct New DOB *</span>
          </label>
          <input
            type="date"
            value={formData.newDob}
            onChange={(e) => handleChange('newDob', e.target.value)}
            className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white focus:border-blue-500 focus:outline-none transition-all"
          />
          {errors.newDob && (
            <span className="text-xs font-bold text-red-400">{errors.newDob}</span>
          )}
        </div>

        {/* OPTIONAL FIELDS SEPARATOR */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Optional Fields</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* 7. Old DOB (Optional) */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Old DOB in Aadhaar (Optional)</span>
          </label>
          <input
            type="date"
            value={formData.oldDob}
            onChange={(e) => handleChange('oldDob', e.target.value)}
            className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800/60 border-2 border-slate-750 text-white focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* 8 & 9. Father Name & Mother Name (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Father Name (Optional)</span>
            </label>
            <input
              type="text"
              value={formData.fatherName}
              onChange={(e) => handleChange('fatherName', e.target.value)}
              placeholder="e.g. Suresh Kumar"
              className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800/60 border-2 border-slate-750 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Mother Name (Optional)</span>
            </label>
            <input
              type="text"
              value={formData.motherName}
              onChange={(e) => handleChange('motherName', e.target.value)}
              placeholder="e.g. Sunita Devi"
              className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800/60 border-2 border-slate-750 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* 10. Mobile Number (Optional) */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-slate-500" />
            <span>Mobile Number (Optional)</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={formData.mobileNumber}
            onChange={(e) => handleChange('mobileNumber', e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full px-4 py-3.5 text-base font-mono font-semibold rounded-2xl bg-slate-800/60 border-2 border-slate-750 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* Bottom Action Buttons */}
        <div className="pt-4 space-y-3">
          <button
            type="submit"
            className="btn-primary-xl py-5 text-xl shadow-blue-600/30 active:scale-95"
          >
            <span>Generate Email →</span>
            <ArrowRight className="w-6 h-6 text-white" />
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary-xl py-4 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
              <span>← Back</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
