import { capital } from "@/lib/manipulate/string";
import { Reply } from "../reply";
import { Fields, RestError } from "../reply/type";
import { AllowedMethods } from "@/types/server";

export type ServerErrorConfig =
  | { code: "CLIENT_FIELD"; deps: [err: { field: Fields; message: string } & RestError] }
  | { code: "MISSING_FIELDS"; deps: [err: { field: string } & Omit<RestError, "field">] }
  | { code: "CLIENT_TYPE"; deps: [err: { field: string; details?: string } & Omit<RestError, "field">] }
  | { code: "INVALID_AUTH"; deps: [err?: RestError] }
  | { code: "INVALID_VERIF_TOKEN"; deps: [err?: Omit<RestError, "field">] }
  | { code: "INVALID_TOKEN"; deps: [err?: RestError] }
  | { code: "NOT_FOUND"; deps: [err: { item: string; desc?: string } & RestError] }
  | { code: "IS_BOUND"; deps: [err?: { provider?: string } & RestError] }
  | { code: "NOT_BOUND"; deps: [err?: { provider?: string } & RestError] }
  | { code: "TOO_MUCH_REQ"; deps: [err?: { desc?: string } & RestError] }
  | { code: "SELF_REQ"; deps: [err?: RestError] }
  | { code: "IS_RECYCLED"; deps: [err: { name: string } & RestError] }
  | { code: "NOT_RECYCLED"; deps: [err: { name: string } & RestError] }
  | { code: "SERVER_ERROR"; deps: [err: RequireAtLeastOne<{ error: Error; message: string }> & RestError] }
  | { code: "FORBIDDEN"; deps: [err: { message: string } & RestError] }
  | { code: "METHOD_NOT_ALLOWED"; deps: [err: { method: string; allowed: AllowedMethods[] } & RestError] }
  | { code: "CONFLICT"; deps: [err: { message: string } & RestError] };
export type ServerErrorCode = ServerErrorConfig["code"];

type Config<C> = Extract<ServerErrorConfig, { code: C }>;
type DepsOf<C extends ServerErrorCode> = Config<C>["deps"];

export class ServerError<C extends ServerErrorCode> {
  code: C;
  deps: DepsOf<C>;

  constructor(code: C, ...deps: DepsOf<C>);
  constructor(error: ServerError<C>);

  constructor(codeOrError: C | ServerError<C>, ...depsOrRes: DepsOf<C> | [undefined]) {
    if (codeOrError instanceof ServerError) {
      this.code = codeOrError.code;
      this.deps = codeOrError.deps;
    } else {
      this.code = codeOrError;
      this.deps = depsOrRes as unknown as DepsOf<C>;
    }
  }

  exec(reply: Reply) {
    const { deps, code } = { code: this.code, deps: this.deps } as ServerErrorConfig;

    switch (code) {
      case "CLIENT_FIELD":
        reply.error({ ...deps[0], field: deps[0].field, message: deps[0].message, code: "CLIENT_FIELD" }).fail();
        break;
      case "MISSING_FIELDS":
        reply.error({ ...deps[0], title: "Missing Fields", message: `${capital(deps[0].field)} is required`, code: "MISSING_FIELDS" }).fail();
        break;
      case "CLIENT_TYPE":
        reply
          .error({
            ...deps[0],
            code: "INVALID_CLIENT_TYPE",
            message: `Invalid ${deps[0].field} type. ${capital(deps[0].details || "")}`.trim(),
            title: "Invalid Type",
          })
          .fail();
        break;
      case "INVALID_VERIF_TOKEN":
        reply
          .error({
            ...deps[0],
            title: "Invalid OTP",
            message: "Invalid or expired Verification token. Please create a new verification email request.",
            code: "CLIENT_FIELD",
            field: "token",
          })
          .fail();
        break;
      case "INVALID_AUTH":
        reply
          .error({
            ...deps[0],
            title: "Authentication Needed",
            message: "Authentication needed please back to dashboard or change your account",
            code: "INVALID_AUTH",
          })
          .fail();
        break;
      case "INVALID_TOKEN":
        reply
          .error({
            ...deps[0],
            title: "Invalid Session",
            message: "Invalid token please re-signin to refresh your session",
            code: "INVALID_TOKEN",
          })
          .fail();
        break;
      case "NOT_FOUND":
        reply
          .error({
            ...deps[0],
            title: "Not Found",
            message: `${capital(deps[0].item)} not found${deps[0].desc ? `. ${capital(deps[0].desc)}` : ""}`,
            code: "NOT_FOUND",
          })
          .fail();
        break;
      case "IS_BOUND":
        reply
          .error({
            ...deps[0],
            code: "IS_BOUND",
            message: `Account is already bound to ${deps[0]?.provider ?? "local"}`,
            title: "Account already bounded",
          })
          .fail();
        break;
      case "NOT_BOUND":
        reply
          .error({
            ...deps[0],
            message: `Account is not bounded to ${deps[0]?.provider ?? "local"} yet, please bind to ${deps[0]?.provider ?? "local"} first`,
            code: "NOT_BOUND",
            title: "Account is not bounded",
          })
          .fail();
        break;
      case "TOO_MUCH_REQ":
        reply
          .error({
            ...deps[0],
            title: "Too many requests",
            message: `Too many requests. ${capital(deps[0]?.desc || "") || "Please try again later"}`,
            code: "TOO_MUCH_REQUEST",
          })
          .fail();
        break;
      case "SELF_REQ":
        reply
          .error({
            ...deps[0],
            message: "Can not self request, please report this issue to Hoshify Team",
            title: "Self request detected",
            code: "SELF_REQUEST",
          })
          .fail();
        break;
      case "IS_RECYCLED":
        reply
          .error({
            ...deps[0],
            message: `${capital(deps[0].name)} is recycled, please restore first`,
            code: "IS_RECYCLED",
          })
          .fail();
        break;
      case "NOT_RECYCLED":
        reply
          .error({
            ...deps[0],
            message: `${capital(deps[0].name)} is not recycled, please recycle first`,
            code: "NOT_RECYCLED",
          })
          .fail();
        break;
      case "SERVER_ERROR":
        reply
          .error({
            ...deps[0],
            title: "Server Error",
            message: deps[0].message || "Internal server error",
            code: "SERVER_ERROR",
            details: deps[0].error?.message,
          })
          .fail();
        break;
      case "FORBIDDEN":
        reply.error({ ...deps[0], code: "SERVER_ERROR" }).fail();
        break;
      case "METHOD_NOT_ALLOWED":
        reply
          .error({
            ...deps[0],
            title: "Method Not Allowed",
            code: "METHOD_NOT_ALLOWED",
            message: `Method ${deps[0].method} not allowed`,
            details: `Allowed method is ${deps[0].allowed.join(", ")}`,
          })
          .setHeader("Allow", deps[0].allowed.join(", "))
          .fail();
        break;
      case "CONFLICT":
        reply.error({ ...deps[0], code: "CONFLICT", message: deps[0].message }).fail();
        break;
    }
  }
}
