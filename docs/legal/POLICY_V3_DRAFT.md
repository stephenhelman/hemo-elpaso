# HOEP Privacy Policy v3 (draft for board approval)

What v3 adds to v2 (`POLICY_V2_DRAFT.md`): the phone line. Nothing else changes. The Terms of Use and the Children and
Age Policy stay at version 2. The text-message paragraph is unchanged until texting is built (phase 3).

**Before publishing:** the board approves the wording below; Spanish is reviewed (`ES_REVIEW.md`); the attorney
questions on voicemail and call records are answered or accepted as open (`ATTORNEY_QUESTIONS.md` 26 to 30); and
`LEGAL_EFFECTIVE_DATE` in `src/content/legal/meta.ts` is set (it dates all three legal pages).

## Feature status (new toggle keys)

| Feature | Status | Toggle key |
| --- | --- | --- |
| Phone line (menu, call forwarding and voicemail) | Not yet available | `phone_system` |
| Calls from our board through the website | Not yet available | `phone_dialer` |

Until `phone_system` is on, calls to HOEP's number are forwarded to one fallback number (or hear a notice) and nothing is
recorded. `{VOICEMAIL_RETENTION}` is set to "30 days" and must match the code (`npm run check:legal`).

## Statements to confirm

These go beyond the audit's draft, so that the policy says what the code does:

- The sentence about the menu being switched off (Phone calls).
- That HOEP keeps the caller's number, encrypted, with each voicemail, uses it to call back, and that the President and
  Vice President can see it, each view recorded (Voicemail).
- **Phone call records: 1 year.** Proposed. The daily job deletes older call records at the phone provider.

## English (as published)

**Phone calls.** {STATUS:phone_system} When you call us, we and our phone provider receive your number, the time and length of the call and the option you choose. We connect you to the board member assigned to answer. We don’t record live calls. If the phone menu is switched off, your call goes to one board member or you hear an automated notice, and no message is taken.

**Voicemail.** {STATUS:phone_system} If you leave a message, our phone provider stores the recording. Only the President and Vice President can listen to it. We delete it after {VOICEMAIL_RETENTION} or sooner. We don’t transcribe it or attach it to email. We also keep your number, encrypted, with the time and length of the message, so we can return your call, limit repeated messages and delete yours if you ask. Only the President and Vice President can see your number, and we record each time they view it on our website. Please leave out medical details. In an emergency, call 911.

**Calls from our board.** {STATUS:phone_dialer} Board members may call you from our website using HOEP’s number. We keep who called, when and the result, such as reached or left a message.

**How we use it** (added): To answer your phone calls and return your voicemail. {STATUS:phone_system}

| Provider or information | What it does, or how long |
| --- | --- |
| Twilio | Answers and connects our calls and stores voicemails. {STATUS:phone_system} Calls from our board through the website. {STATUS:phone_dialer} Sends text messages. {STATUS:sms} |
| Voicemail recordings {STATUS:phone_system} | No more than {VOICEMAIL_RETENTION}, then deleted |
| Phone call records (number, time and length), and the time and length of a deleted voicemail {STATUS:phone_system} | 1 year |

## Español (borrador, por revisar)

**Llamadas telefónicas.** {STATUS:phone_system} Cuando nos llama, nosotros y nuestro proveedor telefónico recibimos su número, la hora y la duración de la llamada y la opción que elige. Lo comunicamos con el miembro de la junta asignado para contestar. No grabamos las llamadas en vivo. Si el menú telefónico está desactivado, su llamada pasa a un miembro de la junta o usted escucha un aviso automático, y no se toman mensajes.

**Mensajes de voz.** {STATUS:phone_system} Si deja un mensaje, nuestro proveedor telefónico guarda la grabación. Solo la presidencia y la vicepresidencia pueden escucharla. La borramos después de {VOICEMAIL_RETENTION} o antes. No la transcribimos ni la adjuntamos a ningún correo. También guardamos su número, cifrado, con la hora y la duración del mensaje, para devolverle la llamada, limitar los mensajes repetidos y borrar los suyos si lo pide. Solo la presidencia y la vicepresidencia pueden ver su número, y anotamos cada vez que lo consultan en nuestro sitio web. Por favor, no incluya detalles médicos. En una emergencia, llame al 911.

**Llamadas de nuestra junta.** {STATUS:phone_dialer} Los miembros de la junta pueden llamarle desde nuestro sitio web usando el número de HOEP. Anotamos quién llamó, cuándo y el resultado, por ejemplo si lograron hablar con usted o le dejaron un mensaje.

**Cómo la usamos** (agregado): Para contestar sus llamadas y responder a sus mensajes de voz. {STATUS:phone_system}

| Proveedor o información | Qué hace, o cuánto tiempo |
| --- | --- |
| Twilio | Contesta y comunica nuestras llamadas y guarda los mensajes de voz. {STATUS:phone_system} Llamadas de nuestra junta desde el sitio web. {STATUS:phone_dialer} Envía los mensajes de texto. {STATUS:sms} |
| Grabaciones de mensajes de voz {STATUS:phone_system} | No más de {VOICEMAIL_RETENTION}; después se borran |
| Registros de llamadas (número, hora y duración), y la hora y duración de un mensaje de voz borrado {STATUS:phone_system} | 1 año |
