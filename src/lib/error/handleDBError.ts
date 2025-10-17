import { QueryConditionalConflict, QueryConditionalMissing, QueryError } from "@/services/db/type";
import { Fields } from "@/services/reply/type";
import { ServerError } from "@/services/server-error";
import { Prisma } from "@prisma/client";

type PrismaErrorCode = "P2025" | "P2002" | "P2021" | "P2022" | "P2000" | "P2001" | "P2004" | "P2014";

const isPrismaError = (err: unknown): err is Prisma.PrismaClientKnownRequestError => {
  return err instanceof Prisma.PrismaClientKnownRequestError;
};

const getErrorCode = (err: unknown): PrismaErrorCode | null => {
  if (isPrismaError(err)) {
    return err.code as PrismaErrorCode;
  }
  return null;
};

export const handleDBServiceError = (err: unknown, modelName: string | null, error?: QueryError) => {
  const code = getErrorCode(err);
  if (error === null) return null;
  if (error instanceof ServerError) return error;
  if (typeof error === "function") return error();
  if (!modelName) modelName = "unknown";
  const missing = error as QueryConditionalMissing | undefined;
  const conflict = error as QueryConditionalConflict | undefined;

  switch (code) {
    case "P2025": // Record not found
      if (missing?.notFound === null) return null;
      if (missing?.notFound) return missing.notFound;

      return new ServerError("NOT_FOUND", { item: modelName });

    case "P2002": // Unique constraint failed
    case "P2021": // The record searched for in the where condition does not exist
    case "P2022": // A value that is required to be unique is missing
      if (conflict?.exists === null || conflict?.unique === null) return null;
      if (conflict?.exists) return conflict.exists;
      if (conflict?.unique) return conflict.unique;

      const target = isPrismaError(err) ? err.meta?.target : undefined;
      const field = Array.isArray(target) ? target[0] : "field";
      return new ServerError("CLIENT_FIELD", {
        field: field as Fields,
        message: `${field} already exists`,
      });

    case "P2000": // Value too long
    case "P2001": // Record doesn't exist
    case "P2004": // Constraint failed
      return new ServerError("CLIENT_TYPE", {
        field: modelName,
        details: isPrismaError(err) ? err.message : undefined,
      });

    case "P2014": // Required relation violation
      return new ServerError("MISSING_FIELDS", {
        field: "required relation",
        details: isPrismaError(err) ? err.message : undefined,
      });

    default:
      return err;
  }
};
