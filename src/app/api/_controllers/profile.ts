import { pick } from "@/lib/manipulate/object";
import { capital } from "@/lib/manipulate/string";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ServerError } from "@/services/server-error";
import { ApiRequest, ApiResponse } from "@/types/server";
import { Admin, Profile } from "@prisma/client";

export abstract class ProfileController {
  static neededBody = ["bio", "avatarUrl", "name"];

  static async get(_: ApiRequest<never, never, never>, { reply }: ApiResponse<Profile>) {
    const profile = await crud.getOne(prisma.profile, {});
    reply.success(profile).respond();
  }

  static async create(req: ApiRequest<Pick<Profile, "bio" | "avatarUrl" | "name" | "location">, never, never>, { reply }: ApiResponse<Profile>) {
    await crud.getOne(
      prisma.profile,
      {},
      { error: { found: new ServerError("FORBIDDEN", { message: "Profile is already created, can not create more than 1 profile" }) } }
    );

    const { bio, avatarUrl, name, location } = req.body || {};
    const profile = await crud.createOne(prisma.profile, { bio, avatarUrl, name, location });

    reply
      .success(profile)
      .info(`${capital(name)} successfully created.`)
      .created();
  }

  static async update(
    req: ApiRequest<Pick<Profile, "bio" | "avatarUrl" | "name" | "location">, "id", never>,
    { reply }: ApiResponse<Profile>,
    _: Admin
  ) {
    const id = req.query.id as string;

    const update = pick(req.body || {}, ["bio", "avatarUrl", "name", "location"]);
    const profile = await crud.updateById(prisma.profile, id, update);
    reply.success(profile).info(`${profile.name} successfully updated.`).respond();
  }

  static async delete(req: ApiRequest<never, "id", "token">, { reply }: ApiResponse<Profile>, _: Admin) {
    const { id, token } = req.query as Record<"id" | "token", string>;

    await crud.getOne(prisma.verification, { type: "OTP_ACTION", secret: token }, { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } });
    const deleted = await crud.deleteById(prisma.profile, id);

    reply.success(deleted).info(`${deleted.name} successfully deleted.`).respond();
  }
}
