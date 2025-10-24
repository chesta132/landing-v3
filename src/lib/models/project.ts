import { Project } from "@prisma/client";

export abstract class ProjectEntity {
  static readonly UPDATABLE_FIELDS = ["title", "description", "demoUrl", "thumbnail"] satisfies (keyof Project)[];

  static readonly default: Project = {
    createdAt: new Date(0),
    deleteAt: null,
    demoUrl: "",
    description: "",
    id: "",
    isRecycled: false,
    profileId: "",
    repoUrl: "",
    thumbnail: "",
    title: "",
    updatedAt: new Date(),
  };
}
