import { Admin, Profile, Project, Social, Tech, Verification, Prisma, Revoked } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

export type Models = {
  admin: Admin;
  profile: Profile;
  project: Project;
  social: Social;
  tech: Tech;
  verification: Verification;
  revoked: Revoked;
};

export type Model<T = never> = [T] extends [never] ? Models[keyof Models] : ValueOf<PickByValueStrict<Models, T>>;

export type Delegates = {
  admin: Prisma.AdminDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  profile: Prisma.ProfileDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  project: Prisma.ProjectDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  social: Prisma.SocialDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  tech: Prisma.TechDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  verification: Prisma.VerificationDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
  revoked: Prisma.RevokedDelegate<DefaultArgs, Prisma.PrismaClientOptions>;
};

export type Delegate<T = never> = [T] extends [never] ? Delegates[keyof Delegates] : ValueOf<PickByValueStrict<Delegates, T>>;

type ReverseModelMap<T> = T extends any
  ? {
      [K in keyof Models]: Models[K] extends T ? K : never;
    }[keyof Models]
  : never;

export type InferDelegateByModel<T> = ReverseModelMap<T> extends keyof Delegates ? Delegates[ReverseModelMap<T>] : never;
