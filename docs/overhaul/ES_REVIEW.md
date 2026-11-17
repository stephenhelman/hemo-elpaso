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
