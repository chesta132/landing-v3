import { ServerError } from "@/services/server-error";
import { spacing } from "../manipulate/string";
import { ZodArray, ZodObject } from "zod";

/** @deprecated Use validatePayload instead */
export const validateRequires = (neededField: string[], from: any) => {
  const missingFieldsSet: Set<string> = new Set();
  let isValid = true;
  if (Array.isArray(from)) {
    from.forEach((data) => {
      neededField.forEach((field) => {
        if (data[field] === undefined) {
          missingFieldsSet.add(field);
          isValid = false;
        }
      });
    });
  } else {
    neededField.forEach((field) => {
      if (from[field] === undefined) {
        missingFieldsSet.add(field);
        isValid = false;
      }
    });
  }
  const missingFields = [...missingFieldsSet].map((field) => spacing(field));

  if (!isValid) {
    throw new ServerError("MISSING_FIELDS", { field: missingFields.join(", ") });
  }
};

export const validatePayload = (schema: ZodObject | ZodArray, from: any) => {
  const valid = schema.safeParse(from);
  if (valid.error) {
    const missingFields = valid.error.issues
      .filter((i) => i.code === "invalid_type" && i.path.every((k) => from?.[k] === undefined))
      .flatMap((i) => i.path);
    if (missingFields.length >= 1) {
      throw new ServerError("MISSING_FIELDS", { field: missingFields.join(", ") });
    } else {
      const fields = valid.error.issues.flatMap((i) => i.path);
      throw new ServerError("CLIENT_TYPE", { field: fields.join(", ") });
    }
  }
};
