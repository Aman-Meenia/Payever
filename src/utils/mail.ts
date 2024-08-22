import nodemailer from "nodemailer";

export const sendEmailToUser = async (email: string, username: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    // Send Email
    const mailOptions = {
      from: "amanmeneia09876@gmail.com",
      to: email,
      subject: "",
      html: `
        <p>
Your account created successfully with username ${username}; 
        </p>
    `,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log("Error while sending email to user ");
    console.log(err);
    return false;
  }
};
