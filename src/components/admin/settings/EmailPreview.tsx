"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  variables: string[];
}

interface Props {
  template: EmailTemplate;
  adminEmail: string;
}

export default function EmailPreview({ template, adminEmail }: Props) {
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState(adminEmail);

  // Sample data for preview
  const getSampleData = () => {
    const baseData: Record<string, string> = {
      patientName: "John Doe",
      eventTitle: "Spring Educational Dinner 2026",
      eventDate: "April 15, 2026",
      eventTime: "6:00 PM",
      location: "UMC El Paso Conference Center",
      adultsCount: "2",
      childrenCount: "1",
      checkInTime: "5:45 PM",
      eventSlug: "spring-dinner-2026",
      assistanceType: "Event Fees",
      requestedAmount: "$150.00",
      approvedAmount: "$150.00",
      applicationId: "APP-12345",
      amount: "$150.00",
      paymentMethod: "Check",
      checkNumber: "1001",
      expectedDate: "Within 5-7 business days",
      reviewNotes: "Application approved - all documentation was in order.",
      cancellationReason: "Due to unforeseen circumstances",
      liveEventUrl:
        "https://hemo-elpaso.vercel.app/events/spring-dinner-2026/live",
      portalUrl: "https://hemo-elpaso.vercel.app/portal/dashboard",
    };

    return baseData;
  };

  const renderSubjectWithData = () => {
    let subject = template.subject;
    const sampleData = getSampleData();

    template.variables.forEach((variable) => {
      const value = sampleData[variable] || `{{${variable}}}`;
      subject = subject.replace(new RegExp(`{{${variable}}}`, "g"), value);
    });

    return subject;
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `/api/admin/settings/email-templates/${template.id}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testEmail,
            sampleData: getSampleData(),
          }),
        },
      );

      if (response.ok) {
        toast.success(`Test email sent to ${testEmail}!`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send test email");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Email Preview
          </h3>

          {/* Email Header Preview */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-neutral-600 w-20">
                  From:
                </span>
                <span className="text-neutral-900">
                  Hemophilia Outreach of El Paso
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-neutral-600 w-20">To:</span>
                <span className="text-neutral-900">patient@example.com</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-neutral-600 w-20">
                  Subject:
                </span>
                <span className="text-neutral-900 font-medium">
                  {renderSubjectWithData()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Body Note */}
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              📧 <strong>Email Body Preview:</strong> The full email body is
              rendered using React Email components. To see the complete design,
              send a test email below.
            </p>
          </div>

          {/* Sample Variables */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">
              Sample Data Used
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {template.variables.slice(0, 8).map((variable) => {
                const sampleData = getSampleData();
                return (
                  <div key={variable} className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-xs font-mono text-neutral-600 mb-1">{`{{${variable}}}`}</p>
                    <p className="text-sm text-neutral-900">
                      {sampleData[variable] || "N/A"}
                    </p>
                  </div>
                );
              })}
            </div>
            {template.variables.length > 8 && (
              <p className="text-xs text-neutral-500 mt-2">
                +{template.variables.length - 8} more variables
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Send Test Email
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Send a test email with sample data to see the complete design and
          layout.
        </p>

        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your-email@example.com"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSendTest}
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
