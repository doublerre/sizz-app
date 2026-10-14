import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import axios, { AxiosError } from "axios";
import api from "../src/services/api.ts";
import { scholarshipService } from "../src/services/scholarship.service.ts";
import {
  formDraftKey,
  readFormDraft,
} from "../src/components/scholarships/formDraft.ts";
import {
  answeredValues,
  displayAnswer,
  validateAnswers,
  validateFile,
} from "../src/components/scholarships/dynamicForm.ts";

const field = (type, overrides = {}) => ({
  key: "answer",
  label: "Pregunta",
  type,
  required: true,
  minLength: null,
  maxLength: null,
  minValue: null,
  maxValue: null,
  maxFileBytes: 1024,
  allowedFileTypes: ["PDF"],
  options: [],
  ...overrides,
});
const ok = (config) => ({
  config,
  status: 200,
  statusText: "OK",
  headers: {},
  data: {},
});
const unauthorized = (config) =>
  new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, {
    ...ok(config),
    status: 401,
  });
let storage;
beforeEach(() => {
  storage = new Map([
    ["sizz_access_token", "expired-test-token"],
    ["sizz_refresh_token", "test-refresh-token"],
  ]);
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = { location: { href: "" } };
});

test("required false and zero remain answers; blank drafts are omitted", () => {
  assert.deepEqual(
    validateAnswers([field("YES_NO")], { answer: false }, true),
    {},
  );
  assert.deepEqual(validateAnswers([field("NUMBER")], { answer: 0 }, true), {});
  assert.deepEqual(validateAnswers([field("DATE")], {}, false), {});
  assert.equal(
    Object.keys(validateAnswers([field("DATE")], {}, true)).length,
    1,
  );
  assert.deepEqual(
    answeredValues({ zero: 0, no: false, empty: "", none: [] }),
    { zero: 0, no: false },
  );
});
test("incomplete form drafts survive reload and are account scoped", () => {
  const key = formDraftKey("admin-a", "form-1");
  const draft = {
    name: "",
    purpose: "APPLICATION",
    fields: [field("FILE", { label: "" })],
  };
  localStorage.setItem(key, JSON.stringify(draft));
  assert.deepEqual(readFormDraft(localStorage, key), draft);
  draft.fields[0].label = "Identificación";
  localStorage.setItem(key, JSON.stringify(draft));
  assert.equal(
    readFormDraft(localStorage, key).fields[0].label,
    "Identificación",
  );
  assert.equal(
    readFormDraft(localStorage, formDraftKey("admin-b", "form-1")),
    null,
  );
  localStorage.setItem(key, "broken");
  assert.throws(() => readFormDraft(localStorage, key));
  assert.equal(localStorage.getItem(key), "broken");
});
test("number limits, text limits, emails, phones and allowed options are validated", () => {
  for (const [definition, answer] of [
    [field("NUMBER"), NaN],
    [field("NUMBER", { minValue: 5 }), 4],
    [field("NUMBER", { maxValue: 5 }), 6],
    [field("SHORT_TEXT", { minLength: 3 }), "ab"],
    [field("EMAIL"), "bad"],
    [field("PHONE"), "letters"],
    [
      field("MULTI_SELECT", { options: [{ value: "a", label: "A" }] }),
      ["unknown"],
    ],
  ])
    assert.equal(
      Object.keys(validateAnswers([definition], { answer }, true)).length,
      1,
    );
  const selection = field("MULTI_SELECT", {
    options: [{ value: "a", label: "A" }],
  });
  assert.deepEqual(validateAnswers([selection], { answer: ["a"] }, true), {});
  assert.equal(displayAnswer(["a"], selection), "A");
});
test("uploads enforce file type, nonempty content and per-field size", () => {
  assert.equal(
    validateFile(field("FILE"), { type: "application/pdf", size: 100 }),
    "",
  );
  assert.ok(validateFile(field("FILE"), { type: "image/png", size: 100 }));
  assert.ok(
    validateFile(field("FILE"), { type: "application/pdf", size: 1025 }),
  );
  assert.ok(validateFile(field("FILE"), { type: "application/pdf", size: 0 }));
  assert.equal(
    validateFile(field("FILE", { allowedFileTypes: ["IMAGE"] }), {
      type: "image/jpeg",
      size: 100,
    }),
    "",
  );
});
test("login 401 is shown without refreshing or redirecting; stale token is excluded", async () => {
  let refreshCalls = 0;
  axios.defaults.adapter = async (config) => {
    refreshCalls++;
    return ok(config);
  };
  api.defaults.adapter = async (config) => {
    assert.equal(config.headers.Authorization, undefined);
    throw unauthorized(config);
  };
  await assert.rejects(
    api.post("/auth/login", { email: "test@example.test", password: "test" }),
  );
  assert.equal(refreshCalls, 0);
  assert.equal(window.location.href, "");
});
test("public calls ignore stale credentials and never trigger authentication refresh", async () => {
  let refreshCalls = 0;
  axios.defaults.adapter = async (config) => {
    refreshCalls++;
    return ok(config);
  };
  api.defaults.adapter = async (config) => {
    assert.equal(config.headers.Authorization, undefined);
    return { ...ok(config), data: [] };
  };
  assert.deepEqual(await scholarshipService.publicCalls(), []);
  api.defaults.adapter = async (config) => {
    throw unauthorized(config);
  };
  await assert.rejects(scholarshipService.publicCalls());
  assert.equal(refreshCalls, 0);
  assert.equal(window.location.href, "");
  assert.equal(localStorage.getItem("sizz_access_token"), "expired-test-token");
});

test("concurrent expired requests share a refresh and retry with the new token", async () => {
  let refreshCalls = 0;
  axios.defaults.adapter = async (config) => {
    refreshCalls++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return {
      ...ok(config),
      data: {
        accessToken: "new-test-token",
        refreshToken: "new-refresh-token",
      },
    };
  };
  api.defaults.adapter = async (config) => {
    if (config.headers.Authorization !== "Bearer new-test-token")
      throw unauthorized(config);
    return ok(config);
  };
  await Promise.all([
    api.get("/scholarships/calls"),
    api.get("/scholarships/forms"),
  ]);
  assert.equal(refreshCalls, 1);
  assert.equal(storage.get("sizz_access_token"), "new-test-token");
});
test("failed refresh rejects all waiting requests and clears the session", async () => {
  axios.defaults.adapter = async (config) => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    throw unauthorized(config);
  };
  api.defaults.adapter = async (config) => {
    throw unauthorized(config);
  };
  const results = await Promise.allSettled([
    api.get("/scholarships/calls"),
    api.get("/scholarships/forms"),
  ]);
  assert.ok(results.every((result) => result.status === "rejected"));
  assert.equal(storage.size, 0);
  assert.equal(window.location.href, "/login");
});

test("refresh cannot restore a session after logout or replace a new login", async () => {
  for (const newLogin of [false, true]) {
    storage.set("sizz_access_token", "expired-test-token");
    storage.set("sizz_refresh_token", "test-refresh-token");
    let complete;
    let notifyStarted;
    const started = new Promise((resolve) => {
      notifyStarted = resolve;
    });
    let requests = 0;
    axios.defaults.adapter = (config) => {
      notifyStarted();
      return new Promise((resolve) => {
        complete = () =>
          resolve({
            ...ok(config),
            data: {
              accessToken: "old-refreshed-token",
              refreshToken: "old-refreshed-refresh",
            },
          });
      });
    };
    api.defaults.adapter = async (config) => {
      requests++;
      throw unauthorized(config);
    };
    const result = assert.rejects(api.get("/scholarships/calls"));
    await started;
    localStorage.removeItem("sizz_access_token");
    localStorage.removeItem("sizz_refresh_token");
    if (newLogin) {
      localStorage.setItem("sizz_access_token", "new-login-token");
      localStorage.setItem("sizz_refresh_token", "new-login-refresh");
    }
    complete();
    await result;
    assert.equal(
      localStorage.getItem("sizz_access_token"),
      newLogin ? "new-login-token" : null,
    );
    assert.equal(
      localStorage.getItem("sizz_refresh_token"),
      newLogin ? "new-login-refresh" : null,
    );
    assert.equal(requests, 1, "Canceled refresh must not retry private reads");
    assert.equal(window.location.href, "");
  }
});
test("service keeps booleans and arrays and uses multipart for private documents", async () => {
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return ok(config);
  };
  await scholarshipService.saveAnswers("application-id", {
    no: false,
    multiple: ["a", "b"],
    zero: 0,
  });
  await scholarshipService.assignForm("call-id", "version-id", null);
  await scholarshipService.upload(
    "application-id",
    "document_key",
    new File(["pdf"], "document.pdf", { type: "application/pdf" }),
  );
  await scholarshipService.download("application-id", "file-id");
  assert.deepEqual(JSON.parse(requests[0].data), {
    answers: { no: false, multiple: ["a", "b"], zero: 0 },
  });
  assert.deepEqual(JSON.parse(requests[1].data), {
    formVersionId: "version-id",
    applicationType: null,
  });
  assert.ok(requests[2].data instanceof FormData);
  assert.equal(requests[2].data.get("file").name, "document.pdf");
  assert.equal(requests[3].responseType, "blob");
  assert.equal(requests[3].headers.Authorization, "Bearer expired-test-token");
});
