import { record } from "@/lib/manipulate/object";
import { capital } from "@/lib/manipulate/string";
import { parsePaginationQuery } from "@/lib/server/query";
import { CreateRouteOptionsBase } from "@/lib/server/route";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ApiRequest, ApiResponse } from "@/types/server";
import { $Enums, Admin, Tech } from "@prisma/client";
import pluralize from "pluralize";
import z from "zod";
import { TechPayload } from "../_payloads/tech";

export abstract class TechController {
  private static UPDATABLE_FIELDS = ["name", "type", "url"] satisfies (keyof TechPayload.UpdateBody)[];
  private static typeEnum = z.enum(Object.typedValues($Enums.TechType));

  static readonly routeOptions = {
    create: {
      bodyValidator: z.object({ name: z.string(), type: this.typeEnum, url: z.string() }),
    },
    update: {
      bodyValidator: z.object({ ...record(this.UPDATABLE_FIELDS, z.string().nullish()), type: this.typeEnum }),
    },
    updateMany: {
      bodyValidator: z.array(z.object({ ...record(this.UPDATABLE_FIELDS, z.string().nullish()), type: this.typeEnum, id: z.string() })),
    },
    softDeleteMany: { bodyValidator: z.array(z.object({ id: z.string() })) },
    restoreMany: { bodyValidator: z.array(z.object({ id: z.string() })) },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async get(req: ApiRequest<never, TechPayload.SingleParam, never>, { reply }: ApiResponse<Tech>) {
    const tech = await crud.getById(prisma.tech, req.query.id as string);
    reply.success(tech).respond();
  }

  static async getMany(req: ApiRequest<never, never, TechPayload.GetManyQuery>, { reply }: ApiResponse<Tech[]>) {
    const { offset, sort, sortBy, isRecycled: queryIsRecycled } = req.query;
    const { limit, skip, orderBy } = parsePaginationQuery({ offset, sort, sortBy });
    const isRecycled = typeof queryIsRecycled === "string" ? JSON.safeParse(queryIsRecycled, { fallback: false }) : false;

    const tech = await crud.getMany(prisma.tech, { isRecycled }, { orderBy, take: limit, skip });
    reply.success(tech).respond();
  }

  static async create(req: ApiRequest<TechPayload.CreateBody, never, never>, { reply }: ApiResponse<Tech>, _: Admin) {
    const { name, type, url, projectId } = req.body;
    const tech = await crud.createOne(prisma.tech, { name, type, url, projectId });
    reply.success(tech).info(`New ${tech.name} created`).respond();
  }

  static async update(req: ApiRequest<TechPayload.UpdateBody, TechPayload.SingleParam, never>, { reply }: ApiResponse<Tech>, _: Admin) {
    const { name, type, url } = req.body;
    const id = req.query.id as string;
    const tech = await crud.updateById(prisma.tech, id, { name, type, url });
    reply
      .success(tech)
      .info(`${capital(tech.name)} updated`)
      .respond();
  }

  static async updateMany(req: ApiRequest<TechPayload.UpdateManyBody, never, never>, { reply }: ApiResponse<Tech[]>, _: Admin) {
    const techs = await prisma.$transaction(
      req.body.map(({ id, name, type, url }) => prisma.tech.update({ where: { id }, data: { name, type, url } }))
    );
    reply
      .success(techs)
      .info(`${techs.length} ${pluralize("tech", techs.length)} updated`)
      .respond();
  }

  static async softDelete(req: ApiRequest<never, TechPayload.SingleParam, never>, { reply }: ApiResponse<Tech>, _: Admin) {
    const id = req.query.id as string;
    const tech = await crud.softDeleteById(prisma.tech, id);
    reply
      .success(tech)
      .info(`${capital(tech.name)} deleted`)
      .respond();
  }

  static async softDeleteMany(req: ApiRequest<TechPayload.SoftDeleteManyBody, never, never>, { reply }: ApiResponse<Tech[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const techs = await crud.softDeleteMany(prisma.tech, { id: { in: ids } });
    reply
      .success(techs)
      .info(`${techs.length} ${pluralize("tech", techs.length)} deleted`)
      .respond();
  }

  static async restore(req: ApiRequest<never, TechPayload.SingleParam, never>, { reply }: ApiResponse<Tech>, _: Admin) {
    const id = req.query.id as string;
    const tech = await crud.restoreById(prisma.tech, id);
    reply
      .success(tech)
      .info(`${capital(tech.name)} restored`)
      .respond();
  }

  static async restoreMany(req: ApiRequest<TechPayload.RestoreManyBody, never, never>, { reply }: ApiResponse<Tech[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const techs = await crud.restoreMany(prisma.tech, { id: { in: ids } });
    reply
      .success(techs)
      .info(`${techs.length} ${pluralize("tech", techs.length)} restored`)
      .respond();
  }
}
