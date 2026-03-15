"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BarChart3,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Upload,
  ExternalLink,
  X,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

interface Scholarship {
  id: string;
  recipientName: string;
  amount: number;
  academicYear: string;
  description: string | null;
  awardedAt: string;
}

interface AnnualReport {
  id: string;
  year: number;
  totalEventsHeld: number;
  totalAttendance: number;
  totalAssistancePaid: number;
  totalScholarshipsPaid: number;
  totalSponsorIncome: number | null;
  notes: string | null;
}

interface TaxFiling {
  id: string;
  year: number;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

interface Props {
  scholarships: Scholarship[];
  annualReports: AnnualReport[];
  taxFilings: TaxFiling[];
  isTreasurer: boolean;
}

type Tab = "scholarships" | "reports" | "filings";

export default function AdminArchiveClient({
  scholarships,
  annualReports,
  taxFilings,
  isTreasurer,
}: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<Tab>("scholarships");

  const tabs = [
    { id: "scholarships" as Tab, label: "Scholarships", icon: GraduationCap },
    { id: "reports" as Tab, label: "Annual Reports", icon: BarChart3 },
    { id: "filings" as Tab, label: "990 Filings", icon: FileText },
  ];

  return (
    <>
      <ConfirmDialog />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Archive Management
            </h1>
            <p className="text-sm text-neutral-500">
              Manage public transparency records for HOEP
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 mb-8">
            <nav className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-4 border-b-2 transition-colors text-sm font-medium ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === "scholarships" && (
            <ScholarshipsTab
              scholarships={scholarships}
              onRefresh={() => router.refresh()}
              confirm={confirm}
            />
          )}
          {activeTab === "reports" && (
            <AnnualReportsTab
              reports={annualReports}
              isTreasurer={isTreasurer}
              onRefresh={() => router.refresh()}
            />
          )}
          {activeTab === "filings" && (
            <TaxFilingsTab
              filings={taxFilings}
              isTreasurer={isTreasurer}
              onRefresh={() => router.refresh()}
            />
          )}
        </div>
      </div>
    </>
  );
}

// -------------------------------------------------------
// SCHOLARSHIPS TAB
// -------------------------------------------------------
function ScholarshipsTab({
  scholarships,
  onRefresh,
  confirm,
}: {
  scholarships: Scholarship[];
  onRefresh: () => void;
  confirm: any;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    recipientName: "",
    amount: "",
    academicYear: "",
    description: "",
    awardedAt: "",
  });

  const handleSubmit = async () => {
    if (
      !form.recipientName ||
      !form.amount ||
      !form.academicYear ||
      !form.awardedAt
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/archive/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Scholarship added");
        setShowForm(false);
        setForm({
          recipientName: "",
          amount: "",
          academicYear: "",
          description: "",
          awardedAt: "",
        });
        onRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: "Delete Scholarship?",
      message: `This will remove the scholarship record for ${name}.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/archive/scholarships/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Scholarship deleted");
        onRefresh();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-neutral-500">
          {scholarships.length} scholarship
          {scholarships.length !== 1 ? "s" : ""} on record
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Scholarship
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-4">
            New Scholarship Award
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) =>
                  setForm({ ...form, recipientName: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Amount ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2025-2026"
                value={form.academicYear}
                onChange={(e) =>
                  setForm({ ...form, academicYear: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Award Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.awardedAt}
                onChange={(e) =>
                  setForm({ ...form, awardedAt: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>
      )}

      {scholarships.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <GraduationCap className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No scholarships on record yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scholarships.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-5 bg-white rounded-xl border border-neutral-200"
            >
              <div>
                <p className="font-semibold text-neutral-900">
                  {s.recipientName}
                </p>
                <p className="text-sm text-neutral-500">
                  {s.academicYear} ·{" "}
                  {new Date(s.awardedAt).toLocaleDateString()}
                </p>
                {s.description && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {s.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-neutral-900">
                  {fmt(s.amount)}
                </span>
                <button
                  onClick={() => handleDelete(s.id, s.recipientName)}
                  disabled={deleting === s.id}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === s.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// ANNUAL REPORTS TAB
// -------------------------------------------------------
function AnnualReportsTab({
  reports,
  isTreasurer,
  onRefresh,
}: {
  reports: AnnualReport[];
  isTreasurer: boolean;
  onRefresh: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear() - 1,
  );
  const [sponsorIncome, setSponsorIncome] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/archive/annual-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          totalSponsorIncome: sponsorIncome ? parseFloat(sponsorIncome) : null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Annual report for ${selectedYear} generated`);
        setShowForm(false);
        onRefresh();
      } else if (res.status === 409) {
        toast.error(data.error);
      } else {
        toast.error(data.error || "Failed to generate");
      }
    } catch {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-neutral-500">
          {reports.length} annual report{reports.length !== 1 ? "s" : ""} on
          record
        </p>
        {isTreasurer && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Generate Report
          </button>
        )}
      </div>

      {showForm && isTreasurer && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-2">
            Generate Annual Report
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            Events, attendance, assistance, and scholarship totals will be
            auto-calculated from the database.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Sponsor Income ($)
              </label>
              <input
                type="number"
                placeholder="Optional"
                value={sponsorIncome}
                onChange={(e) => setSponsorIncome(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Generate
            </button>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No annual reports yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-neutral-200 p-6"
            >
              <h3 className="font-bold text-neutral-900 text-lg mb-4">
                {r.year} Annual Report
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Events Held", value: r.totalEventsHeld.toString() },
                  {
                    label: "Total Attendance",
                    value: r.totalAttendance.toString(),
                  },
                  {
                    label: "Assistance Paid",
                    value: fmt(r.totalAssistancePaid),
                  },
                  {
                    label: "Scholarships Paid",
                    value: fmt(r.totalScholarshipsPaid),
                  },
                  ...(r.totalSponsorIncome !== null
                    ? [
                        {
                          label: "Sponsor Income",
                          value: fmt(r.totalSponsorIncome),
                        },
                      ]
                    : []),
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-3 rounded-lg bg-neutral-50"
                  >
                    <p className="text-xs text-neutral-500 mb-1">
                      {stat.label}
                    </p>
                    <p className="font-bold text-neutral-900">{stat.value}</p>
                  </div>
                ))}
              </div>
              {r.notes && (
                <p className="text-sm text-neutral-500 mt-4 border-t border-neutral-100 pt-4">
                  {r.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// TAX FILINGS TAB
// -------------------------------------------------------
function TaxFilingsTab({
  filings,
  isTreasurer,
  onRefresh,
}: {
  filings: TaxFiling[];
  isTreasurer: boolean;
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !year) {
      toast.error("Please select a file and year");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", year);
      const res = await fetch("/api/admin/archive/tax-filings", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success(`Form 990 for ${year} uploaded`);
        setFile(null);
        onRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {isTreasurer && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-4">
            Upload Form 990
          </h3>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-28 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                PDF File
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 shrink-0"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload
            </button>
          </div>
        </div>
      )}

      {filings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No 990 filings uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filings.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between p-5 bg-white rounded-xl border border-neutral-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-neutral-50">
                  <FileText className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    Form 990 — {f.year}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Uploaded {new Date(f.createdAt).toLocaleDateString()} by{" "}
                    {f.uploadedBy}
                  </p>
                </div>
              </div>
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
