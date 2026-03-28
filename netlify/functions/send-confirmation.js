export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await request.json()
  const record = body.record

  if (!record) {
    return new Response('No record found', { status: 400 })
  }

  const emailHtml = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #1a2b22;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 0.06em; color: #1e3a2f; text-transform: uppercase; margin: 0;">Tierra Wellness</h1>
        <p style="font-size: 12px; color: #9aab9f; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 6px;">Booking Confirmation</p>
      </div>

      <div style="border-top: 1px solid #e0dbd0; border-bottom: 1px solid #e0dbd0; padding: 24px 0; margin-bottom: 28px;">
        <p style="font-size: 15px; color: #1a2b22; margin: 0 0 6px;">Dear ${record.first_name},</p>
        <p style="font-size: 14px; color: #5a6b62; line-height: 1.7; margin: 0;">Your booking is confirmed. We look forward to welcoming you.</p>
      </div>

      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #f0ece3;">
          <td style="padding: 10px 0; color: #9aab9f; width: 40%;">Session</td>
          <td style="padding: 10px 0; color: #1a2b22; font-weight: 500;">${record.session_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0ece3;">
          <td style="padding: 10px 0; color: #9aab9f;">Date</td>
          <td style="padding: 10px 0; color: #1a2b22; font-weight: 500;">${record.date}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0ece3;">
          <td style="padding: 10px 0; color: #9aab9f;">Time</td>
          <td style="padding: 10px 0; color: #1a2b22; font-weight: 500;">${record.time}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9aab9f;">Name</td>
          <td style="padding: 10px 0; color: #1a2b22; font-weight: 500;">${record.first_name} ${record.last_name}</td>
        </tr>
      </table>

      <div style="margin-top: 32px; padding: 20px; background: #f5f0e8; border-radius: 8px;">
        <p style="font-size: 13px; color: #5a6b62; line-height: 1.7; margin: 0;">If you need to cancel or reschedule, please contact us as soon as possible. We recommend arriving 10 minutes before your session.</p>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="font-size: 12px; color: #9aab9f; letter-spacing: 0.08em; text-transform: uppercase;">Tierra Wellness</p>
      </div>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tierra Wellness <bookings@playground.damioncaldicott.co.za>',
      to: record.email,
      subject: `Booking confirmed — ${record.date} at ${record.time}`,
      html: emailHtml,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Resend error:', error)
    return new Response('Email failed', { status: 500 })
  }

  return new Response('Email sent', { status: 200 })
}


