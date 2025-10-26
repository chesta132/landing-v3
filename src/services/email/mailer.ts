import nodemailer from "nodemailer";
import { EmailLoginInfo, emailTemplate } from "./template";
import { capitalEach, ellipsis } from "@/lib/manipulate/string";
import { CLIENT_URL, EMAIL_AUTH_PASS, EMAIL_AUTH_USER } from "@/config";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: EMAIL_AUTH_USER,
    pass: EMAIL_AUTH_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const sendOTPEmail = async (email: string, otpCode: string, name: string, loginInfo?: EmailLoginInfo) => {
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
        loginInfo,
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

export const sendAuthConfirmationEmail = async (email: string, secret: string, name: string, loginInfo?: EmailLoginInfo) => {
  try {
    await transporter.sendMail({
      from: "Chardy Team",
      to: email,
      subject: "Chardy Login Confirmation",
      html: emailTemplate({
        mode: "verification",
        title: "Confirm Your Login",
        message: `Someone just logged into your Chardy account. Please confirm this was you by pressing button bellow.\n\nIf you did not attempt to login, please contact Chardy support immediately.`,
        name: capitalEach(name),
        button: {
          href: `${CLIENT_URL}/auth/confirm?secret=${secret}`,
          text: "Confirm Login",
        },
        loginInfo,
      }),
    });
  } catch (error) {
    console.error("Email error", error);
    throw error as Error;
  }
};

export abstract class Email {
  static async sendOTP(email: string, { otp, name, loginInfo }: { otp: string; name: string; loginInfo?: EmailLoginInfo }) {
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
          code: otp,
          loginInfo,
        }),
      });
    } catch (error) {
      console.error("Email error", error);
      throw error as Error;
    }
  }

  /**
   * @param credentials Default is "password"
   */
  static async sendCredentialChanges(email: string, { name, credentials = "password" }: { name: string; credentials?: string }) {
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
  }

  static async sendAuthConfirmation(
    email: string,
    {
      name,
      secret,
      loginInfo,
      type,
      expiry,
    }: { secret: string; name: string; loginInfo?: EmailLoginInfo; type: "SIGN_IN" | "SIGN_UP"; expiry?: string }
  ) {
    try {
      await transporter.sendMail({
        from: "Chardy Team",
        to: email,
        subject: type === "SIGN_IN" ? "Chardy Login Confirmation" : "Chardy Creates New Admin Account Confirmation",
        html: emailTemplate({
          mode: "verification",
          title: type === "SIGN_IN" ? "Confirm Your Login" : `Allow ${ellipsis(name, 20)} to create account`,
          message:
            type === "SIGN_IN"
              ? `Someone just logged into your Chardy account. Please confirm this was you by pressing button bellow.\n\nIf you did not attempt to login, please contact Chardy support immediately.`
              : `${name} wants create an admin account in Chardy app. Please press the button bellow if you allow ${name} to create their admin account.`,
          name: type === "SIGN_IN" ? capitalEach(name) : "Chesta Ardiona",
          button:
            type === "SIGN_IN"
              ? {
                  href: `${CLIENT_URL}/auth/confirm-sign-in?secret=${secret}`,
                  text: "Confirm Login",
                }
              : {
                  href: `${CLIENT_URL}/auth/allow-sign-up?secret=${secret}`,
                  text: "Allow to create account",
                },
          loginInfo,
          expiry,
        }),
      });
    } catch (error) {
      console.error("Email error", error);
      throw error as Error;
    }
  }

  static async sendInfo(
    email: string,
    { name, subject, message, title, additionalInfo }: { name: string; subject: string; message: string; title: string; additionalInfo?: string }
  ) {
    try {
      await transporter.sendMail({
        from: "Chardy Team",
        to: email,
        subject,
        html: emailTemplate({ mode: "information", message, title, name, additionalInfo }),
      });
    } catch (err) {
      console.error("Email error", err);
      throw err;
    }
  }
}

export default Email;
