import { Injectable, OnModuleInit, Logger } from "@nestjs/common";

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

function fromFirestoreValue(v: any): any {
  if (!v || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return Boolean(v.booleanValue);
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue?.values || []).map(fromFirestoreValue);
  if ("mapValue" in v) return fromFirestoreFields(v.mapValue?.fields || {});
  return null;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields || {})) {
    res[k] = fromFirestoreValue(v);
  }
  return res;
}

class FirestoreRestAdapter {
  private readonly baseUrl: string;

  constructor(projectId: string) {
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  }

  collection(collectionName: string) {
    const baseUrl = this.baseUrl;
    return {
      doc(docId: string) {
        const encodedId = encodeURIComponent(docId);
        const docUrl = `${baseUrl}/${collectionName}/${encodedId}`;
        return {
          async get() {
            const res = await fetch(docUrl, { method: "GET" });
            if (res.status === 404) {
              return { exists: false, id: docId, data: () => undefined };
            }
            if (!res.ok) {
              throw new Error(`Firestore GET error: ${res.status}`);
            }
            const json = (await res.json()) as any;
            const parsed = fromFirestoreFields(json.fields || {});
            return {
              exists: true,
              id: docId,
              data: () => parsed,
            };
          },
          async set(data: Record<string, any>, options?: { merge?: boolean }) {
            const keys = Object.keys(data || {}).filter((k) => data[k] !== undefined);
            let url = docUrl;
            if (options?.merge && keys.length > 0) {
              const maskParams = keys
                .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
                .join("&");
              url = `${docUrl}?${maskParams}`;
            }
            const res = await fetch(url, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fields: toFirestoreFields(data) }),
            });
            if (!res.ok) {
              throw new Error(`Firestore SET error: ${res.status}`);
            }
          },
        };
      },
      where(field: string, _op: string, value: any) {
        return {
          limit(max: number) {
            return {
              async get() {
                const queryUrl = `${baseUrl}:runQuery`;
                const res = await fetch(queryUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    structuredQuery: {
                      from: [{ collectionId: collectionName }],
                      where: {
                        fieldFilter: {
                          field: { fieldPath: field },
                          op: "EQUAL",
                          value: toFirestoreValue(value),
                        },
                      },
                      limit: max,
                    },
                  }),
                });
                if (!res.ok) {
                  return { empty: true, docs: [] };
                }
                const rows = (await res.json()) as any[];
                const docs = (rows || [])
                  .filter((r) => r && r.document)
                  .map((r) => {
                    const nameParts = String(r.document.name || "").split("/");
                    const id = decodeURIComponent(nameParts[nameParts.length - 1] || "");
                    const parsed = fromFirestoreFields(r.document.fields || {});
                    return {
                      id,
                      data: () => parsed,
                    };
                  });
                return {
                  empty: docs.length === 0,
                  docs,
                };
              },
            };
          },
        };
      },
    };
  }
}

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private restClient: FirestoreRestAdapter | null = null;

  onModuleInit() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.restClient) return;
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "tandem-2-75612";
    this.restClient = new FirestoreRestAdapter(projectId);
    this.logger.log(`✅ Connecteur Cloud Firestore initialisé pour le projet ${projectId}`);
  }

  get firestore(): any {
    this.ensureInitialized();
    return this.restClient;
  }

  get auth(): any {
    return null;
  }
}
