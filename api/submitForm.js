const nodemailer = require('nodemailer');
const multipart = require('parse-multipart-data');
const crypto = require('crypto');
const bizSdk = require('facebook-nodejs-business-sdk');

const ServerEvent = bizSdk.ServerEvent;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const CustomData = bizSdk.CustomData;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get raw body buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse multipart form data
    const boundary = multipart.getBoundary(req.headers['content-type']);
    const parts = multipart.parse(buffer, boundary);

    const formData = {};
    let fileData = null;

    parts.forEach(part => {
      if (part.filename) {
        fileData = {
          filename: part.filename,
          data: part.data,
          type: part.type
        };
      } else {
        formData[part.name] = part.data.toString();
      }
    });

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const emailToOwner = {
      from: process.env.SMTP_USER,
      to: process.env.OWNER_EMAIL,
      subject: `New Quote Request from ${formData.name}`,
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
        <p><strong>Project Description:</strong> ${formData.description}</p>
        <p><strong>Preferred Scale/Size:</strong> ${formData.scale || 'Not specified'}</p>
        <p><strong>Material:</strong> ${formData.material}</p>
        <p><strong>Finishing:</strong> ${formData.finishing}</p>
        <p><strong>Timeline/Deadline:</strong> ${formData.timeline || 'Not specified'}</p>
        <p><strong>Additional Notes:</strong> ${formData.notes || 'None'}</p>
        <p><strong>3D File:</strong> ${fileData ? fileData.filename : 'No file attached'}</p>
      `,
      attachments: fileData ? [{
        filename: fileData.filename,
        content: fileData.data
      }] : []
    };

    const emailToCustomer = {
      from: process.env.SMTP_USER,
      to: formData.email,
      subject: 'Quote Request Received - FormeHaus',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color:#FAF7F2; color:#2B2B2B;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2; padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td style="background:#D98B4C; padding:32px 40px; text-align:center;">
                      <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:600; letter-spacing:-0.5px;">Quote Request Received</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 20px 0; font-size:17px; line-height:1.6; color:#2B2B2B;">Hi <strong>${formData.name}</strong>,</p>

                      <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#4a4a4a;">Thank you for your inquiry. We've received your project details and 3D file, and we'll review them carefully.</p>

                      <div style="background:#f8f6f3; border-left:4px solid #D98B4C; padding:20px; margin:24px 0; border-radius:4px;">
                        <p style="margin:0 0 8px 0; font-size:15px; font-weight:600; color:#2B2B2B;">What's Next?</p>
                        <p style="margin:0; font-size:15px; line-height:1.6; color:#4a4a4a;">You can expect a detailed quote within <strong>1-2 business days</strong>, including pricing, timeline, and material recommendations.</p>
                      </div>

                      <!-- Summary Section -->
                      <h2 style="margin:32px 0 16px 0; font-size:20px; font-weight:600; color:#2B2B2B; border-bottom:2px solid #D98B4C; padding-bottom:8px;">Your Submission Summary</h2>

                      <table width="100%" cellpadding="8" cellspacing="0" style="font-size:15px; line-height:1.6;">
                        <tr>
                          <td style="padding:8px 0; color:#666; vertical-align:top; width:180px;"><strong>Project Description:</strong></td>
                          <td style="padding:8px 0; color:#2B2B2B;">${formData.description}</td>
                        </tr>
                        ${formData.scale ? `
                        <tr>
                          <td style="padding:8px 0; color:#666; vertical-align:top;"><strong>Preferred Scale/Size:</strong></td>
                          <td style="padding:8px 0; color:#2B2B2B;">${formData.scale}</td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding:8px 0; color:#666; vertical-align:top;"><strong>Material:</strong></td>
                          <td style="padding:8px 0; color:#2B2B2B;">${formData.material}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; color:#666; vertical-align:top;"><strong>Surface Finishing:</strong></td>
                          <td style="padding:8px 0; color:#2B2B2B;">${formData.finishing}</td>
                        </tr>
                        ${formData.timeline ? `
                        <tr>
                          <td style="padding:8px 0; color:#666; vertical-align:top;"><strong>Timeline:</strong></td>
                          <td style="padding:8px 0; color:#2B2B2B;">${formData.timeline}</td>
                        </tr>
                        ` : ''}
                        ${formData.notes ? `
                        <tr>
                          <td style="padding:8px 0; color:#666; vertical-align:top;"><strong>Additional Notes:</strong></td>
                          <td style="padding:8px 0; color:#2B2B2B;">${formData.notes}</td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding:8px 0; color:#666; vertical-align:top;"><strong>3D File:</strong></td>
                          <td style="padding:8px 0; color:#2B2B2B;">${fileData ? fileData.filename : 'No file attached'}</td>
                        </tr>
                      </table>

                      <p style="margin:32px 0 0 0; font-size:15px; line-height:1.6; color:#4a4a4a;">If you have any questions in the meantime, feel free to reply to this email.</p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8f6f3; padding:32px 40px; border-top:1px solid #e0ddd8;">
                      <p style="margin:0 0 4px 0; font-size:15px; font-weight:600; color:#2B2B2B;">Best regards,</p>
                      <p style="margin:0 0 2px 0; font-size:15px; font-weight:600; color:#D98B4C;">Kobi Walsh</p>
                      <p style="margin:0; font-size:14px; color:#666;">FormeHaus</p>
                    </td>
                  </tr>

                </table>

                <!-- Footer Text -->
                <p style="margin:24px 0 0 0; font-size:13px; color:#999; text-align:center;">© 2025 FormeHaus. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(emailToOwner);
    await transporter.sendMail(emailToCustomer);

    // Send Meta Conversions API event
    try {
      const accessToken = process.env.META_ACCESS_TOKEN;
      const pixelId = process.env.META_PIXEL_ID;

      if (accessToken && pixelId) {
        // Hash user data for privacy
        const hashData = (data) => {
          if (!data) return null;
          return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
        };

        // Get client IP and user agent
        const clientIpAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                                req.headers['x-real-ip'] ||
                                req.socket.remoteAddress;
        const clientUserAgent = req.headers['user-agent'];

        // Create user data
        const userData = new UserData()
          .setEmails([hashData(formData.email)])
          .setPhones(formData.phone ? [hashData(formData.phone)] : [])
          .setClientIpAddress(clientIpAddress)
          .setClientUserAgent(clientUserAgent)
          .setFbc(formData.fbc || null)  // Facebook click ID from cookie
          .setFbp(formData.fbp || null); // Facebook browser ID from cookie

        // Split name into first and last
        const nameParts = formData.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        if (firstName) userData.setFirstNames([hashData(firstName)]);
        if (lastName) userData.setLastNames([hashData(lastName)]);

        // Create custom data
        const customData = new CustomData()
          .setContentName('Quote Request')
          .setContentCategory('3D Printing')
          .setValue(0)  // You can set estimated value here
          .setCurrency('USD');

        // Create server event
        const serverEvent = new ServerEvent()
          .setEventName('Lead')
          .setEventTime(Math.floor(Date.now() / 1000))
          .setUserData(userData)
          .setCustomData(customData)
          .setEventSourceUrl(req.headers.referer || req.headers.origin || 'https://formehaus.com')
          .setActionSource('website');

        // Add event_id for deduplication if provided
        if (formData.event_id) {
          serverEvent.setEventId(formData.event_id);
        }

        // Send to Meta
        const eventRequest = new EventRequest(accessToken, pixelId)
          .setEvents([serverEvent]);

        await eventRequest.execute();
        console.log('Meta CAPI event sent successfully');
      }
    } catch (capiError) {
      // Don't fail the request if CAPI fails, just log it
      console.error('Meta CAPI Error:', capiError.message);
    }

    return res.status(200).json({ success: true, message: 'Quote request submitted successfully' });

  } catch (error) {
    console.error('Detailed Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
