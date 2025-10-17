import { Admin, Profile, Project, Social, Tech, Verification, Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

export type Models = {
  admin: Admin;
  profile: Profile;
  project: Project;
  social: Social;
  tech: Tech;
  verification: Verification;
};

export type Model<T = never> = [T] extends [never] ? Models[keyof Models] : PickByValueStrict<Models, T>[keyof PickByValueStrict<Models, T>];

export type Delegates = {
  admin: Prisma.AdminDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  profile: Prisma.ProfileDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  project: Prisma.ProjectDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  social: Prisma.SocialDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  tech: Prisma.TechDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  verification: Prisma.VerificationDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
};

export type Delegate<T = never> = [T] extends [never]
  ? Delegates[keyof Delegates]
  : PickByValueStrict<Delegates, T>[keyof PickByValueStrict<Delegates, T>];
