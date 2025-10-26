import { record } from "@/lib/manipulate/object";
import { capital } from "@/lib/manipulate/string";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ApiRequest, ApiResponse, CreateRouteOptionsBase } from "@/services/route/types";
import { Admin, Project, Tech } from "@prisma/client";
import pluralize from "pluralize";
import z from "zod";
import { ProjectPayload } from "../../pages/api/_payloads/project";
import { ProjectEntity } from "@/lib/models/project";
import { PAGINATION_LIMIT } from "@/config";
import { RouteValidator } from "@/services/route/validator";
import { TechController } from "../tech";

type ProjectWithTech = Project & {
  techStack: Tech[];
};

export abstract class ProjectController {
  static readonly routeOptions = {
    create: {
      bodyValidator: z
        .object({
          title: z.string(),
          description: z.string(),
          demoUrl: z.string().optional(),
          thumbnail: z.string().optional(),
          tech: z.array(TechController.routeOptions.create.bodyValidator.omit({ projectId: true })).optional(),
        })
        .strip(),
    },
    update: {
      bodyValidator: z.object(record(ProjectEntity.UPDATABLE_FIELDS, z.string().optional())).strip(),
    },
    updateMany: {
      bodyValidator: z.array(z.object({ ...record(ProjectEntity.UPDATABLE_FIELDS, z.string().optional()), id: z.string() }).strip()),
    },
    softDeleteMany: { bodyValidator: z.array(z.object({ id: z.string() }).strip()) },
    restoreMany: { bodyValidator: z.array(z.object({ id: z.string() }).strip()) },
    getMany: { queryValidator: RouteValidator.createGetManyValidator(ProjectEntity.default) },
    singleParam: { paramValidator: z.object({ id: z.string() }).strip() },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async get(req: ApiRequest<never, ProjectPayload.SingleParam, never>, { reply }: ApiResponse<Project>) {
    const project = await crud.getById(prisma.project, req.query.id);
    reply.success(project).respond();
  }

  static async getMany(req: ApiRequest<never, never, ProjectPayload.GetManyQuery>, { reply }: ApiResponse<Project[]>) {
    const { offset = 0, sort = "desc", sortBy, isRecycled = false } = req.query;
    const take = PAGINATION_LIMIT;
    const orderBy = sortBy ? { [sortBy]: sort } : { createdAt: "desc" as const };

    const project = await crud.getMany(prisma.project, { isRecycled }, { orderBy, take, skip: offset });
    reply.success(project).respond();
  }

  static async create(req: ApiRequest<ProjectPayload.CreateBody, never, never>, { reply }: ApiResponse<ProjectWithTech>, _: Admin) {
    const { description, title, demoUrl, thumbnail, tech } = req.body;
    const profile = await crud.getOne(prisma.profile, {});
    const project = (await crud.createOne(
      prisma.project,
      {
        profileId: profile.id,
        description,
        title,
        demoUrl,
        thumbnail,
        techStack: tech ? { create: tech } : undefined,
      },
      { include: { techStack: true } }
    )) as ProjectWithTech;
    reply.success(project).info(`New ${project.title} created`).respond();
  }

  static async update(req: ApiRequest<ProjectPayload.UpdateBody, ProjectPayload.SingleParam, never>, { reply }: ApiResponse<Project>, _: Admin) {
    const { demoUrl, description, thumbnail, title } = req.body;
    const id = req.query.id;
    const project = await crud.updateById(prisma.project, id, { demoUrl, description, thumbnail, title });
    reply
      .success(project)
      .info(`${capital(project.title)} updated`)
      .respond();
  }

  static async updateMany(req: ApiRequest<ProjectPayload.UpdateManyBody, never, never>, { reply }: ApiResponse<Project[]>, _: Admin) {
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

  static async softDelete(req: ApiRequest<never, ProjectPayload.SingleParam, never>, { reply }: ApiResponse<Project>, _: Admin) {
    const id = req.query.id;
    const project = await crud.softDeleteById(prisma.project, id);
    reply
      .success(project)
      .info(`${capital(project.title)} deleted`)
      .respond();
  }

  static async softDeleteMany(req: ApiRequest<ProjectPayload.SoftDeleteManyBody, never, never>, { reply }: ApiResponse<Project[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const projects = await crud.softDeleteMany(prisma.project, { id: { in: ids } });
    reply
      .success(projects)
      .info(`${projects.length} ${pluralize("project", projects.length)} deleted`)
      .respond();
  }

  static async restore(req: ApiRequest<never, ProjectPayload.SingleParam, never>, { reply }: ApiResponse<Project>, _: Admin) {
    const id = req.query.id;
    const project = await crud.restoreById(prisma.project, id);
    reply
      .success(project)
      .info(`${capital(project.title)} restored`)
      .respond();
  }

  static async restoreMany(req: ApiRequest<ProjectPayload.RestoreManyBody, never, never>, { reply }: ApiResponse<Project[]>, _: Admin) {
    const ids = req.body.map((b) => b.id);
    const projects = await crud.restoreMany(prisma.project, { id: { in: ids } });
    reply
      .success(projects)
      .info(`${projects.length} ${pluralize("project", projects.length)} restored`)
      .respond();
  }
}
