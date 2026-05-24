import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://roommatepeace.app'
const FROM =
  process.env.RESEND_FROM_EMAIL
    ? `Roommate Peace <${process.env.RESEND_FROM_EMAIL}>`
    : 'Roommate Peace <onboarding@resend.dev>'

export interface ReminderItem {
  type: 'chore' | 'bill'
  title: string
  dueLabel: string
  amountCents?: number
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function buildEmailHtml(name: string | null, items: ReminderItem[]): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const chores = items.filter((i) => i.type === 'chore')
  const bills = items.filter((i) => i.type === 'bill')

  const choreRows = chores
    .map(
      (c) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4;">
          <span style="color: #1c1917; font-size: 15px;">${c.title}</span>
          <span style="color: #78716c; font-size: 13px; margin-left: 8px;">due ${c.dueLabel}</span>
        </td>
      </tr>`
    )
    .join('')

  const billRows = bills
    .map(
      (b) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4;">
          <span style="color: #1c1917; font-size: 15px;">${b.title}</span>
          ${b.amountCents ? `<span style="color: #78716c; font-size: 13px; margin-left: 8px;">${formatCents(b.amountCents)} due ${b.dueLabel}</span>` : `<span style="color: #78716c; font-size: 13px; margin-left: 8px;">due ${b.dueLabel}</span>`}
        </td>
      </tr>`
    )
    .join('')

  const choreSection =
    chores.length > 0
      ? `
      <h3 style="color: #44403c; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 4px;">Chores</h3>
      <table width="100%" cellpadding="0" cellspacing="0">${choreRows}</table>`
      : ''

  const billSection =
    bills.length > 0
      ? `
      <h3 style="color: #44403c; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 4px;">Bills</h3>
      <table width="100%" cellpadding="0" cellspacing="0">${billRows}</table>`
      : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <!-- Header -->
          <tr>
            <td style="background-color: #10b981; border-radius: 12px 12px 0 0; padding: 24px 32px;">
              <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">Roommate Peace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e7e5e4; border-top: none;">
              <p style="margin: 0 0 8px; color: #1c1917; font-size: 16px; font-weight: 600;">${greeting}</p>
              <p style="margin: 0 0 4px; color: #78716c; font-size: 15px; line-height: 1.5;">
                Here's a quick heads-up on what's coming up for you — no pressure, just keeping everyone on the same page.
              </p>

              ${choreSection}
              ${billSection}

              <!-- CTA -->
              <div style="margin-top: 32px; text-align: center;">
                <a href="${APP_URL}/dashboard"
                   style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
                  Open Roommate Peace
                </a>
              </div>

              <!-- Footer -->
              <p style="margin: 32px 0 0; color: #a8a29e; font-size: 12px; text-align: center; line-height: 1.6;">
                You're receiving this because you're a member of a Roommate Peace household.<br>
                Reminders are sent once a day when items are due today or tomorrow.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendReminderEmail(
  to: string,
  name: string | null,
  items: ReminderItem[]
): Promise<void> {
  const dueToday = items.some((i) => i.dueLabel === 'today')
  const subject = dueToday
    ? 'You have items due today'
    : "Heads up — items due tomorrow"

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: buildEmailHtml(name, items),
  })
}
