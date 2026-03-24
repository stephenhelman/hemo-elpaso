import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { encryptToken, decryptToken } from "./gmail-crypto";
import { prisma } from "./db";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

function createOAuthClient(): OAuth2Client {
  const redirectUri =
    process.env.GOOGLE_GMAIL_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_GMAIL_CLIENT_ID,
    process.env.GOOGLE_GMAIL_CLIENT_SECRET,
    redirectUri,
  );
}

/**
 * Generate the Gmail OAuth consent URL.
 * State encodes { boardRoleId, patientId } as a JSON string.
 */
export function getGmailAuthUrl(boardRoleId: string, patientId: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // always request refresh token
    state: JSON.stringify({ boardRoleId, patientId }),
  });
}

/**
 * Get an authenticated OAuth2Client for a BoardRole.
 * Decrypts stored tokens, refreshes if expired, and saves refreshed token back to DB.
 * Returns null if the role has no tokens stored.
 */
export async function getOAuthClientForRole(
  boardRoleId: string,
): Promise<OAuth2Client | null> {
  const role = await prisma.boardRole.findUnique({
    where: { id: boardRoleId },
    select: {
      gmailAccessToken: true,
      gmailRefreshToken: true,
      gmailTokenExpiry: true,
    },
  });

  if (!role?.gmailRefreshToken) return null;

  const client = createOAuthClient();

  client.setCredentials({
    access_token: role.gmailAccessToken
      ? decryptToken(role.gmailAccessToken)
      : undefined,
    refresh_token: decryptToken(role.gmailRefreshToken),
    expiry_date: role.gmailTokenExpiry
      ? role.gmailTokenExpiry.getTime()
      : undefined,
  });

  // Listen for token refreshes and persist them
  client.on("tokens", async (tokens) => {
    const updateData: Record<string, unknown> = {};
    if (tokens.access_token) {
      updateData.gmailAccessToken = encryptToken(tokens.access_token);
    }
    if (tokens.expiry_date) {
      updateData.gmailTokenExpiry = new Date(tokens.expiry_date);
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.boardRole.update({
        where: { id: boardRoleId },
        data: updateData,
      });
    }
  });

  // Proactively refresh if within 5 minutes of expiry
  const expiryMs = role.gmailTokenExpiry?.getTime() ?? 0;
  const fiveMinutes = 5 * 60 * 1000;
  if (expiryMs && Date.now() >= expiryMs - fiveMinutes) {
    try {
      await client.getAccessToken();
    } catch (err) {
      console.error("[gmail-oauth] Token refresh failed:", err);
      return null;
    }
  }

  return client;
}

/**
 * Exchange an authorization code for tokens and store them encrypted on the BoardRole.
 */
export async function exchangeCodeAndStore(
  code: string,
  boardRoleId: string,
  patientId: string,
): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token returned. Ensure prompt=consent was used.",
    );
  }

  await prisma.boardRole.update({
    where: { id: boardRoleId },
    data: {
      gmailAccessToken: tokens.access_token
        ? encryptToken(tokens.access_token)
        : null,
      gmailRefreshToken: encryptToken(tokens.refresh_token),
      gmailTokenExpiry: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
      gmailConnectedAt: new Date(),
      gmailConnectedBy: patientId,
      gmailSendAsConfigured: true,
    },
  });
}

/**
 * Send an email via the Gmail API on behalf of a BoardRole.
 * Returns the Gmail message ID.
 */
export async function sendViaGmail(params: {
  boardRoleId: string;
  to: string;
  subject: string;
  htmlBody: string;
  fromEmail: string; // role address, e.g. president@hemo-el-paso.org
  fromName?: string; // e.g. "HOEP President"
  replyTo: string; // board member's personal email
}): Promise<string> {
  const client = await getOAuthClientForRole(params.boardRoleId);
  if (!client) {
    throw new Error(
      `No valid Gmail credentials for boardRoleId ${params.boardRoleId}`,
    );
  }

  const gmail = google.gmail({ version: "v1", auth: client });

  const fromHeader = params.fromName
    ? `${params.fromName} <${params.fromEmail}>`
    : params.fromEmail;

  // Build RFC 2822 message
  const messageParts = [
    `From: ${fromHeader}`,
    `To: ${params.to}`,
    `Reply-To: ${params.replyTo}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    params.htmlBody,
  ];
  const rawMessage = messageParts.join("\r\n");

  // Base64url encode
  const encoded = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  const messageId = response.data.id;
  if (!messageId) {
    throw new Error("Gmail API returned no message ID");
  }

  return messageId;
}
