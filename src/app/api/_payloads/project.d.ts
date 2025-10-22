import { $Enums, Project } from "@prisma/client";

export namespace ProjectPayload {
  // Body
  type CreateBody = {
    description: string;
    title: string;
    demoUrl?: string;
    thumbnail?: string;
    tech?: { name: string; type: $Enums.TechType; url: string }[];
  };
  type UpdateBody = { description?: string; title?: string; demoUrl?: string; thumbnail?: string };
  type UpdateManyBody = (UpdateBody & { id: string })[];
  type SoftDeleteManyBody = { id: string }[];
  type RestoreManyBody = { id: string }[];

  // Param
  type SingleParam = { id: string };
  
  // Query
  type GetManyQuery = { offset?: number; sortBy?: keyof Project; sort?: "asc" | "desc"; isRecycled?: boolean };
}
