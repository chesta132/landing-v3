import crud from "../db/crud";
import prisma from "../db/client";
import { AuthService, CreateAdminInfo } from ".";
import { encrypt } from "@/lib/crypto";
import Email from "../email/mailer";
import { ServerError } from "../server-error";
import { timeInMs } from "@/lib/manipulate/number";
import { CHARDY_EMAIL } from "@/config";

export abstract class SignupService {
  static async createConfirmation({ email, hashedPassword, name }: { email: string; name: string; hashedPassword: string }) {
    const session = crypto.randomUUID();
    const secret = encrypt(session);
    await crud.createOne(prisma.verification, {
      expires: new Date(Date.now() + timeInMs({ day: 1 })),
      secret,
      type: "CONFIRMATION_ACTION",
      info: JSON.stringify({ email, name, password: hashedPassword }),
    });
    Email.sendAuthConfirmation(CHARDY_EMAIL!, { name, secret, type: "SIGN_UP", expiry: "1 day" });
  }

  static async allowCreateAdmin(secret: string) {
    const profile = await AuthService.getProfile("SIGN_UP");
    const verif = await crud.getOne(
      prisma.verification,
      { secret, type: "CONFIRMATION_ACTION" },
      { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } }
    );
    const { email, name, password } = JSON.parse(verif.info as CreateAdminInfo);
    await crud.createOne(prisma.admin, { email, name, password, profileId: profile.id });
    await crud.deleteById(prisma.verification, verif.id);
    await Email.sendInfo(email, {
      name,
      title: "Welcome To Chardy as an Admin",
      message: "Your account is accepted by Chesta Ardiona, please sign-in to access Chardy Dashboard",
      subject: "Welcome To Chardy",
    });
  }
}
