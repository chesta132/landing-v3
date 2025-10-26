import { createAccessToken, createRefreshToken } from "../../lib/token";
import { timeInMs } from "@/lib/manipulate/number";
import { omit, pick } from "@/lib/manipulate/object";
import { CodeError } from "../server-error/type";
import { NextApiRequest, NextApiResponse } from "next";
import { ACCESS_TOKEN_EXPIRY, ACCESS_TOKEN_KEY, NODE_ENV, REFRESH_TOKEN_EXPIRY, REFRESH_TOKEN_KEY } from "@/config";
import { CookieUserBase, Replied, ErrorReplyType, ResType, ReplyOptions } from "./type";
import { accessTokenConfig, refreshTokenConfig, refreshTokenSessionOnlyConfig } from "@/lib/token";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { serialize } from "cookie";

const defaultPayload = <T>(): Replied<T> => ({ data: { code: "SERVER_ERROR", message: "Payload is empty." } as T, meta: { status: "ERROR" } });

const statusAlias: {
  code: CodeError[];
  status: number;
}[] = [
  { code: ["INVALID_AUTH", "INVALID_TOKEN"], status: 401 },
  { code: ["IS_BOUND", "NOT_BOUND", "NOT_VERIFIED", "FORBIDDEN"], status: 403 },
  { code: ["NOT_FOUND"], status: 404 },
  { code: ["METHOD_NOT_ALLOWED"], status: 405 },
  { code: ["CLIENT_FIELD", "MISSING_FIELDS", "SELF_REQUEST", "INVALID_CLIENT_TYPE"], status: 406 },
  { code: ["IS_VERIFIED", "IS_RECYCLED", "NOT_RECYCLED", "CONFLICT"], status: 409 },
  { code: ["TOO_MUCH_REQUEST"], status: 429 },
  { code: ["CLIENT_REFRESH"], status: 301 },
  { code: ["SERVER_ERROR"], status: 500 },
  { code: ["BAD_GATEWAY"], status: 502 },
];

/**
 * Wrapper for NextApiResponse object with method chaining.
 * Provides utilities for standardized success/error responses and extra features.
 */
export class Reply<SuccessType = unknown, SuccessReady extends boolean = false, ErrorReady extends boolean = false> {
  private _jsonPayload: Replied<typeof this._body | typeof this._errorBody, boolean> = defaultPayload();
  private _res: NextApiResponse;
  private _req: NextApiRequest;

  private _cookie;
  private _body?: SuccessType | SuccessType[];
  private _errorBody?: ErrorReplyType;
  private _accessToken?: string;
  private _refreshToken?: string;
  private _rememberMe?: boolean;

  /**
   * Initialize Template of the original NextApiResponse.
   */
  constructor(req: NextApiRequest, res: NextApiResponse<SuccessType>) {
    this._res = res;
    this._req = req;
    this._cookie = {
      get: (name: string) => ({ name, value: this._req.cookies[name] || "" }),
      set: (name: string, value: string, options?: Omit<ResponseCookie, "name" | "value">) => {
        const cookieString = serialize(name, value, {
          path: options?.path || "/",
          domain: options?.domain,
          httpOnly: options?.httpOnly,
          secure: options?.secure,
          sameSite: options?.sameSite as any,
          maxAge: options?.maxAge,
          expires: options?.expires === undefined ? undefined : new Date(options?.expires),
        });

        const existing = this._res.getHeader("Set-Cookie");
        const cookies = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
        this.setHeader("Set-Cookie", [...cookies, cookieString]);
      },
      delete: (name: string) => {
        const cookieString = serialize(name, "", { path: "/", maxAge: 0 });
        const existing = this._res.getHeader("Set-Cookie");
        const cookies = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
        this.setHeader("Set-Cookie", [...cookies, cookieString]);
      },
    };
  }

  private _reset() {
    this._body = undefined;
    this._errorBody = undefined;
    this._jsonPayload = defaultPayload();
    this._accessToken = undefined;
    this._refreshToken = undefined;
    return this as Reply<unknown, false, false>;
  }

  private _finalize<S extends boolean>(success: S) {
    this._jsonPayload.meta.status = success ? "SUCCESS" : "ERROR";
    this._jsonPayload.data = success ? this._body : omit(this._errorBody!, ["status"]);
    return this as unknown as S extends true ? Reply<SuccessType, true, false> : Reply<unknown, false, true>;
  }

  /**
   * Set the response body with success or error payload.
   *
   * @example
   * ```ts
   * reply.body({ success: { userId: 123 } }).ok();
   * ```
   * @example
   * ```ts
   * reply.body({ error: { code: "NOT_FOUND", message: "User not found" } }).error();
   * ```
   *
   * @param success Data for success response
   * @param error Data for error response
   * @returns this
   */
  body<T extends OneFieldOnly<{ success: SuccessType; error: ErrorReplyType }>>({ success, error }: T) {
    if (success) this._body = success;
    if (error) this._errorBody = pick(error, ["code", "details", "field", "message", "status", "title"]);
    return this as unknown as T extends { success: infer S }
      ? [S] extends [never]
        ? Reply<unknown, false, true>
        : Reply<S, true, false>
      : Reply<unknown, false, true>;
  }

  /**
   * Set the response body as a success payload.
   *
   * @example
   * ```ts
   * reply.success({ userId: 123 }).ok();
   * ```
   *
   * @param data The data to send in the success response
   * @returns this
   */
  success<T extends SuccessType>(data: T) {
    return this.body({ success: data });
  }

  /**
   * Set the response body as an error payload.
   *
   * @example
   * ```ts
   * reply.error({ code: "NOT_FOUND", message: "User not found", status: 404 }).fail();
   * ```
   *
   * @param data The error object conforming to ErrorReplyType
   * @returns this
   */
  error(data: ErrorReplyType) {
    return this.body({ error: data });
  }

  /**
   * Add a information message to the response metadata.
   *
   * @example
   * ```ts
   * reply.info("Profile updated successfully")
   *    .body({ success: user })
   *    .ok();
   * ```
   *
   * @param information Information message
   * @returns this
   */
  info(information: string) {
    this._jsonPayload.meta.information = information;
    return this;
  }

  /**
   * Apply pagination metadata to the response body (if the body is an array).
   *
   * @example
   * ```ts
   * reply.body({ success: users })
   *    .paginate({ limit: 10, offset: 0 })
   *    .ok();
   * ```
   *
   * @param paginateMeta Pagination options (limit, offset)
   * @returns this
   */
  paginate: IsArray<SuccessType, (paginateMeta: ReplyOptions["paginateMeta"]) => this> = ((paginateMeta: ReplyOptions["paginateMeta"]) => {
    if (Array.isArray(this._body)) {
      const { limit, offset } = paginateMeta;
      const hasNext = this._body.length >= limit;
      const nextOffset = hasNext ? offset + limit : null;

      this._jsonPayload.meta.hasNext = hasNext;
      this._jsonPayload.meta.nextOffset = nextOffset;
    }
    return this;
  }) as any;

  /**
   * Generate access and refresh tokens for the given user.
   *
   * @example
   * ```ts
   * reply.body({ success: user })
   *    .generateTokens({ user2, rememberMe: true })
   *    .setCookie({ template: "REFRESH_ACCESS" });
   * ```
   *
   * @param cookie User data and options
   * @returns this
   */
  generateTokens(cookie: ReplyOptions<SuccessType>["cookie"]) {
    let { user, rememberMe } = cookie;
    if (rememberMe !== undefined) this._rememberMe = rememberMe;
    if (!user) {
      if (!this._body) return this;
      user = this._body as unknown as CookieUserBase;
    }
    let { id } = user;
    this._accessToken = createAccessToken({
      adminId: id,
      expires: new Date(Date.now() + (Number(ACCESS_TOKEN_EXPIRY) || timeInMs({ minute: 5 }))),
    });
    this._refreshToken = createRefreshToken(
      { adminId: id, expires: new Date(Date.now() + (Number(REFRESH_TOKEN_EXPIRY) || timeInMs({ week: 1 }))) },
      this._rememberMe ? undefined : null
    );
    return this;
  }

  /**
   * Send cookies to the client (access, refresh, or custom).
   *
   * @example
   * ```ts
   * reply.setCookie({ template: "ACCESS", user, rememberMe: false });
   * reply.body({ success: user }).setCookie({ template: "ACCESS", rememberMe: false }).ok();
   * ```
   *
   * @param cookie Cookie configuration
   * @returns this
   */
  setCookie(cookie: ReplyOptions<SuccessType>["cookie"]) {
    const { rememberMe, template, ...rest } = cookie;
    if (rememberMe !== undefined) this._rememberMe = rememberMe;
    if (!this._accessToken || !this._refreshToken) {
      if (!this._body && !cookie.user) return this;
      else if (template) this.generateTokens(cookie);
    }

    const refreshConfig = this._rememberMe ? refreshTokenConfig : refreshTokenSessionOnlyConfig;

    switch (template) {
      case "ACCESS":
        this._cookie.set(ACCESS_TOKEN_KEY, this._accessToken!, accessTokenConfig);
        break;
      case "REFRESH":
        this._cookie.set(REFRESH_TOKEN_KEY, this._refreshToken!, refreshConfig);
        break;
      case "REFRESH_ACCESS":
        this._cookie.set(ACCESS_TOKEN_KEY, this._accessToken!, accessTokenConfig);
        this._cookie.set(REFRESH_TOKEN_KEY, this._refreshToken!, refreshConfig);
        break;
      default:
        if (rest.name && rest.value) {
          this._cookie.set(rest.name, rest.value, rest);
        }
    }

    this._accessToken = undefined;
    this._refreshToken = undefined;
    return this;
  }

  /**
   * Delete cookies from the response.
   *
   * @example
   * ```ts
   * reply.body({ success: user }).deleteCookies(["accessToken", "refreshToken"]).ok();
   * ```
   *
   * @param name Name of the cookie or array of names to delete
   * @param options Cookie options
   * @returns this
   */
  async deleteCookies(name: string[] | string) {
    if (Array.isArray(name)) {
      name.forEach((n) => this._cookie.delete(n));
    } else {
      this._cookie.delete(name);
    }
    return this;
  }

  /**
   * Set headers from the response.
   *
   * @example
   * ```ts
   * reply.body({ error }).setHeader("Allow", "GET, POST").ok();
   *
   * const headers = new Headers({ "Content-Type": "text/html" });
   * reply.body({ success: user }).setHeader(headers).ok();
   * ```
   *
   * @param name Name of the header
   * @param value Value of the header
   * @param header Header instance
   * @returns this
   */
  setHeader(name: string, value: number | string | readonly string[]): this;
  setHeader(header: Headers): this;
  setHeader(headerOrName: string | Headers, value?: number | string | readonly string[]) {
    if (headerOrName instanceof Headers) {
      this._res.setHeaders(headerOrName);
    } else {
      this._res.setHeader(headerOrName, value!);
    }
    return this;
  }

  /**
   * Reset all internal state of a Reply instance to its default values.
   * This clears the success/error body, JSON payload, and tokens.
   *
   * @example
   * ```ts
   * const newReply = reply.reset();
   * newReply.body({ success: user }).ok();
   * ```
   *
   * @returns A new Reply instance with default internal state
   */
  reset() {
    return new Reply(this._req, this._res);
  }

  /**
   * Redirect the client to a specified URL.
   * @example
   * ```ts
   * reply.redirect("https://example.com");
   * ```
   *
   * @param url URL to redirect to
   * @returns this
   */
  redirect(url: string) {
    this._res.redirect(url);
    return this;
  }

  /**
   * Smart send success or error.
   *
   * @example
   * ```ts
   * reply.info("User has been updated").body({ success: updatedUser }).respond();
   * reply.body({ error: formattedError }).respond();
   * ```
   */
  respond: ResType<SuccessReady, ErrorReady> = (() => {
    if (this._body) {
      this.ok();
    } else if (this._errorBody) {
      this.fail();
    }
    this._reset();
  }) as any;

  /**
   * Send a standard 200 OK response.
   *
   * @example
   * ```ts
   * reply.info("Fetched user data").body({ success: user }).ok();
   * ```
   */
  ok: ResType<SuccessReady, false> = (() => {
    this._finalize(true);
    if (this._body) {
      this._res.status(200).json(this._jsonPayload);
    }
    this._reset();
  }) as any;

  /**
   * Send a standard 204 No Content response.
   *
   * @example
   * ```ts
   * reply.noContent();
   * ```
   */
  noContent() {
    this._finalize(true);
    this._res.status(204).end();
    this._reset();
  }

  /**
   * Send a standard 201 Created response.
   *
   * @example
   * ```ts
   * reply.body({ success: newUser }).created();
   * ```
   */
  created: ResType<SuccessReady, false> = (() => {
    this._finalize(true);
    if (this._body) {
      this._res.status(201).json(this._jsonPayload);
    }
    this._reset();
  }) as any;

  /**
   * Send an error response using ErrorReplyType.
   *
   * @example
   * ```ts
   * reply.body({
   *   error: { code: "INVALID_AUTH", message: "Invalid token", status: 401 }
   * }).fail();
   * ```
   */
  fail: ResType<false, ErrorReady> = (() => {
    this._finalize(false);
    const errorBody = this._errorBody;
    if (errorBody) {
      const status = errorBody.status ?? statusAlias.find((s) => s.code.includes(errorBody.code))?.status ?? 500;
      if (status >= 500) {
        console.error("\nServer error found and sent successfully:");
        console.table(errorBody);
      } else {
        if (NODE_ENV !== "production") {
          console.warn("\nClient error found and sent successfully:");
          console.table(errorBody);
        }
      }
      this._res.status(status).json(this._jsonPayload);
    }
    this._reset();
  }) as any;
}
