import { Resend } from "resend";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
  }
  return _resend;
}

export const EMAIL_CONFIG = {
  from: "AgentFlow <hello@agent-flow.app>",
  appName: "AgentFlow",
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
};

interface LeadForDigest {
  full_name: string;
  next_action: string | null;
  next_action_date: string | null;
}

export async function sendDailyDigest(
  to: string,
  userName: string,
  leads: LeadForDigest[]
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const resend = getResendClient();

  const leadList = leads
    .map(
      (l) =>
        `<li><strong>${escapeHtml(l.full_name)}</strong>${l.next_action ? `: ${escapeHtml(l.next_action)}` : ""}${l.next_action_date ? ` (due ${new Date(l.next_action_date).toLocaleDateString()})` : ""}</li>`
    )
    .join("");

  const html = `
    <h2>Good morning, ${userName}!</h2>
    <p>You have ${leads.length} lead${leads.length === 1 ? "" : "s"} to follow up with today:</p>
    <ul>${leadList}</ul>
    <p>
      <a href="${EMAIL_CONFIG.appUrl}/follow-ups" style="display:inline-block;background-color:#0F766E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">
        View Follow-ups
      </a>
    </p>
    <p style="color:#94A3B8;font-size:12px;margin-top:24px;">
      — ${EMAIL_CONFIG.appName}: The CRM for agents who hate CRMs
    </p>
  `;

  try {
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `${leads.length} follow-up${leads.length === 1 ? "" : "s"} due today`,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function sendMagicLinkEmail(
  to: string,
  userName: string,
  magicLinkUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const resend = getResendClient();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;">

            <!-- Header -->
            <tr><td style="background-color:#0F766E;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:600;letter-spacing:-0.02em;">AgentFlow</h1>
            </td></tr>

            <!-- Body -->
            <tr><td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#0F172A;font-size:20px;font-weight:600;">Sign in to AgentFlow</h2>
              <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.6;">
                Hi ${escapeHtml(userName)}, click the button below to sign in to your account. This link expires in 10 minutes.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background-color:#F97316;border-radius:8px;">
                    <a href="${magicLinkUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.01em;">
                      Sign in to AgentFlow
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 0;color:#94A3B8;font-size:13px;line-height:1.5;">
                If you didn&apos;t request this email, you can safely ignore it. Only someone with access to your email can sign in.
              </p>
            </td></tr>

            <!-- Footer -->
            <tr><td style="background-color:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.5;text-align:center;">
                AgentFlow &mdash; The CRM for agents who hate CRMs<br>
                <a href="${EMAIL_CONFIG.appUrl}" style="color:#0F766E;text-decoration:none;">agent-flow.app</a>
              </p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: "Sign in to AgentFlow",
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const resend = getResendClient();

  const html = `
    <h2>Welcome to ${EMAIL_CONFIG.appName}, ${escapeHtml(userName)}!</h2>
    <p>You're all set to start managing your leads like a pro.</p>
    <p>Here's what you can do:</p>
    <ul>
      <li>Add your first lead</li>
      <li>Set up your pipeline stages</li>
      <li>Schedule follow-ups</li>
    </ul>
    <p>
      <a href="${EMAIL_CONFIG.appUrl}/dashboard" style="display:inline-block;background-color:#0F766E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">
        Go to Dashboard
      </a>
    </p>
    <p style="color:#94A3B8;font-size:12px;margin-top:24px;">
      — ${EMAIL_CONFIG.appName}: The CRM for agents who hate CRMs
    </p>
  `;

  try {
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `Welcome to ${EMAIL_CONFIG.appName}!`,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export { getResendClient as resend };
