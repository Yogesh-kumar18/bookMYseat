import { env } from "./config.js";

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailDeliveryResult = { ok: true; skipped?: boolean } | { ok: false; error: string };

function page(title: string, body: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f7f4e8;padding:24px;color:#17231c">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7e1cf;border-radius:12px;padding:28px">
        <h1 style="font-size:24px;margin:0 0 16px">${title}</h1>
        <div style="font-size:15px;line-height:1.6">${body}</div>
        <p style="margin-top:28px;font-size:12px;color:#6b665d">BookMySeat, Mathura</p>
      </div>
    </div>
  `;
}

async function deliver(message: EmailMessage): Promise<EmailDeliveryResult> {
  if (!env.RESEND_API_KEY) {
    const error = "RESEND_API_KEY is not configured; email was not sent.";
    if (env.NODE_ENV === "production") console.error(error, { to: message.to, subject: message.subject });
    else console.info("Email skipped in local development.", { to: message.to, subject: message.subject });
    return env.NODE_ENV === "production" ? { ok: false, error } : { ok: true, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, ...message })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, error: `Resend email failed with ${response.status}: ${detail}` };
  }
  console.info("Email sent successfully.", { to: message.to, subject: message.subject });
  return { ok: true };
}

export async function sendEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
  try {
    return await deliver(message);
  } catch (error) {
    console.error(error);
    return { ok: false, error: error instanceof Error ? error.message : "Email delivery failed." };
  }
}

export function sendWelcomeEmail(to: string, name: string) {
  const dashboardLink = `${env.CLIENT_URL.split(",")[0]?.replace(/\/+$/, "") || "https://bookmyseat.in"}/dashboard`;
  return sendEmail({
    to,
    subject: "Welcome to BookMySeat",
    text: `Welcome to BookMySeat, ${name}. Your account is ready. Open your dashboard: ${dashboardLink}. For support, contact ${env.SUPPORT_EMAIL}.`,
    html: page("Welcome to BookMySeat", `<p>Hi ${name},</p><p>Your account is ready. You can now discover libraries, manage memberships, join the student community, and track your study journey.</p><p><a href="${dashboardLink}" style="display:inline-block;background:#2f6b4f;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;font-weight:700">Open dashboard</a></p><p>Need help? Contact <a href="mailto:${env.SUPPORT_EMAIL}" style="color:#2f6b4f;font-weight:700">${env.SUPPORT_EMAIL}</a>.</p>`)
  });
}

export function sendPasswordResetEmail(to: string, name: string, resetLink: string) {
  return sendEmail({
    to,
    subject: "Reset your BookMySeat password",
    text: `Hi ${name}, reset your BookMySeat password here: ${resetLink}. This link expires in 15 minutes.`,
    html: page("Reset your password", `<p>Hi ${name},</p><p>Use this secure link to set a new password. It expires in 15 minutes.</p><p><a href="${resetLink}" style="display:inline-block;background:#2f6b4f;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;font-weight:700">Reset password</a></p>`)
  });
}

export function sendMembershipApprovedEmail(to: string, name: string, libraryName: string) {
  return sendEmail({
    to,
    subject: `Membership approved at ${libraryName}`,
    text: `Hi ${name}, your BookMySeat membership at ${libraryName} has been approved.`,
    html: page("Membership approved", `<p>Hi ${name},</p><p>Your membership at <strong>${libraryName}</strong> has been approved.</p>`)
  });
}

export function sendOwnerRegistrationEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "BookMySeat owner registration received",
    text: `Hi ${name}, your BookMySeat owner account is ready. Add or claim your library from the owner dashboard.`,
    html: page("Owner account ready", `<p>Hi ${name},</p><p>Your owner account is ready. Add or claim your library from the owner dashboard.</p><p>For launch help, contact ${env.SUPPORT_EMAIL}.</p>`)
  });
}
