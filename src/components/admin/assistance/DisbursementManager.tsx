"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface Disbursement {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  checkNumber: string | null;
  issueDate: Date;
}

interface Props {
  applicationId: string;
  approvedAmount: number;
  disbursements: Disbursement[];
  adminEmail: string;
}

export default function DisbursementManager({
  applicationId,
  approvedAmount,
  disbursements,
  adminEmail,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  const [formData, setFormData] = useState({
    amount: approvedAmount.toString(),
    paymentMethod: "CHECK",
    checkNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [proofFile, setProofFile] = useState<File | null>(null);

  const totalDisbursed = disbursements.reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );
  const remaining = approvedAmount - totalDisbursed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(formData.amount) > remaining) {
      toast.error(
        `Amount exceeds remaining balance ($${remaining.toFixed(2)})`,
      );
      return;
    }

    if (formData.paymentMethod === "CHECK" && !formData.checkNumber) {
      toast.error("Please enter check number");
      return;
    }

    setLoading(true);

    try {
      // Create disbursement
      const response = await fetch(
        `/api/admin/assistance/${applicationId}/disbursement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
            issuedBy: adminEmail,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create disbursement");
      }

      const { disbursementId } = await response.json();

      // Upload proof of payment if provided
      if (proofFile) {
        setUploadingProof(true);

        const fileFormData = new FormData();
        fileFormData.append("file", proofFile);
        fileFormData.append("disbursementId", disbursementId);

        const uploadResponse = await fetch(
          `/api/admin/assistance/${applicationId}/disbursement/upload`,
          {
            method: "POST",
            body: fileFormData,
          },
        );

        if (!uploadResponse.ok) {
          console.error("Failed to upload proof of payment");
        }
      }

      toast.success("Disbursement recorded!");
      setShowForm(false);
      setFormData({
        amount: remaining.toString(),
        paymentMethod: "CHECK",
        checkNumber: "",
        issueDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setProofFile(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
      setUploadingProof(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large (max 10MB)");
        return;
      }
      setProofFile(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Create Disbursement
        </h2>
        <DollarSign className="w-5 h-5 text-green-600" />
      </div>

      {/* Summary */}
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-900">Approved Amount:</span>
          <span className="font-semibold text-green-900">
            ${approvedAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-900">Disbursed:</span>
          <span className="font-semibold text-green-900">
            ${totalDisbursed.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-green-300">
          <span className="text-green-900 font-semibold">Remaining:</span>
          <span className="font-bold text-green-900">
            ${remaining.toFixed(2)}
          </span>
        </div>
      </div>

      {remaining <= 0 ? (
        <p className="text-sm text-neutral-600 text-center py-4">
          Full amount has been disbursed
        </p>
      ) : !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
        >
          Record Disbursement
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                $
              </span>
              <input
                type="number"
                required
                min="0"
                max={remaining}
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Payment Method *
            </label>
            <select
              required
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="CHECK">Check</option>
              <option value="CASH">Cash</option>
              <option value="REIMBURSEMENT">Reimbursement</option>
            </select>
          </div>

          {/* Check Number */}
          {formData.paymentMethod === "CHECK" && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Check Number *
              </label>
              <input
                type="text"
                required
                value={formData.checkNumber}
                onChange={(e) =>
                  setFormData({ ...formData, checkNumber: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Check #"
              />
            </div>
          )}

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Issue Date *
            </label>
            <input
              type="date"
              required
              value={formData.issueDate}
              onChange={(e) =>
                setFormData({ ...formData, issueDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Internal notes..."
            />
          </div>

          {/* Proof of Payment Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Proof of Payment (Optional)
            </label>
            {!proofFile ? (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
                <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                <span className="text-xs text-neutral-600">
                  Upload check scan or receipt
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                <span className="text-sm text-neutral-900 truncate">
                  {proofFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setProofFile(null)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setProofFile(null);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingProof}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading || uploadingProof ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingProof ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Record Disbursement"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
