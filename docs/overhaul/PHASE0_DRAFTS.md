# Phase 0 drafts: policy and consent text for family sign-in and verification

Prepared 2026-11-23. **Everything here is a DRAFT for Stephen, the board and the attorney. Nothing is published, nothing in `src/` was changed.** Spanish drafts are included because every policy and consent text is bilingual; they need a native-speaker review (`docs/overhaul/ES_REVIEW.md` is the existing process).

Decisions this is written against (Stephen, 2026-11-23): Auth0 has social logins only (Google, Facebook, Apple); email magic link first, SMS later via Twilio Verify; primary adult only; President and VP review letters; letter deleted on decision; results do not expire (`expiresAt` stays nullable); verification gates assistance, scholarships and diagnosis-targeted invitations only (at matching time, after 60 days); RSVP via `/rsvp/[token]` stays account-free; assistance, scholarships, live events and newsletter are deferred.

## 0. How these drafts get into the app

Rules from `src/content/consent.ts` and `src/content/legal/*`:

- Consent wording is versioned. **Never edit v2 in place.** These drafts become `v3`, and `CONSENT_TEXT_VERSION` moves to `"v3"` only when approved. Types that do not change keep their v2 text (`media: v1.media`, as v2 does today).
- `ConsentRecord` is append-only (a database trigger rejects UPDATE). A new consent is a new row.
- The privacy policy changes need a new `LEGAL_EFFECTIVE_DATE` in `src/content/legal/meta.ts`, and the policy itself says "If a change affects how we use information you already gave us, we'll ask for your consent again." **Verification and family sign-in both do, so existing households must be told and asked before the new uses start** (Section 4).

---

## 1. Privacy Policy changes

Section names match `src/content/legal/privacy.ts`. "Today" quotes the current text.

### 1.1 "What we collect" (new paragraphs)

**EN**

> **When you sign in to your family page:** your email address (we send you a one-time sign-in link) and, if you choose to sign in with Google, Facebook or Apple, the name and email address that service shares with us. We do not receive your password for those services. We store a sign-in cookie on your device so you stay signed in.
>
> **When you verify a diagnosis (optional):** you can upload a letter from a health care provider that confirms a bleeding-disorder diagnosis for you or for a child in your household. Only the President and Vice President can open it. We delete the file as soon as it has been reviewed. We keep only the result: which diagnosis was confirmed, the date, and who reviewed it. The letter is never put in an email, a link or a QR code.

**ES**

> **Cuando inicia sesión en la página de su familia:** su correo electrónico (le enviamos un enlace de acceso de un solo uso) y, si elige iniciar sesión con Google, Facebook o Apple, el nombre y el correo que ese servicio comparte con nosotros. No recibimos su contraseña de esos servicios. Guardamos una cookie de inicio de sesión en su dispositivo para mantener su sesión.
>
> **Cuando verifica un diagnóstico (opcional):** puede subir una carta de un profesional de la salud que confirme un diagnóstico de trastorno de la coagulación de usted o de un menor de su hogar. Solo la Presidencia y la Vicepresidencia pueden abrirla. Eliminamos el archivo en cuanto se revisa. Solo conservamos el resultado: qué diagnóstico se confirmó, la fecha y quién lo revisó. La carta nunca se incluye en un correo, un enlace ni un código QR.

*Today:* "We store one cookie to remember your language choice." That sentence becomes untrue for signed-in people. Replace with (EN) "We store a cookie to remember your language choice and, if you sign in, a cookie that keeps you signed in. Neither is used for advertising." (ES) "Guardamos una cookie para recordar su idioma y, si inicia sesión, otra que mantiene su sesión. Ninguna se usa para publicidad."

### 1.2 "How we use it" (add two bullets)

- EN: "To let you view and update your household's information, RSVPs and consents when you sign in."
  ES: "Para que pueda ver y actualizar la información, las confirmaciones de asistencia y los consentimientos de su hogar cuando inicia sesión."
- EN: "To confirm a diagnosis, if you choose to verify it. Some HOEP events and programs are only for people with a confirmed diagnosis. After the 60-day window explained below, we send invitations to diagnosis-specific events only to households with a confirmed diagnosis. Invitations never say why you were invited or mention anyone's diagnosis."
  ES: "Para confirmar un diagnóstico, si decide verificarlo. Algunos eventos y programas de HOEP son solo para personas con un diagnóstico confirmado. Después del plazo de 60 días que se explica abajo, enviamos invitaciones a eventos específicos de un diagnóstico solo a hogares con un diagnóstico confirmado. Las invitaciones nunca dicen por qué lo invitamos ni mencionan el diagnóstico de nadie."

### 1.3 New section "Verifying a diagnosis" (after "Who can see it")

**EN**

> Verification is optional. You can register, RSVP to events and use your family page without it.
>
> **What changes if you do not verify:** 60 days after your household is asked to verify, we stop including your household in invitations to events meant for a specific diagnosis. You can still RSVP to any event you have a link for, and you will still get general invitations. You can verify at any time and be included again. Financial assistance and scholarships, if HOEP offers them, will also require verification.
>
> **How it works:** you upload a letter; the President or Vice President reviews it; we delete the file when they decide, whether they approve it or not; if they cannot approve it we tell you a general reason (for example, "the letter was not readable") and you can try again. We keep the result until you ask us to delete your household record.
>
> **We never ask for medical records beyond the letter, and we never share the letter or the result with other organizations.**

**ES**

> La verificación es opcional. Puede registrarse, confirmar asistencia a eventos y usar la página de su familia sin ella.
>
> **Qué cambia si no verifica:** 60 días después de que se le pida verificar a su hogar, dejamos de incluirlo en las invitaciones a eventos dirigidos a un diagnóstico específico. Aún puede confirmar asistencia a cualquier evento del que tenga un enlace y seguirá recibiendo invitaciones generales. Puede verificar en cualquier momento y volver a ser incluido. La ayuda financiera y las becas, si HOEP las ofrece, también requerirán verificación.
>
> **Cómo funciona:** usted sube una carta; la Presidencia o la Vicepresidencia la revisa; eliminamos el archivo cuando deciden, la aprueben o no; si no se puede aprobar, le damos una razón general (por ejemplo, "la carta no se pudo leer") y puede intentarlo de nuevo. Conservamos el resultado hasta que usted pida eliminar el registro de su hogar.
>
> **No pedimos expedientes médicos aparte de la carta, y nunca compartimos la carta ni el resultado con otras organizaciones.**

### 1.4 "Who can see it"

*Today:* "Health information is visible only to the President and Vice President." This is **not yet true in code**: `canViewPHI` also covers Secretary and Treasurer (Section 3 of `PHASE1_AND_SPIKE_PLAN.md` lists every use). Either narrow `canViewPHI` before the policy ships, or change the sentence. Stephen has chosen to narrow later, so **the policy must not be published with this sentence until the narrowing is done** (see Section 1a of `PHASE1_AND_SPIKE_PLAN.md`).

Add: EN "Only the President and Vice President can open a diagnosis letter." ES "Solo la Presidencia y la Vicepresidencia pueden abrir una carta de diagnóstico."

Provider table: change the Auth0 row.

| Provider | Today | Proposed EN | Proposed ES |
| --- | --- | --- | --- |
| Auth0 | Board member sign-in | Sign-in for board members and for families who choose to sign in with Google, Facebook or Apple | Inicio de sesión para miembros de la junta y para familias que eligen iniciar con Google, Facebook o Apple |
| Google / Facebook / Apple | (not listed) | If you choose to sign in with one of them, that company sees that you signed in to HOEP | Si elige iniciar sesión con alguno, esa empresa sabe que inició sesión en HOEP |
| Twilio | (not listed) | **Not yet.** Add only when text-message sign-in launches | **Aún no.** Agregar solo cuando se lance el inicio por mensaje de texto |

(Whether social sign-in for families ships in the first release is open: Phase 2 builds the email link only. Do not list Google/Facebook/Apple until it does.)

### 1.5 "How long we keep it" (new rows)

| Information | EN | ES |
| --- | --- | --- |
| Diagnosis letter | "Until it is reviewed, and no more than 14 days. Then deleted" | "Hasta que se revise, y no más de 14 días. Luego se elimina" |
| Verification result (which diagnosis, date, reviewer) | "While you're involved with HOEP (same as your household record)" | "Mientras participe en HOEP (igual que el registro de su hogar)" |
| Sign-in links | "Valid 30 minutes, one use" | "Válidos 30 minutos, un solo uso" |
| Sign-in sessions | "30 days, or until you sign out" | "30 días, o hasta que cierre sesión" |

(14 days, 30 minutes and 30 days are **proposals** for Stephen to confirm; they are the values the plan builds to.)

### 1.6 "Your choices and rights" and "Security"

Add to the list of requests: EN "Delete your verification result." ES "Eliminar su resultado de verificación." Deleting a household already cascades (`DATA_INVENTORY.md`); the verification table must cascade the same way.

Security: add EN "Sign-in links work once and expire quickly. Diagnosis letters are stored privately and deleted after review." ES "Los enlaces de acceso funcionan una sola vez y caducan pronto. Las cartas de diagnóstico se guardan en privado y se eliminan tras la revisión."

### 1.7 Children and Age Policy (`/children`)

Primary adult only can sign in; minors never have accounts. Add EN: "Only adults can sign in. A parent or guardian can verify a child's diagnosis; the letter is deleted after review and only the result is kept." ES: "Solo los adultos pueden iniciar sesión. Un padre, madre o tutor puede verificar el diagnóstico de un menor; la carta se elimina tras la revisión y solo se conserva el resultado." (Attorney question 12.)

### 1.8 Terms (`/terms`)

Add a short "Your family page" clause: sign-in links are personal; do not forward them; HOEP may suspend access for misuse. Wording left to the attorney (attorney Question 14).

---

## 2. Consent text v3 drafts

Only **new** consent types are drafted. `data_and_contact`, `media`, `age_guardian_attestation` and the `member_*` texts carry over from v2 unchanged. If the attorney wants `data_and_contact` reworded (it already says "including health information if I choose to share it"), that is a separate v3 change.

### 2.1 `verification` (shown at upload; required before the upload button works)

Recorded on the primary's `ConsentRecord` (type `verification`, `method` `portal`), one row per upload request.

**EN**

> I agree that HOEP's President or Vice President may read the letter I am uploading, only to confirm the diagnosis it names. HOEP will delete the letter when they decide, and keep only the result (which diagnosis, the date, and who reviewed it). If the letter is about a child in my household, I am that child's parent or legal guardian. This is optional. ([Privacy Policy](/privacy))

**ES**

> Acepto que la Presidencia o la Vicepresidencia de HOEP pueda leer la carta que estoy subiendo, solo para confirmar el diagnóstico que indica. HOEP eliminará la carta cuando decidan y conservará únicamente el resultado (qué diagnóstico, la fecha y quién lo revisó). Si la carta es de un menor de mi hogar, soy su padre, madre o tutor legal. Esto es opcional. ([Política de Privacidad](/privacy))

### 2.2 `portal_notice` (not a consent; a notice shown on first sign-in, logged as `ConsentRecord` type `portal_notice_ack` or as an audit row; attorney to decide, Question 13)

**EN**

> You are signed in to your HOEP family page. You can see and update your household's information, your RSVPs and your consents. Only you can see this page. If you share your sign-in link with someone, they can see it too. [Privacy Policy](/privacy)

**ES**

> Ha iniciado sesión en la página de su familia de HOEP. Puede ver y actualizar la información de su hogar, sus confirmaciones de asistencia y sus consentimientos. Solo usted puede ver esta página. Si comparte su enlace de acceso con alguien, esa persona también podrá verla. [Política de Privacidad](/privacy)

### 2.3 `sms_contact` (**deferred to the SMS phase; draft kept here so counsel sees it early**)

> I agree that HOEP may text me a one-time sign-in code at the number I gave. Message and data rates may apply. I can reply STOP at any time. This is optional; I can sign in by email instead.

> Acepto que HOEP me envíe por mensaje de texto un código de acceso de un solo uso al número que proporcioné. Pueden aplicar tarifas de mensajes y datos. Puedo responder STOP en cualquier momento. Esto es opcional; puedo iniciar sesión por correo electrónico.

### 2.4 Email sign-in link: what the email may say

The email must follow rule 4 (no diagnosis, no verification wording that implies one). Proposed bilingual subject and body, no household details:

> **EN subject:** Your HOEP sign-in link
> **EN body:** Tap the button to sign in to your HOEP family page. This link works once and expires in 30 minutes. If you didn't ask for it, you can ignore this email.
> **ES asunto:** Su enlace de acceso a HOEP
> **ES cuerpo:** Toque el botón para iniciar sesión en la página de su familia de HOEP. Este enlace funciona una sola vez y caduca en 30 minutos. Si no lo solicitó, puede ignorar este correo.

The verification notices ("Please verify") must say "Please review your family page" and nothing about a diagnosis. Those emails are `lib/email/policy.ts` non-essential kinds (blocked after consent withdrawal); the **sign-in link itself is a transactional kind the person requested** and should be added to `ESSENTIAL_EMAIL_KINDS` (attorney Question 15).

---

## 3. What existing households must be told

Existing households registered under consent v2 and a privacy policy that says nothing about family pages or verification. Before **verification gating starts** (not before the family page opens), each household needs:

1. A one-time email (non-diagnosis wording) pointing to the updated policy and the family page.
2. The 60-day window starting on a **defined date** (Question 5 in `PHASE1_AND_SPIKE_PLAN.md`), not at registration.
3. No automatic exclusion for households that never saw the notice. A household that never received an email (no email on file, phone-only) is handled by the call list, not silently dropped. Matching must treat "never notified" as "not yet in the window".

---

## 4. Open items for the attorney and board

All tracked in `docs/legal/ATTORNEY_QUESTIONS.md` (questions 9 to 19, appended) and in the plan. Highest priority: whether storing a verification *result* (a confirmed diagnosis) changes HOEP's status under Texas Health & Safety Code chapter 181 (existing question 1), and whether making a program benefit conditional on verification needs more than a notice.
