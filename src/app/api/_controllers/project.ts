import { PAGINATION_LIMIT } from "@/config";
import { record } from "@/lib/manipulate/object";
import { capital } from "@/lib/manipulate/string";
import { parsePaginationQuery } from "@/lib/server/query";
import { CreateRouteOptionsBase } from "@/lib/server/route";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ApiRequest, ApiResponse } from "@/types/server";
import { Admin, Project } from "@prisma/client";
import pluralize from "pluralize";
import z from "zod";

export type CreateProjectPayload = { description: string; title: string; demoUrl?: string; thumbnail?: string };
export type UpdateProjectPayload = { description?: string; title?: string; demoUrl?: string; thumbnail?: string };
export type UpdateManyProjectPayload = (UpdateProjectPayload & { id: string })[];
export type SoftDeleteManyProjectPayload = { id: string }[];

export abstract class ProjectController {
  private static UPDATABLE_FIELDS = ["title", "description", "demoUrl", "thumbnail"] satisfies (keyof UpdateProjectPayload)[];

  static readonly routeOptions = {
    create: {
      bodyValidator: z.object({ title: z.string(), description: z.string(), demoUrl: z.string().nullish(), thumbnail: z.string().nullish() }),
    },
    update: {
      bodyValidator: z.object(record(this.UPDATABLE_FIELDS, z.string().nullish())),
    },
    updateMany: {
      bodyValidator: z.array(z.object({ ...record(this.UPDATABLE_FIELDS, z.string().nullish()), id: z.string() })),
    },
    softDeleteMany: { bodyValidator: z.array(z.object({ id: z.string() })) },
    restoreMany: { bodyValidator: z.array(z.object({ id: z.string() })) },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async get(req: ApiRequest<never, "id", never>, { reply }: ApiResponse<Project>) {
    const project = await crud.getById(prisma.project, req.query.id as string);
    reply.success(project).respond();
  }

  static async getMany(req: ApiRequest<never, never, "offset" | "sortBy" | "sort" | "isRecycled">, { reply }: ApiResponse<Project[]>) {
    const { offset, sort, sortBy, isRecycled: queryIsRecycled } = req.query;
    const { limit, skip, orderBy } = parsePaginationQuery({ offset, sort, sortBy });
    const isRecycled = typeof queryIsRecycled === "string" ? JSON.safeParse(queryIsRecycled, { fallback: false }) : false;

    const project = await crud.getMany(prisma.project, { isRecycled }, { orderBy, take: limit, skip });
    reply.success(project).respond();
  }

  static async create(req: ApiRequest<CreateProjectPayload, never, never>, { reply }: ApiResponse<Project>, _: Admin) {
    const { description, title, demoUrl, thumbnail } = req.body;
    const profile = await crud.getOne(prisma.profile, {});
    const project = await crud.createOne(prisma.project, { profileId: profile.id, description, title, demoUrl, thumbnail });
    reply.success(project).info(`New ${project.title} created`).respond();
  }

  static async update(req: ApiRequest<UpdateProjectPayload, "id", never>, { reply }: ApiResponse<Project>, _: Admin) {
    const { demoUrl, description, thumbnail, title } = req.body;
    const id = req.query.id as string;
    const project = await crud.updateById(prisma.project, id, { demoUrl, description, thumbnail, title });
    reply
      .success(project)
      .info(`${capital(project.title)} updated`)
      .respond();
  }

  static async updateMany(req: ApiRequest<UpdateManyProjectPayload, never, never>, { reply }: ApiResponse<Project[]>, _: Admin) {
    const projects = await prisma.$transaction(
      req.body.map(({ id, demoUrl, description, thumbnail, title }) =>
        prisma.project.update({ where: { id }, data: { demoUrl, description, thumbnail, title } })
      )
    );
    reply
      .success(projects)
      .info(`${projects.length} ${pluralize("project", projects.length)} updated`)
      .respond();
  }

  static async softDelete(req: ApiRequest<never, "id", never>, { reply }: ApiResponse<Project>, _: Admin) {
    const id = req.query.id as string;
    const project = await crud.softDeleteById(prisma.project, id);
    reply
      .success(project)
      .info(`${capital(project.title)} deleted`)
      .respond();
  }

  static async softDeleteMany(req: ApiRequest<SoftDeleteManyProjectPayload, never, never>, { reply }: ApiResponse<Project[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const projects = await crud.softDeleteMany(prisma.project, { id: { in: ids } });
    reply
      .success(projects)
      .info(`${projects.length} ${pluralize("project", projects.length)} deleted`)
      .respond();
  }

  static async restore(req: ApiRequest<never, "id", never>, { reply }: ApiResponse<Project>, _: Admin) {
    const id = req.query.id as string;
    const project = await crud.restoreById(prisma.project, id);
    reply
      .success(project)
      .info(`${capital(project.title)} restored`)
      .respond();
  }

  static async restoreMany(req: ApiRequest<SoftDeleteManyProjectPayload, never, never>, { reply }: ApiResponse<Project[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const projects = await crud.restoreMany(prisma.project, { id: { in: ids } });
    reply
      .success(projects)
      .info(`${projects.length} ${pluralize("project", projects.length)} restored`)
      .respond();
  }
}
