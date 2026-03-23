"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2, Upload, Globe, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

const TIERS = [
  { value: "PLATINUM", label: "Platinum", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { value: "GOLD", label: "Gold", color: "bg-amber-50 text-amber-700 border-amber-300" },
  { value: "SILVER", label: "Silver", color: "bg-neutral-100 text-neutral-600 border-neutral-300" },
  { value: "BRONZE", label: "Bronze", color: "bg-orange-50 text-orange-700 border-orange-300" },
  { value: "PARTNER", label: "Partner", color: "bg-primary-50 text-primary border-primary-200" },
];

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  tier: string;
  website: string | null;
  isActive: boolean;
  _count: { events: number };
}

interface FormState {
  name: string;
  tier: string;
  website: string;
}

function TierBadge({ tier }: { tier: string }) {
  const t = TIERS.find((t) => t.value === tier) ?? TIERS[4];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${t.color}`}>
      {t.label}
    </span>
  );
}

export default function SponsorsClient({
  initialSponsors,
}: {
  initialSponsors: Sponsor[];
}) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", tier: "PARTNER", website: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingLogoFor, setUploadingLogoFor] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setForm({ name: "", tier: "PARTNER", website: "" });
    setEditingId(null);
    setShowCreate(true);
  };

  const openEdit = (s: Sponsor) => {
    setForm({ name: s.name, tier: s.tier, website: s.website ?? "" });
    setEditingId(s.id);
    setShowCreate(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreate(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setSponsors((prev) => [{ ...created, _count: { events: 0 } }, ...prev]);
      setShowCreate(false);
      toast.success("Sponsor created");
    } catch {
      toast.error("Failed to create sponsor");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      setEditingId(null);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Sponsor) => {
    try {
      const res = await fetch(`/api/admin/sponsors/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (!res.ok) throw new Error();
      setSponsors((prev) =>
        prev.map((sp) => (sp.id === s.id ? { ...sp, isActive: !s.isActive } : sp)),
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sponsor? This will remove them from all events.")) return;
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSponsors((prev) => prev.filter((s) => s.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleLogoUpload = async (sponsorId: string, file: File) => {
    setUploadingLogoFor(sponsorId);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch(`/api/admin/sponsors/${sponsorId}/logo`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error();
      const { logoUrl } = await res.json();
      setSponsors((prev) =>
        prev.map((s) => (s.id === sponsorId ? { ...s, logoUrl } : s)),
      );
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setUploadingLogoFor(null);
    }
  };

  const handleRemoveLogo = async (sponsorId: string) => {
    try {
      await fetch(`/api/admin/sponsors/${sponsorId}/logo`, { method: "DELETE" });
      setSponsors((prev) =>
        prev.map((s) => (s.id === sponsorId ? { ...s, logoUrl: null } : s)),
      );
    } catch {
      toast.error("Failed to remove logo");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border-2 border-primary/20 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">New Sponsor</h2>
          <SponsorForm form={form} setForm={setForm} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create
            </button>
            <button
              onClick={cancelEdit}
              className="px-5 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sponsors list */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <p className="font-semibold text-neutral-900">{sponsors.length} sponsors</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Sponsor
          </button>
        </div>

        {sponsors.length === 0 ? (
          <div className="py-16 text-center text-neutral-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No sponsors yet. Add one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {sponsors.map((s) => (
              <div key={s.id} className={`p-6 ${!s.isActive ? "opacity-50" : ""}`}>
                {editingId === s.id ? (
                  <>
                    <SponsorForm form={form} setForm={setForm} />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleUpdate(s.id)}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-5 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden">
                        {s.logoUrl ? (
                          <Image src={s.logoUrl} alt={s.name} width={64} height={64} className="object-contain" />
                        ) : (
                          <Building2 className="w-7 h-7 text-neutral-300" />
                        )}
                      </div>
                      {/* Logo upload button */}
                      <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-neutral-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors shadow-sm">
                        {uploadingLogoFor === s.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-3 h-3 text-neutral-500" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleLogoUpload(s.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-neutral-900">{s.name}</p>
                        <TierBadge tier={s.tier} />
                        {!s.isActive && (
                          <span className="text-xs text-neutral-400 font-medium">Inactive</span>
                        )}
                      </div>
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline mb-1"
                        >
                          <Globe className="w-3 h-3" />
                          {s.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      <p className="text-xs text-neutral-400">{s._count.events} event(s)</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {s.logoUrl && (
                        <button
                          onClick={() => handleRemoveLogo(s.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs"
                          title="Remove logo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(s)}
                        className="px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
                        title={s.isActive ? "Deactivate" : "Activate"}
                      >
                        {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="p-2 text-neutral-500 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" />
    </div>
  );
}

function SponsorForm({
  form,
  setForm,
}: {
  form: { name: string; tier: string; website: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; tier: string; website: string }>>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="sm:col-span-1">
        <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Sponsor name"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Tier</label>
        <select
          value={form.tier}
          onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {TIERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Website</label>
        <input
          type="url"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}
