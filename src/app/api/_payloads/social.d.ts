import { Social } from "@prisma/client";

export namespace SocialPayload {
  // Body
  type CreateBody = { provider: string; url: string };
  type UpdateBody = { provider?: string; url?: string };
  type UpdateManyBody = (UpdateBody & { id: string })[];
  type SoftDeleteManyBody = { id: string }[];
  type RestoreManyBody = { id: string }[];

  // Param
  type SingleParam = { id: string };

  // Query
  type GetManyQuery = { offset?: number; sortBy?: keyof Social; sort?: "asc" | "desc"; isRecycled?: boolean };
}
