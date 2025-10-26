import { CodeError } from "../server-error/type";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

// UNSETTED FIELDS ⚠️
export type Fields = any;

/**
 * Structure of an error response payload.
 */
export interface ErrorReplyType {
  /** Unique error code */
  code: CodeError;
  /** Human-readable message */
  message: string;
  /** Optional UI title for displaying error */
  title?: string;
  /** Extra details for debugging */
  details?: string;
  /** Optional field reference (useful for forms) */
  field?: Fields;
  /** HTTP status code override */
  status?: number;
}

export interface RestError extends Omit<ErrorReplyType, "message" | "code"> {}

/**
 * Standard response envelope.
 */
export interface Replied<T, Success extends boolean = boolean> {
  meta: {
    /** Status of response (SUCCESS/ERROR) */
    status: Success extends true ? "SUCCESS" : "ERROR";
  } & (Success extends true
    ? {
        /** Indicates whether there is next data (for pagination) */
        hasNext?: boolean;
        /** Next offset for pagination */
        nextOffset?: number | null;
        /** Optional information message */
        information?: string;
      }
    : never);
  /** Response payload data */
  data: T;
}

export type ResFunc = () => void;
export type ResType<SuccessReady extends boolean, ErrorReady extends boolean> = IsTruthy<SuccessReady, ResFunc, IsTruthy<ErrorReady, ResFunc>>;

export type CookieUserBase = { id: string };
export type CookieUser<T> = T extends CookieUserBase ? { user?: CookieUserBase } : { user: CookieUserBase };

export type CookieType<T = undefined> = EitherWithKeys<
  {
    template: "REFRESH" | "ACCESS" | "REFRESH_ACCESS";
  },
  ResponseCookie
> & { rememberMe?: boolean } & CookieUser<T>;

export interface ReplyOptions<T = undefined> {
  cookie: CookieType<T>;
  paginateMeta: { limit: number; offset: number };
  info: string;
}
