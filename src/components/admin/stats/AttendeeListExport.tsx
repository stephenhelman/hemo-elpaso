"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileDown, Users } from "lucide-react";

interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  checkInTime: Date;
  attendeeRole: string;
}

interface Props {
  eventSlug: string;
  eventTitle: string;
  attendees: Attendee[];
}

export default function AttendeeListExport({
  eventSlug,
  eventTitle,
  attendees,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  // Abbreviate name for privacy (S. Helman or Stephen H.)
  const abbreviateName = (
    firstName: string,
    lastName: string,
    style: "first" | "last",
  ) => {
    if (style === "first") {
      // S. Helman
      return `${firstName.charAt(0)}. ${lastName}`;
    } else {
      // Stephen H.
      return `${firstName} ${lastName.charAt(0)}.`;
    }
  };

  const getExportRole = (role: string): string => {
    switch (role) {
      case "patient":
      case "admin":
      case "board":
        return "Attendee"; // Protect patient/staff status
      case "sponsor":
      case "donor":
        return "Sponsor/Donor"; // Combine sponsors and donors
      case "volunteer":
        return "Volunteer";
      default:
        return "Attendee";
    }
  };

  const handleExportCSV = () => {
    const csv = [
      `Attendee Contact List - ${eventTitle}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "⚠️ PRIVACY-SAFE FORMAT - Names abbreviated",
      "",
      "Name,Email,Phone,Role,Check-In Time",
    ];

    attendees.forEach((attendee) => {
      const name = abbreviateName(
        attendee.firstName,
        attendee.lastName,
        "first",
      );
      const phone = attendee.phone || "N/A";
      const role = getExportRole(attendee.attendeeRole);
      const checkInTime = new Date(attendee.checkInTime).toLocaleString();

      csv.push(
        [
          `"${name}"`,
          attendee.email,
          phone,
          role,
          attendee.attendeeRole,
          checkInTime,
        ].join(","),
      );
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventSlug}_attendee-contacts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Group by role
  const attendeeGroup = attendees.filter((a) =>
    ["patient", "admin", "board"].includes(a.attendeeRole),
  );
  const sponsorDonorGroup = attendees.filter((a) =>
    ["sponsor", "donor"].includes(a.attendeeRole),
  );
  const volunteerGroup = attendees.filter(
    (a) => a.attendeeRole === "volunteer",
  );

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 mb-8">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-neutral-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-neutral-600" />
              )}
            </button>
            <h2 className="text-xl font-display font-bold text-neutral-900">
              Attendee Contact List
            </h2>
          </div>

          {attendees.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {attendees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No attendees for this event</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Attendees (patients/admin/board combined) */}
              {attendeeGroup.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Attendees ({attendeeGroup.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {attendeeGroup.map((attendee) => (
                      <AttendeeCard key={attendee.id} attendee={attendee} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors/Donors */}
              {sponsorDonorGroup.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Sponsors & Donors ({sponsorDonorGroup.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sponsorDonorGroup.map((attendee) => (
                      <AttendeeCard key={attendee.id} attendee={attendee} />
                    ))}
                  </div>
                </div>
              )}

              {/* Volunteers */}
              {volunteerGroup.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Volunteers ({volunteerGroup.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {volunteerGroup.map((attendee) => (
                      <AttendeeCard key={attendee.id} attendee={attendee} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-900 mb-1">
              🔒 Maximum Privacy Protection
            </p>
            <p className="text-xs text-amber-700">
              Names abbreviated (e.g., "S. Helman"), roles simplified to
              "Attendee", "Sponsor/Donor", and "Volunteer" to protect patient
              status and personal information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendeeCard({ attendee }: { attendee: Attendee }) {
  const abbreviatedName = `${attendee.firstName.charAt(0)}. ${attendee.lastName}`;

  return (
    <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
      <p className="font-medium text-neutral-900 text-sm mb-1">
        {abbreviatedName}
      </p>
      <p className="text-xs text-neutral-600 truncate mb-1">{attendee.email}</p>
      {attendee.phone && (
        <p className="text-xs text-neutral-500">{attendee.phone}</p>
      )}
    </div>
  );
}

interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  checkInTime: Date;
  attendeeRole: string;
}
