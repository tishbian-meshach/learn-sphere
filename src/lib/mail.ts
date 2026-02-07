import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInviteEmail = async (to: string, courseTitle: string, courseUrl: string, instructorName: string) => {
  const mailOptions = {
    from: `"LearnSphere" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Invitation to join: ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Course Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited to join the course <strong>"${courseTitle}"</strong> on LearnSphere.</p>
        <p>To access the course and start learning, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${courseUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Course Now</a>
        </div>
        <p>Best regards,<br><strong>${instructorName}</strong><br>LeanSphere Team</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
        <p style="font-size: 11px; color: #64748b; text-align: center;">If the button doesn't work, copy and paste this link into your browser: ${courseUrl}</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
