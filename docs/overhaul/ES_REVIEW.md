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

## Legal v2 (new, 2026-11-24)

Privacy Policy v2, the Terms and Children's additions, consent v3 and the event notices. English is the board-approved text (docs/legal/POLICY_V2_DRAFT.md) and controls. Spanish is neutral Latin American, plain and warm, written with “usted”. Review the Spanish for tone and accuracy; nothing here has been checked by a native speaker yet.

Markup: `{STATUS:key}` renders the live label “Aún no disponible” (toggle off) or “Disponible desde <fecha>” (toggle on). `{PROCESSOR}`, `{TRANSCRIPT}`, `{BACKUP}`, `{ASSISTANCE_RETENTION}` and `{ADDRESS}` are filled from src/content/legal/meta.ts. Keep every token exactly as written.

### Consent v3 (src/content/consent.ts)

**media**
- EN: I agree that HOEP may take and publish photos and video of me and the minors in my household at HOEP events, including event recordings and live streams. HOEP will not name us without asking. I can withdraw this at any time and ask HOEP to remove a photo or recording.
- ES: Acepto que HOEP pueda tomar y publicar fotos y videos de mí y de los menores de mi hogar en los eventos de HOEP, incluidas las grabaciones y transmisiones en vivo de los eventos. HOEP no nos identificará por nombre sin preguntarnos antes. Puedo retirar este consentimiento en cualquier momento y pedir a HOEP que retire una foto o una grabación.

**member_media**
- EN: I agree that HOEP may take and publish photos and video of me at HOEP events, including event recordings and live streams. HOEP will not name me without asking. I can withdraw this at any time and ask HOEP to remove a photo or recording.
- ES: Acepto que HOEP pueda tomar y publicar fotos y videos de mí en los eventos de HOEP, incluidas las grabaciones y transmisiones en vivo de los eventos. HOEP no me identificará por nombre sin preguntarme antes. Puedo retirar este consentimiento en cualquier momento y pedir a HOEP que retire una foto o una grabación.

**sms**
- EN: I agree that HOEP may text me at this number about events, reminders, announcements and sign-in codes, once HOEP starts sending texts. Message and data rates may apply. Message frequency varies. Reply STOP to stop, HELP for help. Consent is not required to take part in HOEP.
- ES: Acepto que HOEP me envíe mensajes de texto a este número sobre eventos, recordatorios, avisos y códigos para iniciar sesión, cuando HOEP empiece a enviar mensajes de texto. Pueden aplicar tarifas de mensajes y datos. La frecuencia de los mensajes varía. Responda STOP para dejar de recibirlos y HELP para obtener ayuda. No es obligatorio dar este consentimiento para participar en HOEP.

**newsletter**
- EN: Send me HOEP's newsletter by email. I can unsubscribe in any newsletter.
- ES: Quiero recibir el boletín de HOEP por correo electrónico. Puedo cancelar la suscripción en cualquier boletín.

**verification**
- EN: I agree that HOEP's President or Vice President may read the letter I am uploading, only to confirm the diagnosis it names. HOEP will delete the letter when they decide and keep only the result (which diagnosis, the date, and who reviewed it). If the letter is about a child in my household, I am that child's parent or legal guardian.
- ES: Acepto que la presidencia o la vicepresidencia de HOEP pueda leer la carta que estoy subiendo, solo para confirmar el diagnóstico que menciona. HOEP borrará la carta cuando decidan y conservará únicamente el resultado (qué diagnóstico, la fecha y quién lo revisó). Si la carta es sobre un menor de mi hogar, soy el padre, la madre o el tutor legal de ese menor.

### Event notices (RSVP page)

**quotes**
- EN: HOEP may quote things said at this event in its newsletter or website without names. We will ask first before using anyone's name.
- ES: HOEP puede citar, sin nombres, lo que se diga en este evento en su boletín o en su sitio web. Le preguntaremos antes de usar el nombre de cualquier persona.

**recorded**
- EN: This event will be recorded and streamed. Cameras face the presenters, not the audience. Tell us at check-in if you'd like to stay off camera.
- ES: Este evento se grabará y se transmitirá en vivo. Las cámaras apuntan a quienes presentan, no al público. Avísenos al registrarse si prefiere quedar fuera de cámara.

**recordedWithCaptions**
- EN: This event will be recorded, streamed and shown with live English and Spanish captions. Cameras face the presenters, not the audience. Tell us at check-in if you'd like to stay off camera.
- ES: Este evento se grabará, se transmitirá en vivo y se mostrará con subtítulos en vivo en inglés y español. Las cámaras apuntan a quienes presentan, no al público. Avísenos al registrarse si prefiere quedar fuera de cámara.

Also new: RSVP-form error messages `consentSms` and `consentNewsletter` (src/translation/registerInfoPage.ts), in the same informal “tú” as the rest of that form.

### Privacy Policy v2 (src/content/legal/privacy.ts)

- EN: Hemophilia Outreach of El Paso (HOEP) is a nonprofit that supports families affected by bleeding disorders in the El Paso area. This policy explains what information we collect, why, who can see it, how long we keep it, and your choices. Some features below are marked “Not yet available”: we describe them now so you know exactly how they will work before they start. We never sell your information.
  ES: Hemophilia Outreach of El Paso (HOEP) es una organización sin fines de lucro que apoya a las familias afectadas por trastornos hemorrágicos en el área de El Paso. Esta política explica qué información recopilamos, para qué, quién puede verla, cuánto tiempo la conservamos y qué opciones tiene usted. Algunas funciones de abajo están marcadas como “Aún no disponible”: las describimos desde ahora para que sepa exactamente cómo funcionarán antes de que empiecen. Nunca vendemos su información.
- EN: Information we collect
  ES: Información que recopilamos
- EN: **When you register your household:** your name, email and/or phone number, preferred language, and mailing address if you give it. The people in your household: first name (last name optional), relationship to you, and age group, never a date of birth. If you choose to tell us, whether you or a child in your household has a bleeding disorder, and which one. This is health information, and we treat it with extra care. We also record your consents and when you gave them.
  ES: **Cuando registra a su hogar:** su nombre, su correo electrónico y/o su número de teléfono, su idioma preferido y su dirección postal, si decide darla. Las personas de su hogar: nombre (el apellido es opcional), parentesco con usted y grupo de edad, nunca la fecha de nacimiento. Si usted decide decírnoslo, si usted o un menor de su hogar tiene un trastorno hemorrágico y cuál. Esta es información de salud y la tratamos con especial cuidado. También anotamos sus consentimientos y la fecha en que los dio.
- EN: **Adults in your household** confirm their own information. If you list someone 18 or older, we email or call them once. They decide for themselves whether to share health information and whether to consent. If they don’t confirm within 30 days, we delete what you entered about them.
  ES: **Los adultos de su hogar** confirman su propia información. Si usted incluye a alguien de 18 años o más, le enviamos un correo o lo llamamos una sola vez. Cada persona decide por sí misma si comparte información de salud y si da su consentimiento. Si no confirma en 30 días, borramos lo que usted escribió sobre esa persona.
- EN: **When you RSVP or attend an event:** who in your household is coming, the number of guests, and who checked in.
  ES: **Cuando confirma su asistencia o asiste a un evento:** quién de su hogar va a asistir, el número de invitados y quién se registró a la entrada.
- EN: **When you contact us:** your name, email, phone (optional) and message. Messages go to HOEP’s email and are not stored in our database. Please don’t include medical details; we will follow up privately.
  ES: **Cuando se comunica con nosotros:** su nombre, correo electrónico, teléfono (opcional) y su mensaje. Los mensajes llegan al correo de HOEP y no se guardan en nuestra base de datos. Por favor, no incluya detalles médicos; le responderemos de forma privada.
- EN: **When you visit the website:** privacy-friendly page-view statistics that use no cookies and don’t identify you, and one cookie that remembers your language. Our hosting provider sees standard technical information, such as your IP address, to deliver the site.
  ES: **Cuando visita el sitio web:** estadísticas de visitas que respetan la privacidad, no usan cookies y no lo identifican, y una sola cookie que recuerda su idioma. Nuestro proveedor de alojamiento web ve información técnica estándar, como su dirección IP, para poder mostrarle el sitio.
- EN: **Photos at events:** we publish photos only of people who consented to photo use.
  ES: **Fotos en los eventos:** solo publicamos fotos de las personas que dieron su consentimiento para el uso de fotos.
- EN: **Event recordings and live streams.** {STATUS:recordings} Some events may be streamed live and recorded so families who can’t attend can watch. We announce this on the invitation, at the door and at the start. We point cameras at presenters, not the audience. When someone asks a question, the presenter repeats it rather than showing the person. Families who declined photo use are kept off camera. Recordings are posted as unlisted videos or on the family page, not publicly searchable.
  ES: **Grabaciones y transmisiones en vivo de eventos.** {STATUS:recordings} Algunos eventos podrían transmitirse en vivo y grabarse para que las familias que no pueden asistir los vean. Lo anunciaremos en la invitación, en la puerta y al comenzar. Las cámaras apuntan a quienes presentan, no al público. Cuando alguien hace una pregunta, quien presenta la repite en lugar de mostrar a la persona. Las familias que no aceptaron el uso de fotos quedan fuera de cámara. Las grabaciones se publican como videos no listados o en la página familiar, y no aparecen en las búsquedas públicas.
- EN: **Live captions and translation (Puente Live).** {STATUS:live_captions} At some events and meetings, HOEP’s own app, Puente Live, shows live English and Spanish captions of what is said. Speech is sent to a speech-to-text service and the text to a translation service; neither keeps it beyond processing, except as described under “How long we keep it”. HOEP doesn’t save the audio. Captions are machine-made and can be wrong; they are not a replacement for a qualified interpreter. A board member can pause captions at any time, for example when someone shares something personal. Board members may download a transcript after an event to help write newsletters or blog posts. We never publish a whole transcript.
  ES: **Subtítulos y traducción en vivo (Puente Live).** {STATUS:live_captions} En algunos eventos y reuniones, la aplicación propia de HOEP, Puente Live, muestra subtítulos en vivo en inglés y español de lo que se dice. La voz se envía a un servicio que la convierte en texto, y el texto a un servicio de traducción; ninguno la conserva más allá del procesamiento, salvo lo que se indica en “Cuánto tiempo la conservamos”. HOEP no guarda el audio. Los subtítulos los genera una máquina y pueden tener errores; no sustituyen a un intérprete calificado. Un miembro de la junta puede pausar los subtítulos en cualquier momento, por ejemplo cuando alguien comparte algo personal. Los miembros de la junta pueden descargar una transcripción después del evento para ayudar a escribir boletines o artículos del blog. Nunca publicamos una transcripción completa.
- EN: **When you sign in to your family page.** {STATUS:family_portal} You sign in with Google, Apple or Facebook. The service shares your name and email with us, and we use the email to find your household. We keep a record of which sign-in is linked to your household. If we can’t find your household, we keep that sign-in record for up to 30 days so the board can help you. We never receive your password for those services. A cookie keeps you signed in. Each adult in a household who has confirmed their own details can sign in with the email they confirmed with. Each adult manages their own consents and information, and parents and guardians manage their children’s information. No one sees another adult’s consents or health information.
  ES: **Cuando inicia sesión en su página familiar.** {STATUS:family_portal} Usted inicia sesión con Google, Apple o Facebook. El servicio comparte con nosotros su nombre y correo, y usamos el correo para encontrar su hogar. Guardamos un registro de qué inicio de sesión está vinculado a su hogar. Si no encontramos su hogar, conservamos ese registro hasta 30 días para que la junta pueda ayudarle. Nunca recibimos su contraseña de esos servicios. Una cookie mantiene su sesión abierta. Cada adulto de un hogar que haya confirmado sus propios datos puede iniciar sesión con el correo con el que confirmó. Cada adulto administra sus propios consentimientos e información, y los padres y tutores administran la información de sus hijos. Nadie ve los consentimientos ni la información de salud de otro adulto.
- EN: **When you verify a diagnosis (optional).** {STATUS:verification} You can upload a letter from a health care provider confirming a bleeding disorder for you or a child in your household. Only the President and Vice President can open it. We delete the file as soon as it’s reviewed and keep only the result: which diagnosis was confirmed, the date, and who reviewed it.
  ES: **Cuando verifica un diagnóstico (opcional).** {STATUS:verification} Puede subir una carta de un profesional de la salud que confirme un trastorno hemorrágico suyo o de un menor de su hogar. Solo la presidencia y la vicepresidencia pueden abrirla. Borramos el archivo en cuanto se revisa y conservamos solo el resultado: qué diagnóstico se confirmó, la fecha y quién lo revisó.
- EN: **Text messages.** {STATUS:sms} If you opt in, your mobile number and whether you agreed to texts. Texts include event reminders, announcements and sign-in codes. Reply STOP at any time.
  ES: **Mensajes de texto.** {STATUS:sms} Si usted acepta, su número de celular y si aceptó recibir mensajes. Los mensajes incluyen recordatorios de eventos, avisos y códigos para iniciar sesión. Responda STOP en cualquier momento para dejar de recibirlos.
- EN: **Newsletter.** {STATUS:newsletter} If you subscribe, your email and language. You can unsubscribe in any newsletter.
  ES: **Boletín.** {STATUS:newsletter} Si se suscribe, su correo electrónico y su idioma. Puede cancelar la suscripción en cualquier boletín.
- EN: **Patient stories and blog.** {STATUS:stories} If you share your story, what you choose to tell us and any photos you provide, only with your signed permission (a parent or guardian signs for a child). Quotes from events are used without names unless the person gives permission.
  ES: **Historias de pacientes y blog.** {STATUS:stories} Si comparte su historia, lo que usted decida contarnos y las fotos que nos dé, solo con su permiso firmado (un padre, madre o tutor firma por un menor). Las frases dichas en los eventos se usan sin nombre, salvo que la persona dé su permiso.
- EN: **Financial assistance and scholarships.** {STATUS:assistance} If you apply, what the application asks for, such as the reason, the amount and supporting documents, plus a record of any payment. These programs require a verified diagnosis.
  ES: **Ayuda financiera y becas.** {STATUS:assistance} Si presenta una solicitud, lo que ella pide, como el motivo, el monto y los documentos de apoyo, y un registro de cualquier pago. Estos programas requieren un diagnóstico verificado.
- EN: **Polls and questions at events.** {STATUS:live_interaction} Your answers to live polls are anonymous. Questions you submit may be shown on screen without your name.
  ES: **Encuestas y preguntas en eventos.** {STATUS:live_interaction} Sus respuestas a las encuestas en vivo son anónimas. Las preguntas que envíe pueden mostrarse en pantalla sin su nombre.
- EN: **Community Q&A.** {STATUS:community} Questions and answers you post, which a board member reviews before they appear. Please don’t post health details you wouldn’t want others to see.
  ES: **Preguntas y respuestas de la comunidad.** {STATUS:community} Las preguntas y respuestas que publique, que un miembro de la junta revisa antes de que aparezcan. Por favor, no publique datos de salud que no quisiera que otras personas vean.
- EN: **Online donations.** {STATUS:donations} A payment company processes donations. HOEP receives your name, email, the amount and the date for receipts. We never see or store your full card number.
  ES: **Donaciones en línea.** {STATUS:donations} Una empresa de pagos procesa las donaciones. HOEP recibe su nombre, su correo, el monto y la fecha para los recibos. Nunca vemos ni guardamos el número completo de su tarjeta.
- EN: **Volunteer sign-up.** {STATUS:volunteers} Your name, contact information, availability and the events you volunteer for.
  ES: **Registro de voluntarios.** {STATUS:volunteers} Su nombre, datos de contacto, disponibilidad y los eventos en los que se ofrece como voluntario.
- EN: How we use it
  ES: Cómo la usamos
- EN: To invite you to events. Some events are for specific groups, such as families affected by a particular condition or children of a certain age. Invitations never say why you were invited or mention anyone’s diagnosis.
  ES: Para invitarle a eventos. Algunos eventos son para grupos específicos, como familias afectadas por una condición en particular o niños de cierta edad. Las invitaciones nunca dicen por qué se le invitó ni mencionan el diagnóstico de nadie.
- EN: To review new registrations before sending invitations.
  ES: Para revisar los registros nuevos antes de enviar invitaciones.
- EN: To manage RSVPs, send confirmations and reminders, and check people in.
  ES: Para administrar las confirmaciones de asistencia, enviar confirmaciones y recordatorios, y registrar la entrada de las personas.
- EN: To answer your messages.
  ES: Para responder a sus mensajes.
- EN: To let you see and update your household’s information, and manage your photo, text and newsletter choices, on your family page. {STATUS:family_portal}
  ES: Para que pueda ver y actualizar la información de su hogar, y administrar sus opciones de fotos, mensajes de texto y boletín, en su página familiar. {STATUS:family_portal}
  (CHANGED in feat/portal-edits: “see” became “see and update”; reviewer, please re-check.)
- EN: To confirm a diagnosis, if you choose to verify it. {STATUS:verification}
  ES: Para confirmar un diagnóstico, si usted decide verificarlo. {STATUS:verification}
- EN: To send the texts you opted into. {STATUS:sms}
  ES: Para enviarle los mensajes de texto que aceptó recibir. {STATUS:sms}
- EN: To send the newsletter you opted into. {STATUS:newsletter}
  ES: Para enviarle el boletín que aceptó recibir. {STATUS:newsletter}
- EN: To review assistance applications. {STATUS:assistance}
  ES: Para revisar las solicitudes de ayuda. {STATUS:assistance}
- EN: To improve our programs using overall counts, never individual records.
  ES: Para mejorar nuestros programas usando cifras generales, nunca registros individuales.
- EN: We do not use your information for advertising. We do not sell, rent or trade it. **Sponsors never receive names or contact details.** They see totals only, such as how many families attended.
  ES: No usamos su información para publicidad. No la vendemos, alquilamos ni intercambiamos. **Los patrocinadores nunca reciben nombres ni datos de contacto.** Solo ven totales, como cuántas familias asistieron.
- EN: Verifying a diagnosis
  ES: Verificación de un diagnóstico
- EN: {STATUS:verification} Verification is optional. You can register, RSVP and use your family page without it.
  ES: {STATUS:verification} La verificación es opcional. Puede registrarse, confirmar su asistencia y usar su página familiar sin verificar.
- EN: If you don’t verify: 60 days after your household is asked to, we stop including you in invitations to events meant for a specific diagnosis. You still get general invitations, and you can still RSVP to any event you have a link for. You can verify any time and be included again. Financial assistance and scholarships require verification.
  ES: Si no verifica: 60 días después de que se le pida a su hogar que lo haga, dejamos de incluirle en las invitaciones a eventos para un diagnóstico específico. Seguirá recibiendo las invitaciones generales y podrá confirmar su asistencia a cualquier evento del que tenga un enlace. Puede verificar en cualquier momento y volver a ser incluido. La ayuda financiera y las becas requieren verificación.
- EN: How it works: you upload a letter, the President or Vice President reviews it, and we delete the file once they decide, whether or not they approve it. If they can’t approve it, we tell you a general reason and you can try again. We never ask for medical records beyond the letter, and we never share the letter or the result with other organizations.
  ES: Cómo funciona: usted sube una carta, la presidencia o la vicepresidencia la revisa y borramos el archivo en cuanto decide, la apruebe o no. Si no se puede aprobar, le explicamos el motivo en términos generales y puede intentarlo de nuevo. Nunca pedimos expedientes médicos aparte de la carta, y nunca compartimos la carta ni el resultado con otras organizaciones.
- EN: Who can see it
  ES: Quién puede verla
- EN: Only HOEP board members who need it for their role, with access limited by role. Health information, including diagnosis letters, is visible only to the President and Vice President. Other board members may see your contact details and household members to confirm your registration; they never see health information. Board members sign in with secure accounts, and every access to family records is logged. The account that manages website settings cannot see family information.
  ES: Solo los miembros de la junta de HOEP que la necesitan para su cargo, con acceso limitado según el cargo. La información de salud, incluidas las cartas de diagnóstico, solo la ven la presidencia y la vicepresidencia. Otros miembros de la junta pueden ver sus datos de contacto y a las personas de su hogar para confirmar su registro; nunca ven información de salud. Los miembros de la junta inician sesión con cuentas seguras, y cada acceso a los registros de las familias queda anotado. La cuenta que administra la configuración del sitio no puede ver información de las familias.
- EN: We use these service providers. They process information only to provide their service to HOEP:
  ES: Usamos estos proveedores de servicios. Ellos procesan la información únicamente para prestar su servicio a HOEP:
- EN: Vercel | Hosts the website; privacy-friendly page statistics
  ES: Vercel | Aloja el sitio web; estadísticas de visitas que respetan la privacidad
- EN: Neon | Stores our database
  ES: Neon | Guarda nuestra base de datos
- EN: Resend | Sends our emails
  ES: Resend | Envía nuestros correos electrónicos
- EN: Cloudflare | Stores event photos; protects our forms from spam
  ES: Cloudflare | Guarda las fotos de los eventos; protege nuestros formularios contra el spam
- EN: Auth0 | Board sign-in and family sign-in with Google, Apple or Facebook. {STATUS:family_portal}
  ES: Auth0 | Inicio de sesión de la junta y de las familias con Google, Apple o Facebook. {STATUS:family_portal}
- EN: Sanity | Manages public website content (no family information)
  ES: Sanity | Administra el contenido público del sitio web (sin información de las familias)
- EN: Google | HOEP email; the map on our contact page. Google Meet for virtual events and YouTube for recordings. {STATUS:recordings} Address suggestions while you type, if enabled. {STATUS:address_autocomplete}
  ES: Google | Correo de HOEP; el mapa de nuestra página de contacto. Google Meet para eventos virtuales y YouTube para las grabaciones. {STATUS:recordings} Sugerencias de direcciones mientras escribe, si está activado. {STATUS:address_autocomplete}
- EN: Railway | Hosts Puente Live. {STATUS:live_captions}
  ES: Railway | Aloja Puente Live. {STATUS:live_captions}
- EN: Deepgram | Turns speech into text for live captions; audio is kept only while it’s processed. {STATUS:live_captions}
  ES: Deepgram | Convierte la voz en texto para los subtítulos en vivo; el audio se conserva solo mientras se procesa. {STATUS:live_captions}
- EN: Anthropic | Translates caption text; deleted within 30 days and never used to train models. {STATUS:live_captions}
  ES: Anthropic | Traduce el texto de los subtítulos; se borra en un plazo de 30 días y nunca se usa para entrenar modelos. {STATUS:live_captions}
- EN: Twilio | Sends text messages. {STATUS:sms}
  ES: Twilio | Envía los mensajes de texto. {STATUS:sms}
- EN: Payment processor: {PROCESSOR} | Processes donations. {STATUS:donations}
  ES: Procesador de pagos: {PROCESSOR} | Procesa las donaciones. {STATUS:donations}
- EN: We may share information if the law requires it, or to protect someone’s safety.
  ES: Podemos compartir información si la ley lo exige o para proteger la seguridad de alguien.
- EN: Your consents
  ES: Sus consentimientos
- EN: When you register, you agree that HOEP may keep your information and contact you about events and services. Photo and video use is separate and optional, and so are texts and the newsletter. Some actions, like uploading a letter or applying for assistance, ask for a short consent at that moment. You can change any consent by contacting us. Withdrawing consent stops invitations and other non-essential messages; we still send confirmations and reminders for an RSVP you keep.
  ES: Al registrarse, usted acepta que HOEP guarde su información y se comunique con usted sobre eventos y servicios. El uso de fotos y videos es aparte y opcional, igual que los mensajes de texto y el boletín. Algunas acciones, como subir una carta o solicitar ayuda, piden un consentimiento breve en ese momento. Puede cambiar cualquier consentimiento comunicándose con nosotros. Al retirar su consentimiento dejamos de enviarle invitaciones y otros mensajes que no sean esenciales; seguimos enviando las confirmaciones y los recordatorios de una asistencia que usted mantenga.
- EN: Children
  ES: Menores de edad
- EN: Only adults (18 or older) can register or sign in. A parent or legal guardian may include their children. See our [Children and Age Policy](/children).
  ES: Solo los adultos (de 18 años o más) pueden registrarse o iniciar sesión. Un padre, madre o tutor legal puede incluir a sus hijos. Lea nuestra [Política para Menores y Edad](/children).
- EN: How long we keep it
  ES: Cuánto tiempo la conservamos
- EN: Your household record | While you’re involved with HOEP. After 3 years with no RSVP or contact, we reach out, then delete it if we don’t hear back
  ES: El registro de su hogar | Mientras usted participe con HOEP. Después de 3 años sin confirmación de asistencia ni contacto, nos comunicamos con usted y lo borramos si no recibimos respuesta
- EN: An unconfirmed adult’s details | 30 days, then deleted
  ES: Datos de un adulto sin confirmar | 30 días; después se borran
- EN: Event links and QR codes | Until 30 days after the event
  ES: Enlaces y códigos QR de eventos | Hasta 30 días después del evento
- EN: Email delivery records | 1 year
  ES: Registros de entrega de correos | 1 año
- EN: Access logs | 3 years
  ES: Registros de acceso | 3 años
- EN: Contact-form messages | In HOEP’s inbox until the matter is resolved
  ES: Mensajes del formulario de contacto | En el correo de HOEP hasta que el asunto se resuelva
- EN: Published photos | Until we remove them, including on request
  ES: Fotos publicadas | Hasta que las retiremos, incluso si usted lo solicita
- EN: Event recordings {STATUS:recordings} | Until removed, including on request
  ES: Grabaciones de eventos {STATUS:recordings} | Hasta que se retiren, incluso si usted lo solicita
- EN: Live caption audio {STATUS:live_captions} | Not saved by HOEP; held by the speech service only while processing
  ES: Audio de los subtítulos en vivo {STATUS:live_captions} | HOEP no lo guarda; el servicio de voz lo conserva solo mientras lo procesa
- EN: Caption text sent for translation {STATUS:live_captions} | Deleted by the translation service within 30 days
  ES: Texto de subtítulos enviado a traducción {STATUS:live_captions} | El servicio de traducción lo borra en un plazo de 30 días
- EN: Downloaded event transcripts {STATUS:live_captions} | {TRANSCRIPT}, then deleted
  ES: Transcripciones de eventos descargadas {STATUS:live_captions} | {TRANSCRIPT}; después se borran
- EN: Diagnosis letters {STATUS:verification} | Until reviewed, no more than 14 days
  ES: Cartas de diagnóstico {STATUS:verification} | Hasta que se revisan, máximo 14 días
- EN: Verification result {STATUS:verification} | Same as your household record
  ES: Resultado de la verificación {STATUS:verification} | Igual que el registro de su hogar
- EN: Sign-in sessions {STATUS:family_portal} | Up to 7 days, and you’re signed out after 24 hours of inactivity
  ES: Sesiones de inicio de sesión {STATUS:family_portal} | Hasta 7 días, y se cierra su sesión tras 24 horas de inactividad
- EN: Linked sign-ins {STATUS:family_portal} | Which Google, Apple or Facebook sign-in is linked to your household: while your household record exists
  ES: Inicios de sesión vinculados {STATUS:family_portal} | Qué inicio de sesión de Google, Apple o Facebook está vinculado a su hogar: mientras exista el registro de su hogar
- EN: Sign-ins we couldn’t match to a household {STATUS:family_portal} | 30 days after last use, then deleted
  ES: Inicios de sesión que no pudimos asociar a un hogar {STATUS:family_portal} | 30 días después del último uso, y luego se borran
- EN: Merged duplicate records | If we merge duplicate records, we keep an empty placeholder for up to 12 months, and the other email address only to recognize your sign-in.
  ES: Registros duplicados fusionados | Si fusionamos registros duplicados, conservamos un registro vacío hasta 12 meses, y el otro correo electrónico solo para reconocer su inicio de sesión. (NEW in feat/portal-edits)
- EN: Assistance records {STATUS:assistance} | {ASSISTANCE_RETENTION}
  ES: Registros de ayuda financiera {STATUS:assistance} | {ASSISTANCE_RETENTION}
- EN: Donation records {STATUS:donations} | As required for tax receipts
  ES: Registros de donaciones {STATUS:donations} | Lo que exijan los recibos para impuestos
- EN: Deleted information may stay in secure backups for {BACKUP} before it is permanently erased.
  ES: La información borrada puede permanecer en copias de seguridad protegidas durante {BACKUP} antes de eliminarse por completo.
- EN: Your choices and rights
  ES: Sus opciones y derechos
- EN: You can ask us to tell you what we have about you and your household; correct it; delete it completely, including any verification result; remove a photo, recording or quote of you or your child; or stop contacting you. Contact {EMAIL} or {PHONE}. We may ask a question to confirm it’s you, and we respond within 30 days.
  ES: Puede pedirnos que le digamos qué información tenemos sobre usted y su hogar; que la corrijamos; que la borremos por completo, incluido cualquier resultado de verificación; que retiremos una foto, una grabación o una cita suya o de su hijo o hija; o que dejemos de comunicarnos con usted. Escriba a {EMAIL} o llame al {PHONE}. Es posible que le hagamos una pregunta para confirmar que es usted, y respondemos en un plazo de 30 días.
- EN: Security
  ES: Seguridad
- EN: Encrypted connections, role-limited access for board members, private links that can’t be guessed, and no health information in emails, links or QR codes. {STATUS:family_portal} Diagnosis letters are stored privately and deleted after review. {STATUS:verification} No system is perfectly secure. If a breach affected your information, we would notify you as the law requires.
  ES: Conexiones cifradas, acceso de la junta limitado por cargo, enlaces privados imposibles de adivinar, y nunca incluimos información de salud en correos, enlaces ni códigos QR. {STATUS:family_portal} Las cartas de diagnóstico se guardan en privado y se borran después de revisarse. {STATUS:verification} Ningún sistema es perfectamente seguro. Si una violación de seguridad afectara su información, se lo notificaríamos como lo exige la ley.
- EN: Changes to this policy
  ES: Cambios a esta política
- EN: When a feature marked “Not yet available” starts, this page updates to show the date. If we change how we use information you already gave us, we’ll tell you and ask for your consent again.
  ES: Cuando empiece una función marcada como “Aún no disponible”, esta página se actualizará para mostrar la fecha. Si cambiamos la manera en que usamos información que usted ya nos dio, se lo diremos y le pediremos su consentimiento de nuevo.
- EN: Contact
  ES: Contacto
- EN: Hemophilia Outreach of El Paso · {ADDRESS}{EMAIL} · {PHONE}
  ES: Hemophilia Outreach of El Paso · {ADDRESS}{EMAIL} · {PHONE}

### Terms of Use v2: new section (src/content/legal/terms.ts)

- EN: **Your family page.** {STATUS:family_portal} Your sign-in is personal. Don’t share it. HOEP may suspend access if a page is misused.
  ES: **Su página familiar.** {STATUS:family_portal} Su inicio de sesión es personal. No lo comparta. HOEP puede suspender el acceso si una página se usa de forma indebida.
- EN: **Live captions.** {STATUS:live_captions} Captions and translations at HOEP events are machine-made and can be wrong. They’re for general understanding, not medical, legal or consent decisions.
  ES: **Subtítulos en vivo.** {STATUS:live_captions} Los subtítulos y las traducciones en los eventos de HOEP los genera una máquina y pueden tener errores. Sirven para entender de forma general, no para decisiones médicas, legales ni de consentimiento.
- EN: **Recordings.** {STATUS:recordings} By attending an event that is announced as recorded, you understand you may be heard or seen in the background. Ask a board member, and we’ll keep you off camera.
  ES: **Grabaciones.** {STATUS:recordings} Al asistir a un evento que se anuncia como grabado, usted entiende que podrían oírlo o verlo al fondo. Pídale a un miembro de la junta y lo mantendremos fuera de cámara.
- EN: **Community posts.** {STATUS:community} Be respectful, don’t share someone else’s health information, and don’t give medical advice. A board member reviews every post before it appears.
  ES: **Publicaciones de la comunidad.** {STATUS:community} Sea respetuoso, no comparta información de salud de otra persona y no dé consejos médicos. Un miembro de la junta revisa cada publicación antes de que aparezca.

### Children and Age Policy v2: new section (src/content/legal/children.ts)

- EN: **Signing in.** {STATUS:family_portal} Only adults can sign in to a family page. Children never have accounts.
  ES: **Inicio de sesión.** {STATUS:family_portal} Solo los adultos pueden iniciar sesión en una página familiar. Los menores nunca tienen cuentas.
- EN: **Verifying a child’s diagnosis.** {STATUS:verification} A parent or legal guardian can upload a letter for their child. The letter is deleted after review, and only the result is kept.
  ES: **Verificación del diagnóstico de un menor.** {STATUS:verification} Un padre, madre o tutor legal puede subir una carta sobre su hijo o hija. La carta se borra después de revisarse y solo se conserva el resultado.
- EN: **Recordings and live streams.** {STATUS:recordings} We keep children whose families declined photo use off camera, and we don’t point cameras at the audience. A parent can ask us to remove any recording that shows their child.
  ES: **Grabaciones y transmisiones en vivo.** {STATUS:recordings} Mantenemos fuera de cámara a los menores cuyas familias no aceptaron el uso de fotos, y no apuntamos las cámaras al público. Un padre o madre puede pedirnos que retiremos cualquier grabación en la que aparezca su hijo o hija.
- EN: **Stories.** {STATUS:stories} We publish a child’s story or quote only with a parent’s or guardian’s signed permission.
  ES: **Historias.** {STATUS:stories} Publicamos la historia o una frase de un menor solo con el permiso firmado de su padre, madre o tutor.


## Family page (feat/family-portal)

Strings in `src/lib/portal/text.ts` (EN / ES), the page `src/app/(public)/portal/`, and the account menu (`Board` / `Junta`, `My household` / `Mi hogar` in `src/translation/layoutPage.ts`). Consent wording itself is the existing v3 text (`src/content/consent.ts`) and is unchanged.

Policy text changed in this branch (already listed above under the privacy policy and Terms): the family sign-in paragraph (Google, Apple or Facebook only), the merged social-sign-in paragraph removed, the Auth0 provider row, the "view and update" purpose line, the security line, and Terms "Your family page". The `family_social_signin` toggle is retired; `family_portal` covers all of it.

- EN: My household
  ES: Mi hogar
- EN: This is the information HOEP has about your household. You can update your own details and your children’s here. Each adult in the household signs in for themselves and manages their own choices and information; no one sees another adult’s choices or health information. To withdraw consent to store your information, contact us.
  ES: Esta es la información que HOEP tiene sobre su hogar. Aquí puede actualizar sus propios datos y los de sus hijos. Cada adulto del hogar inicia sesión por sí mismo y administra sus propias opciones e información; nadie ve las opciones ni la información de salud de otro adulto. Para retirar el consentimiento de guardar su información, contáctenos.
  (CHANGED in feat/portal-edits.)
- EN: Contact HOEP
  ES: Contactar a HOEP
- EN: People in your household
  ES: Personas de su hogar
- EN: You
  ES: Usted
- EN: Waiting to confirm
  ES: Falta que confirme
- EN: Diagnoses you shared
  ES: Diagnósticos que compartió
- EN: Only you can see this. HOEP board members who need it for their role can also see it; it is never sent by email or put in links.
  ES: Solo usted puede verlos. Los miembros de la junta de HOEP que lo necesiten para su cargo también pueden verlos; nunca se envían por correo ni se ponen en enlaces.
- EN: None shared.
  ES: No compartió ninguno.
- EN: Your events
  ES: Sus eventos
- EN: Upcoming
  ES: Próximos
- EN: Past
  ES: Anteriores
- EN: Invited
  ES: Invitaciones
- EN: No upcoming events yet.
  ES: Todavía no hay eventos próximos.
- EN: No past events.
  ES: No hay eventos anteriores.
- EN: Cancelled
  ES: Cancelado
- EN: Change or cancel
  ES: Cambiar o cancelar
- EN: View
  ES: Ver
- EN: Use the link in your invitation email to reply.
  ES: Use el enlace de su correo de invitación para responder.
- EN: Your choices
  ES: Sus opciones
- EN: These are saved as new entries; earlier ones stay on record. Change them any time.
  ES: Se guardan como entradas nuevas; las anteriores quedan registradas. Puede cambiarlas cuando quiera.
- EN: On
  ES: Sí
- EN: Off
  ES: No
- EN: Not set
  ES: Sin definir
- EN: Saving…
  ES: Guardando…
- EN: Saved.
  ES: Guardado.
- EN: Could not save. Please try again.
  ES: No se pudo guardar. Inténtelo de nuevo.
- EN: HOEP isn’t sending these yet. Your choice is saved for when it starts.
  ES: HOEP todavía no envía esto. Su elección queda guardada para cuando empiece.
- EN: Storing your information and contacting you
  ES: Guardar su información y comunicarnos con usted
- EN: To withdraw this one, contact us (it also stops event emails).
  ES: Para retirar este, contáctenos (también detiene los correos de eventos).
- EN: Privacy Policy
  ES: Política de Privacidad
- EN: Your family page is coming soon
  ES: Su página familiar llegará pronto
- EN: You’re signed in. We’re still finishing this page.
  ES: Ya iniciamos su sesión. Todavía estamos terminando esta página.
- EN: Back to homepage
  ES: Volver al inicio
- EN: Board | ES: Junta
- EN: My household | ES: Mi hogar

## Family page: editing, adults sign in, guardians (feat/portal-edits)

### Consent v4: NEEDS HUMAN REVIEW (EN wording is DRAFT pending Stephen's and the attorney's approval)

One new text, `member_guardian_attestation` in `src/content/consent.ts`. A confirmed adult the primary designated as a child's guardian must accept it on the family page before they can see or change that child's information. Recorded as an `age_guardian_attestation` consent on that adult's member row. Everything else in v4 is v3 unchanged. `CONSENT_TEXT_VERSION` is now `v4`.

- EN: I am this child's parent or legal guardian.
  ES: Soy el padre, la madre o el tutor legal de este menor.

### Policy text changed in this branch (already listed above in their sections, marked CHANGED / NEW)

The "see and update" purpose line; the family sign-in paragraph (each adult signs in, manages their own choices, parents and guardians manage their children's, no one sees another adult's consents or health information); the new retention row for merged duplicate records (12 months, and the other email only to recognize a sign-in). `LEGAL_EFFECTIVE_DATE` is untouched.

### Family page strings (`src/lib/portal/edit-text.ts`, EN / ES)

Function-valued strings show a placeholder for the name.

- EN: Save
  ES: Guardar
- EN: Saving…
  ES: Guardando…
- EN: Saved.
  ES: Guardado.
- EN: That didn’t work. Please check it and try again.
  ES: No funcionó. Revise los datos e inténtelo de nuevo.
- EN: Cancel
  ES: Cancelar
- EN: Edit
  ES: Editar
- EN: Remove
  ES: Quitar
- EN: Yes, do it
  ES: Sí, hacerlo
- EN: Add
  ES: Agregar
- EN: Enter a first name.
  ES: Escriba un nombre.
- EN: Enter a last name.
  ES: Escriba un apellido.
- EN: That phone number doesn’t look right.
  ES: Ese número de teléfono no parece correcto.
- EN: Keep at least one way to reach you: an email or a phone number.
  ES: Conserve al menos una forma de contactarle: un correo o un teléfono.
- EN: That email address doesn’t look right.
  ES: Ese correo electrónico no parece correcto.
- EN: Check the details for this person (an adult needs an email, or choose to confirm by phone).
  ES: Revise los datos de esta persona (un adulto necesita un correo, o elija confirmar por teléfono).
- EN: A household can have up to 12 people.
  ES: Un hogar puede tener hasta 12 personas.
- EN: Choose an age group.
  ES: Elija un grupo de edad.
- EN: Choose a relationship.
  ES: Elija un parentesco.
- EN: You’ve made a lot of changes. Please wait a minute.
  ES: Ha hecho muchos cambios. Espere un minuto.
- EN: You can’t do that here.
  ES: No puede hacer eso aquí.
- EN: About you
  ES: Sobre usted
- EN: First name
  ES: Nombre
- EN: Last name
  ES: Apellido
- EN: Phone
  ES: Teléfono
- EN: Preferred language
  ES: Idioma preferido
- EN: English
  ES: English
- EN: Español
  ES: Español
- EN: Mailing address
  ES: Dirección postal
- EN: This is the household’s address. Any adult in the household can update it.
  ES: Es la dirección del hogar. Cualquier adulto del hogar puede actualizarla.
- EN: Email
  ES: Correo electrónico
- EN: New email address
  ES: Nuevo correo electrónico
- EN: Change email
  ES: Cambiar correo
- EN: We’ll send a confirmation link to the new address. Your email changes only after you use that link, and you stay signed in either way.
  ES: Enviaremos un enlace de confirmación a la nueva dirección. Su correo cambia solo cuando use ese enlace, y su sesión sigue abierta de cualquier forma.
- EN: If this address can be used, we’ve sent it a confirmation link.
  ES: Si esta dirección se puede usar, le enviamos un enlace de confirmación.
- EN: Your diagnoses
  ES: Sus diagnósticos
- EN: Only you can see and change this. HOEP board members who need it for their role can also see it. It is never sent by email or put in links.
  ES: Solo usted puede verlos y cambiarlos. Los miembros de la junta de HOEP que lo necesiten para su cargo también pueden verlos. Nunca se envían por correo ni se ponen en enlaces.
- EN: Changes to diagnoses and age groups affect future invitations only. Invitations we already sent are not changed.
  ES: Los cambios en diagnósticos y grupos de edad afectan solo a las invitaciones futuras. Las invitaciones que ya enviamos no cambian.
- EN: People in your household
  ES: Personas de su hogar
- EN: You
  ES: Usted
- EN: Household contact
  ES: Contacto del hogar
- EN: Waiting to confirm
  ES: Falta que confirme
- EN: Minor
  ES: Menor
- EN: Adult
  ES: Adulto
- EN: Add a person
  ES: Agregar una persona
- EN: Add a child or minor
  ES: Agregar un niño o menor
- EN: Add an adult
  ES: Agregar un adulto
- EN: Relationship
  ES: Parentesco
- EN: Age group
  ES: Grupo de edad
- EN: Child
  ES: Hijo/a
- EN: Spouse / partner
  ES: Cónyuge / pareja
- EN: Parent
  ES: Padre / madre
- EN: Sibling
  ES: Hermano/a
- EN: Other
  ES: Otro
- EN: Their email
  ES: Su correo electrónico
- EN: Confirm by phone instead (HOEP will call)
  ES: Confirmar por teléfono (HOEP llamará)
- EN: Adults confirm for themselves. We email them a link, or HOEP calls if you choose phone. They aren’t counted for invitations until they confirm.
  ES: Los adultos confirman por sí mismos. Les enviamos un enlace por correo, o HOEP llama si elige teléfono. No cuentan para las invitaciones hasta que confirmen.
- EN: Diagnoses
  ES: Diagnósticos
- EN: None shared.
  ES: No compartió ninguno.
- EN: Edit diagnoses
  ES: Editar diagnósticos
- EN: Only this child’s parents or guardians can see or change their diagnoses.
  ES: Solo los padres o tutores de este menor pueden ver o cambiar sus diagnósticos.
- EN: Is {name}’s age group still right?
  ES: ¿Sigue siendo correcto el grupo de edad de {nombre}?
- EN: Yes, still right
  ES: Sí, sigue igual
- EN: Now 18 or older
  ES: Ya tiene 18 años o más
- EN: {name} is now an adult
  ES: {nombre} ya es adulto
- EN: We’ll ask them to confirm for themselves, like any adult. Their diagnoses are cleared from the household until they confirm and share their own.
  ES: Le pediremos que confirme por sí mismo, como cualquier adulto. Sus diagnósticos se quitan del hogar hasta que confirme y comparta los suyos.
- EN: Convert to an adult
  ES: Convertir en adulto
- EN: Remove {name} from your household? They come off upcoming RSVPs. Past attendance stays as a count only.
  ES: ¿Quitar a {nombre} de su hogar? Sale de los registros a eventos próximos. La asistencia pasada queda solo como un número.
- EN: this person
  ES: esta persona
- EN: Parents / guardians
  ES: Padres / tutores
- EN: You are always a guardian. Other adults you add here can see and change this child’s diagnoses after they accept the guardian statement the next time they sign in.
  ES: Usted siempre es tutor. Los otros adultos que agregue aquí podrán ver y cambiar los diagnósticos de este menor después de aceptar la declaración de tutor la próxima vez que inicien sesión.
- EN: Add a guardian
  ES: Agregar un tutor
- EN: waiting to accept
  ES: falta que acepte
- EN: accepted
  ES: aceptó
- EN: Please confirm
  ES: Por favor confirme
- EN: You were added as a parent or guardian of {name}. To see or change their information, confirm:
  ES: Lo agregaron como padre, madre o tutor de {nombre}. Para ver o cambiar su información, confirme:
- EN: I am this child’s parent or legal guardian.
  ES: Soy el padre, la madre o el tutor legal de este menor.
- EN: I confirm
  ES: Confirmo
- EN: Not now
  ES: Ahora no
- EN: Your choices
  ES: Sus opciones
- EN: Leave this household
  ES: Salir de este hogar
- EN: You’ll be removed from this household and your sign-in will stop working. Your consents are withdrawn, and you come off upcoming RSVPs. The person who set up the household is told that an adult left.
  ES: Saldrá de este hogar y su inicio de sesión dejará de funcionar. Sus consentimientos se retiran y sale de los registros a eventos próximos. Se avisa a quien creó el hogar que un adulto salió.
- EN: Leave this household
  ES: Salir de este hogar
- EN: Delete our data
  ES: Eliminar nuestros datos
- EN: This asks HOEP to delete your whole household. It doesn’t delete anything by itself: HOEP follows its privacy process and will contact you.
  ES: Esto pide a HOEP eliminar todo su hogar. No elimina nada por sí solo: HOEP sigue su proceso de privacidad y se comunicará con usted.
- EN: Request to delete our household
  ES: Pedir que se elimine nuestro hogar
- EN: This asks HOEP to delete your own data. It doesn’t delete anything by itself: HOEP follows its privacy process and will contact you.
  ES: Esto pide a HOEP eliminar sus propios datos. No elimina nada por sí solo: HOEP sigue su proceso de privacidad y se comunicará con usted.
- EN: Request to delete my data
  ES: Pedir que se eliminen mis datos
- EN: We’ve told HOEP. Someone will contact you.
  ES: Avisamos a HOEP. Alguien se comunicará con usted.
- EN: Confirm your new email
  ES: Confirme su nuevo correo
- EN: Press the button to change your email address on your HOEP family page.
  ES: Oprima el botón para cambiar su correo electrónico en su página familiar de HOEP.
- EN: Confirm my new email
  ES: Confirmar mi nuevo correo
- EN: Done. Your email address was changed.
  ES: Listo. Su correo electrónico cambió.
- EN: This link isn’t valid any more. If you still want to change your email, ask for a new link on your family page.
  ES: Este enlace ya no es válido. Si todavía quiere cambiar su correo, pida un enlace nuevo en su página familiar.
- EN: Go to my family page
  ES: Ir a mi página familiar

### Emails (inline in `src/lib/portal/edit.ts`; each is EN and ES in one message, link only, no names)

- Confirm your new email (to the NEW address). Subject: Confirm your new email / Confirme su nuevo correo.
- An adult left your household (to the primary). Subject: An adult left your household / Un adulto salió de su hogar.
- A privacy request needs review (to the `privacy.requests` route). Subject: A privacy request needs review / Una solicitud de privacidad necesita revisión.


### Reviewer tier and registration review (added with `feat/review-queue`)

- EN: Other board members may see your contact details and household members to confirm your registration; they never see health information. (in "Who can see it")
  ES: Otros miembros de la junta pueden ver sus datos de contacto y a las personas de su hogar para confirmar su registro; nunca ven información de salud.
- EN: To review new registrations before sending invitations. (in "How we use it")
  ES: Para revisar los registros nuevos antes de enviar invitaciones.
- EN: Address suggestions while you type, if enabled. (Google row)
  ES: Sugerencias de direcciones mientras escribe, si está activado.
- EN: We'll review your registration and may call you. (registration emails and the confirmation screen)
  ES: Revisaremos tu registro y es posible que te llamemos.
- EN: HOEP is reviewing your registration and may call you. You can still use this page to see and update your information. Invitations to events start after the review. (family page)
  ES: HOEP está revisando su registro y es posible que le llamemos. Todavía puede usar esta página para ver y actualizar su información. Las invitaciones a eventos empiezan después de la revisión.
- EN: Events you can RSVP to / No events are open for your RSVP right now. / RSVP (family page)
  ES: Eventos a los que puede confirmar asistencia / Por ahora no hay eventos abiertos para su confirmación. / Confirmar asistencia
- EN: Enter the email you registered with. / Email me an RSVP link / If your household is registered and approved, we've emailed you an RSVP link. / No email? Call HOEP to RSVP at {phone}. / Not registered yet? Register first (event page; see `src/translation/eventRsvp.ts`)
  ES: Escribe el correo con el que te registraste. / Envíame un enlace para confirmar / Si tu hogar está registrado y aprobado, te enviamos un enlace para confirmar tu asistencia. / ¿Sin correo? Llama a HOEP para confirmar tu asistencia al {phone}. / ¿Aún no te has registrado? Regístrate primero
- Address form labels, errors and the "suggestions come from Google" line: `src/translation/address.ts` (EN and ES side by side).
- RSVP link email (subject "Your RSVP link" / "Su enlace para confirmar asistencia", body in `src/messages/RsvpAccessLinkEmail.tsx`, EN and ES in one file).
- Registration confirmation line in the email: "We'll review your registration and may call you." / "Revisaremos tu registro y es posible que te llamemos."

## RSVP requests, virtual attendance, contact preferences (feat/rsvp-requests)

EN is the source; every ES string below needs a native-speaker read. Plain, warm Latin American Spanish; "usted" in emails, "tú" in the modal and the event page (matches the existing RSVP page).

### Privacy Policy (src/content/legal/privacy.ts): NEW paragraphs and bullets (LEGAL_EFFECTIVE_DATE untouched; bump the policy version when you publish)

| EN | ES |
| --- | --- |
| **Virtual attendance.** {STATUS:recordings} Some events may offer a way to join online, with a Google Meet link and a YouTube link. We send those links only to households the board has confirmed for virtual attendance, in their invitation, confirmation and reminder emails. They are never shown on the public event page. If you ask to attend an event you weren’t invited to, the board reviews your request and decides whether you attend in person or online. | **Participación en línea.** {STATUS:recordings} Algunos eventos podrían ofrecer una forma de participar en línea, con un enlace de Google Meet y un enlace de YouTube. Enviamos esos enlaces solo a los hogares que la junta confirmó para participar en línea, en sus correos de invitación, confirmación y recordatorio. Nunca se muestran en la página pública del evento. Si pide asistir a un evento al que no fue invitado, la junta revisa su solicitud y decide si asistirá en persona o en línea. |
| **Contact preferences.** If you choose, you can name other confirmed adults in your household who also receive your invitation and confirmation emails (you always receive them), and you can tell us whether a phone number can receive text messages. We keep the answer so we can respect it if we start sending texts. {STATUS:sms} We don’t send texts yet. | **Preferencias de contacto.** Si usted lo decide, puede indicar a otros adultos confirmados de su hogar que también reciban sus correos de invitación y confirmación (usted siempre los recibe), y puede decirnos si un número de teléfono puede recibir mensajes de texto. Guardamos la respuesta para respetarla si empezamos a enviar mensajes de texto. {STATUS:sms} Todavía no enviamos mensajes de texto. |
| (How we use it) To review requests to attend an event, and to choose whether you attend in person or virtually. | Para revisar las solicitudes para asistir a un evento y elegir si asistirá en persona o en línea. |
| (How we use it) To send the Google Meet and YouTube links for a virtual event, only to households confirmed to attend virtually. {STATUS:recordings} | Para enviar los enlaces de Google Meet y YouTube de un evento en línea, solo a los hogares confirmados para participar en línea. {STATUS:recordings} |

The virtual sentences are bound to the `recordings` toggle: they show "Not yet available" until it is on, and the event form will not turn virtual on while it is off.

### The RSVP modal (src/translation/rsvpModal.ts) and the RSVP page additions (src/translation/rsvpPage.ts)

See those files: every key has EN and ES side by side. Please read especially: `registerTitle`/`emailTitle`/`phoneTitle` (the three choices), `requestNote`, `reviewNote`, `doneRequest`, `requestWaitlisted`, `alreadyVirtual`, `byInvitation`, `blocked`.

### Registration (src/translation/registerInfoPage.ts): `eventNote`, `phoneMode`, `phoneModeNote`, `successCall`, `successEvent`, `canText*`

### Family page contact preferences (src/lib/portal/contact-text.ts)

### Emails (src/messages/RsvpRequestEmail.tsx, EN and ES in the same file; src/messages/EventInvitation.tsx virtual block)

| Email | Gist | Check |
| --- | --- | --- |
| Request received | "We got your request. We'll confirm soon, and we'll write to you again either way." | warm, no promise of a yes |
| Waitlisted | "All in-person spots are taken for now. If a spot opens, or another way to join is possible, we'll write to you." | does not mention virtual by name (virtual may be off) |
| Declined | "We're sorry we aren't able to say yes this time… you're always welcome to call us." | kind and general. **Never** gives a reason or a reason code |
| Confirmed virtual / virtual reminder | Meet link, YouTube link, date and time, how to join | links appear in these emails and virtual invitations only |


## Email-code sign-in (fix/email-code-signin)

EN is the source. Needs a native-speaker read. `LEGAL_EFFECTIVE_DATE` untouched.

### Privacy Policy (src/content/legal/privacy.ts): CHANGED

- EN: **When you sign in to your family page.** {STATUS:family_portal} You sign in with Google, Apple, Facebook, or a one-time code we email to you. The service (or the code email) gives us your email address, and we use it to find your household. …
  ES: **Cuando inicia sesión en su página familiar.** {STATUS:family_portal} Usted inicia sesión con Google, Apple, Facebook, o con un código de un solo uso que le enviamos por correo. El servicio (o el correo con el código) nos da su dirección de correo, y la usamos para encontrar su hogar. …
- EN: Auth0 | Board sign-in and family sign-in with Google, Apple, Facebook, or a one-time code emailed to you. {STATUS:family_portal}
  ES: Auth0 | Inicio de sesión de la junta y de las familias con Google, Apple, Facebook o un código de un solo uso enviado por correo. {STATUS:family_portal}
- EN: Linked sign-ins {STATUS:family_portal} | Which Google, Apple, Facebook or emailed-code sign-in is linked to your household: while your household record exists
  ES: Inicios de sesión vinculados {STATUS:family_portal} | Qué inicio de sesión de Google, Apple, Facebook o con código por correo está vinculado a su hogar: mientras exista el registro de su hogar

### Feature toggle label (src/lib/features/registry.ts, `family_portal`)

- EN: Family page (sign in with Google, Apple, Facebook or an emailed code)
  ES: Página familiar (inicio de sesión con Google, Apple, Facebook o un código por correo)

### Sign-in help text

- Login button tooltip (`UserMenu.tsx`). EN: Log in with Google, Apple or Facebook, or get a code by email. ES: Inicie sesión con Google, Apple o Facebook, o reciba un código por correo.
- RSVP modal hint (`rsvpModal.ts`, `eventRsvp.ts`). EN: … You can sign in with Google, Apple or Facebook, or get a code by email. ES: … Puedes iniciar sesión con Google, Apple o Facebook, o recibir un código por correo.
- "We couldn't find your household" (`no-household/page.tsx`). EN: … or by asking for a code at a different address. A code sent to the email you registered with always works. ES: … o pidió un código a otra dirección. Un código enviado al correo con el que se registró siempre funciona.

## Conferences on the Resources page (feat/conferences)

EN is the source. Needs a native-speaker read. Written in usted, like the rest of the Resources page.

### Conference cards (`src/translation/conferences.ts`)

| Key | EN | ES |
| --- | --- | --- |
| hostedBy | Hosted by {organizer}. Registration is on their website. | Organizado por {organizer}. La inscripción se hace en su sitio web. |
| website | Conference website | Sitio web de la conferencia |
| register | Register on their website | Inscribirse en su sitio web |
| newTab | (opens in a new tab) | (se abre en una pestaña nueva) |
| registrationOpens | Registration opens {date} | La inscripción abre el {date} |
| registrationCloses | Registration closes {date} | La inscripción cierra el {date} |
| registrationClosed | Registration is closed | La inscripción está cerrada |
| mode.inPerson | In person | Presencial |
| mode.virtual | Online | En línea |
| mode.hybrid | In person and online | Presencial y en línea |
| travelTitle | HOEP travel assistance available | Ayuda de HOEP para viajes disponible |
| travelDeadline | Last day to ask: {date} | Último día para solicitarla: {date} |
| travelLink | Ask about travel assistance | Preguntar sobre la ayuda para viajes |
