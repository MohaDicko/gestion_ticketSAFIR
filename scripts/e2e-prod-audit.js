/* E2E de bout en bout contre l'API déployée. Usage: node scripts/e2e-prod-audit.js [baseUrl]
 * Crée des comptes/tickets "E2E ..." puis les supprime (tickets) / désactive (comptes). */
const B = (process.argv[2] || "https://gestionticketsafir.vercel.app") + "/api/v1";
const results = [];
const ok = (name, cond, extra = "") => {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  -> " + extra : ""}`);
};

async function call(sess, method, path, body) {
  const headers = { "content-type": "application/json" };
  if (sess) {
    headers.cookie = sess.cookie;
    if (method !== "GET") headers["x-csrf-token"] = sess.csrf;
  }
  const r = await fetch(B + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  const txt = await r.text();
  try { data = JSON.parse(txt); } catch { data = txt; }
  return { status: r.status, data };
}
async function login(email, password) {
  const r = await fetch(B + "/auth/login", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }),
  });
  const cookies = r.headers.getSetCookie().map((c) => c.split(";")[0]);
  const data = await r.json().catch(() => ({}));
  return { status: r.status, cookie: cookies.join("; "), csrf: (cookies.find((c) => c.startsWith("dc_csrf=")) || "").split("=")[1], user: data.user };
}

(async () => {
  const stamp = Date.now();
  const created = { tickets: [], devId: null, consId: null };
  const admin = await login("aliko.getheme@safirconsulting.net", "Ev@ngel10n");
  ok("Admin login", admin.status === 201);

  // ---- Profils existants
  for (const [e, p] of [
    ["superadmin@safirconsulting.net", "Ev@ngel10n"],
    ["anoop.pandimukkula@safirconsulting.net", "Safir2026!Dev"],
    ["mohamed.dicko@safirconsulting.com", "Safir@2026"],
    ["melissa.diakite@safirconsulting.net", "Safir2026!Consultant"],
  ]) {
    const l = await login(e, p);
    ok(`Login ${e}`, l.status === 201, `status ${l.status}`);
  }
  ok("Login mauvais mot de passe => 401", (await login("aliko.getheme@safirconsulting.net", "wrong")).status === 401);

  // ---- Onboarding développeur + règle d'or
  const devEmail = `e2e.dev${stamp}@safirconsulting.net`;
  let r = await call(admin, "POST", "/developers", { firstName: "E2E", lastName: "Dev", email: devEmail, jobTitle: "Dev SAP", weeklyCapacityHours: 40 });
  ok("Admin crée un développeur", r.status === 201, `status ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  created.devId = r.data?.id;
  let dev = await login(devEmail, "Safir2026!DevCapacity");
  ok("Dev: 1ère connexion OK avec mot de passe initial", dev.status === 201);
  ok("Dev: mustChangePassword = true", dev.user?.mustChangePassword === true);
  r = await call(dev, "GET", "/tickets");
  ok("Dev: accès bloqué (403) tant que mot de passe non changé", r.status === 403, `status ${r.status}`);
  r = await call(dev, "POST", "/auth/change-password", { currentPassword: "Safir2026!DevCapacity", newPassword: "E2eNew2026!dev" });
  ok("Dev: changement de mot de passe", r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  ok("Dev: ancien mot de passe refusé", (await login(devEmail, "Safir2026!DevCapacity")).status === 401);
  dev = await login(devEmail, "E2eNew2026!dev");
  ok("Dev: nouveau mot de passe persiste, mustChangePassword=false", dev.status === 201 && dev.user?.mustChangePassword === false);

  // ---- Onboarding consultant + règle d'or
  const consEmail = `e2e.cons${stamp}@safirconsulting.net`;
  r = await call(admin, "POST", "/consultants", { firstName: "E2E", lastName: "Consultant", email: consEmail });
  ok("Admin crée un consultant", r.status === 201, `status ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  created.consId = r.data?.id;
  let cons = await login(consEmail, "Safir2026!Consultant");
  ok("Consultant: 1ère connexion + mustChangePassword", cons.status === 201 && cons.user?.mustChangePassword === true);
  r = await call(cons, "POST", "/auth/change-password", { currentPassword: "Safir2026!Consultant", newPassword: "E2eNew2026!cons" });
  ok("Consultant: changement de mot de passe", r.status === 201 || r.status === 200, `status ${r.status}`);
  cons = await login(consEmail, "E2eNew2026!cons");
  ok("Consultant: nouveau mot de passe persiste", cons.status === 201 && cons.user?.mustChangePassword === false);

  // ---- Admin: création de tickets de tous types
  for (const t of ["ADDON", "GATEWAY", "S4HANA", "REPORT", "SUPPORT", "INTEGRATION", "MAINTENANCE", "CUSTOMTYPE"]) {
    for (const p of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]) {
      if (p !== "MEDIUM" && !["ADDON", "GATEWAY"].includes(t)) continue;
      r = await call(admin, "POST", "/tickets", { title: `E2E ${t} ${p} ${stamp}`, description: "e2e", typeCode: t, priorityCode: p, estimatedHours: 4, actorId: admin.user?.id, recipientEmails: [] });
      ok(`Admin crée ticket ${t}/${p}`, r.status === 201, `status ${r.status}`);
      if (r.data?.id) created.tickets.push(r.data.id);
    }
  }

  // ---- Consultant crée un ticket
  r = await call(cons, "POST", "/tickets", { title: `E2E Consultant ${stamp}`, description: "demande consultant", typeCode: "ADDON", priorityCode: "MEDIUM", estimatedHours: 8, actorId: cons.user?.id, creatorName: "E2E Consultant", creatorEmail: consEmail, recipientEmails: [] });
  ok("Consultant crée un ticket", r.status === 201, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  const tk = r.data;
  if (tk?.id) created.tickets.push(tk.id);
  r = await call(admin, "GET", "/tickets");
  ok("Admin voit le ticket du consultant", Array.isArray(r.data) && r.data.some((t) => t.id === tk?.id));
  r = await call(cons, "GET", "/tickets");
  ok("Consultant lit la liste des tickets", r.status === 200, `status ${r.status}`);

  // ---- Qualification + affectation
  ok("Ticket consultant créé en RECEIVED", tk?.status === "RECEIVED", `statut ${tk?.status}`);
  for (const s of ["TO_QUALIFY", "READY"]) {
    r = await call(admin, "PATCH", `/tickets/${tk.reference}/status`, { status: s, actorId: admin.user?.id });
    ok(`Admin statut -> ${s}`, r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  }
  r = await call(admin, "POST", `/tickets/${tk.reference}/assign`, { developerId: created.devId, allocatedHours: 8, actorId: admin.user?.id });
  ok("Admin affecte le ticket au dev", r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);

  // ---- Dev: chrono, pause, blocage, reprise, livraison
  r = await call(dev, "POST", "/time-entries/start", { ticketId: tk.id });
  ok("Dev démarre le chronomètre", r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  const entryId = r.data?.id;
  r = await call(dev, "GET", "/time-entries/active");
  ok("Dev: chrono actif", r.status === 200 && !!entryId && r.data?.id === entryId);
  r = await call(dev, "POST", `/time-entries/${entryId}/pause`);
  ok("Dev: pause", r.status === 201 || r.status === 200, `status ${r.status}`);
  r = await call(dev, "POST", `/time-entries/${entryId}/resume`);
  ok("Dev: reprise", r.status === 201 || r.status === 200, `status ${r.status}`);
  r = await call(dev, "POST", `/tickets/${tk.reference}/blockers`, { reason: "Accès SAP manquant", actorId: dev.user?.id });
  ok("Dev déclare un blocage", r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  r = await call(admin, "GET", "/time-entries/live");
  ok("Admin: activité live accessible", r.status === 200, `status ${r.status}`);
  r = await call(admin, "GET", `/tickets/${tk.reference}`);
  ok("Admin voit le ticket en BLOCKED", r.data?.status === "BLOCKED", `statut ${r.data?.status}`);
  r = await call(cons, "POST", `/tickets/${tk.reference}/unblock`, { resolution: "Accès fourni", actorId: cons.user?.id });
  ok("Consultant débloque le ticket", r.status === 201 || r.status === 200, `status ${r.status}`);
  r = await call(admin, "GET", `/tickets/${tk.reference}`);
  ok("Ticket revenu IN_PROGRESS après déblocage", r.data?.status === "IN_PROGRESS", `statut ${r.data?.status}`);

  // ---- Messagerie dev / admin / consultant
  for (const [who, s, role] of [["dev", dev, "DEVELOPER"], ["admin", admin, "ADMIN"], ["consultant", cons, "CONSULTANT"]]) {
    r = await call(s, "POST", `/tickets/${tk.reference}/comments`, { content: `message ${who}`, authorId: s.user?.id, authorName: who, authorEmail: s.user?.email, authorRole: role });
    ok(`Messagerie: ${who} poste un commentaire`, r.status === 201 || r.status === 200, `status ${r.status}`);
  }
  r = await call(admin, "GET", `/tickets/${tk.reference}`);
  ok("Les 3 messages sont visibles", (r.data?.comments || []).length >= 3, `comments ${(r.data?.comments || []).length}`);

  r = await call(dev, "GET", "/time-entries/active");
  ok("Le blocage a clôturé le chrono du dev", r.status === 200 && !r.data, `status ${r.status}`);
  r = await call(dev, "POST", "/time-entries/start", { ticketId: tk.id });
  ok("Dev redémarre le chrono après déblocage", r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  await new Promise((res) => setTimeout(res, 7000));
  r = await call(dev, "POST", `/time-entries/${r.data?.id}/stop`, { comment: "fin" });
  ok("Dev arrête le chrono (temps consigné)", (r.status === 201 || r.status === 200) && r.data?.ignored === false, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  r = await call(dev, "PATCH", `/tickets/${tk.reference}/status`, { status: "DELIVERED", actorId: dev.user?.id, reason: "livré" });
  ok("Dev livre le ticket (DELIVERED)", r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);

  // ---- Recette consultant: rejet puis validation
  r = await call(cons, "PATCH", `/tickets/${tk.reference}/status`, { status: "IN_PROGRESS", actorId: cons.user?.id, reason: "recette refusée" });
  ok("Consultant rejette la recette (retour IN_PROGRESS)", r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  r = await call(dev, "PATCH", `/tickets/${tk.reference}/status`, { status: "DELIVERED", actorId: dev.user?.id });
  ok("Dev relivre", r.status === 200, `status ${r.status}`);
  r = await call(cons, "PATCH", `/tickets/${tk.reference}/status`, { status: "CLOSED", actorId: cons.user?.id, reason: "recette validée" });
  ok("Consultant valide la recette (CLOSED)", r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);

  // ---- Reporting & feuilles de temps
  const day = new Date().toISOString().slice(0, 10);
  r = await call(dev, "GET", `/time-entries/report?from=${day}&to=${day}`);
  ok("Dev: rapport d'activité", r.status === 200, `status ${r.status}`);
  r = await call(admin, "GET", `/time-entries/report?developerId=${created.devId}&from=${day}&to=${day}`);
  ok("Admin: rapport d'un dev", r.status === 200, `status ${r.status}`);
  r = await call(admin, "GET", "/developers"); ok("Admin: liste devs", r.status === 200);
  r = await call(admin, "GET", "/consultants"); ok("Admin: liste consultants", r.status === 200);
  r = await call(admin, "GET", "/skills"); ok("Skills", r.status === 200);
  r = await call(dev, "GET", "/developers"); ok("RBAC: dev interdit sur /developers (403)", r.status === 403, `status ${r.status}`);
  r = await call(cons, "DELETE", `/tickets/${tk.id}`); ok("RBAC: consultant interdit de supprimer (403)", r.status === 403, `status ${r.status}`);
  r = await call(null, "GET", "/tickets"); ok("Sans session => 401", r.status === 401);

  // ---- Nettoyage
  for (const id of created.tickets) await call(admin, "DELETE", `/tickets/${id}`);
  if (created.devId) await call(admin, "DELETE", `/developers/${created.devId}`);
  if (created.consId) await call(admin, "DELETE", `/consultants/${created.consId}`);
  r = await call(admin, "GET", "/tickets");
  ok("Nettoyage: aucun ticket E2E restant", Array.isArray(r.data) && !r.data.some((t) => /^E2E /.test(t.title)));

  const failed = results.filter((x) => !x.pass);
  console.log(`\nRESULTAT: ${results.length - failed.length}/${results.length} OK`);
  if (failed.length) console.log("ECHECS:\n- " + failed.map((f) => f.name).join("\n- "));
})().catch((e) => { console.error("CRASH", e); process.exit(1); });

