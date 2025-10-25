import { record } from "@/lib/manipulate/object";
import { capital } from "@/lib/manipulate/string";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ApiRequest, ApiResponse, CreateRouteOptionsBase } from "@/lib/route/types";
import { $Enums, Admin, Tech } from "@prisma/client";
import pluralize from "pluralize";
import z from "zod";
import { TechPayload } from "../_payloads/tech";
import { TechEntity } from "@/lib/models/tech";
import { PAGINATION_LIMIT } from "@/config";
import { RouteValidator } from "@/lib/route/validator";

export abstract class TechController {
  private static typeEnum = z.enum(Object.typedValues($Enums.TechType));

  static readonly routeOptions = {
    create: {
      bodyValidator: z.object({ name: z.string(), type: this.typeEnum, url: z.string(), projectId: z.string() }).strip(),
    },
    update: {
      bodyValidator: z.object({ ...record(TechEntity.UPDATABLE_FIELDS, z.string().optional()), type: this.typeEnum }).strip(),
    },
    updateMany: {
      bodyValidator: z.array(
        z.object({ ...record(TechEntity.UPDATABLE_FIELDS, z.string().optional()), type: this.typeEnum, id: z.string() }).strip()
      ),
    },
    softDeleteMany: { bodyValidator: z.array(z.object({ id: z.string() }).strip()) },
    restoreMany: { bodyValidator: z.array(z.object({ id: z.string() }).strip()) },
    getMany: { queryValidator: RouteValidator.createGetManyValidator(TechEntity.default) },
    singleParam: { paramValidator: z.object({ id: z.string() }).strip() },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async get(req: ApiRequest<never, TechPayload.SingleParam, never>, { reply }: ApiResponse<Tech>) {
    const tech = await crud.getById(prisma.tech, req.query.id);
    reply.success(tech).respond();
  }

  static async getMany(req: ApiRequest<never, never, TechPayload.GetManyQuery>, { reply }: ApiResponse<Tech[]>) {
    const { offset = 0, sort = "desc", sortBy, isRecycled = false } = req.query;
    const take = PAGINATION_LIMIT;
    const orderBy = sortBy && { [sortBy]: sort };

    const tech = await crud.getMany(prisma.tech, { isRecycled }, { orderBy, take, skip: offset });
    reply.success(tech).respond();
  }

  static async create(req: ApiRequest<TechPayload.CreateBody, never, never>, { reply }: ApiResponse<Tech>, _: Admin) {
    const { name, type, url, projectId } = req.body;
    const tech = await crud.createOne(prisma.tech, { name, type, url, projectId });
    reply.success(tech).info(`New ${tech.name} created`).respond();
  }

  static async update(req: ApiRequest<TechPayload.UpdateBody, TechPayload.SingleParam, never>, { reply }: ApiResponse<Tech>, _: Admin) {
    const { name, type, url } = req.body;
    const id = req.query.id;
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
    const id = req.query.id;
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
    const id = req.query.id;
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
