import nodemailer from 'nodemailer';
export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD, // Use App Password here if 2FA is enabled
      },
    });
  
    try {
      const info = await transporter.sendMail({
        from: `"Accessible Health Hub" <${process.env.EMAIL}>`,
        to,
        subject,
        html,
        attachments,
      });
  
      if (info.rejected.length > 0) {
        console.error("Email rejected:", info.rejected);
        return false;
      }
  
      console.log("Email sent to:", to);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  };
  