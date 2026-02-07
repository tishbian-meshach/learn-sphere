import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const APP_NAME = "LearnSphere";
const PRIMARY_COLOR = "#4f46e5";

export const sendInviteEmail = async (to: string, courseTitle: string, courseUrl: string, instructorName: string) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Invitation to join: ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${PRIMARY_COLOR}; border-bottom: 2px solid ${PRIMARY_COLOR}; padding-bottom: 10px;">Course Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited to join the course <strong>"${courseTitle}"</strong> on ${APP_NAME}.</p>
        <p>To access the course and start learning, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${courseUrl}" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Course Now</a>
        </div>
        <p>Best regards,<br><strong>${instructorName}</strong><br>${APP_NAME} Team</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
        <p style="font-size: 11px; color: #64748b; text-align: center;">If the button doesn't work, copy and paste this link into your browser: ${courseUrl}</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendProvisionWelcomeEmail = async (to: string, name: string, password: string) => {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`;
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Welcome to ${APP_NAME} - Your Account is Ready`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${PRIMARY_COLOR}; padding-bottom: 10px;">Welcome to the Platform, ${name}!</h2>
        <p>An account has been created for you on <strong>${APP_NAME}</strong>. You can now log in and start your learning journey.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">Your Credentials</p>
          <p style="margin: 10px 0 5px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: ${PRIMARY_COLOR};">${password}</code></p>
        </div>

        <p>Please change your password after your first login for security reasons.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
        </div>

        <p>Best regards,<br><strong>System Administrator</strong><br>${APP_NAME} Infrastructure</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendEnrollmentEmail = async (to: string, userName: string, courseTitle: string, courseUrl: string) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Enrollment Confirmed: ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981; padding-bottom: 10px;">Enrollment Successful!</h2>
        <p>Hello ${userName},</p>
        <p>You have successfully enrolled in <strong>"${courseTitle}"</strong>. You can now access all the course materials and join the community.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${courseUrl}" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Jump into the Course</a>
        </div>

        <p>Keep learning and growing!</p>
        <p>Best regards,<br>${APP_NAME} Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendCourseCompletionEmail = async (to: string, userName: string, courseTitle: string) => {
  const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/learner/courses`;
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Congratulations! You've Completed ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: linear-gradient(to bottom, #ffffff, #f0fdf4);">
        <h2 style="color: #10b981; text-align: center;">🎓 Achievement Unlocked!</h2>
        <p>Congratulations ${userName},</p>
        <p>You've officially completed <strong>"${courseTitle}"</strong>! This is a significant milestone in your professional development.</p>
        
        <div style="background: white; border: 2px dashed #10b981; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
          <p style="font-size: 18px; font-weight: bold; color: #064e3b; margin: 0;">Completion Certified</p>
          <p style="color: #059669; font-size: 14px;">Your certificate is now available in your dashboard.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download My Certificate</a>
        </div>

        <p>What's next? Check out more courses or share your achievement with your network!</p>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendPaymentSuccessEmail = async (to: string, userName: string, courseTitle: string, amount: number, transactionId: string) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Receipt for your purchase: ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${PRIMARY_COLOR}; padding-bottom: 10px;">Payment Successful</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for your purchase. We've received your payment for <strong>"${courseTitle}"</strong>.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding-bottom: 10px;">Transaction ID:</td>
              <td style="text-align: right; font-weight: bold; padding-bottom: 10px;">${transactionId}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Amount Paid:</td>
              <td style="text-align: right; font-weight: bold; font-size: 18px; color: ${PRIMARY_COLOR};">₹${(amount / 100).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p>You can access your course immediately through your learner dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/learner/courses" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
        </div>

        <p>Best regards,<br>Finance Team @ ${APP_NAME}</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
