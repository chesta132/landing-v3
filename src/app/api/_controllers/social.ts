import { PAGINATION_LIMIT } from "@/config";
import { record } from "@/lib/manipulate/object";
import { parsePaginationQuery } from "@/lib/server/query";
import { CreateRouteOptionsBase } from "@/lib/server/route";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ApiRequest, ApiResponse } from "@/types/server";
import { Admin, Social } from "@prisma/client";
import pluralize from "pluralize";
import z from "zod";
import { SocialPayload } from "../_payloads/social";

export abstract class SocialController {
  private static UPDATABLE_FIELDS = ["provider", "url"] satisfies (keyof SocialPayload.UpdateBody)[];

  static readonly routeOptions = {
    create: { bodyValidator: z.object({ provider: z.string(), url: z.string() }) },
    update: { bodyValidator: z.object(record(this.UPDATABLE_FIELDS, z.string().nullish())) },
    updateMany: { bodyValidator: z.array(z.object({ ...record(this.UPDATABLE_FIELDS, z.string().nullish()), id: z.string() })) },
    softDeleteMany: { bodyValidator: z.array(z.object({ id: z.string() })) },
    restoreMany: { bodyValidator: z.array(z.object({ id: z.string() })) },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async get(req: ApiRequest<never, SocialPayload.SingleParam, never>, { reply }: ApiResponse<Social>) {
    const social = await crud.getById(prisma.social, req.query.id as string);
    reply.success(social).respond();
  }

  static async getMany(req: ApiRequest<never, never, SocialPayload.GetManyQuery>, { reply }: ApiResponse<Social[]>) {
    const { offset, sort, sortBy, isRecycled: queryIsRecycled } = req.query;
    const { limit, skip, orderBy } = parsePaginationQuery({ offset, sort, sortBy });
    const isRecycled = typeof queryIsRecycled === "string" ? JSON.safeParse(queryIsRecycled, { fallback: false }) : false;

    const social = await crud.getMany(prisma.social, { isRecycled }, { orderBy, take: limit, skip });
    reply.success(social).respond();
  }

  static async create(req: ApiRequest<SocialPayload.CreateBody, never, never>, { reply }: ApiResponse<Social>, _: Admin) {
    const { provider, url } = req.body;
    const profile = await crud.getOne(prisma.profile, {});
    const social = await crud.createOne(prisma.social, { provider, url, profileId: profile.id });
    reply.success(social).info(`New ${social.provider} social created`).respond();
  }

  static async update(req: ApiRequest<SocialPayload.UpdateBody, SocialPayload.SingleParam, never>, { reply }: ApiResponse<Social>, _: Admin) {
    const { provider, url } = req.body;
    const id = req.query.id as string;
    const social = await crud.updateById(prisma.social, id, { provider, url });
    reply.success(social).info(`${social.provider} social updated`).respond();
  }

  static async updateMany(req: ApiRequest<SocialPayload.UpdateManyBody, never, never>, { reply }: ApiResponse<Social[]>, _: Admin) {
    const socials = await prisma.$transaction(
      req.body.map(({ id, provider, url }) => prisma.social.update({ where: { id }, data: { provider, url } }))
    );
    reply
      .success(socials)
      .info(`${socials.length} ${pluralize("social", socials.length)} updated`)
      .respond();
  }

  static async softDelete(req: ApiRequest<never, SocialPayload.SingleParam, never>, { reply }: ApiResponse<Social>, _: Admin) {
    const id = req.query.id as string;
    const social = await crud.softDeleteById(prisma.social, id);
    reply.success(social).info(`${social.provider} social deleted`).respond();
  }

  static async softDeleteMany(req: ApiRequest<SocialPayload.SoftDeleteManyBody, never, never>, { reply }: ApiResponse<Social[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const socials = await crud.softDeleteMany(prisma.social, { id: { in: ids } });
    reply
      .success(socials)
      .info(`${socials.length} ${pluralize("social", socials.length)} deleted`)
      .respond();
  }

  static async restore(req: ApiRequest<never, SocialPayload.SingleParam, never>, { reply }: ApiResponse<Social>, _: Admin) {
    const id = req.query.id as string;
    const social = await crud.restoreById(prisma.social, id);
    reply.success(social).info(`${social.provider} social restored`).respond();
  }

  static async restoreMany(req: ApiRequest<SocialPayload.RestoreManyBody, never, never>, { reply }: ApiResponse<Social[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const socials = await crud.restoreMany(prisma.social, { id: { in: ids } });
    reply
      .success(socials)
      .info(`${socials.length} ${pluralize("social", socials.length)} restored`)
      .respond();
  }
}
