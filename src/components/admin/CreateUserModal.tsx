'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, CreateUserPayload } from '@/lib/api/users';
import { batchesApi } from '@/lib/api/batches';
import { useUIStore } from '@/stores/useUIStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { UserRole, ImportedStudent } from '@/types';
import {
  UserPlus,
  User,
  Phone,
  Lock,
  Mail,
  GraduationCap,
  Plus,
  Undo2,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  Copy,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { useBatches } from '@/hooks/useBatches';
import {
  validateStudentsCsv,
  generateSampleCsv,
  CsvValidationResult,
} from '@/lib/utils/csvImportValidator';

export function CreateUserModal() {
  const queryClient = useQueryClient();
  const { isCreateUserModalOpen, setCreateUserModalOpen, createUserModalTab, addToast } = useUIStore();
  const { batches, isLoading: isLoadingBatches, createBatch } = useBatches();

  // Tab state
  const [activeTab, setActiveTab] = useState<'single' | 'import'>('single');

  // Single User State
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isCreatingNewBatch, setIsCreatingNewBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Bulk Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvValidation, setCsvValidation] = useState<CsvValidationResult | null>(null);
  const [importBatchId, setImportBatchId] = useState('');
  const [isImportCreatingNewBatch, setIsImportCreatingNewBatch] = useState(false);
  const [importNewBatchName, setImportNewBatchName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importServerErrors, setImportServerErrors] = useState<string[]>([]);
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Sync tab with store when modal opens
  useEffect(() => {
    if (isCreateUserModalOpen) {
      setActiveTab(createUserModalTab || 'single');
    }
  }, [isCreateUserModalOpen, createUserModalTab]);

  // Auto-select first batch when batches load
  useEffect(() => {
    if (batches.length > 0) {
      if (!selectedBatchId) setSelectedBatchId(batches[0].id);
      if (!importBatchId) setImportBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId, importBatchId]);

  // Single User Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.createUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      addToast({
        type: 'success',
        title: 'Account Created',
        message: `Created ${newUser.role} account for ${newUser.name}`,
      });
      handleClose();
    },
  });

  // Bulk Import Mutation
  const importMutation = useMutation({
    mutationFn: ({ batchId, file }: { batchId: string; file: File }) =>
      batchesApi.importStudents(batchId, file),
  });

  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setPassword('');
    setRole('student');
    setSelectedBatchId(batches[0]?.id || '');
    setIsCreatingNewBatch(false);
    setNewBatchName('');
    setEmail('');
    setError(null);

    setCsvFile(null);
    setCsvValidation(null);
    setImportBatchId(batches[0]?.id || '');
    setIsImportCreatingNewBatch(false);
    setImportNewBatchName('');
    setImportError(null);
    setImportServerErrors([]);
    setImportedStudents(null);
    setCopiedId(null);
    setCopiedAll(false);
  };

  const handleClose = () => {
    setCreateUserModalOpen(false);
    resetForm();
  };

  // Handle single user submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneClean = phoneNumber.trim();
    if (!phoneClean.startsWith('+')) {
      setError('Phone number must start with "+" and country code (e.g. +14155552671)');
      return;
    }
    if (!/^\+[0-9]{7,15}$/.test(phoneClean)) {
      setError('Phone number must contain 7-15 digits after "+" (e.g. +14155552671)');
      return;
    }

    if (!name.trim()) {
      setError('Please provide a full name');
      return;
    }

    let finalBatchId = selectedBatchId;

    if (role === 'student' && isCreatingNewBatch) {
      const trimmedBatch = newBatchName.trim();
      if (!trimmedBatch) {
        setError('Please enter a batch name');
        return;
      }
      try {
        const created = await createBatch({ name: trimmedBatch });
        finalBatchId = created.id;
        setSelectedBatchId(created.id);
        setIsCreatingNewBatch(false);
      } catch (batchErr: unknown) {
        const errorMsg =
          (batchErr as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to create batch';
        setError(errorMsg);
        return;
      }
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        phoneNumber: phoneClean,
        password,
        role,
        batchId: role === 'student' ? finalBatchId || undefined : undefined,
        email: email.trim() || undefined,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create user account';
      setError(errorMsg);
    }
  };

  // Handle file selection and instant client validation
  const handleFileChange = (file: File | null) => {
    setImportError(null);
    setImportServerErrors([]);
    setImportedStudents(null);

    if (!file) {
      setCsvFile(null);
      setCsvValidation(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please upload a .csv file');
      setCsvFile(null);
      setCsvValidation(null);
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const result = validateStudentsCsv(text);
      setCsvValidation(result);
    };
    reader.onerror = () => {
      setImportError('Failed to read selected file');
    };
    reader.readAsText(file);
  };

  // Handle bulk import submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportServerErrors([]);

    if (!csvFile) {
      setImportError('Please select a CSV file');
      return;
    }

    if (!csvValidation || !csvValidation.isValid) {
      setImportError('Please fix CSV validation errors before submitting');
      return;
    }

    let finalBatchId = importBatchId;

    if (isImportCreatingNewBatch) {
      const trimmed = importNewBatchName.trim();
      if (!trimmed) {
        setImportError('Please enter a batch name');
        return;
      }
      try {
        const created = await createBatch({ name: trimmed });
        finalBatchId = created.id;
        setImportBatchId(created.id);
        setIsImportCreatingNewBatch(false);
      } catch (bErr: unknown) {
        const msg =
          (bErr as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to create batch';
        setImportError(msg);
        return;
      }
    }

    if (!finalBatchId) {
      setImportError('Please select a cohort batch');
      return;
    }

    try {
      const response = await importMutation.mutateAsync({
        batchId: finalBatchId,
        file: csvFile,
      });

      const students: ImportedStudent[] = Array.isArray(response)
        ? response
        : response.results || response.students || response.created || [];

      setImportedStudents(students);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });

      addToast({
        type: 'success',
        title: 'Import Successful',
        message: `Imported ${students.length || csvValidation.rows.length} students.`,
      });
    } catch (err: unknown) {
      const errData = (err as {
        response?: { data?: { errors?: unknown[]; message?: string } };
      })?.response?.data;

      if (errData?.errors && Array.isArray(errData.errors)) {
        const serverErrs = errData.errors.map((item: unknown) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            const errObj = item as { row?: number; message?: string; error?: string };
            if (errObj.row) {
              return `Row ${errObj.row}: ${errObj.message || errObj.error || JSON.stringify(errObj)}`;
            }
            return errObj.message || errObj.error || JSON.stringify(errObj);
          }
          return String(item);
        });
        setImportServerErrors(serverErrs);
      } else if (typeof errData?.message === 'string') {
        if (errData.message.includes('\n')) {
          setImportServerErrors(errData.message.split('\n').filter((l: string) => l.trim()));
        } else {
          setImportError(errData.message);
        }
      } else {
        setImportError('Failed to import students. Please check your CSV data.');
      }
    }
  };

  // Download credentials CSV
  const handleDownloadCredentialsCsv = () => {
    if (!importedStudents || importedStudents.length === 0) return;
    const targetBatch = batches.find((b) => b.id === importBatchId)?.name || 'batch';
    const header = 'Name,Phone Number,Email,Temporary Password,Batch\n';
    const rows = importedStudents
      .map((s) => {
        const pass = s.temporaryPassword || s.password || '';
        return `"${s.name}","${s.phoneNumber}","${s.email || ''}","${pass}","${targetBatch}"`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_credentials_${targetBatch}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy all credentials to clipboard
  const handleCopyAllCredentials = () => {
    if (!importedStudents || importedStudents.length === 0) return;
    const text = importedStudents
      .map((s) => {
        const pass = s.temporaryPassword || s.password || '';
        return `Name: ${s.name} | Phone: ${s.phoneNumber} | Password: ${pass}${
          s.email ? ` | Email: ${s.email}` : ''
        }`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
    addToast({ type: 'info', message: 'Credentials copied to clipboard' });
  };

  // Copy single password
  const handleCopySinglePassword = (password: string, id: string) => {
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download sample CSV template
  const handleDownloadSample = () => {
    const content = generateSampleCsv();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isCreateUserModalOpen}
      onClose={handleClose}
      title={importedStudents ? 'Student Credentials' : 'Add Account'}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* VIEW 1: CREDENTIALS SUCCESS VIEW */}
        {importedStudents ? (
          <div className="space-y-4 text-left animate-fade-in">
            <div className="p-3.5 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#e9edef] text-sm">
                  {importedStudents.length} Students Imported
                </p>
                <p className="text-[11px] text-amber-400 mt-0.5">
                  Save these temporary passwords now. They cannot be retrieved after closing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyAllCredentials}
                  className="flex items-center gap-1.5"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'Copied' : 'Copy All'}</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadCredentialsCsv}
                  className="flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </Button>
              </div>
            </div>

            {/* Credentials Table */}
            <div className="max-h-64 overflow-y-auto rounded-xl bg-[#111b21] border border-[#2a3942] custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202c33] text-[#8696a0] uppercase font-semibold text-[10px] border-b border-[#2a3942] sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Phone (Login)</th>
                    <th className="px-3 py-2">Temporary Password</th>
                    <th className="px-3 py-2 text-right">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3942] text-[#d1d7db]">
                  {importedStudents.map((s, idx) => {
                    const rowKey = s.id || s._id || `${s.phoneNumber}-${idx}`;
                    const pass = s.temporaryPassword || s.password || '—';
                    const isCopied = copiedId === rowKey;

                    return (
                      <tr key={rowKey} className="hover:bg-[#182229] transition-colors">
                        <td className="px-3 py-2 font-medium text-[#e9edef]">
                          {s.name}
                          {s.email && <span className="block text-[10px] text-[#8696a0]">{s.email}</span>}
                        </td>
                        <td className="px-3 py-2 font-mono text-[#00a884]">{s.phoneNumber}</td>
                        <td className="px-3 py-2 font-mono font-bold text-amber-300">{pass}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopySinglePassword(pass, rowKey)}
                            className="p-1 rounded text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
                            title="Copy password"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-[#00a884]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button type="button" variant="primary" size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* VIEW 2: FORM VIEW (Single Account vs Bulk Import) */
          <>
            {/* Tab Selection */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#202c33] border border-[#2a3942]">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'single'
                    ? 'bg-[#00a884] text-white shadow-sm'
                    : 'text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Single Account</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'import'
                    ? 'bg-[#00a884] text-white shadow-sm'
                    : 'text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Import Students (CSV)</span>
              </button>
            </div>

            {/* TAB CONTENT: BULK IMPORT */}
            {activeTab === 'import' ? (
              <form onSubmit={handleImportSubmit} className="space-y-4 text-left animate-fade-in">
                {/* File Upload Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                      CSV File
                    </label>
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="inline-flex items-center gap-1 text-[11px] text-[#00a884] hover:underline"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Sample CSV</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />

                  {!csvFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#2a3942] hover:border-[#00a884] rounded-xl p-5 text-center cursor-pointer bg-[#111b21] transition-all group"
                    >
                      <Upload className="w-6 h-6 text-[#8696a0] group-hover:text-[#00a884] mx-auto mb-1.5 transition-colors" />
                      <p className="text-xs font-semibold text-[#e9edef]">
                        Choose CSV file or drag and drop
                      </p>
                      <p className="text-[11px] text-[#8696a0] mt-0.5">
                        Headers: <span className="text-[#00a884] font-mono">phoneNumber, name</span> (optional: <span className="text-[#00a884] font-mono">email</span>) • Phone must start with <span className="text-[#00a884] font-mono">+CountryCode</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#111b21] border border-[#2a3942]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[#202c33] text-[#00a884]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#e9edef] truncate">{csvFile.name}</p>
                          <p className="text-[10px] text-[#8696a0]">
                            {(csvFile.size / 1024).toFixed(1)} KB • {csvValidation?.totalRows ?? 0} rows
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileChange(null)}
                        className="p-1.5 rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Validation Errors */}
                {csvValidation && !csvValidation.isValid && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-2 font-bold text-rose-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{csvValidation.errors.length} issue(s) found:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 max-h-36 overflow-y-auto custom-scrollbar text-[11px] font-mono">
                      {csvValidation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation Preview */}
                {csvValidation && csvValidation.isValid && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="rounded-lg bg-[#111b21] border border-[#2a3942] overflow-hidden text-[11px]">
                      <div className="px-3 py-1.5 bg-[#202c33] text-[#00a884] font-semibold text-[11px] flex items-center justify-between">
                        <span>Preview ({csvValidation.rows.length} students)</span>
                      </div>
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-[#2a3942] text-[#d1d7db]">
                          {csvValidation.rows.slice(0, 5).map((r) => (
                            <tr key={r.rowNumber}>
                              <td className="px-3 py-1.5 font-medium text-[#e9edef]">{r.name}</td>
                              <td className="px-3 py-1.5 font-mono text-[#00a884]">{r.phoneNumber}</td>
                              <td className="px-3 py-1.5 text-[#8696a0]">{r.email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvValidation.rows.length > 5 && (
                        <div className="px-3 py-1 text-[10px] text-[#8696a0] bg-[#182229] border-t border-[#2a3942]">
                          + {csvValidation.rows.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Target Cohort Batch Selection */}
                <div className="p-3 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                      Cohort Batch
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsImportCreatingNewBatch(!isImportCreatingNewBatch);
                        setImportNewBatchName('');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-[#00a884] hover:underline"
                    >
                      {isImportCreatingNewBatch ? (
                        <>
                          <Undo2 className="w-3 h-3" /> Existing Batch
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" /> New Batch
                        </>
                      )}
                    </button>
                  </div>

                  {isImportCreatingNewBatch ? (
                    <Input
                      placeholder="Batch name"
                      value={importNewBatchName}
                      onChange={(e) => setImportNewBatchName(e.target.value)}
                      leftIcon={<GraduationCap className="w-4 h-4 text-[#00a884]" />}
                      required
                      autoFocus
                    />
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00a884]">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <select
                        value={importBatchId}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsImportCreatingNewBatch(true);
                          } else {
                            setImportBatchId(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl bg-[#111b21] pl-9 pr-3 py-2.5 text-xs text-[#e9edef] border border-[#2a3942] focus:border-[#00a884] outline-none transition-colors appearance-none cursor-pointer"
                      >
                        {batches.length === 0 ? (
                          <option value="" disabled>
                            {isLoadingBatches ? 'Loading batches...' : 'No batches exist yet'}
                          </option>
                        ) : (
                          batches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))
                        )}
                        <option value="__NEW__">+ Create New Cohort Batch...</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Server Error Reporting */}
                {importError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                    {importError}
                  </div>
                )}

                {importServerErrors.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-rose-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{importServerErrors.length} error(s) returned:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 max-h-36 overflow-y-auto custom-scrollbar text-[11px] font-mono">
                      {importServerErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={importMutation.isPending}
                    disabled={!csvFile || (csvValidation !== null && !csvValidation.isValid)}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {csvValidation?.isValid
                        ? `Import ${csvValidation.rows.length} Students`
                        : 'Import Students'}
                    </span>
                  </Button>
                </div>
              </form>
            ) : (
              /* TAB CONTENT: SINGLE USER */
              <form onSubmit={handleSingleSubmit} className="space-y-4 animate-fade-in">
                {/* Role Selection Tabs */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                    Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['student', 'agent', 'super_admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                          role === r
                            ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]'
                            : 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942]'
                        }`}
                      >
                        {r.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Full Name"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    leftIcon={<User className="w-4 h-4 text-[#8696a0]" />}
                    required
                  />

                  <Input
                    label="Phone Number (Login ID)"
                    placeholder="+14155552671"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    leftIcon={<Phone className="w-4 h-4 text-[#8696a0]" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Password"
                    type="text"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-[#8696a0]" />}
                    required
                  />

                  <Input
                    label="Email (Optional)"
                    type="email"
                    placeholder="alex@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4 text-[#8696a0]" />}
                  />
                </div>

                {/* Student Specific Fields */}
                {role === 'student' && (
                  <div className="p-3 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2 animate-fade-in">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-[#8696a0]">
                          Cohort Batch
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewBatch(!isCreatingNewBatch);
                            setNewBatchName('');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-[#00a884] hover:underline"
                        >
                          {isCreatingNewBatch ? (
                            <>
                              <Undo2 className="w-3 h-3" /> Existing Batch
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" /> New Batch
                            </>
                          )}
                        </button>
                      </div>

                      {isCreatingNewBatch ? (
                        <Input
                          placeholder="Batch name"
                          value={newBatchName}
                          onChange={(e) => setNewBatchName(e.target.value)}
                          leftIcon={<GraduationCap className="w-4 h-4 text-[#00a884]" />}
                          required
                          autoFocus
                        />
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00a884]">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <select
                            value={selectedBatchId}
                            onChange={(e) => {
                              if (e.target.value === '__NEW__') {
                                setIsCreatingNewBatch(true);
                              } else {
                                setSelectedBatchId(e.target.value);
                              }
                            }}
                            className="w-full rounded-xl bg-[#111b21] pl-9 pr-3 py-2.5 text-xs text-[#e9edef] border border-[#2a3942] focus:border-[#00a884] outline-none transition-colors appearance-none cursor-pointer"
                          >
                            {batches.length === 0 ? (
                              <option value="" disabled>
                                {isLoadingBatches ? 'Loading batches...' : 'No batches exist yet'}
                              </option>
                            ) : (
                              batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))
                            )}
                            <option value="__NEW__">+ Create New Cohort Batch...</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
