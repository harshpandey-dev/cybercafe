import React, { useState } from 'react';
import { User, CreditCard, Calendar, Clock, Hash, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { formatAadhaarNumber } from '../utils/uidaiEmail';

export default function AadhaarDetailsScreen({ initialDetails, onSubmitDetails, onNext, onBack }) {
  const [formData, setFormData] = useState(
    initialDetails || {
      name: '',
      aadhaarNumber: '',
      oldDob: '',
      newDob: '',
      enrollmentNumber: '',
      enrollmentDate: new Date().toISOString().slice(0, 10),
      enrollmentTime: '12:00',
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

    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      newErrors.aadhaarNumber = 'Valid 12-digit Aadhaar number required';
    }
    if (!formData.oldDob) newErrors.oldDob = 'Old DOB in Aadhaar is required';
    if (!formData.newDob) newErrors.newDob = 'New Correct DOB is required';
    if (!formData.enrollmentNumber.trim()) newErrors.enrollmentNumber = 'Enrollment Number required';
    if (!formData.enrollmentDate) newErrors.enrollmentDate = 'Enrollment Date required';
    if (!formData.enrollmentTime) newErrors.enrollmentTime = 'Enrollment Time required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const handleProceed = onSubmitDetails || onNext;
    if (handleProceed) {
      handleProceed(formData);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-xl mx-auto w-full space-y-6">
      {/* Title */}
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          Aadhaar Update Details
        </h2>
        <p className="text-slate-400 text-sm">
          Enter customer details below with minimal typing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Name */}
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

        {/* 2. Aadhaar Number */}
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

        {/* 3 & 4. Old DOB & New DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-red-400" />
              <span>3. DOB in Aadhaar *</span>
            </label>
            <input
              type="date"
              value={formData.oldDob}
              onChange={(e) => handleChange('oldDob', e.target.value)}
              className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white focus:border-blue-500 focus:outline-none transition-all"
            />
            {errors.oldDob && (
              <span className="text-xs font-bold text-red-400">{errors.oldDob}</span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-green-400" />
              <span>4. Correct New DOB *</span>
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
        </div>

        {/* 5. Enrollment Number */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-blue-400" />
            <span>5. Enrollment Number (EID) *</span>
          </label>
          <input
            type="text"
            value={formData.enrollmentNumber}
            onChange={(e) => handleChange('enrollmentNumber', e.target.value)}
            placeholder="1234/12345/12345"
            className="w-full px-4 py-3.5 text-lg font-mono font-bold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
          />
          {errors.enrollmentNumber && (
            <span className="text-xs font-bold text-red-400">{errors.enrollmentNumber}</span>
          )}
        </div>

        {/* 6 & 7. Enrollment Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>6. Enrollment Date *</span>
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
              <span>7. Enrollment Time *</span>
            </label>
            <input
              type="time"
              value={formData.enrollmentTime}
              onChange={(e) => handleChange('enrollmentTime', e.target.value)}
              className="w-full px-4 py-3.5 text-base font-semibold rounded-2xl bg-slate-800 border-2 border-slate-700 text-white focus:border-blue-500 focus:outline-none transition-all"
            />
            {errors.enrollmentTime && (
              <span className="text-xs font-bold text-red-400">{errors.enrollmentTime}</span>
            )}
          </div>
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
              <span>← Back to PDF Ready</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
