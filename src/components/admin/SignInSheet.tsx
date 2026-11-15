import { paginate, type SheetAttendee } from "@/lib/signin-sheet";

/**
 * Printable sign-in sheet (US Letter). Contains NO diagnoses, emails or addresses: only name, party size, a
 * check-in box and a "no photos" marker. Phone appears only in the blank walk-in rows (written by hand).
 * Pages are laid out by lib/signin-sheet.ts so each one can say "Page X of N".
 */
export default function SignInSheet({
  title,
  dateLine,
  location,
  attendees,
}: {
  title: string;
  dateLine: string;
  location: string;
  attendees: SheetAttendee[];
}) {
  const pages = paginate(attendees);
  const total = pages.length;
  return (
    <div className="sheet-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {pages.map((items, pi) => (
        <section key={pi} className="sheet-page">
          {pi === 0 ? (
            <header className="sheet-head">
              {/* Horizontal lockup + tagline: 3.1in wide on paper (brand minimum 3in). Clear space is built into the file. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/hoep-lockup-horizontal-tagline.svg" alt="Hemophilia Outreach of El Paso" className="sheet-lockup" />
              <div className="sheet-event">
                <div className="sheet-kicker">Sign-in sheet</div>
                <h1>{title}</h1>
                <div>{dateLine}</div>
                <div>{location}</div>
              </div>
            </header>
          ) : (
            <div className="sheet-cont">
              {title} · {dateLine} <span>(continued)</span>
            </div>
          )}

          <Table items={items} />

          <footer className="sheet-foot">
            <span>Confidential: HOEP board use only</span>
            <span>
              Page {pi + 1} of {total}
            </span>
          </footer>
        </section>
      ))}
    </div>
  );
}

function Table({ items }: { items: ReturnType<typeof paginate>[number] }) {
  // split into runs so the header row precedes each run of the same kind
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < items.length) {
    const kind = items[i].kind;
    if (kind === "walkinHeading") {
      out.push(
        <div key={key++} className="sheet-section">
          Walk-ins <span>(not on the list: please print clearly)</span>
        </div>,
      );
      i++;
      continue;
    }
    const run = [];
    while (i < items.length && items[i].kind === kind) run.push(items[i++]);
    out.push(
      kind === "attendee" ? (
        <table key={key++} className="sheet-table">
          {out.length === 0 && (
            <thead>
              <tr>
                <th className="c-box">In</th>
                <th>Name</th>
                <th className="c-party">Party</th>
                <th className="c-photo">Photos</th>
              </tr>
            </thead>
          )}
          <tbody>
            {run.map((it, n) =>
              it.kind === "attendee" ? (
                <tr key={n}>
                  <td className="c-box"><span className="box" /></td>
                  <td className="name">
                    <strong>{it.row.lastName}</strong>, {it.row.firstName}
                  </td>
                  <td className="c-party">{it.row.partySize}</td>
                  <td className="c-photo">{it.row.noPhotos ? <span className="nophoto">NO PHOTOS</span> : null}</td>
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      ) : (
        <table key={key++} className="sheet-table walkin">
          <thead>
            <tr>
              <th>Name</th>
              <th className="c-phone">Phone</th>
              <th className="c-party">Party</th>
              <th className="c-sig">Signature</th>
            </tr>
          </thead>
          <tbody>
            {run.map((_, n) => (
              <tr key={n}>
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      ),
    );
  }
  return <>{out}</>;
}

const CSS = `
.sheet-root { font-family: 'Inter', system-ui, sans-serif; color: #2A2426; }
.sheet-page { position: relative; box-sizing: border-box; width: 8.5in; height: 11in; padding: 0.5in; margin: 0 auto 24px; background: #fff; box-shadow: 0 1px 8px rgba(0,0,0,.18); overflow: hidden; }
.sheet-head { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 10px; }
.sheet-lockup { width: 3.1in; height: auto; display: block; margin-left: -0.1in; }
.sheet-event h1 { font-size: 20pt; line-height: 1.15; margin: 0 0 4px; color: #8B1538; font-weight: 700; }
.sheet-event { font-size: 10.5pt; line-height: 1.4; }
.sheet-kicker { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .12em; color: #2A2426; opacity: .7; margin-bottom: 2px; }
.sheet-cont { font-size: 9pt; color: #2A2426; opacity: .75; border-bottom: 2px solid #8B1538; padding-bottom: 6px; margin-bottom: 8px; }
.sheet-cont span { opacity: .7; }
.sheet-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11pt; }
.sheet-table th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; padding: 0 6px 4px; border-bottom: 2px solid #8B1538; height: 0.35in; vertical-align: bottom; }
.sheet-table td { height: 0.4in; padding: 0 6px; border-bottom: 1px solid #FACED2; vertical-align: middle; }
.sheet-table .c-box { width: 0.5in; text-align: center; }
.sheet-table .c-party { width: 0.7in; text-align: center; }
.sheet-table .c-photo { width: 1.2in; text-align: center; }
.sheet-table .c-phone { width: 1.8in; }
.sheet-table .c-sig { width: 2.3in; }
.sheet-table.walkin td { height: 0.6in; border-bottom: 1px solid #2A2426; }
.box { display: inline-block; width: 0.22in; height: 0.22in; border: 1.5px solid #2A2426; border-radius: 3px; vertical-align: middle; }
.nophoto { display: inline-block; font-size: 7.5pt; font-weight: 700; letter-spacing: .05em; padding: 2px 6px; border: 1.5px solid #8B1538; color: #8B1538; border-radius: 4px; }
.sheet-section { margin: 14px 0 6px; font-size: 12pt; font-weight: 700; color: #8B1538; }
.sheet-section span { font-weight: 400; font-size: 9pt; color: #2A2426; opacity: .75; }
.sheet-foot { position: absolute; left: 0.5in; right: 0.5in; bottom: 0.35in; display: flex; justify-content: space-between; font-size: 8.5pt; border-top: 1px solid #FACED2; padding-top: 6px; }
@page { size: letter; margin: 0; }
@media print {
  aside, header.sticky, footer.bg-neutral-900, [data-admin-chrome], .no-print { display: none !important; }
  main { margin: 0 !important; }
  html, body { background: #fff !important; overflow: visible !important; }
  .sheet-page { margin: 0; box-shadow: none; page-break-after: always; break-after: page; }
  .sheet-page:last-child { page-break-after: auto; break-after: auto; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
