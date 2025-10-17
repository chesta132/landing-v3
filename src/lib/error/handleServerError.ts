import { Prisma } from "@prisma/client";
import { Reply } from "@/services/reply";
import { ServerError } from "@/services/server-error";

export const handleServerError = async (err: unknown, reply: Reply) => {
  const res = reply.reset();
  if (err instanceof ServerError) {
    new ServerError(err).exec(res);
    return;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    res
      .error({
        message: err.message,
        title: "Validation Error",
        code: "SERVER_ERROR",
      })
      .fail();
    return;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res
        .error({
          title: "Unique Constraint Error",
          message: `Unique constraint failed: ${err.meta?.constraint || "unknown field"}`,
          code: "SERVER_ERROR",
        })
        .fail();
      return;
    } else if (err.code === "P2025") {
      res
        .error({
          title: "Record Not Found",
          message: "Required record not found. Please check your input.",
          code: "NOT_FOUND",
        })
        .fail();
      return;
    } else {
      res
        .error({
          title: "Database Error",
          message: err.message,
          code: "SERVER_ERROR",
        })
        .fail();
      return;
    }
  } else {
    res.error({ message: "Internal Server Error", code: "SERVER_ERROR", details: (err as Error).message }).fail();
  }
};
