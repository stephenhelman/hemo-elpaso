"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminUserEditTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

interface User {
  id: string;
  email: string;
  role: string;
  contactProfile: {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

interface Props {
  user: User;
  locale: Lang;
}

export default function UserEditForm({ user, locale }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = adminUserEditTranslation[locale];

  const [formData, setFormData] = useState({
    role: user.role,
    firstName: user.contactProfile?.firstName || "",
    lastName: user.contactProfile?.lastName || "",
    phone: user.contactProfile?.phone || "",
    city: user.contactProfile?.city || "",
    state: user.contactProfile?.state || "",
    zipCode: user.contactProfile?.zipCode || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("User updated successfully!");
        router.push(`/admin/users/${user.id}`);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6"
    >
      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t.role}
        </label>
        <select
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="patient">{t.roleOptions.patient}</option>
          <option value="admin">{t.roleOptions.admin}</option>
          <option value="board">{t.roleOptions.board}</option>
        </select>
        <p className="text-xs text-neutral-500 mt-1">{t.roleNote}</p>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t.firstName}
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t.lastName}
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t.phone}
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t.city}
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t.state}
          </label>
          <select
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t.stateOptions.selectState}</option>
            <option value="TX">{t.stateOptions.TX}</option>
            <option value="NM">{t.stateOptions.NM}</option>
            <option value="AZ">{t.stateOptions.AZ}</option>
            <option value="CA">{t.stateOptions.CA}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t.zipCode}
        </label>
        <input
          type="text"
          value={formData.zipCode}
          onChange={(e) =>
            setFormData({ ...formData, zipCode: e.target.value })
          }
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t.email}
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600 cursor-not-allowed"
        />
        <p className="text-xs text-neutral-500 mt-1">{t.emailNote}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.saving}
            </>
          ) : (
            t.saveChanges
          )}
        </button>
      </div>
    </form>
  );
}
