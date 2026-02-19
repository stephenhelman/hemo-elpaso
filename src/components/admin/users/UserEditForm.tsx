"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
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
}

export default function UserEditForm({ user }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    role: user.role,
    firstName: user.profile?.firstName || "",
    lastName: user.profile?.lastName || "",
    phone: user.profile?.phone || "",
    city: user.profile?.city || "",
    state: user.profile?.state || "",
    zipCode: user.profile?.zipCode || "",
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
          Role *
        </label>
        <select
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="patient">Patient</option>
          <option value="admin">Admin</option>
          <option value="board">Board Member</option>
        </select>
        <p className="text-xs text-neutral-500 mt-1">
          Changing roles affects system access and permissions
        </p>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            First Name *
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
            Last Name *
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
          Phone
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
            City
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
            State
          </label>
          <select
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select State</option>
            <option value="TX">Texas</option>
            <option value="NM">New Mexico</option>
            <option value="AZ">Arizona</option>
            <option value="CA">California</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          ZIP Code
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
          Email (Read-Only)
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600 cursor-not-allowed"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Email cannot be changed through admin interface
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
