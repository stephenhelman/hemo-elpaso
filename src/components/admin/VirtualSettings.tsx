"use client";

/**
 * Event form: "Requests from uninvited households" and "Offer virtual attendance" (Google Meet + YouTube links).
 * Virtual is locked while the "recordings" feature is off, and the reason is shown. The links are board-only: they appear
 * only in virtual invitations, confirmations and reminders, never on the public event page.
 */
export interface RequestSettingsValue { allowUninvitedRequests: boolean; virtualEnabled: boolean; meetUrl: string; youtubeUrl: string }

const input = "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm disabled:bg-neutral-100 disabled:text-neutral-400";

export default function VirtualSettings({ value, onChange, recordingsOn }: { value: RequestSettingsValue; onChange: (v: RequestSettingsValue) => void; recordingsOn: boolean }) {
  // An event that is already virtual stays editable (so its links can be fixed) even if the toggle later goes off.
  const locked = !recordingsOn && !value.virtualEnabled;
  return (
    <div className="space-y-5">
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={value.allowUninvitedRequests} onChange={(e) => onChange({ ...value, allowUninvitedRequests: e.target.checked })} className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary" />
          <span className="text-sm font-medium text-neutral-700">Requests from uninvited households: allowed</span>
        </label>
        <p className="text-xs text-neutral-500 mt-1 ml-6">
          Allowed: a household that wasn&apos;t invited can ask to attend, and the board decides under &ldquo;RSVP requests&rdquo;. Not allowed: the event page says it is by invitation. Applies to events that target a diagnosis too.
        </p>
      </div>
      <div>
        <label className={`flex items-center gap-2 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}>
          <input type="checkbox" disabled={locked} checked={value.virtualEnabled} onChange={(e) => onChange({ ...value, virtualEnabled: e.target.checked })} className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary" />
          <span className="text-sm font-medium text-neutral-700">Offer virtual attendance</span>
        </label>
        {!recordingsOn && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 ml-6" role="note">
            Locked: live streams are listed as &ldquo;not yet available&rdquo; in the privacy policy until the board turns on the &ldquo;recordings&rdquo; feature (Admin &gt; Settings &gt; Features).
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 mt-3 ml-6">
          <label className="block text-sm font-medium text-neutral-700">Google Meet link
            <input type="url" inputMode="url" placeholder="https://meet.google.com/…" disabled={locked} value={value.meetUrl} onChange={(e) => onChange({ ...value, meetUrl: e.target.value })} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm font-medium text-neutral-700">YouTube link
            <input type="url" inputMode="url" placeholder="https://youtube.com/…" disabled={locked} value={value.youtubeUrl} onChange={(e) => onChange({ ...value, youtubeUrl: e.target.value })} className={`${input} mt-1`} />
          </label>
        </div>
        <p className="text-xs text-neutral-500 mt-1 ml-6">Both links are needed to turn it on. They are sent only to households confirmed to attend virtually, and are never shown on the public event page.</p>
      </div>
    </div>
  );
}
