"use client";

import { useState } from "react";
import { Check, Loader2, Building2, Globe } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";

const TIER_ORDER = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "PARTNER"];
const TIER_LABELS: Record<string, string> = {
  PLATINUM: "Platinum",
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
  PARTNER: "Partner",
};

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  tier: string;
  website: string | null;
}

export default function EventSponsorsClient({
  eventId,
  allSponsors,
  initialSelectedIds,
}: {
  eventId: string;
  allSponsors: Sponsor[];
  initialSelectedIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/sponsors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Sponsors updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const grouped = TIER_ORDER.reduce<Record<string, Sponsor[]>>((acc, tier) => {
    const list = allSponsors.filter((s) => s.tier === tier);
    if (list.length) acc[tier] = list;
    return acc;
  }, {});

  if (allSponsors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-neutral-400">
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="mb-3">No active sponsors yet.</p>
        <Link href="/admin/sponsors" className="text-sm text-primary hover:underline">
          Add sponsors →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {Object.entries(grouped).map(([tier, sponsors]) => (
          <div key={tier}>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
              {TIER_LABELS[tier]}
            </p>
            <div className="space-y-2">
              {sponsors.map((s) => {
                const selected = selectedIds.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      selected
                        ? "border-primary bg-primary-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(s.id)}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 rounded-lg border border-neutral-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.logoUrl ? (
                        <Image src={s.logoUrl} alt={s.name} width={40} height={40} className="object-contain" />
                      ) : (
                        <Building2 className="w-5 h-5 text-neutral-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 text-sm">{s.name}</p>
                      {s.website && (
                        <p className="text-xs text-neutral-400 truncate">{s.website.replace(/^https?:\/\//, "")}</p>
                      )}
                    </div>
                    {selected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Sponsors
        </button>
        <p className="text-sm text-neutral-400">{selectedIds.size} selected</p>
      </div>
    </div>
  );
}
