import { PAGINATION_LIMIT } from "@/config";
import { CreateRouteOptionsBase } from "@/lib/server/route";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ApiRequest, ApiResponse } from "@/types/server";
import { Admin, Social } from "@prisma/client";
import pluralize from "pluralize";
import z from "zod";

export type CreateSocialPayload = { provider: string; url: string };
export type UpdateSocialPayload = { provider: string; url: string };
export type UpdateManySocialPayload = (UpdateSocialPayload & { id: string })[];
export type SoftDeleteManySocialPayload = { id: string }[];

export abstract class SocialController {
  static neededBodyToCreate: (keyof CreateSocialPayload)[] = ["provider", "url"];
  static neededBodyToUpdate: (keyof UpdateSocialPayload)[] = ["provider", "url"];
  static neededBodyToUpdateMany: (keyof UpdateManySocialPayload[number])[] = ["provider", "url", "id"];
  static neededBodyToSoftDeleteMany: (keyof SoftDeleteManySocialPayload[number])[] = ["id"];
  static readonly routeOptions = {
    create: { bodyValidator: z.object({ provider: z.string(), url: z.string() }) },
    update: { bodyValidator: z.object({ provider: z.string(), url: z.string() }) },
    updateMany: { bodyValidator: z.object({ provider: z.string(), url: z.string(), id: z.string() }), bodyArray: true },
    softDeleteMany: { bodyValidator: z.object({ id: z.string() }), bodyArray: true },
    restoreMany: { bodyValidator: z.object({ id: z.string() }), bodyArray: true },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async get(req: ApiRequest<never, "id", never>, { reply }: ApiResponse<Social>) {
    const social = await crud.getById(prisma.social, req.query.id as string);
    reply.success(social).respond();
  }

  static async getMany(req: ApiRequest<never, never, "offset" | "sortBy" | "sort" | "isRecycled">, { reply }: ApiResponse<Social[]>) {
    const { offset, sort: querySort, sortBy, isRecycled: queryIsRecycled } = req.query;
    const limit = PAGINATION_LIMIT;
    const skip = Number(offset?.toString()) || 0;
    const sort = typeof sortBy === "string" ? { [sortBy]: querySort === "asc" ? querySort : "desc" } : undefined;
    const isRecycled = typeof queryIsRecycled === "string" ? JSON.safeParse<boolean>(queryIsRecycled, false) : false;

    const social = await crud.getMany(prisma.social, { isRecycled }, { orderBy: sort, take: limit, skip });
    reply.success(social).respond();
  }

  static async create(req: ApiRequest<CreateSocialPayload, never, never>, { reply }: ApiResponse<Social>, _: Admin) {
    const { provider, url } = req.body;
    const profile = await crud.getOne(prisma.profile, {});
    const social = await crud.createOne(prisma.social, { provider, url, profileId: profile.id });
    reply.success(social).info(`New ${social.provider} social created`).respond();
  }

  static async update(req: ApiRequest<UpdateSocialPayload, "id", never>, { reply }: ApiResponse<Social>, _: Admin) {
    const { provider, url } = req.body;
    const id = req.query.id as string;
    const social = await crud.updateById(prisma.social, id, { provider, url });
    reply.success(social).info(`${social.provider} social updated`).respond();
  }

  static async updateMany(req: ApiRequest<UpdateManySocialPayload, never, never>, { reply }: ApiResponse<Social[]>, _: Admin) {
    const socials = await prisma.$transaction(
      req.body.map(({ id, provider, url }) => prisma.social.update({ where: { id }, data: { provider, url } }))
    );
    reply
      .success(socials)
      .info(`${socials.length} ${pluralize("social", socials.length)} updated`)
      .respond();
  }

  static async softDelete(req: ApiRequest<never, "id", never>, { reply }: ApiResponse<Social>, _: Admin) {
    const id = req.query.id as string;
    const social = await crud.softDeleteById(prisma.social, id);
    reply.success(social).info(`${social.provider} social deleted`).respond();
  }

  static async softDeleteMany(req: ApiRequest<SoftDeleteManySocialPayload, never, never>, { reply }: ApiResponse<Social[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const socials = await crud.softDeleteMany(prisma.social, { id: { in: ids } });
    reply
      .success(socials)
      .info(`${socials.length} ${pluralize("social", socials.length)} deleted`)
      .respond();
  }

  static async restore(req: ApiRequest<never, "id", never>, { reply }: ApiResponse<Social>, _: Admin) {
    const id = req.query.id as string;
    const social = await crud.restoreById(prisma.social, id);
    reply.success(social).info(`${social.provider} social restored`).respond();
  }

  static async restoreMany(req: ApiRequest<SoftDeleteManySocialPayload, never, never>, { reply }: ApiResponse<Social[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const socials = await crud.restoreMany(prisma.social, { id: { in: ids } });
    reply
      .success(socials)
      .info(`${socials.length} ${pluralize("social", socials.length)} restored`)
      .respond();
  }
}
