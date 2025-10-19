interface EmailButton {
  text: string;
  href: string;
}

interface EmailLoginInfo {
  device?: string;
  location?: string;
  time?: string;
  ip?: string;
}

interface EmailTemplateProps {
  mode: "verification" | "someone-login" | "information" | "confirmation";
  brandName?: string;
  name?: string;
  title: string;
  message: string;
  button?: EmailButton;
  code?: string;
  codeExpiry?: string;
  additionalInfo?: string;
  footerText?: string;
  loginInfo?: EmailLoginInfo;
}

function emailTemplate({
  mode,
  brandName = "Chardy",
  name,
  title,
  message,
  button,
  code,
  codeExpiry = "10 minutes",
  additionalInfo,
  footerText = `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
  loginInfo,
}: EmailTemplateProps): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";

  // Generate verification code section
  const codeSection = code
    ? `
    <div class="verification-code">
      <div class="code">${code}</div>
    </div>
    <p style="font-size: 15px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px;">
      Enter this code on the verification page${button ? ", or click the button below:" : "."}
    </p>
  `
    : "";

  // Generate button section
  const buttonSection = button
    ? `
    <a href="${button.href}" class="button" style="display: inline-block; padding: 14px 32px; background: #fb923c; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 20px 0;">
      ${button.text}
    </a>
  `
    : "";

  // Generate info box based on mode
  let infoBox = "";
  if (mode === "verification") {
    infoBox = `
      <div class="info-box" style="background: #18181b; border-left: 4px solid #fb923c; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
          <strong style="color: #e4e4e7;">This code expires in ${codeExpiry}.</strong><br>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;
  } else if (mode === "confirmation") {
    infoBox = `
      <div class="info-box" style="background: #18181b; border-left: 4px solid #fb923c; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
          ${
            additionalInfo ||
            '<strong style="color: #e4e4e7;">This link expires in 1 hour.</strong><br>If you didn\'t request this, please ignore this email.'
          }
        </p>
      </div>
    `;
  } else if (additionalInfo) {
    infoBox = `
      <div class="info-box" style="background: #18181b; border-left: 4px solid #fb923c; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
          ${additionalInfo}
        </p>
      </div>
    `;
  }

  // Generate someone-login specific content
  const loginContent =
    mode === "someone-login" && loginInfo
      ? `
    <div style="background: #18181b; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="font-size: 15px; color: #a1a1aa; line-height: 1.6; margin-bottom: 12px;">
        <strong style="color: #e4e4e7;">Login Details:</strong>
      </p>
      ${
        loginInfo.device
          ? `<p style="font-size: 14px; color: #a1a1aa; margin: 8px 0;">• Device: <span style="color: #e4e4e7;">${loginInfo.device}</span></p>`
          : ""
      }
      ${
        loginInfo.location
          ? `<p style="font-size: 14px; color: #a1a1aa; margin: 8px 0;">• Location: <span style="color: #e4e4e7;">${loginInfo.location}</span></p>`
          : ""
      }
      ${
        loginInfo.time
          ? `<p style="font-size: 14px; color: #a1a1aa; margin: 8px 0;">• Time: <span style="color: #e4e4e7;">${loginInfo.time}</span></p>`
          : ""
      }
      ${
        loginInfo.ip
          ? `<p style="font-size: 14px; color: #a1a1aa; margin: 8px 0;">• IP Address: <span style="color: #e4e4e7;">${loginInfo.ip}</span></p>`
          : ""
      }
    </div>
    <p style="font-size: 15px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px;">
      If this wasn't you, please secure your account immediately.
    </p>
  `
      : "";

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            background: #0a0a0a;
        }
        .email-content {
            max-width: 600px;
            margin: 40px auto;
            padding: 40px;
            background: #09090b;
            border-radius: 12px;
            border: 1px solid #27272a;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #fb923c;
            margin-bottom: 30px;
        }
        h2 {
            font-size: 24px;
            color: #fafafa;
            margin-bottom: 16px;
            font-weight: 600;
        }
        p {
            font-size: 15px;
            color: #a1a1aa;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: #fb923c;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background: #f97316;
        }
        .verification-code {
            background: #18181b;
            border: 2px dashed #3f3f46;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 25px 0;
        }
        .code {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #fb923c;
            font-family: 'Courier New', monospace;
        }
        .info-box {
            background: #18181b;
            border-left: 4px solid #fb923c;
            padding: 16px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box p {
            color: #a1a1aa;
            margin: 0;
            font-size: 14px;
        }
        .info-box strong {
            color: #e4e4e7;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #27272a;
            font-size: 13px;
            color: #71717a;
            text-align: center;
        }
        .divider {
            height: 1px;
            background: #27272a;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-content">
        <div class="logo">${brandName}</div>
        <h2>${title}</h2>
        <p>${mode === "information" ? (name ? `Hey ${name}!` : "Hey there!") : ""} ${message}</p>
        
        ${codeSection}
        ${loginContent}
        ${buttonSection}
        ${infoBox}
        
        <div class="footer">
            <p>${footerText}</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

export { emailTemplate };
export type { EmailTemplateProps, EmailButton, EmailLoginInfo };
