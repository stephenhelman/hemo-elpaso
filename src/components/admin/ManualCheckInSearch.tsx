"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Patient {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
}

interface Props {
  eventId: string;
}

export default function ManualCheckInSearch({ eventId }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("patient");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);

    try {
      const response = await fetch(
        `/api/admin/checkin/patients/search?query=${encodeURIComponent(searchQuery)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.patients || []);
      } else {
        toast.error("Search failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async (patientId: string, patientName: string) => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/checkin/manual/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          patientId,
          attendeeRole: selectedRole,
        }),
      });

      if (response.ok) {
        toast.success(`${patientName} checked in as ${selectedRole}`);
        setShowModal(false);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedRole("patient");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to check in");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        Search & Check In
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  Search & Check In
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Role Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Attendee Type
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="patient">Patient/Family</option>
                  <option value="sponsor">Sponsor/Rep</option>
                  <option value="donor">Donor</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin/Staff</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  Select role for reporting (sponsors/donors excluded from
                  patient metrics)
                </p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {searching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600 mb-2">
                    Found {searchResults.length} result(s)
                  </p>
                  {searchResults.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                    >
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {patient.profile?.firstName}{" "}
                          {patient.profile?.lastName}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {patient.email}
                        </p>
                        {patient.profile?.phone && (
                          <p className="text-xs text-neutral-400">
                            {patient.profile.phone}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleCheckIn(
                            patient.id,
                            `${patient.profile?.firstName} ${patient.profile?.lastName}`,
                          )
                        }
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Check In
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <div className="text-center py-8 text-neutral-500">
                  No patients found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
