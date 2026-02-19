"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

interface PollOption {
  id: string;
  textEn: string;
  textEs: string;
  _count: {
    responses: number;
  };
}

interface Poll {
  id: string;
  questionEn: string;
  questionEs: string;
  _count: {
    responses: number;
  };
  options: PollOption[];
}

interface Question {
  id: string;
  questionEn: string;
  questionEs: string;
  answered: boolean;
  answerEn: string | null;
  answerEs: string | null;
  upvotes: number;
  isAnonymous: boolean;
  createdAt: Date;
}

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
  polls: Poll[];
  questions: Question[];
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
  polls,
  questions,
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

      // Section 2: Poll Results
      csv.push("POLL RESULTS");
      csv.push("=====================================");

      if (polls.length === 0) {
        csv.push("No polls for this event");
      } else {
        polls.forEach((poll, pollIndex) => {
          csv.push(`Poll ${pollIndex + 1}: ${poll.questionEn}`);
          csv.push(`Spanish: ${poll.questionEs}`);
          csv.push(`Total Responses: ${poll._count.responses}`);
          csv.push("");
          csv.push("Option,Votes,Percentage");

          poll.options.forEach((option) => {
            const percentage =
              poll._count.responses > 0
                ? (
                    (option._count.responses / poll._count.responses) *
                    100
                  ).toFixed(1)
                : "0.0";
            csv.push(
              `"${option.textEn}",${option._count.responses},${percentage}%`,
            );
          });

          csv.push("");
          csv.push("---");
          csv.push("");
        });
      }

      csv.push("");
      csv.push("");

      // Section 3: Q&A Summary
      csv.push("Q&A SUMMARY");
      csv.push("=====================================");
      csv.push(`Total Questions,${questions.length}`);
      csv.push(
        `Answered Questions,${questions.filter((q) => q.answered).length}`,
      );
      csv.push(
        `Answer Rate,${questions.length > 0 ? Math.round((questions.filter((q) => q.answered).length / questions.length) * 100) : 0}%`,
      );
      csv.push("");

      if (questions.length === 0) {
        csv.push("No Q&A questions for this event");
      } else {
        csv.push(
          "Question (EN),Question (ES),Answer (EN),Answer (ES),Upvotes,Status,Timestamp",
        );

        questions.forEach((q) => {
          const answered = q.answered ? "Answered" : "Pending";
          const timestamp = new Date(q.createdAt).toLocaleString();

          csv.push(
            [
              `"${q.questionEn.replace(/"/g, '""')}"`,
              `"${q.questionEs.replace(/"/g, '""')}"`,
              q.answerEn ? `"${q.answerEn.replace(/"/g, '""')}"` : "",
              q.answerEs ? `"${q.answerEs.replace(/"/g, '""')}"` : "",
              q.upvotes,
              answered,
              timestamp,
            ].join(","),
          );
        });
      }

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
