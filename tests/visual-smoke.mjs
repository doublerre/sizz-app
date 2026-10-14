import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve, extname } from "node:path";
import { tmpdir } from "node:os";

// Test-only origin and fake JWT: no requests or changes reach the real backend.
const toastTest = process.argv.includes("--toasts");
const actionsTest = process.argv.includes("--actions");
const feedbackTest = process.argv.includes("--feedback");
const activationTest = process.argv.includes("--activation");
const builderDragTest = process.argv.includes("--builder-drag");
const calendarTest = process.argv.includes("--calendars");
const modalityTest = process.argv.includes("--modalities");
const publicCallsTest = process.argv.includes("--public-calls");
const reviewTest = process.argv.includes("--review-regressions");
let rejectAttendance = false;
const pauseTest = process.argv.includes("--pause");
const activationWrites = [];
let rejectActivation = false;
let failingRead = "";
let delayedRead = "";
const readCounts = new Map();
const callFlow = process.argv.includes("--call-flow") || toastTest || pauseTest;
let rejectCallStatus = false;
const output = await mkdtemp(join(tmpdir(), "sizz-becas-review-"));
const browser =
  process.env.SIZZ_TEST_BROWSER ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const field = (key, label, type, extra = {}) => ({
  key,
  label,
  type,
  helpText: "",
  required: true,
  sortOrder: 0,
  minLength: null,
  maxLength: null,
  minValue: null,
  maxValue: null,
  maxFileBytes: 10485760,
  allowedFileTypes: [],
  correctAnswer: null,
  scoreWeight: null,
  options: [],
  ...extra,
});
const fields = [
  field("university", "Institución educativa", "SHORT_TEXT"),
  field("career", "Carrera o área de estudio", "SHORT_TEXT"),
  field("semester", "Semestre actual", "NUMBER", { minValue: 1, maxValue: 12 }),
  field("hours", "Disponibilidad semanal", "NUMBER"),
  field("motivation", "¿Por qué quieres ser guía Zigzag?", "PARAGRAPH"),
  field("id_document", "Identificación oficial", "FILE", {
    allowedFileTypes: ["PDF", "IMAGE"],
  }),
];
const version = {
  id: "version-1",
  version: 1,
  createdAt: "2026-10-01T10:00:00Z",
  fields,
};
const examVersion = {
  id: "exam-version",
  version: 1,
  createdAt: version.createdAt,
  fields: [
    field(
      "science",
      "¿Qué instrumento permite observar objetos muy pequeños?",
      "SINGLE_SELECT",
      {
        correctAnswer: "microscope",
        scoreWeight: 1,
        options: [
          { value: "microscope", label: "Microscopio" },
          { value: "telescope", label: "Telescopio" },
        ],
      },
    ),
  ],
};
const forms = [
  {
    id: "form-1",
    name: "Postulación para guías",
    purpose: "APPLICATION",
    active: true,
    versions: [version],
  },
  {
    id: "exam-form",
    name: "Evaluación de ciencia",
    purpose: "EXAM",
    active: true,
    versions: [examVersion],
  },
];
const category = {
  id: "category-1",
  code: "A",
  name: "Categoría A",
  monthlyAmount: 6000,
  monthlyHours: 60,
  active: true,
};
const period = {
  id: "period-1",
  name: "Enero – Junio 2027",
  startDate: "2027-01-01",
  endDate: "2027-06-30",
  active: true,
};
const call = {
  id: "call-1",
  periodId: period.id,
  name: "Guías de verano 2027",
  opensOn: "2026-10-01",
  closesOn: "2026-12-18",
  durationMonths: 6,
  totalBudget: 360000,
  committedBudget: 36000,
  availableBudget: 324000,
  status: "DRAFT",
  applicationTypes: ["NEW_ENTRY", "RENEWAL"],
  categories: [category],
};
const application = {
  id: "application-1",
  callId: call.id,
  periodId: period.id,
  periodName: period.name,
  applicationType: "NEW_ENTRY",
  status: "VALIDATED",
  createdAt: "2026-10-02T10:42:00Z",
  submittedAt: "2026-10-02T10:42:00Z",
  form: version,
  answers: {
    university: "Universidad Autónoma de Zacatecas",
    career: "Comunicación",
    semester: 6,
    hours: 20,
    motivation: "Me interesa acercar la ciencia a niñas, niños y familias.",
  },
  files: [
    {
      id: "file-1",
      fieldKey: "id_document",
      originalName: "identificacion.pdf",
      mediaType: "application/pdf",
      sizeBytes: 2048,
      status: "APPROVED",
      reviewComment: null,
      uploadedAt: "2026-10-02T10:42:00Z",
    },
  ],
};
const applicants = [
  {
    application,
    studentId: "student-1",
    firstName: "María",
    lastName: "Hernández",
    email: "maria@example.test",
  },
  {
    application: { ...application, id: "application-2", status: "SUBMITTED" },
    studentId: "student-2",
    firstName: "Carlos",
    lastName: "Pérez",
    email: "carlos@example.test",
  },
];
const grant = {
  id: "grant-1",
  callId: call.id,
  studentId: "student-1",
  categoryCode: "A",
  categoryName: category.name,
  monthlyAmount: 6000,
  monthlyHours: 60,
  durationMonths: 6,
  committedAmount: 36000,
  awardedAt: "2026-10-02T10:42:00Z",
};
const months = [
  {
    grantId: grant.id,
    monthNumber: 1,
    monthlyHours: 60,
    minimumHours: 48,
    clockHours: 50,
    extraHours: 2,
    carriedInHours: 0,
    creditedHours: 52,
    remainingHours: 8,
    eligible: true,
    payableHours: 52,
    estimatedAmount: 5200,
    excessHours: 0,
    carryableExcessHours: 0,
    carriedOutHours: 0,
  },
];
const assignments = [
  {
    id: "assignment-1",
    formId: "form-1",
    formName: forms[0].name,
    purpose: "APPLICATION",
    formVersionId: version.id,
    version: 1,
    applicationType: "NEW_ENTRY",
  },
  {
    id: "assignment-2",
    formId: "exam-form",
    formName: forms[1].name,
    purpose: "EXAM",
    formVersionId: examVersion.id,
    version: 1,
    applicationType: null,
  },
];
const routes = new Map([
  [
    "/api/scholarships/open-calls",
    [
      {
        ...call,
        periodName: period.name,
        applicationType: "NEW_ENTRY",
        form: version,
      },
    ],
  ],
  ["/api/scholarships/periods", [period]],
  ["/api/scholarships/categories", [category]],
  ["/api/scholarships/calls", [call]],
  ["/api/scholarships/forms", forms],
  ["/api/scholarships/calls/call-1/forms", assignments],
  ["/api/scholarships/applications/mine", [application]],
  ["/api/scholarships/applications/application-1", application],
  ["/api/scholarships/admin/calls/call-1/applications", applicants],
  [
    "/api/scholarships/applications/application-1/exams",
    [
      {
        formVersionId: examVersion.id,
        name: forms[1].name,
        form: {
          ...examVersion,
          fields: examVersion.fields.map((field) => ({
            ...field,
            correctAnswer: null,
          })),
        },
        scorePercent: null,
        submittedAt: null,
      },
    ],
  ],
  [
    "/api/scholarships/admin/calls/call-1/training-sessions",
    [
      {
        id: "session-1",
        callId: call.id,
        name: "Acción Reacción",
        weight: 100,
        presentCount: 1,
      },
    ],
  ],
  [
    "/api/scholarships/admin/training-sessions/session-1/attendance",
    [
      {
        studentId: "student-1",
        email: applicants[0].email,
        firstName: "María",
        lastName: "Hernández",
        markedAt: application.createdAt,
      },
    ],
  ],
  [
    "/api/scholarships/admin/calls/call-1/merit-list",
    {
      callId: call.id,
      examWeight: 70,
      attendanceWeight: 30,
      applicants: [
        {
          rank: 1,
          applicationId: application.id,
          studentId: "student-2",
          firstName: "Carlos",
          lastName: "Pérez",
          examPercent: 90,
          attendancePercent: 100,
          finalPercent: 93,
        },
      ],
    },
  ],
  ["/api/scholarships/calls/call-1/grants", [grant]],
  ["/api/scholarships/my-grants", [grant]],
  ["/api/scholarships/grants/grant-1/months", months],
  ["/api/scholarships/admin/grants/grant-1/months", months],
  [
    "/api/scholarships/admin/grants/grant-1/attendance",
    [
      {
        id: "incident-1",
        grantId: grant.id,
        date: "2026-10-02",
        firstPunch: "2026-10-02T09:00:00",
        lastPunch: null,
        workedHours: 0,
        status: "INCIDENT",
        explanation: null,
      },
    ],
  ],
]);
const unknown = [];
const published = [];
const callWrites = [];
const fakeToken = (role) =>
  `test.${Buffer.from(JSON.stringify({ sub: "qa@example.test", uid: "qa-test-id", role, exp: 4102444800 })).toString("base64url")}.test`;
routes.set(
  "/api/scholarships/public-calls",
  routes.get("/api/scholarships/open-calls").map((call) => ({
    id: call.id,
    name: call.name,
    periodId: call.periodId,
    periodName: call.periodName,
    opensOn: call.opensOn,
    closesOn: call.closesOn,
    durationMonths: call.durationMonths,
    applicationTypes: call.applicationTypes,
  })),
);
if (pauseTest) {
  const extra = {
    ...category,
    id: "category-2",
    code: "B",
    name: "Categoría B",
  };
  routes.get("/api/scholarships/categories").push(extra);
  call.categories.push(extra);
}
if (actionsTest) {
  routes.set("/api/scholarships/calls", [
    call,
    ...[2, 3, 4].map((number) => ({
      ...call,
      id: `call-${number}`,
      name: `Convocatoria ${number}`,
    })),
  ]);
}
if (callFlow) {
  assignments.splice(1);
  assignments.push({
    ...assignments[0],
    id: "renewal-assignment",
    applicationType: "RENEWAL",
  });
  routes.set("/api/scholarships/calls/call-1/grants", []);
  routes.set("/api/scholarships/admin/calls/call-1/training-sessions", []);
  routes.set("/api/scholarships/admin/calls/call-1/merit-list", {
    callId: call.id,
    examWeight: 70,
    attendanceWeight: 30,
    applicants: [],
  });
}
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    if (
      reviewTest &&
      request.method === "POST" &&
      url.pathname === "/api/auth/register"
    ) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      assert.ok(["GUIDE", "USER"].includes(input.role));
      response
        .writeHead(201, { "Content-Type": "application/json" })
        .end(
          JSON.stringify({
            accessToken: fakeToken(input.role),
            refreshToken: "test-registration-refresh",
            tokenType: "Bearer",
            expiresIn: 3600,
          }),
        );
      return;
    }
    if (
      reviewTest &&
      ["POST", "DELETE"].includes(request.method) &&
      url.pathname ===
        "/api/scholarships/admin/training-sessions/session-1/attendance/student-1"
    ) {
      if (rejectAttendance) {
        response
          .writeHead(422, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({ message: "No se pudo actualizar la asistencia." }),
          );
        return;
      }
      const attendance = routes.get(
        "/api/scholarships/admin/training-sessions/session-1/attendance",
      );
      attendance.splice(0);
      if (request.method === "POST")
        attendance.push({ studentId: "student-1" });
      routes.get(
        "/api/scholarships/admin/calls/call-1/training-sessions",
      )[0].presentCount = attendance.length;
      response.writeHead(200, { "Content-Type": "application/json" }).end("{}");
      return;
    }
    if (request.method === "GET") {
      readCounts.set(url.pathname, (readCounts.get(url.pathname) ?? 0) + 1);
      if (url.pathname === delayedRead)
        await new Promise((resolve) => setTimeout(resolve, 400));
      if (url.pathname === failingRead) {
        response.writeHead(500, { "Content-Type": "application/json" }).end(
          JSON.stringify({
            message: "Ocurrió un error interno. Intenta de nuevo más tarde.",
          }),
        );
        return;
      }
    }
    if (
      request.method === "PUT" &&
      /^\/api\/scholarships\/(forms|periods)\/[^/]+\/status$/.test(url.pathname)
    ) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      activationWrites.push([url.pathname, input]);
      if (rejectActivation) {
        response
          .writeHead(409, { "Content-Type": "application/json" })
          .end(JSON.stringify({ message: "No se pudo cambiar el estado." }));
        return;
      }
      const item = url.pathname.includes("/periods/")
        ? period
        : forms.find((form) => url.pathname.includes(`/${form.id}/`));
      assert.ok(item);
      item.active = input.active;
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(item));
      return;
    }
    if (
      request.method === "PUT" &&
      url.pathname === "/api/scholarships/calls/call-1"
    ) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      callWrites.push([url.pathname, input]);
      Object.assign(call, input);
      if (input.categoryIds)
        call.categories = routes
          .get("/api/scholarships/categories")
          .filter((category) => input.categoryIds.includes(category.id));
      call.availableBudget = call.totalBudget - call.committedBudget;
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(call));
      return;
    }
    if (
      callFlow &&
      ((request.method === "PUT" &&
        url.pathname === "/api/scholarships/calls/call-1/status") ||
        (request.method === "POST" &&
          url.pathname === "/api/scholarships/calls/call-1/forms"))
    ) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      callWrites.push([url.pathname, input]);
      if (input.status && rejectCallStatus) {
        response.writeHead(422, { "Content-Type": "application/json" }).end(
          JSON.stringify({
            message: "No se pudo cerrar la convocatoria. Intenta de nuevo.",
          }),
        );
        return;
      }
      let result;
      if (input.status) {
        call.status = input.status;
        result = call;
      } else {
        result = {
          id: "late-exam",
          formId: "exam-form",
          formName: forms[1].name,
          purpose: "EXAM",
          formVersionId: input.formVersionId,
          version: 1,
          applicationType: null,
        };
        assignments.push(result);
      }
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(result));
      return;
    }
    if (
      request.method === "POST" &&
      url.pathname === "/api/scholarships/forms/form-1/versions"
    ) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      published.push(input);
      const form = {
        ...forms[0],
        versions: [
          ...forms[0].versions,
          { ...version, id: "version-2", version: 2, fields: input.fields },
        ],
      };
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(form));
      return;
    }
    if (request.method !== "GET" || !routes.has(url.pathname)) {
      unknown.push(`${request.method} ${url.pathname}`);
      response.writeHead(404).end();
      return;
    }
    response
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify(routes.get(url.pathname)));
    return;
  }
  try {
    const path = url.pathname.startsWith("/assets/")
      ? resolve("dist", `.${url.pathname}`)
      : resolve("dist/index.html");
    assert.ok(path.startsWith(resolve("dist")));
    let content = await readFile(path);
    if (path.endsWith("index.html")) {
      const role = url.searchParams.get("qa-role") ?? "ADMIN";
      const claims = {
        sub: "qa@example.test",
        uid: "qa-test-id",
        role,
        exp: 4102444800,
      };
      const token = `test.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.test`;
      const verifyRole = url.searchParams.get("qa-verify-role");
      const verifySetup = verifyRole
        ? `history.replaceState({usr:${JSON.stringify({ firstName: "Test", lastName: "Student", email: "verify@example.test", password: "TestOnly123!", role: verifyRole })}},'');`
        : "";
      content = content
        .toString()
        .replace(
          "<head>",
          `<head><script>${verifySetup}${role === "NONE" ? "localStorage.removeItem('sizz_access_token')" : `localStorage.setItem('sizz_access_token',${JSON.stringify(token)})`};window.__errors=[];addEventListener('error',e=>window.__errors.push(e.message));addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));setTimeout(()=>{window.__qaResult={case:${JSON.stringify(url.searchParams.get("qa-case"))},viewport:innerWidth,path:location.pathname,heading:document.querySelector('h1')?.textContent,errors:window.__errors,overflow:document.documentElement.scrollWidth>innerWidth,logos:[...document.querySelectorAll('img')].map(img=>({loaded:img.complete&&img.naturalWidth>0,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}))}},1500)</script>`,
        );
    }
    response
      .writeHead(200, {
        "Content-Type":
          extname(path) === ".js"
            ? "application/javascript"
            : extname(path) === ".css"
              ? "text/css"
              : extname(path) === ".png"
                ? "image/png"
                : extname(path) === ".svg"
                  ? "image/svg+xml"
                  : "text/html",
      })
      .end(content);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const screens = [
  ["/becas", "Convocatorias abiertas", "calls"],
  ["/becas/call-1", "Guías de verano 2027", "detail"],
  [
    "/cuenta/becas/application-1/editar",
    "Completa tu postulación",
    "application",
  ],
  ["/cuenta/becas/application-1", "Estado de tu postulación", "status"],
  [
    "/cuenta/becas/application-1/examenes",
    "Evaluaciones de la convocatoria",
    "exam",
  ],
  ["/cuenta/becas/horas", "Mis horas y becas", "guide-hours"],
  ["/app/becas", "Convocatorias para guías", "admin-calls"],
  ["/app/becas/nueva", "Editor de convocatoria", "admin-new"],
  ["/app/becas/call-1/editar", "Editor de convocatoria", "admin-editor"],
  ["/app/becas/formularios/nuevo", "Formularios y exámenes", "form-builder"],
  ["/app/becas/formularios/form-1", "Formularios y exámenes", "form-existing"],
  ["/app/becas/catalogos", "Periodos y categorías", "catalogs"],
  ["/app/becas/call-1/postulaciones", "Postulaciones", "admin-applications"],
  ["/app/becas/call-1/evaluacion", "Evaluación y otorgamiento", "evaluation"],
  ["/app/becas/call-1/horas", "Horas y becas", "admin-hours"],
];
let browserProcess;
let connection;
async function protocol(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("close", () => {
    for (const callback of pending.values())
      callback.reject(new Error("Test browser closed"));
    pending.clear();
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback.reject(message.error);
      else callback.resolve(message.result);
    }
  });
  return {
    close: () => socket.close(),
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      }),
  };
}
let caseId = 0;
async function render(path, width, filename) {
  const marker = String(++caseId);
  await connection.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width === 390 ? 844 : 1200,
    deviceScaleFactor: 1,
    mobile: width === 390,
  });
  await connection.send("Page.navigate", {
    url: `http://127.0.0.1:${port}${path}${path.includes("?") ? "&" : "?"}qa-case=${marker}`,
  });
  let parsed;
  for (let attempt = 0; attempt < 150; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const result = await connection.send("Runtime.evaluate", {
      expression: "window.__qaResult",
      returnByValue: true,
    });
    if (result.result?.value?.case === marker) {
      parsed = result.result.value;
      break;
    }
  }
  assert.ok(parsed, `No render result: ${path}`);
  if (parsed.viewport !== width) {
    const diagnosis = await connection.send("Runtime.evaluate", {
      expression: `JSON.stringify([...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>${width}+1).slice(-20).map(e=>[e.tagName,e.className,e.getBoundingClientRect().right,e.textContent.slice(0,60)]))`,
      returnByValue: true,
    });
    console.log(diagnosis.result.value);
  }
  assert.equal(parsed.viewport, width, `Expected actual ${width}px viewport`);
  assert.deepEqual(parsed.errors, [], `${path}: browser errors`);
  assert.equal(
    parsed.overflow,
    false,
    `${path}: horizontal overflow at ${width}`,
  );
  assert.ok(
    parsed.logos.every(
      (logo) => logo.loaded && logo.width > 0 && logo.height > 0,
    ),
    `${path}: missing logo`,
  );
  if (filename) {
    const metrics = await connection.send("Page.getLayoutMetrics");
    const image = await connection.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width,
        height: metrics.cssContentSize.height,
        scale: 1,
      },
    });
    await writeFile(filename, Buffer.from(image.data, "base64"));
  }
  return parsed;
}
try {
  browserProcess = spawn(
    browser,
    [
      "--headless",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${join(output, "profile")}`,
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  let debuggingPort;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      debuggingPort = (
        await readFile(join(output, "profile", "DevToolsActivePort"), "utf8")
      ).split("\n")[0];
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  assert.ok(debuggingPort, "Isolated test browser did not start");
  const tab = await fetch(
    `http://127.0.0.1:${debuggingPort}/json/new?about:blank`,
    { method: "PUT" },
  ).then((response) => response.json());
  connection = await protocol(tab.webSocketDebuggerUrl);
  await connection.send("Page.enable");
  await connection.send("Page.bringToFront");
  async function evaluate(expression) {
    const response = await connection.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    assert.ok(
      !response.exceptionDetails,
      JSON.stringify(response.exceptionDetails),
    );
    return response.result?.value;
  }
  async function waitForToastAnimation() {
    for (let attempt = 0; attempt < 50; attempt++) {
      if (
        await evaluate(
          `document.querySelector('.toast-card').getAnimations().every(animation=>animation.playState==='finished')`,
        )
      )
        return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.fail("Toast entrance animation did not finish");
  }
  if (reviewTest) {
    for (const width of [390, 540, 1440]) {
      await render("/cuenta/reservaciones?qa-role=USER", width);
      assert.equal(
        await evaluate(
          `document.querySelector('a[href^="/cuenta/reservaciones/"]')===null`,
        ),
        true,
        "No unimplemented reservation details are offered",
      );
      await evaluate(`document.querySelector('.calendar-trigger').click()`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        await evaluate(
          `[...document.querySelectorAll('.calendar-day')].every(day=>getComputedStyle(day).gridColumnStart==='auto' && getComputedStyle(day).gridColumnEnd==='auto')`,
        ),
        true,
        "Each calendar day occupies one column",
      );
      assert.ok(await evaluate(`(()=>{const r=document.querySelector('.calendar-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()`),'Reservation calendar remains fully visible');
      assert.equal(
        await evaluate(
          `new Set([...document.querySelectorAll('.calendar-weekday')].map(day=>Math.round(day.getBoundingClientRect().x))).size`,
        ),
        7,
      );
      await evaluate(`document.querySelector('.calendar-day').click()`);
      assert.equal(
        await evaluate(`document.querySelector('.calendar-popover')===null`),
        true,
      );
    }
    await evaluate(
      `localStorage.setItem('sizz_refresh_token','logout-test-refresh');[...document.querySelectorAll('a')].find(link=>link.textContent==='Cerrar sesión').click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(await evaluate(`location.pathname`), "/login");
    assert.equal(
      await evaluate(`localStorage.getItem('sizz_access_token')`),
      null,
    );
    assert.equal(
      await evaluate(`localStorage.getItem('sizz_refresh_token')`),
      null,
    );
    for (const role of ["GUIDE", "USER"]) {
      await render(
        `/register/verify-account?qa-role=NONE&qa-verify-role=${role}`,
        1440,
      );
      await evaluate(
        `document.querySelectorAll('.verify-otp-input').forEach(input=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'1');input.dispatchEvent(new Event('input',{bubbles:true}));});document.querySelector('.verify-btn-primary').click()`,
      );
      const destination =
        role === "GUIDE" ? "/cuenta/becas/horas" : "/cuenta/reservaciones";
      for (let attempt = 0; attempt < 50; attempt++) {
        if (
          await evaluate(`location.pathname===${JSON.stringify(destination)}`)
        )
          break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(
        await evaluate(`location.pathname`),
        destination,
        "Verified role reaches an allowed route",
      );
    }
    call.status = "OPEN";
    routes.set("/api/scholarships/calls/call-1/grants", []);
    const sessionsPath =
      "/api/scholarships/admin/calls/call-1/training-sessions";
    const meritPath = "/api/scholarships/admin/calls/call-1/merit-list";
    routes.get(sessionsPath)[0].presentCount = 0;
    routes
      .get("/api/scholarships/admin/training-sessions/session-1/attendance")
      .splice(0);
    await render("/app/becas/call-1/evaluacion", 1440);
    await evaluate(
      `document.querySelector('.sch-form-builder details').open=true;true`,
    );
    async function canConfigure() {
      return evaluate(
        `![...document.querySelectorAll('button')].find(button=>button.textContent==='Agregar sesión').disabled`,
      );
    }
    assert.equal(await canConfigure(), true);
    const sessionReads = readCounts.get(sessionsPath);
    const meritReads = readCounts.get(meritPath);
    delayedRead = sessionsPath;
    await evaluate(
      `document.querySelector('.sch-form-builder details input[type="checkbox"]').click()`,
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (
        readCounts.get(sessionsPath) > sessionReads &&
        (await canConfigure()) === false
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(await canConfigure(), false);
    assert.ok(
      readCounts.get(sessionsPath) > sessionReads,
      "Attendance refreshes session counts",
    );
    assert.ok(
      readCounts.get(meritPath) > meritReads,
      "Attendance refreshes merit",
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.equal(
      await canConfigure(),
      false,
      "First attendance keeps configuration locked",
    );
    delayedRead = "";
    await evaluate(
      `document.querySelector('.sch-form-builder details input[type="checkbox"]').click()`,
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await canConfigure()) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(
      await canConfigure(),
      true,
      "Removing last attendance unlocks configuration",
    );
    rejectAttendance = true;
    await evaluate(
      `document.querySelector('.sch-form-builder details input[type="checkbox"]').click()`,
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await evaluate(`!!document.querySelector('.toast-error')`)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(
      await evaluate(
        `document.querySelector('.sch-form-builder details input[type="checkbox"]').checked`,
      ),
      false,
    );
    assert.equal(await canConfigure(), true);
    console.log(
      "PASS review regressions: reservation logout, valid routes, calendar columns, verified role destinations and attendance count refresh",
    );
  } else if (publicCallsTest) {
    for (const width of [1440, 390]) {
      await render(
        "/becas?qa-role=NONE",
        width,
        join(output, `anonymous-calls-${width}.png`),
      );
      assert.equal(
        await evaluate(`document.querySelectorAll('.sch-call-card').length`),
        1,
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-filter-row a[href="/cuenta/becas"]')===null`,
        ),
        true,
      );
      await render(
        "/becas/call-1?qa-role=NONE",
        width,
        join(output, `anonymous-detail-${width}.png`),
      );
      assert.ok(
        await evaluate(
          `document.querySelector('h1').textContent.includes('Guías de verano')`,
        ),
      );
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('a')].some(link=>link.textContent==='Iniciar sesión para postularme' && link.getAttribute('href')==='/login')`,
        ),
      );
    }
    assert.equal(
      readCounts.get("/api/scholarships/open-calls") ?? 0,
      0,
      "Anonymous browsing never reads eligibility",
    );
    assert.equal(
      readCounts.get("/api/scholarships/applications/mine") ?? 0,
      0,
      "Anonymous browsing never reads private applications",
    );
    await evaluate(
      `[...document.querySelectorAll('a')].find(link=>link.textContent==='Iniciar sesión para postularme').click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(await evaluate(`location.pathname`), "/login");
    assert.equal(await evaluate(`history.state.usr.returnTo`), "/becas/call-1");
    assert.deepEqual(callWrites, []);
    console.log(
      "PASS anonymous call listing and details, protected personal reads and login return destination",
    );
  } else if (modalityTest) {
    const available = routes.get("/api/scholarships/public-calls");
    available[0].applicationTypes = ["RENEWAL", "NEW_ENTRY"];
    available.push({
      ...available[0],
      id: "new-entry-only",
      name: "Solo nuevo ingreso",
      applicationTypes: ["NEW_ENTRY"],
    });
    for (const width of [1440, 390]) {
      await render("/becas", width);
      assert.equal(
        await evaluate(`document.querySelectorAll('.sch-call-card').length`),
        2,
      );
      await evaluate(
        `(()=>{const select=document.querySelector('.sch-filter-row select');select.value='RENEWAL';select.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        await evaluate(`document.querySelectorAll('.sch-call-card').length`),
        1,
        "Both-mode call remains visible in renewal filter",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-call-card strong').textContent`,
        ),
        "Nuevo ingreso · Renovación",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-call-card').textContent.includes('Para tu postulación:')`,
        ),
        false,
        "Public cards show modalities without exposing personal history",
      );
      const metrics = await connection.send("Page.getLayoutMetrics");
      const screenshot = await connection.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: metrics.cssContentSize.width,
          height: metrics.cssContentSize.height,
          scale: 1,
        },
      });
      await writeFile(
        join(output, `renewal-filter-${width}.png`),
        Buffer.from(screenshot.data, "base64"),
      );
      await evaluate(
        `(()=>{const select=document.querySelector('.sch-filter-row select');select.value='NEW_ENTRY';select.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        await evaluate(`document.querySelectorAll('.sch-call-card').length`),
        2,
      );
      await evaluate(
        `(()=>{const input=document.querySelector('.sch-filter-row input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Solo nuevo');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        await evaluate(`document.querySelectorAll('.sch-call-card').length`),
        1,
        "Search works together with modality filter",
      );
    }
    await render("/becas/call-1", 1440);
    assert.ok(
      await evaluate(
        `document.body.textContent.includes('Modalidades de la convocatoria') && document.body.textContent.includes('Nuevo ingreso · Renovación')`,
      ),
    );
    routes.get("/api/scholarships/open-calls")[0].applicationType = "RENEWAL";
    await render("/becas", 1440);
    await evaluate(
      `(()=>{const select=document.querySelector('.sch-filter-row select');select.value='NEW_ENTRY';select.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(
      await evaluate(`document.querySelectorAll('.sch-call-card').length`),
      2,
    );
    await render("/becas/call-1", 1440);
    assert.ok(
      await evaluate(
        `document.querySelector('.sch-option strong').textContent==='Renovación'`,
      ),
    );
    console.log(
      "PASS enabled-modality filters, search, both-mode visibility, details and independent personal eligibility",
    );
  } else if (pauseTest) {
    await render("/app/becas/call-1/editar", 1440);
    async function change(label, status) {
      await evaluate(
        `[...document.querySelectorAll('button')].find(button=>button.textContent===${JSON.stringify(label)}).click()`,
      );
      for (let attempt = 0; attempt < 50; attempt++) {
        if (
          await evaluate(
            `!!document.querySelector('.sch-status-${status.toLowerCase()}') && ![...document.querySelectorAll('button')].find(button=>button.textContent==='Cerrar convocatoria')?.disabled`,
          )
        )
          break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(call.status, status);
      assert.ok(
        await evaluate(
          `!!document.querySelector('.sch-status-${status.toLowerCase()}')`,
        ),
      );
    }
    await change("Publicar convocatoria", "OPEN");
    assert.equal(
      await evaluate(`document.querySelector('input[name="name"]').disabled`),
      true,
    );
    await change("Pausar convocatoria", "PAUSED");
    assert.equal(
      await evaluate(`document.querySelector('input[name="name"]').disabled`),
      false,
    );
    assert.equal(
      await evaluate(
        `document.querySelector('select[name="periodId"]').disabled`,
      ),
      true,
    );
    const originalAssignments = JSON.stringify(assignments);
    await evaluate(
      `(()=>{const checks=document.querySelectorAll('.sch-three-columns section input[type="checkbox"]');checks[1].click();checks[3].click();})()`,
    );
    assert.equal(
      await evaluate(
        `document.querySelectorAll('.sch-three-columns section input[type="checkbox"]:checked').length`,
      ),
      2,
    );
    await evaluate(
      `(()=>{const name=document.querySelector('input[name="name"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(name,'Convocatoria corregida');name.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    const beforeSave = callWrites.length;
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Reanudar convocatoria').click()`,
    );
    assert.equal(
      callWrites.length,
      beforeSave,
      "Unsaved choices must not be ignored when resuming",
    );
    assert.ok(
      await evaluate(
        `document.querySelector('.toast-error').textContent.includes('Guarda los cambios de modalidades y categorías')`,
      ),
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Guardar cambios').click()`,
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (
        call.name === "Convocatoria corregida" &&
        (await evaluate(
          `!!document.querySelector('.toast-success') && ![...document.querySelectorAll('button')].find(button=>button.textContent==='Guardar cambios').disabled`,
        ))
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(call.name, "Convocatoria corregida");
    assert.equal(call.status, "PAUSED");
    assert.deepEqual(call.applicationTypes, ["NEW_ENTRY"]);
    assert.deepEqual(
      call.categories.map((category) => category.id),
      ["category-1"],
    );
    assert.equal(JSON.stringify(assignments), originalAssignments);
    assert.equal(callWrites.at(-1)[0], "/api/scholarships/calls/call-1");
    await render(
      "/app/becas/call-1/editar",
      390,
      join(output, "paused-call-390.png"),
    );
    assert.equal(
      await evaluate(`document.querySelector('input[name="name"]').value`),
      "Convocatoria corregida",
    );
    assert.equal(
      await evaluate(
        `document.querySelectorAll('.sch-three-columns section input[type="checkbox"]:checked').length`,
      ),
      2,
      "Changed choices survive reload",
    );
    const writeCount = callWrites.length;
    await evaluate(
      `document.querySelectorAll('.sch-three-columns section input[type="checkbox"]')[2].click()`,
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Guardar cambios').click()`,
    );
    assert.ok(
      await evaluate(
        `document.querySelector('.toast-error').textContent.includes('Selecciona al menos una modalidad y categoría.')`,
      ),
    );
    assert.equal(
      callWrites.length,
      writeCount,
      "Empty categories must not be sent",
    );
    await evaluate(
      `document.querySelectorAll('.sch-three-columns section input[type="checkbox"]')[2].click()`,
    );
    await evaluate(
      `document.querySelectorAll('.sch-three-columns section input[type="checkbox"]')[0].click()`,
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Guardar cambios').click()`,
    );
    assert.equal(
      callWrites.length,
      writeCount,
      "Empty modalities must not be sent",
    );
    await evaluate(
      `document.querySelectorAll('.sch-three-columns section input[type="checkbox"]')[0].click()`,
    );
    await change("Reanudar convocatoria", "OPEN");
    assert.equal(
      await evaluate(`document.querySelector('input[name="name"]').disabled`),
      true,
    );
    await change("Cerrar convocatoria", "CLOSED");
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('button')].some(button=>button.textContent==='Reanudar convocatoria')`,
      ),
      false,
    );
    console.log(
      "PASS pause, safe correction, resume, preserved forms, responsive layout and final closure",
    );
  } else if (calendarTest) {
    for (const width of [1440, 390]) {
      await render("/app/becas/catalogos", width);
      await evaluate(
        `document.querySelector('.date-input .calendar-trigger').click()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.ok(
        await evaluate(
          `(()=>{const r=document.querySelector('.calendar-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()`,
        ),
        "Calendar stays inside viewport",
      );
      await evaluate(
        `(()=>{const year=document.querySelector('.calendar-head input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(year,'2028');year.dispatchEvent(new Event('input',{bubbles:true}));const month=document.querySelector('.calendar-head select');month.value='1';month.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.ok(
        await evaluate(`!!document.querySelector('[data-date="2028-02-29"]')`),
        "Leap day is selectable",
      );
      const metrics = await connection.send("Page.getLayoutMetrics");
      const screenshot = await connection.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: metrics.cssContentSize.width,
          height: metrics.cssContentSize.height,
          scale: 1,
        },
      });
      await writeFile(
        join(output, `calendar-${width}.png`),
        Buffer.from(screenshot.data, "base64"),
      );
      await evaluate(
        `document.querySelector('[data-date="2028-02-29"]').click()`,
      );
      assert.equal(
        await evaluate(
          `new FormData(document.querySelector('input[name="startDate"]').form).get('startDate')`,
        ),
        "2028-02-29",
      );
      await evaluate(
        `document.querySelector('.date-input .calendar-trigger').click()`,
      );
      await evaluate(
        `document.querySelector('[data-date="2028-02-29"]').focus();document.querySelector('[data-date="2028-02-29"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}))`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        await evaluate(`document.activeElement.getAttribute('data-date')`),
        "2028-03-01",
      );
      await evaluate(`document.activeElement.click()`);
      assert.equal(
        await evaluate(
          `document.querySelector('input[name="startDate"]').value`,
        ),
        "2028-03-01",
      );
      await evaluate(
        `document.querySelector('input[name="startDate"]').form.reset()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        await evaluate(
          `document.querySelector('input[name="startDate"]').value`,
        ),
        "",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('input[name="startDate"]').checkValidity()`,
        ),
        false,
      );
      await evaluate(
        `(()=>{const input=document.querySelector('input[name="startDate"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2027-12-31');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      );
      await evaluate(
        `document.querySelector('.date-input .calendar-trigger').click()`,
      );
      assert.equal(
        await evaluate(
          `document.querySelector('[data-date="2027-12-31"]').getAttribute('aria-pressed')`,
        ),
        "true",
      );
      await evaluate(
        `document.querySelector('.calendar-popover').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))`,
      );
      assert.equal(
        await evaluate(`document.querySelector('.calendar-popover')===null`),
        true,
      );
      await evaluate(
        `document.querySelector('.date-input .calendar-trigger').click()`,
      );
      await evaluate(
        `document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`,
      );
      assert.equal(
        await evaluate(`document.querySelector('.calendar-popover')===null`),
        true,
      );
    }
    fields.push(field("birthday", "Fecha de nacimiento", "DATE"));
    application.status = "DRAFT";
    await render("/cuenta/becas/application-1/editar", 390);
    await evaluate(
      `document.querySelector('.date-input .calendar-trigger').click()`,
    );
    await evaluate(
      `document.querySelector('.calendar-day:not(:disabled)').click()`,
    );
    const chosen = await evaluate(
      `document.querySelector('.date-input input').value`,
    );
    assert.ok(chosen);
    await evaluate(
      `document.querySelector('.date-input .calendar-trigger').click()`,
    );
    assert.equal(
      await evaluate(
        `document.querySelector('.calendar-day.selected').getAttribute('data-date')`,
      ),
      chosen,
      "Controlled dynamic date field retains selection",
    );
    call.status = "OPEN";
    await render("/app/becas/call-1/editar", 1440);
    assert.equal(
      await evaluate(
        `document.querySelectorAll('.date-input .calendar-trigger:disabled').length`,
      ),
      2,
    );
    console.log(
      "PASS styled calendars, leap dates, keyboard, manual entry, reset, controlled fields and disabled dates",
    );
  } else if (builderDragTest) {
    await render(
      "/app/becas/formularios/form-1",
      1440,
      join(output, "builder-drag-1440.png"),
    );
    const original = fields.map((field) => field.key);
    await evaluate(
      `window.__firstField=document.querySelector('.sch-form-builder .sch-builder-field');document.querySelectorAll('.sch-form-builder details').forEach(card=>card.open=false);true`,
    );
    const points = await evaluate(
      `(()=>{const cards=document.querySelectorAll('.sch-form-builder details');const source=cards[0].querySelector('.sch-drag-handle').getBoundingClientRect();const target=cards[2].getBoundingClientRect();return {source:{x:source.x+source.width/2,y:source.y+source.height/2},target:{x:target.x+target.width/2,y:target.y+target.height/2}}})()`,
    );
    await connection.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      ...points.source,
    });
    await connection.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      ...points.source,
      button: "left",
      clickCount: 1,
    });
    await connection.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: points.source.x + 12,
      y: points.source.y + 12,
      button: "left",
      buttons: 1,
    });
    await connection.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: points.source.x + 24,
      y: points.source.y + 24,
      button: "left",
      buttons: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.ok(
      await evaluate(`!!document.querySelector('.sch-field-dragging')`),
    );
    await connection.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      ...points.target,
      button: "left",
      buttons: 1,
    });
    await connection.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: points.target.x + 1,
      y: points.target.y + 1,
      button: "left",
      buttons: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.ok(
      await evaluate(`!!document.querySelector('.sch-field-drop-target')`),
    );
    await connection.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      ...points.target,
      button: "left",
      clickCount: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.ok(
      await evaluate(
        `document.querySelectorAll('.sch-form-builder details')[2]===window.__firstField`,
      ),
      "Moving a question keeps the same field and controls",
    );
    assert.equal(
      await evaluate(
        `document.querySelectorAll('.sch-form-builder details')[1].open`,
      ),
      false,
      "Moving preserves collapsed questions",
    );
    const expected = [
      original[1],
      original[2],
      original[0],
      ...original.slice(3),
    ];
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Guardar borrador').click()`,
    );
    assert.deepEqual(
      await evaluate(
        `JSON.parse(localStorage.getItem('sizz-form-draft:qa-test-id:form-1')).fields.map(field=>field.key)`,
      ),
      expected,
    );
    await render(
      "/app/becas/formularios/form-1",
      390,
      join(output, "builder-drag-390.png"),
    );
    assert.ok(
      await evaluate(
        `document.querySelector('.sch-form-builder summary').textContent.includes(${JSON.stringify(fields[1].label)})`,
      ),
    );
    await evaluate(
      `(()=>{const cards=document.querySelectorAll('.sch-form-builder details');const source=cards[0];const dataTransfer=new DataTransfer();source.querySelector('.sch-drag-handle').dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer}));source.querySelector('.sch-drag-handle').dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer}));})()`,
    );
    assert.equal(
      await evaluate(`document.querySelector('.sch-field-dragging')===null`),
      true,
      "Canceled drag clears feedback",
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Bajar').click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    [expected[0], expected[1]] = [expected[1], expected[0]];
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Publicar nueva versión').click()`,
    );
    for (let attempt = 0; attempt < 50 && published.length === 0; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(published.length, 1);
    assert.deepEqual(
      published[0].fields.map((field) => field.key),
      expected,
    );
    assert.deepEqual(
      published[0].fields.map((field) => field.sortOrder),
      expected.map((_, index) => index),
    );
    assert.ok(
      published[0].fields.every((field) => !field.id),
      "Editor identities are not sent to the API",
    );
    assert.deepEqual(
      version.fields.map((field) => field.key),
      original,
      "Existing version remains unchanged",
    );
    console.log(
      "PASS question drag/drop, stable controls, cancel, draft resume, mobile buttons and published order",
    );
  } else if (activationTest) {
    const cases = [
      ["/app/becas/formularios", forms[0], "forms"],
      ["/app/becas/formularios", forms[1], "forms"],
      ["/app/becas/catalogos", period, "periods"],
    ];
    async function toggle(item, active) {
      await evaluate(
        `document.querySelector(${JSON.stringify(`[aria-label="Acciones de ${item.name}"]`)}).click()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      await evaluate(
        `document.querySelector('.sch-table-actions-popover:popover-open button').click()`,
      );
      for (let attempt = 0; attempt < 50; attempt++) {
        if (
          await evaluate(
            `document.querySelector(${JSON.stringify(`[aria-label="Acciones de ${item.name}"]`)}).closest('tr').textContent.includes(${JSON.stringify(active ? "Habilitado" : "Deshabilitado")})`,
          )
        )
          break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.ok(
        await evaluate(
          `document.querySelector(${JSON.stringify(`[aria-label="Acciones de ${item.name}"]`)}).closest('tr').textContent.includes(${JSON.stringify(active ? "Habilitado" : "Deshabilitado")})`,
        ),
      );
    }
    for (const [path, item, type] of cases) {
      await render(path, 390);
      await toggle(item, false);
      assert.deepEqual(activationWrites.at(-1), [
        `/api/scholarships/${type}/${item.id}/status`,
        { active: false },
      ]);
      assert.ok(await evaluate(`!!document.querySelector('.toast-success')`));
      if (type === "forms") assert.equal(item.versions.length, 1);
      if (item === forms[0]) {
        await render("/app/becas/call-1/editar", 390);
        await evaluate(
          `[...document.querySelectorAll('.sch-steps button')].find(button=>button.textContent==='2 Formularios de solicitud').click()`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        assert.ok(
          await evaluate(`!!document.querySelector('.sch-field select')`),
        );
        assert.equal(
          await evaluate(
            `document.querySelector('option[value="version-1"]')===null`,
          ),
          true,
        );
      } else if (item === forms[1]) {
        await render("/app/becas/call-1/evaluacion", 390);
        assert.equal(
          await evaluate(
            `document.querySelector('option[value="exam-version"]')===null`,
          ),
          true,
        );
      } else {
        await render("/app/becas/nueva", 390);
        assert.equal(
          await evaluate(
            `document.querySelector('option[value="period-1"]')===null`,
          ),
          true,
        );
      }
      await render(path, 390);
      await toggle(item, true);
      assert.deepEqual(activationWrites.at(-1), [
        `/api/scholarships/${type}/${item.id}/status`,
        { active: true },
      ]);
    }
    rejectActivation = true;
    await render("/app/becas/formularios", 1440);
    await evaluate(
      `document.querySelector('.sch-table-actions-trigger').click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    await evaluate(
      `document.querySelector('.sch-table-actions-popover:popover-open button').click()`,
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await evaluate(`!!document.querySelector('.toast-error')`)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(
      await evaluate(
        `document.querySelector('.toast-error').textContent.includes('No se pudo cambiar el estado.')`,
      ),
    );
    assert.equal(forms[0].active, true);
    console.log(
      "PASS disable/enable forms, exams and periods, preserved versions, filtered choices and error toasts",
    );
  } else if (feedbackTest) {
    for (const width of [1440, 390]) {
      await render(
        "/app/becas/call-1/evaluacion",
        width,
        join(output, `navigation-${width}.png`),
      );
      assert.equal(
        await evaluate(
          `getComputedStyle(document.querySelector('.sch-tabs')).backgroundColor`,
        ),
        "rgb(255, 255, 255)",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-tabs a.active').textContent`,
        ),
        "Evaluación",
      );
      assert.equal(
        await evaluate(`document.querySelectorAll('.sch-nav-group').length`),
        2,
      );
    }
    const callsPath = "/api/scholarships/calls";
    const meritPath = "/api/scholarships/admin/calls/call-1/merit-list";
    failingRead = callsPath;
    await render("/app/becas/call-1/evaluacion", 1440);
    assert.ok(
      await evaluate(
        `document.querySelector('.toast-error').textContent.includes('Ocurrió un error interno')`,
      ),
    );
    assert.equal(
      await evaluate(
        `document.querySelectorAll('.sch-notice.sch-error').length`,
      ),
      0,
    );
    assert.equal(
      await evaluate(
        `getComputedStyle(document.querySelector('.toast-error')).animationName`,
      ),
      "toast-enter",
    );
    const errorsCount = readCounts.get(callsPath);
    assert.equal(
      await evaluate(
        `document.querySelector('.toast-error strong').textContent`,
      ),
      "Ocurrió un error",
      "Read failures must not be labeled as save failures",
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(
      readCounts.get(callsPath),
      errorsCount,
      "Showing the error toast must not refetch the page",
    );
    failingRead = "";
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Reintentar').click()`,
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await evaluate(`!!document.querySelector('.sch-summary-grid')`))
        break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(
      await evaluate(`!!document.querySelector('.sch-summary-grid')`),
      "Retry restores the page",
    );
    await evaluate(
      `document.querySelector('.toast-close').click();window.__meritTable=document.querySelector('.sch-table');true`,
    );
    failingRead = meritPath;
    delayedRead = meritPath;
    await evaluate(
      `[...document.querySelectorAll('button')].find(button=>button.textContent==='Actualizar mérito').click()`,
    );
    assert.ok(
      await evaluate(
        `document.querySelector('.sch-table')===window.__meritTable`,
      ),
      "Keep table visible during refresh",
    );
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('.sch-notice')].some(node=>node.textContent==='Cargando…')`,
      ),
      false,
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await evaluate(`!!document.querySelector('.toast-error')`)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(await evaluate(`!!document.querySelector('.toast-error')`));
    assert.ok(
      await evaluate(
        `document.querySelector('.sch-table')===window.__meritTable`,
      ),
      "Keep existing table after refresh fails",
    );
    await connection.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    assert.equal(
      await evaluate(
        `getComputedStyle(document.querySelector('.toast-error')).animationName`,
      ),
      "none",
    );
    console.log(
      "PASS navigation styles, load-error toasts, retry, preserved content, animation, and reduced motion",
    );
  } else if (actionsTest) {
    async function toggleActions() {
      await evaluate(
        `document.querySelector('.sch-table-actions-trigger').click()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    for (const width of [1440, 390]) {
      await render(
        "/app/becas",
        width,
        join(output, `call-actions-${width}.png`),
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table-actions-popover').matches(':popover-open')`,
        ),
        false,
      );
      assert.equal(
        await evaluate(
          `getComputedStyle(document.querySelector('.sch-table th:last-child')).fontSize`,
        ),
        "10px",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table thead').getBoundingClientRect().height`,
        ),
        42,
      );
      assert.deepEqual(
        await evaluate(
          `[...document.querySelectorAll('.sch-table tbody tr')].map(row=>row.getBoundingClientRect().height)`,
        ),
        [82, 82, 82, 82],
      );
      assert.equal(
        await evaluate(
          `getComputedStyle(document.querySelector('.sch-table-actions-trigger span')).fontSize`,
        ),
        "16px",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table-actions-trigger').textContent`,
        ),
        "•••",
      );
      assert.ok(
        await evaluate(
          `(()=>{const th=document.querySelector('.sch-table th:last-child');const range=document.createRange();range.selectNodeContents(th);const title=range.getBoundingClientRect();const center=title.x+title.width/2;return [...document.querySelectorAll('.sch-table-actions-trigger span')].every(span=>{const dots=span.getBoundingClientRect();return Math.abs(dots.x+dots.width/2-center)<1})})()`,
        ),
        "Action title and every ellipsis must share the same horizontal center",
      );
      // Scroll the responsive table to its action column before opening the menu.
      await evaluate(
        `document.querySelector('.sch-table-wrap').scrollLeft=2000`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      await toggleActions();
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table-actions-trigger').getAttribute('aria-expanded')`,
        ),
        "true",
      );
      assert.deepEqual(
        await evaluate(
          `[...document.querySelector('.sch-table-actions-popover').querySelectorAll('a')].map(a=>a.textContent)`,
        ),
        ["Configurar", "Postulaciones", "Horas"],
      );
      assert.ok(
        await evaluate(
          `(()=>{const r=document.querySelector('.sch-table-actions-popover').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight})()`,
        ),
      );
      await toggleActions();
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table-actions-popover').matches(':popover-open')`,
        ),
        false,
      );
      await toggleActions();
      await connection.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Escape",
        code: "Escape",
        windowsVirtualKeyCode: 27,
        nativeVirtualKeyCode: 27,
      });
      await connection.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Escape",
        code: "Escape",
        windowsVirtualKeyCode: 27,
        nativeVirtualKeyCode: 27,
      });
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table-actions-popover').matches(':popover-open')`,
        ),
        false,
      );
      await toggleActions();
      await connection.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: 5,
        y: 5,
        button: "left",
        clickCount: 1,
      });
      await connection.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: 5,
        y: 5,
        button: "left",
        clickCount: 1,
      });
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table-actions-popover').matches(':popover-open')`,
        ),
        false,
      );
      await toggleActions();
      await evaluate(
        `document.querySelector('.sch-table-wrap').dispatchEvent(new Event('scroll'))`,
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table-actions-popover').matches(':popover-open')`,
        ),
        false,
      );
      console.log(`PASS Figma action column and menu ${width}`);
    }
    for (const width of [1440, 390]) {
      await render(
        "/app/becas/formularios",
        width,
        join(output, `form-actions-${width}.png`),
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.sch-table thead').getBoundingClientRect().height`,
        ),
        42,
      );
      assert.deepEqual(
        await evaluate(
          `[...document.querySelectorAll('.sch-table tbody tr')].map(row=>row.getBoundingClientRect().height)`,
        ),
        [82, 82],
      );
      assert.ok(
        await evaluate(
          `(()=>{const th=document.querySelector('.sch-table th:last-child');const range=document.createRange();range.selectNodeContents(th);const title=range.getBoundingClientRect();return [...document.querySelectorAll('.sch-table-actions-trigger span')].every(span=>{const dots=span.getBoundingClientRect();return Math.abs(dots.x+dots.width/2-title.x-title.width/2)<1})})()`,
        ),
        "Form action heading and dots share the same center",
      );
      await evaluate(
        `document.querySelector('.sch-table-wrap').scrollLeft=2000`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      await toggleActions();
      assert.deepEqual(
        await evaluate(
          `[...document.querySelector('.sch-table-actions-popover').querySelectorAll('a')].map(a=>[a.textContent.trim(),a.getAttribute('href')])`,
        ),
        [["Preparar / continuar borrador", "/app/becas/formularios/form-1"]],
      );
      assert.ok(
        await evaluate(
          `(()=>{const r=document.querySelector('.sch-table-actions-popover').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight})()`,
        ),
      );
      await evaluate(
        `document.querySelector('.sch-table-actions-popover a').click()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(
        await evaluate(`location.pathname`),
        "/app/becas/formularios/form-1",
      );
      console.log(`PASS shared form action menu and draft navigation ${width}`);
    }
    await render("/app/becas?qa-role=SCHOLARSHIP_MANAGER", 1440);
    await toggleActions();
    assert.deepEqual(
      await evaluate(
        `[...document.querySelector('.sch-table-actions-popover').querySelectorAll('a')].map(a=>a.textContent)`,
      ),
      ["Configurar", "Postulaciones"],
    );
    await evaluate(
      `document.querySelector('.sch-table-actions-popover a').click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(
      await evaluate(`location.pathname`),
      "/app/becas/call-1/editar",
    );
    console.log("PASS action permissions and navigation");
  } else if (callFlow) {
    for (const width of [1440, 390]) {
      await render(
        "/app/becas/call-1/editar",
        width,
        join(output, `call-config-${width}.png`),
      );
      assert.deepEqual(
        await evaluate(
          `[...document.querySelectorAll('.sch-steps button')].map(b=>b.textContent)`,
        ),
        ["1 General", "2 Formularios de solicitud", "3 Publicación"],
      );
      await evaluate(
        `document.querySelectorAll('.sch-steps button')[1].click()`,
      );
      assert.ok(
        await evaluate(
          `document.body.textContent.includes('Identificación oficial')`,
        ),
      );
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('select option')].every(o=>!o.textContent.includes('Examen'))`,
        ),
      );
    }
    await evaluate(
      `[...document.querySelectorAll('button')].find(b=>b.textContent==='Publicar convocatoria').click()`,
    );
    for (let attempt = 0; attempt < 50 && callWrites.length === 0; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    assert.deepEqual(callWrites[0], [
      "/api/scholarships/calls/call-1/status",
      { status: "OPEN" },
    ]);
    if (toastTest) {
      for (let attempt = 0; attempt < 50; attempt++) {
        if (await evaluate(`!!document.querySelector('.toast-success')`)) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await waitForToastAnimation();
      assert.equal(
        await evaluate(
          `document.querySelector('.toast-card').getAttribute('role')`,
        ),
        "status",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('.toast-card').getBoundingClientRect().width`,
        ),
        358,
      );
      assert.ok(
        await evaluate(
          `document.querySelector('.toast-card').textContent.includes('Convocatoria publicada.')`,
        ),
      );
      assert.equal(
        await evaluate(
          `[...document.querySelectorAll('.sch-notice')].some(n=>n.textContent==='Convocatoria publicada.')`,
        ),
        false,
      );
      await evaluate(`document.querySelector('.toast-close').focus()`);
      await evaluate(
        `document.querySelector('.toast-card').dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}))`,
      );
      await new Promise((resolve) => setTimeout(resolve, 6500));
      assert.ok(
        await evaluate(`!!document.querySelector('.toast-success')`),
        "Focused toast stays visible",
      );
      await evaluate(`document.querySelector('.toast-close').blur()`);
      const bounds = await evaluate(
        `(()=>{const r=document.querySelector('.toast-card').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`,
      );
      const screenshot = await connection.send("Page.captureScreenshot", {
        format: "png",
        clip: bounds,
      });
      await writeFile(
        join(output, "toast-success-390.png"),
        Buffer.from(screenshot.data, "base64"),
      );
      assert.ok(
        await evaluate(
          `(()=>{const img=document.querySelector('.toast-icon img');return img.complete&&img.naturalWidth===34&&img.getBoundingClientRect().width===34})()`,
        ),
      );
      await evaluate(
        `document.querySelector('.sch-tabs a[href="/app/becas/formularios"]').click()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.ok(
        await evaluate(`!!document.querySelector('.toast-success')`),
        "Toast survives route navigation",
      );
      await evaluate(`document.querySelector('.toast-close').click()`);
      assert.equal(
        await evaluate(`document.querySelector('.toast-card') === null`),
        true,
      );
      await render("/app/becas/formularios/nuevo", 390);
      await evaluate(
        `[...document.querySelectorAll('button')].find(button=>button.textContent==='Guardar borrador').click()`,
      );
      assert.ok(await evaluate(`!!document.querySelector('.toast-info')`));
      assert.equal(
        await evaluate(
          `document.querySelector('.toast-info').getAttribute('role')`,
        ),
        "status",
      );
      assert.ok(
        await evaluate(
          `document.querySelector('.toast-info').textContent.includes('Borrador guardado en este navegador')`,
        ),
      );
      assert.ok(
        await evaluate(
          `document.querySelector('.toast-info').getBoundingClientRect().height >= 96`,
        ),
      );
      assert.equal(
        await evaluate(`document.documentElement.scrollWidth > innerWidth`),
        false,
      );
      await evaluate(
        `localStorage.removeItem('sizz-form-draft:qa-test-id:nuevo')`,
      );
      await render("/app/becas/call-1/editar", 1440);
      rejectCallStatus = true;
      await evaluate(
        `[...document.querySelectorAll('button')].find(b=>b.textContent==='Cerrar convocatoria').click()`,
      );
      for (let attempt = 0; attempt < 50; attempt++) {
        if (await evaluate(`!!document.querySelector('.toast-error')`)) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(
        await evaluate(
          `document.querySelector('.toast-card').getAttribute('role')`,
        ),
        "alert",
      );
      await waitForToastAnimation();
      assert.equal(
        await evaluate(
          `document.querySelector('.toast-card').getBoundingClientRect().width`,
        ),
        420,
      );
      await new Promise((resolve) => setTimeout(resolve, 6500));
      assert.ok(
        await evaluate(`!!document.querySelector('.toast-error')`),
        "Error stays visible until dismissal",
      );
      await evaluate(`document.querySelector('.toast-close').click()`);
      rejectCallStatus = false;
      await evaluate(
        `[...document.querySelectorAll('button')].find(b=>b.textContent==='Cerrar convocatoria').click()`,
      );
      for (let attempt = 0; attempt < 50; attempt++) {
        if (await evaluate(`!!document.querySelector('.toast-success')`)) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await new Promise((resolve) => setTimeout(resolve, 6500));
      assert.equal(
        await evaluate(`document.querySelector('.toast-card') === null`),
        true,
        "Success dismisses automatically",
      );
      console.log(
        "PASS Figma toast geometry, icons, route persistence, keyboard pause, manual and automatic dismissal, and API errors",
      );
      callWrites.splice(1);
    }
    await render(
      "/app/becas/call-1/evaluacion",
      390,
      join(output, "late-evaluation-390.png"),
    );
    assert.equal(
      await evaluate(`document.querySelector('select').disabled`),
      false,
    );
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('button')].find(b=>b.textContent==='Agregar sesión').disabled`,
      ),
      false,
    );
    await evaluate(
      `(()=>{const select=document.querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,'exam-version');select.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(b=>b.textContent==='Asignar evaluación').click()`,
    );
    for (let attempt = 0; attempt < 50 && callWrites.length < 2; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    assert.deepEqual(callWrites[1], [
      "/api/scholarships/calls/call-1/forms",
      { formVersionId: "exam-version", applicationType: null },
    ]);
    console.log(
      "PASS dynamic application forms, publication without exams/training, and later evaluation configuration",
    );
  } else {
    for (const width of [1440, 390]) {
      await render("/", width, join(output, `home-${width}.png`));
      const home = await evaluate(
        `document.querySelector('.public-navigation').outerHTML`,
      );
      const styles = `JSON.stringify([...document.querySelectorAll('.public-navigation, .public-navigation img, .public-navigation nav a:not(.active), .public-navigation button')].map(e=>{const s=getComputedStyle(e);return [s.font,s.paddingTop,s.paddingBottom,s.backgroundColor,s.borderRadius]}))`;
      const homeStyles = await evaluate(styles);
      await render("/becas", width);
      const calls = await evaluate(
        `document.querySelector('.public-navigation').outerHTML`,
      );
      // The active link changes; the shared links, actions and appearance stay the same.
      const navigation = `JSON.stringify([...document.querySelectorAll('.public-navigation nav a')].map(a=>[a.getAttribute('href'),a.textContent]))`;
      const callsLinks = await evaluate(navigation);
      assert.equal(
        await evaluate(styles),
        homeStyles,
        "Navigation styles must match on both pages",
      );
      await render("/", width);
      assert.equal(await evaluate(navigation), callsLinks);
      assert.ok(
        home.includes("public-navigation") &&
          calls.includes("public-navigation"),
      );
      if (width === 390) {
        assert.equal(
          await evaluate(
            `getComputedStyle(document.querySelector('.public-navigation nav')).display`,
          ),
          "none",
        );
        await evaluate(
          `document.querySelector('.public-navigation-toggle').click()`,
        );
        assert.equal(
          await evaluate(
            `document.querySelector('.public-navigation-toggle').getAttribute('aria-expanded')`,
          ),
          "true",
        );
        assert.equal(
          await evaluate(
            `getComputedStyle(document.querySelector('.public-navigation nav')).display`,
          ),
          "flex",
        );
      }
      console.log(`PASS shared navigation ${width}`);
    }
    await render("/app/becas/formularios/form-1", 1440);
    await evaluate(
      `(()=>{const input=document.querySelector('.sch-builder-field input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(b=>b.textContent==='Guardar borrador').click()`,
    );
    assert.ok(
      await evaluate(
        `localStorage.getItem('sizz-form-draft:qa-test-id:form-1')`,
      ),
    );
    assert.equal(
      await evaluate(
        `JSON.parse(localStorage.getItem('sizz-form-draft:qa-test-id:form-1')).fields[0].label`,
      ),
      "",
    );
    await render("/app/becas/formularios/form-1", 1440);
    assert.ok(
      await evaluate(
        `document.body.textContent.includes('Borrador recuperado')`,
      ),
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(b=>b.textContent==='Vista previa').click()`,
    );
    assert.equal(
      await evaluate(`document.querySelectorAll('input[type=file]').length`),
      1,
    );
    assert.ok(
      await evaluate(
        `document.querySelector('input[type=file]').accept.includes('application/pdf')`,
      ),
    );
    assert.ok(
      await evaluate(
        `document.querySelector('input[type=file]').parentElement.textContent.includes('JPG / PNG · Máximo 10 MB')`,
      ),
    );
    assert.ok(
      await evaluate(
        `document.querySelector('input[type=file]').parentElement.textContent.includes('Identificación oficial *')`,
      ),
    );
    assert.equal(
      published.length,
      0,
      "Saving and reloading a draft must never publish",
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(b=>b.textContent==='Volver al editor').click()`,
    );
    await evaluate(
      `(()=>{const input=document.querySelector('.sch-builder-field input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Institución actualizada');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await evaluate(
      `[...document.querySelectorAll('button')].find(b=>b.textContent==='Publicar nueva versión').click()`,
    );
    for (let attempt = 0; attempt < 50 && published.length === 0; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(published.length, 1);
    assert.equal(published[0].fields[0].label, "Institución actualizada");
    assert.equal(
      version.fields[0].label,
      "Institución educativa",
      "The previous version remains unchanged",
    );
    for (let attempt = 0; attempt < 50; attempt++) {
      if (
        await evaluate(
          `localStorage.getItem('sizz-form-draft:qa-test-id:form-1') === null`,
        )
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(
      await evaluate(
        `localStorage.getItem('sizz-form-draft:qa-test-id:form-1')`,
      ),
      null,
    );
    await evaluate(
      `localStorage.removeItem('sizz-form-draft:qa-test-id:form-1')`,
    );
    console.log(
      "PASS draft resume and document preview without version creation",
    );
    for (const [path, heading, name] of screens) {
      for (const width of [1440, 390]) {
        const filename = join(output, `${name}-${width}.png`);
        const parsed = await render(path, width, filename);
        assert.equal(parsed.heading, heading, path);
        console.log(`PASS ${width} ${path}`);
      }
    }
    for (const [path, destination] of [
      ["/app/becas?qa-role=USER", "/"],
      ["/app/becas?qa-role=SCHOLARSHIP_MANAGER", "/app/becas"],
      ["/app/becas/call-1/evaluacion?qa-role=SCHOLARSHIP_MANAGER", "/"],
      ["/cuenta/becas/horas?qa-role=GUIDE", "/cuenta/becas/horas"],
      ["/cuenta/becas?qa-role=NONE", "/login"],
    ]) {
      assert.equal(
        (await render(path, 1440)).path,
        destination,
        `Role guard: ${path}`,
      );
      console.log(`PASS role ${path}`);
    }
    assert.deepEqual(
      unknown,
      [],
      "All requests must match the API fixture contract",
    );
  }
  assert.deepEqual(unknown, [], "No requests outside fixture API");
  console.log(`Screenshots: ${output}`);
} finally {
  if (connection) {
    await connection.send("Browser.close").catch(() => {});
    connection.close();
  }
  browserProcess?.kill();
  server.close();
}
