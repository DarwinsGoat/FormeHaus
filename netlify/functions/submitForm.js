const nodemailer = require('nodemailer');
const multipart = require('parse-multipart-data');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    const boundary = multipart.getBoundary(event.headers['content-type']);
    const parts = multipart.parse(Buffer.from(event.body, 'base64'), boundary);
    
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
    
    const transporter = nodemailer.createTransporter({
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
        <h2>✓ Quote Request Received!</h2>
        <p>Hi ${formData.name},</p>
        <p>Thank you for your inquiry. We've received your project details and 3D file, and we'll review them carefully.</p>
        <p>You can expect a detailed quote within 1-2 business days, including pricing, timeline, and material recommendations.</p>

        <h3>Your Submission Summary:</h3>
        <p><strong>Project Description:</strong> ${formData.description}</p>
        <p><strong>Preferred Scale/Size:</strong> ${formData.scale || 'Not specified'}</p>
        <p><strong>Material:</strong> ${formData.material}</p>
        <p><strong>Surface Finishing:</strong> ${formData.finishing}</p>
        <p><strong>Timeline:</strong> ${formData.timeline || 'Not specified'}</p>
        ${formData.notes ? `<p><strong>Additional Notes:</strong> ${formData.notes}</p>` : ''}
        <p><strong>3D File:</strong> ${fileData ? fileData.filename : 'No file attached'}</p>

        <br>
        <p>If you have any questions in the meantime, feel free to reply to this email.</p>
        <p>Best regards,<br><strong>Kobi Walsh</strong><br>FormeHaus</p>
      `
    };
    
    await transporter.sendMail(emailToOwner);
    await transporter.sendMail(emailToCustomer);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Quote request submitted successfully' })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal server error' })
    };
  }
};
