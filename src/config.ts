export const {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  NODE_ENV,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  EMAIL_AUTH_USER,
  EMAIL_AUTH_PASS,
  BASE64_SECRET,
  CHARDY_EMAIL,
} = process.env;
export const CLIENT_URL = NODE_ENV === "development" ? process.env.CLIENT_URL_DEV : process.env.CLIENT_URL;
export const PAGINATION_LIMIT = NODE_ENV === "development" ? 100 : 30;
export const ACCESS_TOKEN_KEY = "ACCESS_TOKEN";
export const REFRESH_TOKEN_KEY = "REFRESH_TOKEN";
