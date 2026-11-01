import { createApiApp } from "../apps/api/src/server";

let appPromise: ReturnType<typeof createApiApp> | undefined;

export default async function handler(req: any, res: any) {
  appPromise ||= createApiApp();
  const app = await appPromise;
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
