import nodemailer from "nodemailer";
import { emailTemplate } from "./template";
import { capitalEach } from "@/lib/manipulate/string";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_AUTH_USER,
    pass: process.env.EMAIL_AUTH_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const sendOTPEmail = async (email: string, otpCode: string, name: string) => {
  try {
    await transporter.sendMail({
      from: "Chardy Team",
      to: email,
      subject: "Chardy One-Time Password (OTP)",
      html: emailTemplate({
        mode: "verification",
        title: "Your One-Time Password (OTP)",
        message: `You have requested a One-Time Password (OTP) to complete your action on Chardy. Please use the following code to proceed.\n\nFor your security, please do not share this OTP with anyone, including Chardy employees.`,
        name: capitalEach(name),
        code: otpCode,
      }),
    });
  } catch (error) {
    console.error("Email error", error);
    throw error as Error;
  }
};

/**
 * @param credentials Default is "password"
 */
export const sendCredentialChanges = async (email: string, name: string, credentials = "password") => {
  try {
    await transporter.sendMail({
      from: "Chardy Team",
      to: email,
      subject: `Chardy ${capitalEach(credentials)} Has Been Changed`,
      html: emailTemplate({
        mode: "information",
        title: `${capitalEach(credentials)} Change`,
        name: capitalEach(name),
        message: `Your Chardy account ${credentials.toLowerCase()} has been successfully updated. If you did not make this change, please contact Chardy support immediately.\n\nFor your security, please do not share your login credentials with anyone, including Chardy employees.`,
      }),
    });
  } catch (error) {
    console.error("Email error", error);
    throw error as Error;
  }
};
