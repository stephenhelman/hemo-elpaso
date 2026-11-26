# Twilio setup and testing

Code: `src/lib/twilio/`, `src/lib/phone/`, `/api/twilio/voice/*`. Admin page: Settings → Phone.
Decisions and plan: `PHONE_AUDIT.md`. Who may sign in to the console: `docs/legal/RUNBOOK.md`.

**Do not give the number to families yet.** Voicemail and policy v3 are not built. An unanswered call hears "call again
later or email info".

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
6. **Fallback TwiML Bin** (before step 7): Developer tools → TwiML Bins → Create new. Name it `HOEP fallback`, paste the
   XML below, Create, and copy its URL.
7. **Number webhooks:** the number → Configure → Voice.
   - A call comes in: **Webhook**, `https://hemoelpaso.org/api/twilio/voice`, **HTTP POST**
   - Primary handler fails: **TwiML Bin** `HOEP fallback`
   - Type the address exactly: `https`, no `www`, no trailing slash. Anything else fails the signature check.
8. **Vercel → Settings → Environment Variables → Production only** (entered by the President or Vice President):

   | Variable | Value |
   | --- | --- |
   | `TWILIO_ACCOUNT_SID` | Account dashboard |
   | `TWILIO_AUTH_TOKEN` | Account dashboard. Verifies every webhook |
   | `TWILIO_PHONE_NUMBER` | the new number, `+1915…` |
   | `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET` | optional: Account → API keys (both or neither) |
   | `TWILIO_FALLBACK_NUMBER` | optional: rung (with press 1) only if the site can't read its routing |

   Leave `TWILIO_MODE` unset in Production (it is `live`). Give Preview no Twilio variables. Redeploy.
9. **Record the production account** so development refuses it:
   `printf '%s' 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' | shasum -a 256`, paste the 64 characters into
   `PRODUCTION_ACCOUNT_SID_SHA256` in `src/lib/twilio/production-account.ts`, commit and deploy.
10. **In the site** (signed in as admin@): Settings → Phone. Add each duty number, press "Verify by phone", have the
    owner type the code, then choose who answers each option.

## Fallback TwiML Bin

Used when the site is down, errors or refuses the request. It plays a message and forwards to nobody: a TwiML Bin cannot
check which key was pressed, so it can't do press-1 screening.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-US" voice="Polly.Joanna-Neural">Thank you for calling Hemophilia Outreach of El Paso. We cannot take your call right now. If this is a medical emergency, hang up and call 9 1 1. Please call again later, or email info at hemoelpaso dot org.</Say>
  <Say language="es-US" voice="Polly.Lupe-Neural">Gracias por llamar a Hemophilia Outreach of El Paso. En este momento no podemos atender su llamada. Si es una emergencia médica, cuelgue y llame al 9 1 1. Por favor llame más tarde o escriba a info arroba hemoelpaso punto org.</Say>
  <Hangup/>
</Response>
```

## Test calls after setup

- [ ] The greeting plays in English and Spanish; no key replays it once, then says goodbye.
- [ ] Options 1, 2 and 3 each ring the assigned phone, showing HOEP's number.
- [ ] Press 1 on the answering phone: the two are connected, with nothing extra after hanging up.
- [ ] Press another key, or nothing: the caller hears "could not connect".
- [ ] Don't answer, so personal voicemail picks up: the caller hears "could not connect" and nothing is left in that
      voicemail. This confirms how Twilio reports `DialBridged` after screening, which the code relies on.
- [ ] A verification call from Settings → Phone asks for the code and accepts it.
- [ ] A swap by the President reaches all four officer mailboxes, with numbers masked.
- [ ] Fallback: set "A call comes in" to `https://hemoelpaso.org/api/twilio/missing`, call, hear the fallback, **put the
      real address back**, and call once more.

## Testing locally with a tunnel

**Without any Twilio account:** the default `capture` mode and `npm run check:phone-routing` run the whole menu with
signed requests. Nothing rings.

**With a real phone** you need a development account that is not the production one:

1. The President or Vice President creates a subaccount `HOEP development` in the upgraded account, buys it a second
   number, and gives you that subaccount's SID and auth token. They open nothing in production. (A separate upgraded
   account of your own also works. A trial account tests the menu only.)
2. Step 9 above must be done first: `allowlist` mode is refused until the production account is recorded.
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
