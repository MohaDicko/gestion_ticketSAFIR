import { createApiApp } from "../../api/src/server";

let appPromise: ReturnType<typeof createApiApp> | undefined;

export default async function handler(req: any, res: any) {
  appPromise ||= createApiApp();
  const app = await appPromise;
  return app.getHttpAdapter().getInstance()(req, res);
}
