import { createApiApp } from "../apps/api/dist/src/server";

let appPromise: ReturnType<typeof createApiApp> | undefined;

export default async function handler(req: any, res: any) {
  appPromise ||= createApiApp();
  const app = await appPromise;
  if (!req.url.startsWith("/api/v1")) {
    req.url = `/api/v1${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
