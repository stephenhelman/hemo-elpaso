import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { FACEBOOK_LABEL, FACEBOOK_URL, SITE_PHONE, siteHost, siteUrl, withLang } from "@/lib/site";
import { ORG_NAME } from "@/lib/brand";

/**
 * Shared frame for every HOEP email: solid-white header with the horizontal lockup + tagline (a PNG on a
 * solid white background, so it survives dark-mode clients), a maroon accent rule, the content, and a footer
 * with the phone, website, Facebook group and (where the email has one) the unsubscribe link.
 * Brand colours: maroon #8B1538, outline ink #2A2426, drop pink #FACED2.
 */
export const EMAIL_COLORS = { maroon: "#8B1538", ink: "#2A2426", pink: "#FACED2", pageBg: "#F6F2F2" } as const;

// email-header.png is 1200x525; shown at 600 wide (the 2x image stays sharp on retina). Brand minimum: 400px.
const HEADER_W = 600;
const HEADER_H = 263;

export default function EmailLayout({
  preview,
  lang = "en",
  unsubscribeUrl,
  unsubscribeText,
  children,
}: {
  preview: string;
  lang?: "en" | "es";
  unsubscribeUrl?: string;
  unsubscribeText?: { prompt: string; link: string };
  children: ReactNode;
}) {
  const es = lang === "es";
  const base = siteUrl();
  return (
    <Html lang={lang}>
      <Head>
        {/* Ask clients not to recolour the message; the header image is on solid white regardless. */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: EMAIL_COLORS.pageBg, margin: 0, padding: "24px 0", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        <Container style={{ backgroundColor: "#ffffff", maxWidth: 600, width: "100%", margin: "0 auto" }}>
          {/* Header: solid white cell, lockup PNG */}
          <Section style={{ backgroundColor: "#ffffff", textAlign: "center" as const, padding: 0 }} bgcolor="#ffffff">
            <Img
              src={`${base}/brand/email-header.png`}
              alt={ORG_NAME}
              width={HEADER_W}
              height={HEADER_H}
              style={{ display: "block", margin: "0 auto", width: "100%", maxWidth: HEADER_W, height: "auto", backgroundColor: "#ffffff" }}
            />
          </Section>
          <Hr style={{ border: "none", borderTop: `4px solid ${EMAIL_COLORS.maroon}`, margin: 0 }} />

          {/* Content */}
          <Section style={{ padding: "32px 32px 24px", color: EMAIL_COLORS.ink, fontSize: 16, lineHeight: "24px" }}>{children}</Section>

          {/* Footer */}
          <Section style={{ padding: "0 32px" }}>
            <Hr style={{ border: "none", borderTop: `1px solid ${EMAIL_COLORS.pink}`, margin: 0 }} />
          </Section>
          <Section style={{ padding: "20px 32px 28px", textAlign: "center" as const }}>
            <Text style={foot}>
              <strong>{ORG_NAME}</strong>
            </Text>
            <Text style={foot}>
              <Link href={SITE_PHONE.tel} style={link}>{SITE_PHONE.display}</Link>
              {" · "}
              <Link href={base} style={link}>{siteHost() || base}</Link>
              {" · "}
              <Link href={FACEBOOK_URL} style={link}>{FACEBOOK_LABEL[es ? "es" : "en"]}</Link>
            </Text>
            <Text style={{ ...foot, fontSize: 12 }}>
              <Link href={withLang(`${base}/privacy`, es ? "es" : "en")} style={link}>
                {es ? "Política de Privacidad" : "Privacy Policy"}
              </Link>
            </Text>
            {unsubscribeUrl && unsubscribeText && (
              <Text style={{ ...foot, fontSize: 12, marginTop: 8 }}>
                {unsubscribeText.prompt}{" "}
                <Link href={unsubscribeUrl} style={link}>{unsubscribeText.link}</Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const foot = { margin: "0 0 4px", fontSize: 13, lineHeight: "20px", color: EMAIL_COLORS.ink } as const;
const link = { color: EMAIL_COLORS.maroon, textDecoration: "underline" } as const;

/** Standard heading/button styles for templates that do not bring their own. */
export const emailH1 = { color: EMAIL_COLORS.maroon, fontSize: 24, lineHeight: "30px", margin: "0 0 16px" } as const;
export const emailButton = {
  backgroundColor: EMAIL_COLORS.maroon,
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: 24,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
} as const;
