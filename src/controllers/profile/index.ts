import { record } from "@/lib/manipulate/object";
import { capital } from "@/lib/manipulate/string";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ServerError } from "@/services/server-error";
import { ApiRequest, ApiResponse, CreateRouteOptionsBase } from "@/services/route/types";
import { Admin, Profile } from "@prisma/client";
import z from "zod";
import { ProfilePayload } from "./payload";

export abstract class ProfileController {
  static readonly routeOptions = {
    update: { bodyValidator: z.object(record(["bio", "avatarUrl", "name", "location"], z.string().optional())).strip() },
    create: {
      bodyValidator: z
        .object({
          ...record(["bio", "avatarUrl", "name"], z.string()),
          location: z.string().optional(),
        })
        .strip(),
    },
    delete: { queryValidator: z.object({ token: z.string() }).strip() },
    singleParam: { paramValidator: z.object({ id: z.string() }).strip() },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async get(_: ApiRequest<never, never, never>, { reply }: ApiResponse<Profile>) {
    const profile = await crud.getOne(prisma.profile, {});
    reply.success(profile).respond();
  }

  static async create(req: ApiRequest<ProfilePayload.CreateBody, never, never>, { reply }: ApiResponse<Profile>) {
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

  static async update(req: ApiRequest<ProfilePayload.UpdateBody, ProfilePayload.SingleParam, never>, { reply }: ApiResponse<Profile>, _: Admin) {
    const id = req.query.id;

    const profile = await crud.updateById(prisma.profile, id, req.body);
    reply.success(profile).info(`${profile.name} successfully updated.`).respond();
  }

  static async delete(req: ApiRequest<never, ProfilePayload.SingleParam, ProfilePayload.DeleteQuery>, { reply }: ApiResponse<Profile>, _: Admin) {
    const { id, token } = req.query;

    await crud.getOne(
      prisma.verification,
      { type: "OTP_ACTION", secret: token.toString() },
      { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } }
    );
    const deleted = await crud.deleteById(prisma.profile, id.toString());

    reply.success(deleted).info(`${deleted.name} successfully deleted.`).respond();
  }
}
