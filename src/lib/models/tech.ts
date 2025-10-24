import { Tech } from "@prisma/client";

export abstract class TechEntity {
  static readonly UPDATABLE_FIELDS = ["name", "type", "url"] satisfies (keyof Tech)[];
  static readonly default: Tech = {
    deleteAt: null,
    id: "",
    isRecycled: false,
    name: "",
    projectId: "",
    type: "UNKNOWN",
    url: "",
  };
}
