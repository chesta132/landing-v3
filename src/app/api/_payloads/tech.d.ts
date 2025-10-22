import { $Enums, Tech } from "@prisma/client";

export namespace TechPayload {
  // Body
  type CreateBody = { name: string; type: $Enums.TechType; url: string; projectId: string };
  type UpdateBody = { name?: string; type?: $Enums.TechType; url?: string };
  type UpdateManyBody = (UpdateBody & { id: string })[];
  type SoftDeleteManyBody = { id: string }[];
  type RestoreManyBody = { id: string }[];

  // Param
  type SingleParam = { id: string };

  // Query
  type GetManyQuery = { offset?: number; sortBy?: keyof Tech; sort?: "asc" | "desc"; isRecycled?: boolean };
}
