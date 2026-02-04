import { contactSchema } from '#shared/contact';
import { emailService } from '../features/email/email-service';

defineRouteMeta({
  openAPI: {
    tags: ['Public'],
    description: 'Submit contact form (public)',
  },
});

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  support: 'Support Request',
  feedback: 'Feedback',
  other: 'Other',
};

export default defineEventHandler(async (event) => {
  const body: unknown = await readBody(event);
  const data = contactSchema.parse(body);

  const subjectLabel = subjectLabels[data.subject] || data.subject;

  // Build email HTML
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${data.name} (${data.email})</p>
    <p><strong>Subject:</strong> ${subjectLabel}</p>
    <hr />
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, '<br />')}</p>
  `;

  const text = `
New Contact Form Submission

From: ${data.name} (${data.email})
Subject: ${subjectLabel}

Message:
${data.message}
  `.trim();

  // Send email to admin
  const adminEmail = process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!adminEmail) {
    // If no email configured, log and return success
    // eslint-disable-next-line no-console -- fallback when email not configured
    console.log('[Contact] No CONTACT_EMAIL configured, logging submission:', data);
    return { success: true };
  }

  await emailService.sendEmail({
    to: adminEmail,
    subject: `[Bistro Contact] ${subjectLabel} from ${data.name}`,
    html,
    text,
    replyTo: data.email,
  });

  return { success: true };
});
