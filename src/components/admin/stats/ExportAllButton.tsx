"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  eventSlug: string;
  eventTitle: string;
  eventId: string;
  totalRsvps: number;
  patientAttendance: number;
  sponsorCount: number;
  donorCount: number;
  volunteerCount: number;
  attendanceRate: number;
}

export default function ExportAllButton({
  eventSlug,
  eventTitle,
  eventId,
  totalRsvps,
  patientAttendance,
  sponsorCount,
  donorCount,
  volunteerCount,
  attendanceRate,
}: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = () => {
    setExporting(true);

    try {
      const csv: string[] = [];

      // Header
      csv.push(`COMPREHENSIVE EVENT REPORT - ${eventTitle}`);
      csv.push(`Event ID: ${eventId}`);
      csv.push(`Generated: ${new Date().toLocaleString()}`);
      csv.push("");
      csv.push("⚠️ PHI-FREE REPORT - Safe for sponsor/donor sharing");
      csv.push("=====================================");
      csv.push("");

      // Section 1: Attendance Summary
      csv.push("ATTENDANCE SUMMARY");
      csv.push("=====================================");
      csv.push(`Total RSVPs,${totalRsvps}`);
      csv.push(`Attendees,${patientAttendance}`);
      csv.push(`Sponsors & Donors Attendance,${sponsorCount + donorCount}`);
      csv.push(`Volunteer Attendance,${volunteerCount}`);
      csv.push(
        `Total Attendance,${patientAttendance + sponsorCount + donorCount + volunteerCount}`,
      );
      csv.push(`Attendance Rate,${attendanceRate}%`);
      csv.push("");
      csv.push("");

      csv.push("=====================================");
      csv.push("End of Report");

      // Download
      const blob = new Blob([csv.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${eventSlug}_comprehensive-report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportAll}
      disabled={exporting}
      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="w-5 h-5" />
          Export Complete Report
        </>
      )}
    </button>
  );
}
