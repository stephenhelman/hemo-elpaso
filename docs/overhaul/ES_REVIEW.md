# ES register review: tú-form strings

Generated for a fluent Spanish reviewer. **Nothing here was rewritten.** The site currently mixes informal (tú) and formal (usted) Spanish. The list below is every public ES string the scan found in tú form, grouped by file with `file:line`.

Total flagged lines: **87** in **19** files. The scan was scoped to public pages, emails and shared lib strings; admin and portal dictionaries are excluded.

**Decision needed:** pick one register for the whole public site (or one per audience: for example tú for the registration/RSVP flow, usted for institutional pages), then rewrite the strings below to match. For reference, these are written in **usted** and are not in this list: contact, resources, get-involved, scholarships, events chrome, most of `contactPage.ts`.

**How this was found:** a heuristic scan of ES dictionary blocks and inline ES strings for tú pronouns (`tu`, `te`, `ti`) and tú imperatives or verb forms (`Regístrate`, `Llámanos`, `Ingresa`, `puedes`, `Estás`, …). It can have false positives (marked *(check)*) and may miss a string with no tell-tale word. Reviewer should also read the unflagged ES text.

Places where tú and usted are mixed on the **same page** (highest priority):

- Home: hero sub "No **estás** solo" (tú) vs upcoming-events subtitle "**Únase** a nosotros" (usted).
- About: CTA "hay un lugar para **ti**" (tú) vs the rest of the page (usted) and board sub "**contáctenos** si **está** interesado".
- Footer: "**Conéctate**", "**Mantente** Informado", "**Regístrate**…" (tú) next to "**Contáctenos**" (usted).
- Contact: "**Síguenos**" (tú) in an otherwise usted page.
- Scholarships CTA button "**Regístrate** para Recibir Información" (tú) next to "**Contáctenos**" (usted).
- Nav/CTA "Participa" (tú) vs page headings in usted.

## `src/messages/RsvpEmail.tsx`

- L52: `confirmation: { h: "¡Estás en la lista!", p: "Tu confirmación está lista.", pre: "Confirmación de asistencia" },`
- L54: `cancelled: { h: "Asistencia cancelada", p: "Tu confirmación fue cancelada. Esperamos verte en un próximo evento.", pre: "Asistencia cancelada" },`
- L57: `qrTitle: "Tu código QR de registro",`
- L58: `qrHelp: "Muéstralo en la entrada.",`
- L59: `qrFallback: "¿No ves tu código QR?",`
- L60: `qrFallbackLink: "Abre tu página de asistencia",`
- L62: `questions: `¿Preguntas? Llámanos al ${SITE_PHONE.dashed} o escribe a ${contactEmail()}.`,`

## `src/messages/EventInvitation.tsx`

- L43: `preview: (t: string) => `Estás invitado/a: ${t}`,`
- L45: `intro: "Hemophilia Outreach of El Paso te invita a:",`
- L49: `ctaHint: "Avísanos si puedes venir (y cuántas personas) con tu enlace personal:",`
- L50: `unsub: "¿No quieres invitaciones por correo?",`

## `src/messages/RegistrationInfoConfirmation.tsx`

- L33: `body: "Recibimos tu solicitud de información de Hemophilia Outreach of El Paso. Te avisaremos sobre próximos eventos y servicios.",`
- L35: ``Para actualizar o eliminar tu información, responde a este correo o escríbenos a ${contactEmail()}.`,`

## `src/app/(public)/register-info/layout.tsx`

- L11: `title: es ? "Regístrate para Recibir Información" : "Register for Information",`
- L13: `? "Regístrate para recibir información sobre eventos y servicios de Hemophilia Outreach of El Paso."`

## `src/app/(public)/access-denied/page.tsx`

- L27: `errorBody: "Algo salió mal al iniciar sesión, por favor inténtalo de nuevo.",`
- L30: `contact: "Contáctanos",`

## `src/app/(public)/scholarships/layout.tsx`

- L26: `"La Beca Conmemorativa Jesus M. Terrazas y Luis Ostos apoya a estudiantes con hemofilia y trastornos hemorrágicos en El Paso, Texas. El próximo ciclo llegará pronto.",`

## `src/translation/layoutPage.ts`

- L41: `connect: "Conéctate",`
- L45: `newsletter: "Mantente Informado",`
- L46: `newsletterSub: "Regístrate para saber de eventos y servicios de HOEP.",`
- L47: `subscribe: "Regístrate para Recibir Información",`
- L53: `{ href: "/get-involved", label: "Participa" },`

## `src/translation/aboutPage.ts`

- L226: `sub: "Ya seas una familia afectada por un trastorno hemorrágico, un voluntario o un posible patrocinador — hay un lugar para ti en nuestra comunidad.",`
- L227: `cta1: "Participa",`
- L228: `cta2: "Contáctanos",`

## `src/translation/resourcesPage.ts`

- L158: `body: "La organización nacional líder dedicada a encontrar mejores tratamientos y curas para los trastornos hemorrágicos y de coagulación. Proporciona educación, defensa y apoyo comunitario.",`
- L357: `body: "La Fundación Nacional de Trastornos Hemorrágicos proporciona recursos de defensa de seguros, incluidas guías para apelar denegaciones y navegar por Medicaid y Medicare.",`

## `src/translation/scholarshipsPage.ts`

- L129: `heading: "¿Quiere Saber Cuándo Abre el Próximo Ciclo?",`
- L131: `cta1: "Regístrate para Recibir Información",`

## `src/translation/rsvpPage.ts`

- L35: `invalidBody: "Puede haber expirado o haber sido reemplazado por un correo más reciente. Llámanos al {phone}.",`
- L37: `invited: "Estás invitado/a a",`
- L39: `partySize: "¿Cuántas personas vienen (contándote)?",`
- L42: `confirmed: "¡Estás confirmado/a!",`
- L44: `qrTitle: "Tu código QR de registro",`
- L45: `qrAlt: "Tu código QR de registro",`
- L46: `qrHelp: "Muéstralo en la entrada. Una captura de pantalla funciona. También te lo enviamos por correo si tenemos tu dirección.",`
- L49: `cancelConfirm: "¿Cancelar tu asistencia a este evento?",`
- L50: `cancelled: "Tu asistencia fue cancelada. Esperamos verte la próxima vez.",`
- L54: `resent: "Enviado. Revisa tu correo.",`
- L55: `wait: "Espera un minuto antes de volver a pedirlo.",`
- L56: `noEmail: "No tenemos un correo electrónico tuyo. Llama al {phone}.",`
- L58: `full: "Este evento está lleno. Llámanos al {phone}.",`
- L59: `closed: "El registro está cerrado. Llámanos al {phone}.",`
- L61: `genericError: "Algo salió mal. Inténtalo de nuevo.",`

## `src/translation/homePage.ts`

- L16: `"Apoyando a individuos y familias afectadas por trastornos hemorrágicos en la región de El Paso. No estás solo.",`
- L17: `cta1: "Participa",`

## `src/translation/getInvolvedPage.ts`

- L10: `eyebrow: "Haz una Diferencia",`
- L11: `heading: "Participa con HOEP",`
- L57: `eyebrow: "Cómo Puedes Ayudar",`
- L228: `"Mesa completa en Gala Anual",`

## `src/translation/registerInfoPage.ts`

- L51: `title: "Regístrate para Recibir Información",`
- L53: `"Cuéntanos un poco sobre tu hogar y te avisaremos de eventos y servicios de HOEP que puedan interesarte. No necesitas cuenta ni contraseña.",`
- L58: `contactHint: "Danos al menos una forma de contactarte (correo o teléfono).",`
- L60: `addressPlaceholder: "Empieza a escribir tu dirección…",`
- L65: `familySize: "Número de personas en tu hogar",`
- L67: `"¿Alguien en tu hogar tiene, o cuida a alguien con, un trastorno hemorrágico?",`
- L69: `"Opcional. Selecciona todas las que apliquen. Nos ayuda a sugerirte eventos relevantes. Nunca lo incluimos en correos.",`
- L75: `rsvpTitle: "Confirma tu asistencia",`
- L77: `partySize: "¿Cuántas personas vienen (contándote)?",`
- L78: `rsvpSuccessTitle: "¡Estás en la lista!",`
- L80: `"Recibimos tu confirmación. Si nos diste un correo electrónico, tu confirmación y tu código QR de registro van en camino.",`
- L81: `full: "Este evento está lleno. Llámanos al {phone}.",`
- L82: `closed: "El registro está cerrado. Llámanos al {phone}.",`
- L86: `"Recibimos tu información. Si nos diste un correo electrónico, tu confirmación va en camino.",`
- L88: `firstName: "Ingresa tu nombre.",`
- L89: `lastName: "Ingresa tu apellido.",`
- L90: `email: "Ingresa un correo electrónico válido.",`
- L91: `phone: "Ingresa un número de teléfono válido.",`
- L92: `contact: "Proporciona un correo electrónico o un teléfono.",`
- L93: `familySize: "Ingresa un tamaño de hogar entre 1 y 30.",`
- L95: `"Debes aceptar el consentimiento de datos y contacto para continuar.",`
- L96: `captcha: "Completa la verificación de seguridad e inténtalo de nuevo.",`
- L97: `generic: "Algo salió mal. Inténtalo de nuevo.",`
- L109: `heading: "Regístrate para Recibir Información",`
- L110: `sub: "Cuéntanos sobre tu hogar y te avisaremos de eventos y servicios que se ajusten. No necesitas cuenta.",`
- L111: `cta: "Regístrate ahora",`

## `src/translation/contactPage.ts`

- L80: `social: "Síguenos",`

## `src/translation/eventsPage.ts`

- L45: `noEvents: "No hay próximos eventos que coincidan con tu búsqueda",`

## `src/components/register-info/RegistrationClosed.tsx`

- L16: `body: "Para registrarte o confirmar asistencia, llámanos. Con gusto te ayudamos.",`
- L17: `contact: "Contáctanos",`

## `src/components/events/event-page/EventPageContent.tsx`

- L73: `{locale === "es" ? "Confirma tu asistencia" : "RSVP for this event"}`
- L186: `{locale === "es" ? "Reserva tu lugar" : "Reserve your spot"}`
- L208: `? "Este evento está lleno. Llámanos al {phone}."`
- L211: `? "El registro está cerrado. Llámanos al {phone}."`
- L219: `? "Para confirmar asistencia, usa el enlace de tu invitación o llámanos al {phone}."`

## `src/lib/invitations/send.ts`

- L78: `? `Estás invitado/a: ${event.titleEs}``

## `src/app/(public)/unsubscribe/page.tsx` (added with the bilingual unsubscribe page)

All ES strings on this page are tú-form, matching the registration/RSVP flow:

- `doneTitle`: `Se canceló tu suscripción`
- `doneBody`: `Ya no recibirás invitaciones a eventos de HOEP en este correo electrónico. Si confirmas tu asistencia a un evento, seguirás recibiendo su confirmación y recordatorio. Para volver a recibir invitaciones, solo contáctanos.`
- `contact`: `Contáctanos`
- `invalid`: `Este enlace para cancelar la suscripción no es válido o ya expiró. Usa el enlace de un correo reciente de HOEP.`
- `generic`: `Algo salió mal. Escríbenos a {email} para que te quitemos de nuestra lista de correo.`
- `failTitle` (`No se pudo cancelar la suscripción`) and `home` (`Volver al inicio`) are register-neutral.

## About page board group labels (`src/translation/aboutPage.ts`)

New ES labels for a fluent reviewer to confirm (register-neutral nouns, but the terminology needs a native check):

- `Officers` → `Funcionarios` (alternatives: `Directivos`, `Oficiales`; the site previously used `Oficiales`)
- `Members at Large` → `Vocales` (alternative: `Miembros en general`)
- `Advisors` → `Asesores`

## Sanity-era Spanish for a fluent reviewer

Group labels used by the People block (`src/components/sanity/PeopleGridBlock.tsx`). The first three are the approved wording; the rest are new:

- `Officers` → `Funcionarios`; `Members at Large` → `Vocales`; `Advisors` → `Asesores` (approved)
- `Founders` → `Fundadores`; `Past Presidents` → `Pasados Presidentes` (existing site wording); `In Memory` → `En Memoria`
- `Send a message` → `Enviar un mensaje`
- Office: `President` → `Presidenta` (Teresita; the Studio takes a separate Spanish office per person)

New pages written in **usted** (formal), unlike the register/RSVP flow which is tú:

- `src/components/layout/NotFoundContent.tsx` (404): `Página no encontrada`, `No pudimos encontrar esa página…`, `Volver al inicio`, `Ver eventos`, `Contáctenos`, `¿Preguntas? Llámenos al`
- `src/app/(public)/error.tsx`: `Algo salió mal`, `Tuvimos un problema inesperado…`, `Intentar de nuevo`, `Si sigue ocurriendo, llámenos al`
- Scholarships card labels (`translation/scholarshipsPage.ts`): `Aceptando Solicitudes`, `Plazo Vencido`, `Monto del Premio`, `Beneficiarios`, `Estudiantes`, `Fecha Límite`, `Tema del Ensayo`

## Resources page in Sanity (Phase 5B)

New or changed Spanish strings (the rest of the Resources copy is unchanged):

- Provider card link: was English in Spanish (`Visit Website`), now `Visitar sitio web`
- Youth program link: was English in Spanish (`Learn More`), now `Más información`
- Default link label when none is set: `Learn more` → `Más información`
- Editor-only labels for program tags: `Ages` → `Edades`, `Season` → `Temporada`, `Cost` → `Costo` (not shown on the site)
- Condition card label `¿Qué es?` (unchanged text, now in code next to the block)
- The register of the existing Resources copy is **usted** (e.g. `Aprenda`, `Contáctenos`); new resources written in the Studio should follow whatever register you decide on.

## About page in Sanity (Phase 5C)

No new Spanish copy was written; the About text moved from the dictionary to the Studio unchanged. Things for a fluent reviewer:

- **Number words in Spanish** (the `{decades}` token): `una, dos, tres, cuatro, cinco, seis, siete, ocho, nueve`. Today it produces `Tres Décadas de Esperanza` (heading) and `durante tres décadas`. Singular (`una década`) is not handled: it needs a different noun, which only matters at one decade.
- Spanish text that now contains tokens: `Más de {decadeYears} Años de Servicio` (badge, shows `Más de 30 Años…`), `Más de {decadeYears} años sirviendo a la comunidad…` (founding card), `más de {decadeYears} años apoyando…` (hero), `durante {decades} décadas` (founder story and spotlight).
- Group heading for the hall of fame: `Pasados Presidentes - Salón de la Fama` (existing wording; the hyphen and the word order are probably worth fixing).
- Existing About copy is a mix: hero and mission are **usted**, the closing banner (`¿Listo para Participar?`, `hay un lugar para ti`, `Participa`, `Contáctanos`) is **tú**.
- The founder's initials on the spotlight are now computed from the name (`LF`, first and last name); board cards keep the first two words (`TF` for Teresita Fernandez de Robles). If you prefer first+last everywhere it would read `TR`.

## Get Involved and Contact in Sanity (Phase 5D)

No new Spanish copy was written; the text moved from the dictionary to the Studio unchanged. For a fluent reviewer:

- **Get Involved ("Haz una Diferencia" eyebrow vs the rest):** the eyebrow `Haz una Diferencia` and the nav button `Participa` are **tú**; the page heading and card text are **usted** (`Participa con HOEP` heading is tú, `Done su Tiempo`, `Ayúdenos`, `Comparta` are usted).
- `Done su Tiempo` (card title): `Done` means "donate"; for time a native would more likely say `Dedique su tiempo` or `Ofrezca su tiempo`.
- `Corra la Voz` (card title): a regional idiom for "spread the word"; check it reads naturally for El Paso (alternatives: `Difunda la Palabra`, `Comparta la Información`).
- The four cards all end with their own link text (`Contáctenos`, `Contáctenos Sobre Patrocinio`, `Expresar Interés`): the first and last are the same word; `Expresar Interés` (infinitive) is the only one not in command form.
- Closing banner: both buttons now read `Contáctenos` (EN: both `Contact Us`), a consequence of the content-accuracy pass.
- **Contact page:** all editable Spanish text is **usted** (`Estamos Aquí Para Usted`, `Envíenos un Mensaje`, `Complete el formulario…`), while the sidebar label `Síguenos` (in code) is **tú**. The note `Servimos a El Paso y la región fronteriza.` (Site settings) is neutral.
- Map heading `Encuéntrenos` and text `Sirviendo orgullosamente… desde 1993` are usted / literal ("since 1993" is not a computed number).
- Site settings now holds the Spanish Facebook label `HOEP en Facebook` and location label `El Paso, Texas`; if the Spanish field is left empty the English text is shown.

## Home page in Sanity (Phase 5E)

The Spanish text moved from the dictionary to the Studio unchanged. For a fluent reviewer:

- **Hero heading** `Dando Esperanza A Nuestra Comunidad`: the accent word is now the marked text `Esperanza` (previously matched by string). Title Case ("A", "Nuestra") is unusual in Spanish; sentence case would be `Dando esperanza a nuestra comunidad`. The footer tagline has the same text but is a separate field now.
- **Hero sub** `No estás solo.` is **tú** and gendered (masculine); `No estás sola` / `No estás solo/a` / `No estás solo ni sola` are alternatives, or a neutral rephrasing.
- **Hero buttons/badges:** `Participa` (tú), `Próximos Eventos`, `Apoyo Gratuito`, `Impulsado por la Comunidad`.
- **Stats labels:** `Familias Atendidas`, `Años de Servicio` (now computed: 33), `Eventos Realizados`, `Gratuito`.
- **Events header** `Únase a nosotros…` is **usted**, while the register band right below it (`Regístrate para Recibir Información`, `Cuéntanos sobre tu hogar…`, `Regístrate ahora`) is **tú**: a register switch on the same page.
- **In code (not editable):** `No hay eventos próximos en este momento. ¡Vuelva pronto!` (usted), `Ver Todos los Eventos`, `lugares disponibles`, `Evento lleno`.

## Household registration, adult confirmation, household admin (new, 2026-11-16)

All new Spanish below is written in **tú** form for the public flow (registration, confirmation email, `/confirm/[token]`), matching the existing registration/RSVP strings, and **needs a fluent reviewer and the register decision above**. Admin strings (household panel) are in the same file and follow the admin dictionary's informal style. The consent texts are **v1, approved by the board** (draft markers removed); the ES wording still needs the fluent-reviewer pass.
Gendered forms to review: `Hijo/a`, `Hermano/a`, `Portadora/portador`, `confirmado/a`, `quedaste confirmado/a`.

### `src/translation/household.ts`

- L59: `householdSize: "Número de personas en tu hogar (contándote)",`
- L60: `membersHeading: "Otras personas en tu hogar",`
- L61: `membersHint: "Agrega a todas las demás personas de tu hogar. Cada persona necesita nombre, parentesco y grupo de edad.",`
- L63: `firstName: "Nombre",`
- L64: `lastName: "Apellido",`
- L65: `optional: "opcional",`
- L66: `relationship: "Parentesco",`
- L67: `ageGroup: "Grupo de edad",`
- L68: `choose: "Elegir…",`
- L69: `add: "Agregar una persona",`
- L70: `remove: "Quitar",`
- L71: `email: "Correo electrónico",`
- L72: `noEmail: "Sin correo: confirmaremos por teléfono",`
- L73: `adultNote: "Esta persona responderá las preguntas de salud por sí misma cuando confirme.",`
- L74: `adultNeedsContact: "Agrega un correo o marca “Sin correo”.",`
- L75: `minorDx: "¿Esta persona tiene un trastorno hemorrágico? (opcional)",`
- L76: `incomplete: "Por favor completa a cada persona de tu hogar antes de continuar.",`
- L77: `primaryDxTitle: "¿Tienes un trastorno hemorrágico, o eres portadora/portador o cuidador? (opcional)",`
- L78: `primaryDxHint: "Responde solo por ti. Selecciona todas las que apliquen. Nos ayuda a sugerirte eventos relevantes. Nunca lo incluimos en correos.",`
- L79: `attestationLabel: "Confirmo (obligatorio)",`
- L80: `consentDataLabel: "Acepto (obligatorio)",`
- L81: `consentMediaLabel: "Acepto (opcional)",`
- L82: `errMembers: "Por favor completa a cada persona de tu hogar.",`
- L83: `errAttestation: "Debes confirmar la declaración sobre edad y tutela para continuar.",`
- L84: `panelTitle: "Hogar",`
- L85: `primaryRow: "Principal",`
- L86: `noMembers: "No hay otras personas en el hogar.",`
- L87: `declinedPlaceholder: "Se quitó del registro",`
- L88: `expiredPlaceholder: "Nunca confirmó",`
- L89: `byPhone: "Confirma por teléfono",`
- L90: `colName: "Nombre",`
- L91: `colRelationship: "Parentesco",`
- L92: `colAge: "Grupo de edad",`
- L93: `colStatus: "Estado",`
- L94: `colDx: "Diagnósticos",`
- L95: `resend: "Reenviar confirmación",`
- L96: `phoneConfirm: "Marcar confirmado por teléfono",`
- L97: `removeMember: "Quitar persona",`
- L98: `removeAsk: "¿Quitar a esta persona del hogar? Se borran sus datos y sus registros de consentimiento.",`
- L99: `resent: "Confirmación enviada",`
- L100: `resendFailed: "No se pudo enviar",`
- L101: `phoneConfirmed: "Marcado como confirmado",`
- L102: `removed: "Persona quitada",`
- L103: `phoneTitle: "Registrar una confirmación por teléfono",`
- L104: `phoneDataLabel: "Aceptó por teléfono: datos y contacto (obligatorio)",`
- L105: `phoneMediaLabel: "Aceptó por teléfono: fotos y video (opcional)",`
- L106: `phoneAdultLabel: "Confirmó que tiene 18 años o más (obligatorio)",`
- L107: `phoneNoHealth: "No registres información de salud de otro adulto.",`
- L108: `save: "Guardar",`
- L109: `cancel: "Cancelar",`
- L110: `pendingFilter: "Confirmaciones pendientes",`
- L111: `pendingBadge: (n: number) => `${n} pendiente${n === 1 ? "" : "s"}`,`

### `src/translation/confirmPage.ts`

- L37: `title: "Confirma tus datos",`
- L40: `youAre: "Te agregaron como",`
- L41: `firstName: "Nombre",`
- L42: `lastName: "Apellido",`
- L43: `email: "Correo electrónico",`
- L44: `dxTitle: "¿Tienes un trastorno hemorrágico, o eres portadora/portador o cuidador? (opcional)",`
- L45: `dxHint: "Solo tú puedes responder esto por ti. Nos ayuda a sugerirte eventos relevantes. Nunca lo incluimos en correos.",`
- L46: `consentHeading: "Tu consentimiento",`
- L47: `consentRequired: "Acepto (obligatorio)",`
- L48: `consentOptional: "Acepto (opcional)",`
- L49: `adultLabel: "Confirmo (obligatorio)",`
- L50: `confirm: "Confirmar",`
- L51: `decline: "Quitarme de este registro",`
- L52: `declineAsk: "¿Quitarte? Borraremos tus datos de este registro.",`
- L53: `declineYes: "Sí, quitarme",`
- L54: `cancel: "Cancelar",`
- L55: `working: "Procesando…",`
- L56: `doneTitle: "Gracias, quedaste confirmado/a",`
- L57: `doneBody: "Guardamos tus datos y preferencias. Puedes cerrar esta página.",`
- L58: `declinedTitle: "Te quitamos del registro",`
- L59: `declinedBody: "Borramos tus datos de este registro. Puedes cerrar esta página.",`
- L60: `invalidTitle: "Este enlace no es válido",`
- L61: `invalidBody: "Puede haber vencido o ya se usó. Llámanos al {phone} y te ayudamos.",`
- L63: `firstName: "Por favor escribe tu nombre.",`
- L64: `email: "Por favor escribe un correo electrónico válido.",`
- L65: `consentData: "Debes aceptar el consentimiento de datos y contacto para confirmar.",`
- L66: `adult: "Debes confirmar que tienes 18 años o más.",`
- L67: `generic: "Algo salió mal. Inténtalo de nuevo.",`

### `src/messages/MemberConfirmation.tsx`

- L28: `preview: "Por favor confirma tus datos con HOEP",`
- L29: `heading: "Por favor confirma tus datos",`
- L32: `ask: "Tómate un minuto para confirmar tus datos y elegir tus propias preferencias. También puedes pedir que te quitemos.",`
- L33: `button: "Revisar y confirmar",`
- L34: `expires: "Este enlace funciona durante 30 días.",`
- L35: `sign: "El equipo de HOEP",`

### `src/content/consent.ts` (v1, board-approved)

- L62: `es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y sobre los menores de mi hogar, y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine esta información en cualquier momento.",`
- L66: `es: "Acepto que HOEP pueda usar fotos o videos en los que aparezcamos yo o los menores de mi hogar en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto no cubre a otros adultos, que responden por sí mismos. Esto es opcional.",`
- L70: `es: "Tengo 18 años o más, y soy el padre, la madre o el tutor legal de los menores que incluí, o tengo el permiso de su tutor.",`
- L75: `es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y se comunique conmigo sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine mi información en cualquier momento.",`
- L79: `es: "Acepto que HOEP pueda usar fotos o videos en los que aparezca yo en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto es opcional.",`
- L83: `es: "Tengo 18 años o más.",`

### Labels in `src/lib/households/constants.ts`

- Relationship, age-group and status labels (`Hijo/a`, `Cónyuge / pareja`, `Padre / madre`, `0–5 años`, `18 años o más`, `Pendiente`, `Confirmado`, `Rechazó`, `Venció`).

### Email subject (`src/lib/households/confirmation.ts`)

- `Por favor confirma tus datos con HOEP`

## Per-person RSVP and check-in (new, 2026-11-17)

New Spanish for the RSVP checklist (tú form, same register question as above) and the RSVP email total. Admin/check-in screens are English-only today, so they add no ES strings.

### `src/translation/household.ts` (RSVP checklist)

- L118: `attendeesTitle: "¿Quiénes vienen?",`
- L119: `attendeesHint: "Desmarca a quien no pueda venir. Puedes cambiarlo después con el mismo enlace.",`
- L120: `youLabel: (n: string) => (n ? `${n} (tú)` : "Tú"),`
- L121: `notConfirmedYet: "aún no ha confirmado",`
- L122: `guestsLabel: "Invitados no listados",`
- L123: `guestsHint: "Personas que vienen contigo y no están en la lista de tu hogar (0 a 10).",`
- L124: `attendeesTotal: (n: number) => `${n} ${n === 1 ? "persona" : "personas"} en total`,`
- L125: `attendeesNone: "Elige al menos una persona o un invitado.",`

### `src/messages/RsvpEmail.tsx`

- Total line: `{n} persona asistirá` / `{n} personas asistirán` (replaces the `Personas: N` label). Gendered/plural forms to confirm.

## Header navigation regroup (new, 2026-11-17)

- `src/components/layout/Navbar.tsx`: dropdown labels `Eventos` (items `Todos los eventos`, `Fotos`) and `Recursos` (items `Guía de recursos`, `Becas`). `Todos los eventos` and `Guía de recursos` are new labels. Existing labels kept: `Nosotros`, `Recibir Información`, `Contacto`, `Participa`.
- `src/translation/layoutPage.ts` (footer): `Acceso de la junta` (board sign-in link). The header no longer has a sign-in button.

## Legal pages (new, 2026-11-19)

Spanish written for the board-approved English policies (`docs/legal/POLICIES_v1.md`). **English controls if the two differ** (each Spanish page says so at the bottom). Register is **usted**, plain and neutral Latin American Spanish. Source: `src/content/legal/{privacy,terms,children}.ts`; consent text: `src/content/consent.ts` (v2, DRAFT).

Placeholders: `{EMAIL}` = privacy inbox, `{PHONE}` = (915) 539-7353, `{HOST}` = site host, `{BACKUP}` = backup window ("hasta 30 días" is an unverified draft value).

### Privacy Policy / Política de Privacidad

| EN | ES |
| --- | --- |
| Privacy Policy | Política de Privacidad |
| Hemophilia Outreach of El Paso (HOEP) is a nonprofit that supports families affected by bleeding disorders in the El Paso area. This policy explains what information we collect through our website and events, why, who can see it, how long we keep it, and the choices you have. We never sell your information. | Hemophilia Outreach of El Paso (HOEP) es una organización sin fines de lucro que apoya a las familias afectadas por trastornos hemorrágicos en el área de El Paso. Esta política explica qué información recopilamos a través de nuestro sitio web y de nuestros eventos, para qué la usamos, quién puede verla, cuánto tiempo la conservamos y qué opciones tiene usted. Nunca vendemos su información. |
| Information we collect | Información que recopilamos |
| **When you register your household:** | **Cuando registra a su hogar:** |
| Your name, email address and/or phone number, and preferred language (English or Spanish). | Su nombre, su correo electrónico y/o su número de teléfono, y su idioma preferido (inglés o español). |
| Your mailing address, if you choose to give it. | Su dirección postal, si decide darla. |
| The people in your household: first name (last name optional), relationship to you, and age group. We do not ask for dates of birth. | Las personas de su hogar: nombre (el apellido es opcional), parentesco con usted y grupo de edad. No pedimos fechas de nacimiento. |
| If you choose to tell us, whether you or a child in your household has a bleeding disorder, and which one (for example, hemophilia A, hemophilia B, or von Willebrand disease). This is health information, and we treat it with extra care. | Si usted decide decírnoslo, si usted o un menor de su hogar tiene un trastorno hemorrágico y cuál (por ejemplo, hemofilia A, hemofilia B o enfermedad de von Willebrand). Esta es información de salud y la tratamos con especial cuidado. |
| Your consents and when you gave them (see “Your consents” below). | Sus consentimientos y la fecha en que los dio (vea “Sus consentimientos” más abajo). |
| **Adults in your household** are asked to confirm their own information. If you list someone 18 or older, we email them once with a private link, or call them if they have no email. They decide for themselves whether to share health information and whether to consent. If they don’t confirm within 30 days, we delete what you entered about them, except a note that your household includes one more adult. | **A los adultos de su hogar** les pedimos que confirmen su propia información. Si usted incluye a alguien de 18 años o más, le enviamos un solo correo con un enlace privado, o lo llamamos si no tiene correo. Cada persona decide por sí misma si comparte información de salud y si da su consentimiento. Si no confirma en 30 días, borramos lo que usted escribió sobre esa persona, salvo una nota de que su hogar incluye un adulto más. |
| **When you RSVP or attend an event:** who in your household is coming, the number of guests, and who checked in. | **Cuando confirma su asistencia o asiste a un evento:** quién de su hogar va a asistir, el número de invitados y quién se registró a la entrada. |
| **When you contact us:** your name, email, phone (optional), and your message. Contact-form messages are sent to HOEP’s email inbox and are not stored in our database. Please don’t include medical details in a contact message; we will follow up privately. | **Cuando se comunica con nosotros:** su nombre, correo electrónico, teléfono (opcional) y su mensaje. Los mensajes del formulario de contacto se envían al correo de HOEP y no se guardan en nuestra base de datos. Por favor, no incluya detalles médicos en un mensaje de contacto; le responderemos de forma privada. |
| **When you visit the website:** we use privacy-friendly page-view statistics that do not use cookies or identify you. We store one cookie to remember your language choice. Our hosting provider sees standard technical information, such as your IP address, to deliver the site. | **Cuando visita el sitio web:** usamos estadísticas de visitas que respetan la privacidad, no usan cookies y no lo identifican. Guardamos una sola cookie para recordar su idioma. Nuestro proveedor de alojamiento web ve información técnica estándar, como su dirección IP, para poder mostrarle el sitio. |
| **Photos:** HOEP may take photos at events. Photos are only published for people who consented to photo use (see below). | **Fotos:** HOEP puede tomar fotos en los eventos. Solo publicamos fotos de las personas que dieron su consentimiento para el uso de fotos (vea más abajo). |
| How we use it | Cómo la usamos |
| To invite you to events. Some events are for specific groups, such as families affected by a particular condition or children of a certain age, so we may use your household’s information to decide which invitations to send you. Invitations never say why you were invited or mention anyone’s diagnosis. | Para invitarle a eventos. Algunos eventos son para grupos específicos, como familias afectadas por una condición en particular o niños de cierta edad, por lo que podemos usar la información de su hogar para decidir qué invitaciones enviarle. Las invitaciones nunca dicen por qué se le invitó ni mencionan el diagnóstico de nadie. |
| To manage RSVPs, send confirmations and reminders, and check people in at events. | Para administrar las confirmaciones de asistencia, enviar confirmaciones y recordatorios, y registrar la entrada de las personas a los eventos. |
| To answer your messages. | Para responder a sus mensajes. |
| To improve our programs, using overall counts (for example, how many families attended). | Para mejorar nuestros programas, usando cifras generales (por ejemplo, cuántas familias asistieron). |
| We do not use your information for advertising, and we do not sell, rent or trade it. | No usamos su información para publicidad, y no la vendemos, alquilamos ni intercambiamos. |
| Who can see it | Quién puede verla |
| Only HOEP board members who need it for their role can see your information, and access is limited by role. Health information is visible only to the President and Vice President. Board members sign in with secure accounts, and access to records is logged. | Solo los miembros de la junta directiva de HOEP que la necesitan para su cargo pueden ver su información, y el acceso está limitado según el cargo. La información de salud solo la ven la presidencia y la vicepresidencia. Los miembros de la junta inician sesión con cuentas seguras, y el acceso a los registros queda anotado. |
| We use trusted service providers to run the website. They process information only to provide their service to HOEP: | Usamos proveedores de servicios de confianza para operar el sitio web. Ellos procesan la información únicamente para prestar su servicio a HOEP: |
| Provider / What it does for HOEP | Proveedor / Qué hace para HOEP |
| Vercel / Hosts the website; privacy-friendly page-view statistics | Vercel / Aloja el sitio web; estadísticas de visitas que respetan la privacidad |
| Neon / Stores our database | Neon / Guarda nuestra base de datos |
| Resend / Sends our emails | Resend / Envía nuestros correos electrónicos |
| Cloudflare / Stores event photos; protects our forms from spam bots | Cloudflare / Guarda las fotos de los eventos; protege nuestros formularios contra robots de spam |
| Auth0 / Board member sign-in | Auth0 / Inicio de sesión de los miembros de la junta |
| Sanity / Manages public website content (no family information) | Sanity / Administra el contenido público del sitio web (sin información de las familias) |
| Google / Shows a map on our contact page | Google / Muestra un mapa en nuestra página de contacto |
| We may share information if the law requires it, or to protect someone’s safety. | Podemos compartir información si la ley lo exige o para proteger la seguridad de alguien. |
| Your consents | Sus consentimientos |
| When you register, you agree that HOEP may keep your information and contact you about events and services. Photo and video consent is separate and optional. You can change either at any time by contacting us. Withdrawing consent stops invitations and other non-essential email. If you have an active RSVP, we will still send that event’s confirmation and reminder unless you cancel the RSVP. | Al registrarse, usted acepta que HOEP guarde su información y se comunique con usted sobre eventos y servicios. El consentimiento para fotos y videos es aparte y es opcional. Puede cambiar cualquiera de los dos en cualquier momento comunicándose con nosotros. Al retirar su consentimiento, dejamos de enviarle invitaciones y otros correos que no sean esenciales. Si tiene una confirmación de asistencia activa, seguiremos enviándole la confirmación y el recordatorio de ese evento, a menos que cancele su asistencia. |
| Every invitation email also has an unsubscribe link. | Cada correo de invitación también incluye un enlace para cancelar la suscripción. |
| Children | Menores de edad |
| Only adults (18 or older) can register. A parent or legal guardian may include their minor children and their information. Read our [Children and Age Policy](/children) for details. | Solo los adultos (de 18 años o más) pueden registrarse. Un padre, madre o tutor legal puede incluir a sus hijos menores de edad y su información. Lea nuestra [Política para Menores y Edad](/children) para más detalles. |
| How long we keep it | Cuánto tiempo la conservamos |
| Information / How long | Información / Cuánto tiempo |
| Your household record / While you’re involved with HOEP. If there’s no RSVP or contact from you for 3 years, we’ll reach out, and delete it if we don’t hear back | El registro de su hogar / Mientras usted participe con HOEP. Si pasan 3 años sin confirmación de asistencia ni contacto de su parte, nos comunicaremos con usted y lo borraremos si no recibimos respuesta |
| An unconfirmed adult’s details / 30 days, then deleted | Datos de un adulto sin confirmar / 30 días; después se borran |
| Event links and QR codes / Until 30 days after the event | Enlaces y códigos QR de eventos / Hasta 30 días después del evento |
| Email delivery records / 1 year | Registros de entrega de correos / 1 año |
| Access logs / 3 years | Registros de acceso / 3 años |
| Contact-form messages / In HOEP’s inbox until the matter is resolved | Mensajes del formulario de contacto / En el correo de HOEP hasta que el asunto se resuelva |
| Published photos / Until we remove them, including on request | Fotos publicadas / Hasta que las retiremos, incluso si usted lo solicita |
| Deleted information may remain in secure backups for a limited period ({BACKUP}) before it is permanently erased. | La información borrada puede permanecer en copias de seguridad protegidas durante un tiempo limitado ({BACKUP}) antes de eliminarse por completo. |
| Your choices and rights | Sus opciones y derechos |
| You can ask us to: | Usted puede pedirnos que: |
| Tell you what information we have about you and your household. | Le digamos qué información tenemos sobre usted y su hogar. |
| Correct it. | La corrijamos. |
| Delete it, completely. | La borremos por completo. |
| Remove a photo of you or your child from our website or social media. | Retiremos de nuestro sitio web o redes sociales una foto suya o de su hijo o hija. |
| Stop contacting you. | Dejemos de comunicarnos con usted. |
| Contact us at {EMAIL} or {PHONE}. We may ask a question to confirm it’s really you, and we will respond within 30 days. | Escríbanos a {EMAIL} o llámenos al {PHONE}. Es posible que le hagamos una pregunta para confirmar que realmente es usted, y le responderemos en un plazo de 30 días. |
| Security | Seguridad |
| We protect your information with encrypted connections, restricted access for board members, private links that can’t be guessed, and by never putting health information in emails, links or QR codes. No system is perfectly secure; if a breach affected your information, we would notify you as the law requires. | Protegemos su información con conexiones cifradas, acceso restringido para los miembros de la junta, enlaces privados imposibles de adivinar, y nunca incluimos información de salud en correos, enlaces ni códigos QR. Ningún sistema es perfectamente seguro; si una violación de seguridad afectara su información, se lo notificaríamos como lo exige la ley. |
| Changes to this policy | Cambios a esta política |
| If we change this policy, we’ll post the new version here with a new effective date. If a change affects how we use information you already gave us, we’ll ask for your consent again. | Si cambiamos esta política, publicaremos aquí la nueva versión con una nueva fecha de vigencia. Si un cambio afecta la manera en que usamos información que usted ya nos dio, le pediremos su consentimiento de nuevo. |
| Contact | Contacto |
| Hemophilia Outreach of El Paso · El Paso, Texas · {EMAIL} · {PHONE} | Hemophilia Outreach of El Paso · El Paso, Texas · {EMAIL} · {PHONE} |
| (none: added sentence) | Esta es una traducción para su comodidad. Si hay alguna diferencia entre la versión en español y la versión en inglés, prevalece la versión en inglés. |

### Terms of Use / Términos de Uso

| EN | ES |
| --- | --- |
| Terms of Use | Términos de Uso |
| By using {HOST} you agree to these terms. If you don’t agree, please don’t use the site. | Al usar {HOST}, usted acepta estos términos. Si no está de acuerdo, por favor no use el sitio. |
| Not medical advice | No es consejo médico |
| Information on this site, including about bleeding disorders, treatment centers and programs, is for general education only. It is not medical advice and does not replace your doctor or hemophilia treatment center. In an emergency, call 911. | La información de este sitio, incluida la que trata de los trastornos hemorrágicos, los centros de tratamiento y los programas, es solo para educación general. No es consejo médico y no reemplaza a su médico ni a su centro de tratamiento de hemofilia. En caso de emergencia, llame al 911. |
| Registering and RSVPs | Registro y confirmación de asistencia |
| You must be 18 or older to register, and the information you give must be accurate. | Debe tener 18 años o más para registrarse, y la información que proporcione debe ser correcta. |
| Only register people you are allowed to: yourself, minors you are the parent or legal guardian of (or have their guardian’s permission for), and other adults in your household, who will be asked to confirm for themselves. | Registre solo a las personas que le corresponde registrar: usted mismo, los menores de quienes usted es padre, madre o tutor legal (o tiene el permiso de su tutor), y otros adultos de su hogar, a quienes se les pedirá que confirmen por sí mismos. |
| Your RSVP and invitation links are private. Please don’t share them; anyone with the link can view or change that RSVP. | Sus enlaces de confirmación de asistencia y de invitación son privados. Por favor, no los comparta; cualquier persona con el enlace puede ver o cambiar esa confirmación. |
| Events can have limited space. RSVPs are first come, first served, and HOEP may change or cancel an event. We will let RSVPed families know. | Los eventos pueden tener cupo limitado. Las confirmaciones se atienden por orden de llegada, y HOEP puede cambiar o cancelar un evento. Se lo haremos saber a las familias que hayan confirmado. |
| At our events | En nuestros eventos |
| HOEP may take photos and video at events. We publish images only of people who consented to photo use. If you see an image of you or your child that you want removed, contact us and we will take it down. | HOEP puede tomar fotos y videos en los eventos. Solo publicamos imágenes de personas que dieron su consentimiento para el uso de fotos. Si ve una imagen suya o de su hijo o hija que desea que retiremos, comuníquese con nosotros y la quitaremos. |
| Acceptable use | Uso aceptable |
| Don’t use the site or its forms to send spam, advertising or harmful content, to try to access information that isn’t yours, or to interfere with how the site works. We may block submissions that break these rules. | No use el sitio ni sus formularios para enviar spam, publicidad o contenido dañino, para intentar acceder a información que no es suya, ni para interferir con el funcionamiento del sitio. Podemos bloquear envíos que incumplan estas reglas. |
| Links to other websites | Enlaces a otros sitios web |
| We link to other organizations, such as national bleeding disorder foundations and local providers. We aren’t responsible for their content or privacy practices. | Incluimos enlaces a otras organizaciones, como fundaciones nacionales de trastornos hemorrágicos y proveedores locales. No somos responsables de su contenido ni de sus prácticas de privacidad. |
| HOEP’s content | Contenido de HOEP |
| The HOEP name, logo and site content belong to HOEP. You may share our pages and event information for non-commercial purposes; please don’t alter our logo or use it to suggest HOEP endorses something. | El nombre, el logotipo y el contenido del sitio pertenecen a HOEP. Puede compartir nuestras páginas y la información de los eventos con fines no comerciales; por favor, no altere nuestro logotipo ni lo use para dar a entender que HOEP respalda algo. |
| No warranty | Sin garantía |
| We work to keep the site accurate and available, but it is provided “as is”, and we can’t promise it will always be error-free or online. To the extent the law allows, HOEP is not liable for losses from using the site. | Nos esforzamos por mantener el sitio correcto y disponible, pero se ofrece “tal como está” y no podemos prometer que siempre estará libre de errores ni en línea. En la medida en que la ley lo permita, HOEP no es responsable por pérdidas derivadas del uso del sitio. |
| Governing law | Ley aplicable |
| These terms are governed by the laws of the State of Texas. | Estos términos se rigen por las leyes del Estado de Texas. |
| Changes | Cambios |
| We may update these terms. The current version and its effective date will always be on this page. | Podemos actualizar estos términos. La versión vigente y su fecha de vigencia siempre estarán en esta página. |
| Contact | Contacto |
| {EMAIL} · {PHONE} | {EMAIL} · {PHONE} |
| (none: added sentence) | Esta es una traducción para su comodidad. Si hay alguna diferencia entre la versión en español y la versión en inglés, prevalece la versión en inglés. |

### Children and Age Policy / Política para Menores y Edad

| EN | ES |
| --- | --- |
| Children and Age Policy | Política para Menores y Edad |
| Many of the families HOEP serves have children with bleeding disorders, so we take extra care with children’s information. Children never use our forms themselves; a parent or guardian provides their information. | Muchas de las familias que atiende HOEP tienen hijos con trastornos hemorrágicos, por eso cuidamos de manera especial la información de los menores. Los niños nunca usan nuestros formularios por sí mismos; la información la proporciona un padre, madre o tutor. |
| Who can register | Quién puede registrarse |
| Only adults 18 or older can register with HOEP or RSVP to events. Everyone who registers confirms that they are 18 or older. This website is not directed to children, and we do not knowingly collect information directly from anyone under 18. If we learn a child registered themselves, we will delete that registration and, where we can, contact a parent or guardian. | Solo los adultos de 18 años o más pueden registrarse con HOEP o confirmar su asistencia a los eventos. Todas las personas que se registran confirman que tienen 18 años o más. Este sitio web no está dirigido a menores y no recopilamos a sabiendas información directamente de nadie menor de 18 años. Si nos enteramos de que un menor se registró por su cuenta, borraremos ese registro y, cuando podamos, nos comunicaremos con un padre, madre o tutor. |
| Children in a household | Menores en un hogar |
| When you register, you may list children under 18 in your household. You confirm that you are their parent or legal guardian, or that you have their guardian’s permission. For each child we collect only: | Al registrarse, puede incluir a los menores de 18 años de su hogar. Usted confirma que es su padre, madre o tutor legal, o que tiene el permiso de su tutor. De cada menor recopilamos únicamente: |
| First name (last name optional) | Nombre (el apellido es opcional) |
| Relationship to you | Parentesco con usted |
| Age group (0–5, 6–12 or 13–17), not a date of birth | Grupo de edad (0–5, 6–12 o 13–17), no la fecha de nacimiento |
| If you choose to tell us, whether they have a bleeding disorder, and which one | Si usted decide decírnoslo, si tiene un trastorno hemorrágico y cuál |
| We use this to invite your family to events that fit your children, such as youth programs and camps, and to check your family in at events. We never put a child’s health information in an email, link or QR code. | Usamos esta información para invitar a su familia a eventos adecuados para sus hijos, como programas para jóvenes y campamentos, y para registrar la entrada de su familia a los eventos. Nunca incluimos la información de salud de un menor en un correo, un enlace ni un código QR. |
| Adults in a household | Adultos en un hogar |
| An adult in your household speaks for themselves. You may list them, but we ask them directly to confirm their information and give their own consent. You cannot share another adult’s health information. If they don’t confirm within 30 days, we delete what you entered about them. | Un adulto de su hogar habla por sí mismo. Usted puede incluirlo, pero le pedimos directamente a esa persona que confirme su información y dé su propio consentimiento. Usted no puede compartir la información de salud de otro adulto. Si no confirma en 30 días, borramos lo que usted escribió sobre esa persona. |
| Photos of children | Fotos de menores |
| We publish photos of children only when their parent or guardian has consented to photo use. At events, board members can see which families declined, so those children are not included in published photos. A parent or guardian can ask us to remove a photo of their child at any time, and we will take it down promptly. | Solo publicamos fotos de menores cuando su padre, madre o tutor ha dado su consentimiento para el uso de fotos. En los eventos, los miembros de la junta pueden ver qué familias no dieron su consentimiento, para que esos menores no aparezcan en las fotos publicadas. Un padre, madre o tutor puede pedirnos en cualquier momento que retiremos una foto de su hijo o hija, y la quitaremos de inmediato. |
| When a child turns 18 | Cuando un menor cumple 18 años |
| The age group you entered does not update automatically. When a child in your household turns 18, please let us know. As an adult, they will be asked to confirm their own information and consent, and any information about them that they don’t confirm will be removed. | El grupo de edad que usted escribió no se actualiza automáticamente. Cuando un menor de su hogar cumpla 18 años, por favor avísenos. Como adulto, se le pedirá que confirme su propia información y dé su consentimiento, y se eliminará cualquier información suya que no confirme. |
| Your rights as a parent or guardian | Sus derechos como padre, madre o tutor |
| You can review, correct or delete your children’s information at any time, and withdraw photo consent, by contacting us at {EMAIL} or {PHONE}. We respond within 30 days. | Puede revisar, corregir o borrar la información de sus hijos en cualquier momento, y retirar el consentimiento para fotos, comunicándose con nosotros en {EMAIL} o al {PHONE}. Respondemos en un plazo de 30 días. |
| (none: added sentence) | Esta es una traducción para su comodidad. Si hay alguna diferencia entre la versión en español y la versión en inglés, prevalece la versión en inglés. |

### Consent text v2 (DRAFT, needs approval)

| Type | EN | ES |
| --- | --- | --- |
| data_and_contact | I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about me and the minors in my household, including health information if I choose to share it, and may contact me by email, phone, or mail about HOEP events and services, as described in the [Privacy Policy](/privacy). I can withdraw this consent, or ask HOEP to delete this information, at any time. | Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y sobre los menores de mi hogar, incluida la información de salud si decido compartirla, y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP, como se describe en la [Política de Privacidad](/privacy). Puedo retirar este consentimiento, o pedir a HOEP que elimine esta información, en cualquier momento. |
| media | I agree that HOEP may use photos or video that include me or the minors in my household at HOEP events in its materials and on its website and social media. This does not cover other adults, who answer for themselves. This is optional. | Acepto que HOEP pueda usar fotos o videos en los que aparezcamos yo o los menores de mi hogar en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto no cubre a otros adultos, que responden por sí mismos. Esto es opcional. |
| age_guardian_attestation | I am 18 or older, and I am the parent or legal guardian of any minors I listed, or have their guardian's permission. ([Children and Age Policy](/children)) | Tengo 18 años o más, y soy el padre, la madre o el tutor legal de los menores que incluí, o tengo el permiso de su tutor. ([Política para Menores y Edad](/children)) |
| member_data_and_contact | I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about myself, including health information if I choose to share it, and may contact me about HOEP events and services, as described in the [Privacy Policy](/privacy). I can withdraw this consent, or ask HOEP to delete my information, at any time. | Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí, incluida la información de salud si decido compartirla, y se comunique conmigo sobre eventos y servicios de HOEP, como se describe en la [Política de Privacidad](/privacy). Puedo retirar este consentimiento, o pedir a HOEP que elimine mi información, en cualquier momento. |
| member_media | I agree that HOEP may use photos or video that include me at HOEP events in its materials and on its website and social media. This is optional. | Acepto que HOEP pueda usar fotos o videos en los que aparezca yo en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto es opcional. |
| member_adult_attestation | I am 18 or older. | Tengo 18 años o más. |

### Other legal UI strings

| Where | EN | ES |
| --- | --- | --- |
| Print button | Print / Save as PDF | Imprimir / Guardar como PDF |
| Page meta | Version 1 · Effective {date} | Versión 1 · Vigente desde {date} |
| Back link on legal pages | All legal pages | Todas las páginas legales |
| /legal index | Legal / How HOEP handles your information, and the rules for using this site. / Read | Información legal / Cómo maneja HOEP su información y las reglas para usar este sitio. / Leer |
| Footer links | Privacy · Terms · Children’s Policy | Privacidad · Términos · Política para menores |
| Link lines (forms, RSVP page) | Privacy Policy · Children and Age Policy · Terms of Use | Política de Privacidad · Política para Menores y Edad · Términos de Uso |
| Contact form notice | Please don’t include medical details; we’ll follow up privately. | Por favor, no incluya detalles médicos; le responderemos de forma privada. |
| Email footer link | Privacy Policy | Política de Privacidad |


### Invitation warning (admin, shown on the event's Invitations page and in the send confirmation)

| EN | ES |
| --- | --- |
| This invitation only goes to families with a specific condition. Its title or description names a condition, which could reveal a family's diagnosis to anyone who sees the email. | Esta invitación solo se envía a familias con una condición específica. Su título o descripción nombra una condición, lo que podría revelar el diagnóstico de una familia a cualquiera que vea el correo. |
