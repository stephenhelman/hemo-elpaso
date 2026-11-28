# Twilio setup and testing

Code: `src/lib/twilio/`, `src/lib/phone/`, `/api/twilio/voice/*`. Admin page: Settings → Phone.
Decisions and plan: `PHONE_AUDIT.md`. Who may sign in to the console: `docs/legal/RUNBOOK.md`.

**Before families get the number:** work through the go-live checklist in `CUTOVER.md`. Until the "Phone line" feature
toggle is on (it needs the published policy v3), calls skip the menu, ring the fallback number and record nothing.

## First: a trial account cannot run this

Twilio's trial blocks `<Dial>` to a phone number (our forwarding and press-1 screening) and `<Record>` (voicemail),
reaches only verified numbers, and gives a shared number you don't keep. The greeting and menu work; every forward is
replaced by "not available on trial accounts". **Upgrade the account before buying the number.**
Source: <https://www.twilio.com/docs/usage/trials/try-out-voice> (read 2026-11-25; check the console, limits change).

## Production console steps

1. **Ownership and sign-in** (`RUNBOOK.md`): vicepresident@ is the owner, president@ a user, both with two-factor
   authentication. admin@ and everyone else: no access. If the trial was created under another address, move ownership
   to vicepresident@ and remove that user before going on.
2. **Upgrade** (Billing → Upgrade) and add a payment method.
3. **Buy the number:** Phone Numbers → Buy a number. Country United States, capability Voice (take SMS too, for later),
   area code 915.
4. **Geographic permissions:** Voice → Settings → Geo permissions. Leave only the United States enabled, with no
   high-risk destinations. If the console lists the US together with Canada, that one entry stays on: the site itself
   refuses Canadian and Caribbean area codes.
5. **Spending alert:** Usage triggers (under Monitor or Billing). Create two email alerts to vicepresident@ and
   president@ on total price: daily at $5 and monthly at $25. Also set the low-balance notice. An alert does not stop
   calls; if you use auto-recharge, keep the amount small.
6. **Protect recordings (required before the first message):** Voice → Settings → General → **Enforce HTTP Auth on
   Media URLs** → Enabled → Save. New accounts may already have it on; check. Without it, anyone holding a recording's
   address can play it. The site warns on the Voicemail page if it finds audio unprotected. Keep **call recording** and
   **transcription** off everywhere else in the console (the site asks for neither on live calls).
   Source: <https://support.twilio.com/hc/en-us/articles/15827821586843> (read 2026-11-27).
7. **Fallback TwiML Bin** (before step 8): Developer tools → TwiML Bins → Create new. Name it `HOEP fallback`, paste the
   XML below, Create, and copy its URL.
8. **Number webhooks:** the number → Configure → Voice.
   - A call comes in: **Webhook**, `https://hemoelpaso.org/api/twilio/voice`, **HTTP POST**
   - Primary handler fails: **TwiML Bin** `HOEP fallback`
   - Type the address exactly: `https`, no `www`, no trailing slash. Anything else fails the signature check.
9. **Vercel → Settings → Environment Variables → Production only** (entered by the President or Vice President):

   | Variable | Value |
   | --- | --- |
   | `TWILIO_ACCOUNT_SID` | Account dashboard |
   | `TWILIO_AUTH_TOKEN` | Account dashboard. Verifies every webhook |
   | `TWILIO_PHONE_NUMBER` | the new number, `+1915…` |
   | `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET` | optional: Account → API keys (both or neither) |
   | `TWILIO_FALLBACK_NUMBER` | **set it:** rung (with press 1) while the phone line is switched off, or if the site can't read its routing or switch. A board member's US number, never HOEP's own |
   | `PHONE_DATA_KEY` | **required for voicemail:** `openssl rand -hex 32`. Encrypts callers' numbers. Keep a copy somewhere safe; a new value makes earlier numbers unreadable |

   Leave `TWILIO_MODE` unset in Production (it is `live`). Give Preview no Twilio variables. Redeploy.
10. **Record the production account** so development refuses it (done 2026-11-27; repeat only if the account changes):
    `printf '%s' 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' | shasum -a 256`, paste the 64 characters into
    `PRODUCTION_ACCOUNT_SID_SHA256` in `src/lib/twilio/production-account.ts`, commit and deploy.
11. **In the site** (signed in as admin@): Settings → Phone. Add each duty number, press "Verify by phone", have the
    owner type the code, then choose who answers each option. Then Settings → Email routing → "New voicemail on the
    phone line": President and Vice President (the default); send a test.
12. **Switch the line on:** once policy v3 is published, admin@ → Settings → Feature toggles → "Phone line". Then do the
    test calls below.

## The switch ("Phone line" feature toggle)

| State | What a caller gets |
| --- | --- |
| On | The menu, forwarding, voicemail |
| Off, or the switch can't be read | Greeting and 911, then the fallback number rings (press 1 to accept). Unanswered, or no fallback number: "we cannot take your call", the website and email. Nothing recorded |
| Site down or erroring | The Twilio-hosted TwiML Bin below |

## Fallback TwiML Bin

Used when the site is down, errors or refuses the request. It plays a message and forwards to nobody: a TwiML Bin cannot
check which key was pressed, so it can't do press-1 screening.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-US" voice="Polly.Joanna-Neural">Thank you for calling Hemophilia Outreach of El Paso. We cannot take your call right now. If this is a medical emergency, hang up and call 9 1 1. Please call again later, visit hemoelpaso dot org, or email info at hemoelpaso dot org.</Say>
  <Say language="es-US" voice="Polly.Lupe-Neural">Gracias por llamar a Hemophilia Outreach of El Paso. En este momento no podemos atender su llamada. Si es una emergencia médica, cuelgue y llame al 9 1 1. Por favor llame más tarde, visite hemoelpaso punto org o escriba a info arroba hemoelpaso punto org.</Say>
  <Hangup/>
</Response>
```

## Test calls after setup

- [ ] The greeting plays in English and Spanish; no key replays it once, then says goodbye.
- [ ] Options 1, 2 and 3 each ring the assigned phone, showing HOEP's number.
- [ ] Press 1 on the answering phone: the two are connected, with nothing extra after hanging up.
- [ ] Press another key, or nothing: the caller hears the voicemail greeting.
- [ ] Don't answer, so personal voicemail picks up: the caller hears the voicemail greeting and nothing is left in that
      personal voicemail. (Confirmed 2026-11-27 with the earlier "call again" message: the parent call showed "completed",
      which is why the code reads only `DialBridged`.)
- [ ] A verification call from Settings → Phone asks for the code and accepts it.
- [ ] A swap by the President reaches all four officer mailboxes, with numbers masked.
- [ ] **Voicemail, each menu choice:** the greeting is in English (1), Spanish (2) or both (3). Leave a message. Within
      a minute President and Vice President get "New voicemail" with a link and nothing else.
- [ ] On Admin → Voicemail: the number is masked; "Show number" shows it in full; the message plays on an iPhone
      (Safari) and a computer; seeking works; "Mark handled" works; the audit log shows each play and each time a number
      was shown (never the number itself).
- [ ] No warning about unprotected recordings is shown. Also check by hand: in a private window, open
      `https://api.twilio.com/2010-04-01/Accounts/<AccountSid>/Recordings/<RecordingSid>.mp3` (ids from the Twilio
      console). It must ask for a password.
- [ ] Delete a message in the site: it disappears from the Twilio console too.
- [ ] Hang up during the greeting, and once right after the beep: no email, nothing listed.
- [ ] Leave 6 messages from one phone in a day: the 6th hears "could not connect … call again later".
- [ ] The next morning, Vercel → Logs: `/api/cron/retention` answered 200.
- [ ] **Switched off:** turn the toggle off. A call hears the greeting and the fallback phone rings; press 1 connects.
      Don't answer: the caller hears "we cannot take your call" and nothing is recorded. **Turn it back on** and call once
      more.
- [ ] Fallback: set "A call comes in" to `https://hemoelpaso.org/api/twilio/missing`, call, hear the fallback, **put the
      real address back**, and call once more.

## Voicemail: how it works

| What | How |
| --- | --- |
| When | Nobody on duty, no answer, busy, or the answering phone didn't press 1 |
| Message | 120 seconds at most; pound key or 6 seconds of silence ends it; never transcribed; live calls are never recorded |
| Limits | Per caller 5 a day (hidden numbers share 10); 60 a day in total. A made-up caller ID gets round the per-caller limit, so the total and the spending alerts are the backstop |
| Audio | Stays at Twilio. Played in Admin → Voicemail through the site (President and Vice President), each play audited |
| Stored by the site | Ids, menu option, language, length, times, the caller's number encrypted and a keyed hash of it |
| Caller's number | Masked. On Admin → Voicemail the President or Vice President can press "Show number": decrypted then, each view audited. Never in email, logs, settings or audit details |
| Deletion | The daily job (`/api/cron/retention`) deletes at Twilio, then marks the row, so that no message is older than 30 days. Failures are retried daily and make the job answer 500. It also takes in a recording whose notice from Twilio was lost, and deletes recordings that belong to no message after a day |
| Email | Route "New voicemail on the phone line": a link only |

The daily job deletes any recording **in the account** that the site doesn't know about. Use the account for nothing
else, and don't point two databases at the same account (a restore of an old database backup counts: recordings newer
than the backup are deleted after a day).

## Recorded prompts instead of the computer voice

Save the file as `public/phone-audio/<en|es>/<prompt>.mp3`, list it in `src/lib/phone/recordings.ts`, run
`npm run check:phone-prompts`, deploy. The words to read are in `src/lib/phone/prompts.ts` (and `ES_REVIEW.md`). A prompt
without a file is spoken as before. The fallback TwiML Bin is separate: to use audio there, upload it as a Twilio Asset
and replace `<Say>` with `<Play>` in the console.

## Testing locally with a tunnel

**Without any Twilio account:** the default `capture` mode with `npm run check:phone-routing` and
`npm run check:phone-voicemail` runs the whole flow with signed requests. Nothing rings and nothing is recorded.

**With a real phone** you need a development account that is not the production one:

1. The President or Vice President creates a subaccount `HOEP development` in the upgraded account, buys it a second
   number, and gives you that subaccount's SID and auth token. They open nothing in production. (A separate upgraded
   account of your own also works. A trial account tests the menu only.)
2. Step 10 above must be done first: `allowlist` mode is refused until the production account is recorded.
3. Install and start a tunnel: `brew install cloudflared`, then `cloudflared tunnel --url http://localhost:3000`.
   Copy the `https://….trycloudflare.com` address.
4. In `.env.local`:

   ```bash
   TWILIO_MODE=allowlist
   TWILIO_DEV_ALLOWLIST=+1915XXXXXXX          # the phone(s) allowed to ring, comma separated
   TWILIO_ACCOUNT_SID=AC...                   # development
   TWILIO_AUTH_TOKEN=...                      # development
   TWILIO_PHONE_NUMBER=+1...                  # the development number
   TWILIO_WEBHOOK_BASE_URL=https://xxxx.trycloudflare.com
   PHONE_DATA_KEY=...                         # any 64 hex characters, development only
   ```

5. `npm run dev`. The log shows `[twilio] TWILIO_MODE=allowlist`.
6. Development number → Voice → A call comes in: Webhook, `https://xxxx.trycloudflare.com/api/twilio/voice`, POST.
7. At `http://localhost:3000`, as admin@ on the development database: Settings → Phone → add your allowlisted phone for
   a board member, verify it, assign it.
8. Call the development number from a **different** phone.
9. When done, stop the tunnel (it exposes your whole development server) and remove `TWILIO_MODE` from `.env.local`.
   A new tunnel has a new address: update steps 4 and 6.

| Symptom | Cause |
| --- | --- |
| "an application error has occurred", server shows nothing | Wrong webhook address, or the tunnel is down |
| `[twilio] rejected request` | The address in the console differs from `TWILIO_WEBHOOK_BASE_URL`, or the token is another account's |
| `[twilio] not configured` | A variable is missing, or the account is refused (the log says why) |
| "Test mode. No phone is rung." | `capture` mode, or the duty number isn't in `TWILIO_DEV_ALLOWLIST` |
