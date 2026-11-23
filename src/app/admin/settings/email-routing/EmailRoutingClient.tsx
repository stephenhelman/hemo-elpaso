"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { adminEmailRoutingTranslation } from "@/translation/adminSettings";
import type { Lang } from "@/types";

export interface RouteView {
  key: string;
  group: "notifications" | "replies";
  mode: "list" | "single";
  options: string[];
  allowTyped: boolean;
  publishedInPolicy: boolean;
  label: string;
  help: string;
  value: string[];
  isDefault: boolean;
  defaultValue: string[];
}

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export default function EmailRoutingClient({ routes, domain, locale, loadError }: { routes: RouteView[]; domain: string; locale: Lang; loadError: boolean }) {
  const t = adminEmailRoutingTranslation[locale];
  const notifications = routes.filter((r) => r.group === "notifications");
  const replies = routes.filter((r) => r.group === "replies");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">{t.title}</h2>
        <p className="text-neutral-600 max-w-3xl">{t.intro}</p>
        {loadError && <p className="mt-3 text-sm text-amber-700">{t.loadError}</p>}
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">{t.notifications}</h3>
        {notifications.map((r) => <RouteCard key={r.key} route={r} domain={domain} locale={locale} />)}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{t.replies}</h3>
          <p className="text-sm text-neutral-600">{t.repliesIntro}</p>
        </div>
        {replies.map((r) => <RouteCard key={r.key} route={r} domain={domain} locale={locale} />)}
      </section>
    </div>
  );
}

function RouteCard({ route, domain, locale }: { route: RouteView; domain: string; locale: Lang }) {
  const t = adminEmailRoutingTranslation[locale];
  const [saved, setSaved] = useState<string[]>(route.value);
  const [value, setValue] = useState<string[]>(route.value);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);

  const dirty = value.join(",") !== saved.join(",");
  const errMsg = (code?: string) => {
    const e = t.errors as Record<string, string>;
    return fill(e[code ?? "generic"] ?? e.generic, { domain });
  };

  const toggle = (a: string) => setValue((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]));
  const addTyped = () => {
    const local = typed.trim().toLowerCase().replace(new RegExp(`@${domain.replace(/\./g, "\\.")}$`), "");
    if (!/^[a-z0-9][a-z0-9._+-]{0,63}$/.test(local)) return toast.error(errMsg("invalid_address"));
    const a = `${local}@${domain}`;
    setValue((v) => (v.includes(a) ? v : [...v, a]));
    setTyped("");
  };

  async function save() {
    if (value.length === 0) return toast.error(t.needOne);
    if (route.publishedInPolicy && !window.confirm(t.policyConfirm)) return;
    setBusy("save");
    try {
      const res = await fetch("/api/admin/settings/email-routing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route: route.key, recipients: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(errMsg(data.error));
      setSaved(data.value);
      setValue(data.value);
      if (!data.changed) toast(t.unchanged);
      else if (data.noticeSent) toast.success(t.saved);
      else toast(t.savedNoNotice, { icon: "⚠️", duration: 8000 });
    } catch {
      toast.error(errMsg());
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    try {
      const res = await fetch("/api/admin/settings/email-routing/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route: route.key }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) return toast.error(t.rateLimited);
      if (!res.ok) return toast.error(t.testFailed);
      toast.success(fill(t.testSent, { to: (data.to as string[]).join(", ") }));
    } catch {
      toast.error(t.testFailed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="mb-3">
        <h4 className="font-semibold text-neutral-900">{route.label}</h4>
        <p className="text-sm text-neutral-600">{route.help}</p>
        {route.isDefault && saved.join(",") === route.defaultValue.join(",") && <p className="text-xs text-neutral-500 mt-1">{t.usingDefault}</p>}
      </div>

      {route.publishedInPolicy && (
        <div className="mb-3 flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t.policyWarning}</span>
        </div>
      )}

      {route.mode === "single" ? (
        <label className="block text-sm">
          <span className="text-neutral-700">{route.group === "replies" ? t.replyTo : t.recipients}</span>
          <select
            className="mt-1 block w-full max-w-sm rounded-lg border border-neutral-300 px-3 py-2"
            value={value[0] ?? ""}
            onChange={(e) => setValue([e.target.value])}
          >
            {route.options.map((o) => {
              const a = `${o}@${domain}`;
              return <option key={a} value={a}>{a}</option>;
            })}
          </select>
        </label>
      ) : (
        <div className="space-y-3">
          <fieldset>
            <legend className="text-sm text-neutral-700 mb-1">{t.recipients}</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {route.options.map((o) => {
                const a = `${o}@${domain}`;
                return (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={value.includes(a)} onChange={() => toggle(a)} />
                    {a}
                  </label>
                );
              })}
              {value.filter((a) => !route.options.includes(a.split("@")[0])).map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked onChange={() => toggle(a)} />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>
          {route.allowTyped && (
            <div>
              <label className="text-sm text-neutral-700">{fill(t.addTyped, { domain })}</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-48"
                  placeholder={t.typedPlaceholder}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTyped(); } }}
                />
                <span className="text-sm text-neutral-500">@{domain}</span>
                <button type="button" onClick={addTyped} className="text-sm px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50">{t.add}</button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">{fill(t.domainNote, { domain })}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || value.length === 0 || busy !== null}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40"
        >
          {busy === "save" ? t.saving : t.save}
        </button>
        <button
          type="button"
          onClick={test}
          disabled={dirty || busy !== null}
          className="px-4 py-2 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50 disabled:opacity-40"
        >
          {busy === "test" ? t.sending : t.sendTest}
        </button>
      </div>
    </div>
  );
}
