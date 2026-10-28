import React, { useState } from 'react';
import { Registration, GlobalSettings } from '../types.ts';
import { api } from '../lib/api.ts';
import { X, Upload, CheckCircle2, AlertCircle, Copy, Check, Smartphone } from 'lucide-react';
import { generateUpiPaymentUrl, generateUpiQrCodeUrl } from '../lib/payment.ts';

interface PaymentProofModalProps {
  registration: Registration;
  settings: GlobalSettings;
  onClose: () => void;
  onSuccess: (updated: Registration) => void;
}

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  registration,
  settings,
  onClose,
  onSuccess
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentRef, setPaymentRef] = useState(registration.paymentReference || '');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>(registration.paymentProofUrl || '');
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId || 'nmimsdhule@upi');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Only image files (PNG, JPEG, WEBP) or PDF receipts are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFileBase64(result);
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!previewUrl && !fileBase64) {
      setError('Please select and upload a payment receipt or screenshot.');
      return;
    }

    if (!paymentRef.trim()) {
      setError('Please enter the 12-digit UPI / Bank Reference (UTR) Number.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadPaymentProof(
        registration.id,
        fileBase64 || previewUrl,
        paymentRef,
        fileName || registration.paymentProofFileName || 'payment_proof.jpg'
      );
      setSuccess(true);
      onSuccess(res.registration);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0b1126] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <span>REG ID: {registration.id}</span>
            <span>&bull;</span>
            <span>{registration.eventName}</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white mt-1">
            Submit Payment Proof
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete your registration fee transfer and provide the transaction verification screenshot.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Proof Uploaded Successfully</h3>
            <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto">
              Your status is now <strong>Under Verification</strong>. The finance committee will verify the transaction and notify you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Payment Summary Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Registration Fee</span>
                <span className="text-2xl font-black font-display text-cyan-300">
                  ₹{registration.registrationFee}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Current Status</span>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {registration.paymentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Official Event-Specific Payment QR */}
            {(() => {
              const upiId = settings.upiId || '9975952579@fam';
              const upiPaymentUrl = generateUpiPaymentUrl(upiId, 'Rugved Solanki', registration.registrationFee, registration.eventName);
              const dynamicQrUrl = generateUpiQrCodeUrl(upiPaymentUrl, 300);

              return (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 text-center space-y-3">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block font-semibold">
                    Dynamic Payment QR for {registration.eventName}
                  </span>

                  <div className="max-w-[180px] mx-auto p-2.5 bg-white rounded-xl shadow-lg border border-cyan-500/40">
                    <img
                      src={dynamicQrUrl}
                      alt={`UPI QR Code for ${registration.eventName} (₹${registration.registrationFee})`}
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  </div>

                  <span className="text-xs font-bold font-mono text-emerald-400 block">
                    Amount Locked: ₹{registration.registrationFee}
                  </span>

                  <a
                    href={upiPaymentUrl}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pay Exact ₹{registration.registrationFee} via UPI App</span>
                  </a>

                  {/* UPI ID Row */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-mono">UPI ID:</span>
                    <code className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-cyan-300 border border-slate-700">
                      {upiId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                    Scanning this QR code or clicking the button pre-fills and locks the amount to ₹{registration.registrationFee} for {registration.eventName}.
                  </p>
                </div>
              );
            })()}

            {/* Transaction Reference / UTR Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                UPI Reference / UTR / Transaction ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 423589123456 or BANK-REF-9021"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder:text-slate-500 font-mono"
              />
            </div>

            {/* Receipt File Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Upload Payment Screenshot / Receipt *
              </label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <Upload className="w-6 h-6 text-cyan-400" />
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-cyan-300">Click to upload</span> or drag and drop
                  </div>
                  <span className="text-[10px] text-slate-500">PNG, JPG, WEBP, or PDF (Max 5MB)</span>
                </div>
              </div>

              {previewUrl && (
                <div className="mt-3 p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[280px]">
                    {fileName || registration.paymentProofFileName || 'payment_proof_file'}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">Ready to upload</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-50 transition-all shadow-lg"
              >
                {uploading ? 'Verifying Upload...' : 'Submit Payment Proof'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
