import { createApiApp } from "../../../../api/dist/src/server";

let appPromise: ReturnType<typeof createApiApp> | undefined;

export const config = {
  api: {
    externalResolver: true,
  },
};

export default async function handler(req: any, res: any) {
  try {
    appPromise ||= createApiApp().catch((err) => {
      appPromise = undefined;
      throw err;
    });
    const app = await appPromise;
    if (!req.url.startsWith("/api/v1")) {
      req.url = `/api/v1${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
    }
    const expressApp = app.getHttpAdapter().getInstance();
    await new Promise<void>((resolve, reject) => {
      const finish = () => {
        res.removeListener("finish", finish);
        res.removeListener("close", finish);
        resolve();
      };

      res.once("finish", finish);
      res.once("close", finish);
      Promise.resolve(expressApp(req, res)).catch(reject);
    });
  } catch (err: any) {
    console.error("[API Handler Error]", err);
    if (!res.headersSent) {
      res.status(500).json({
        statusCode: 500,
        message: err?.message || "Internal Server Error",
      });
    }
  }
}
