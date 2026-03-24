"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
} from "lucide-react";
import GmailComposeModal from "./GmailComposeModal";

interface GmailBannerRole {
  id: string;
  role: string;
  roleLabel: string;
  fromEmail: string;
  gmailSendAsConfigured: boolean;
  gmailConnectedAt?: string | null;
}

interface Props {
  roles: GmailBannerRole[];
  replyTo: string;
}

export default function GmailSetupBanner({ roles, replyTo }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [showSendAsInstructions, setShowSendAsInstructions] = useState(false);
  // Track which boardRoleId is open in the compose modal (null = closed)
  const [composingRoleId, setComposingRoleId] = useState<string | null>(null);

  // A role is "connected" if gmailConnectedAt is set
  const pendingRoles = roles.filter((r) => !r.gmailConnectedAt);
  const connectedRoles = roles.filter((r) => !!r.gmailConnectedAt);

  const composingRole = connectedRoles.find((r) => r.id === composingRoleId);

  if (dismissed || roles.length === 0) return null;

  return (
    <>
      <div className="mb-6 space-y-3">
        {/* Pending roles — one banner per role */}
        {pendingRoles.map((role) => (
          <div
            key={role.id}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Connect your Gmail to send as{" "}
                <span className="font-mono">{role.fromEmail}</span>
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                As {role.roleLabel}, you can send emails from your board
                address. Connect your Gmail account to activate this in the
                portal.
              </p>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <a
                  href={`/api/auth/gmail?boardRoleId=${role.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Connect Gmail →
                </a>
                <button
                  type="button"
                  onClick={() =>
                    setShowSendAsInstructions(!showSendAsInstructions)
                  }
                  className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium hover:text-amber-900"
                >
                  Set up Gmail &ldquo;Send mail as&rdquo;
                  {showSendAsInstructions ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {showSendAsInstructions && (
                <div className="mt-3 bg-white border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1.5">
                  <p className="font-semibold">
                    Gmail &ldquo;Send mail as&rdquo; setup:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-800">
                    <li>
                      Open Gmail → Settings (gear icon) → See all settings
                    </li>
                    <li>
                      Go to the <strong>Accounts and Import</strong> tab
                    </li>
                    <li>
                      Under &ldquo;Send mail as&rdquo;, click{" "}
                      <strong>Add another email address</strong>
                    </li>
                    <li>
                      Enter your name and board address:{" "}
                      <span className="font-mono font-semibold">
                        {role.fromEmail}
                      </span>
                    </li>
                    <li>
                      SMTP server: smtp.resend.com — Port: 465 — Username:
                      resend
                    </li>
                    <li>Enter your Resend API key as the password</li>
                    <li>Verify ownership via the confirmation email</li>
                  </ol>
                  <p className="text-amber-700 mt-2">
                    This lets you send emails as your board address directly
                    from Gmail, outside the HOEP portal.
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 text-amber-400 hover:text-amber-600"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Connected roles */}
        {connectedRoles.map((role) => (
          <div
            key={role.id}
            className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">
                Gmail connected —{" "}
                <span className="font-mono">{role.fromEmail}</span>
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                You can now send emails as {role.roleLabel} from the portal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setComposingRoleId(role.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex-shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              Compose
            </button>
          </div>
        ))}
      </div>

      {/* Compose modal */}
      {composingRole && (
        <GmailComposeModal
          boardRoleId={composingRole.id}
          fromEmail={composingRole.fromEmail}
          replyTo={replyTo}
          onClose={() => setComposingRoleId(null)}
        />
      )}
    </>
  );
}
