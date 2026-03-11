import { Env } from '../index';

export function generateOTP(): string {
  // Generate 6 digit numeric code
  const code = Math.floor(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000);
  return code.toString();
}

export async function sendEmail(env: Env, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
    console.log('No RESEND_API_KEY set. In dev mode, skipping email send.');
    console.log(`To: ${to}, Subj: ${subject}\n\n${html}`);
    return;
  }

  const from = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'; // fallback for testing

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to send email via Resend', err);
    throw new Error('Email sending failed');
  }
}
