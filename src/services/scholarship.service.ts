import api from "./api.ts";
import type {
  AdminApplication,
  Answers,
  ApplicationType,
  Attendance,
  CallForm,
  CallStatus,
  Category,
  CreateCall,
  DailyAttendance,
  Exam,
  FormField,
  Grant,
  MeritList,
  MonthlyHours,
  OpenCall,
  Period,
  ScholarshipApplication,
  ScholarshipCall,
  ScholarshipForm,
  TrainingSession,
} from "./scholarship.types";

const root = "/scholarships";
export const scholarshipService = {
  periods: () => api.get<Period[]>(`${root}/periods`).then((r) => r.data),
  createPeriod: (body: Omit<Period, "id" | "active">) =>
    api.post<Period>(`${root}/periods`, body).then((r) => r.data),
  setPeriodActive: (id: string, active: boolean) =>
    api
      .put<Period>(`${root}/periods/${id}/status`, { active })
      .then((r) => r.data),
  categories: () =>
    api.get<Category[]>(`${root}/categories`).then((r) => r.data),
  saveCategory: (body: Omit<Category, "id">, id?: string) =>
    (id
      ? api.put<Category>(`${root}/categories/${id}`, body)
      : api.post<Category>(`${root}/categories`, body)
    ).then((r) => r.data),
  calls: () => api.get<ScholarshipCall[]>(`${root}/calls`).then((r) => r.data),
  createCall: (body: CreateCall) =>
    api.post<ScholarshipCall>(`${root}/calls`, body).then((r) => r.data),
  updateCall: (
    id: string,
    body: Pick<
      CreateCall,
      | "name"
      | "opensOn"
      | "closesOn"
      | "durationMonths"
      | "totalBudget"
      | "applicationTypes"
      | "categoryIds"
    >,
  ) =>
    api.put<ScholarshipCall>(`${root}/calls/${id}`, body).then((r) => r.data),
  setCallStatus: (id: string, status: CallStatus) =>
    api
      .put<ScholarshipCall>(`${root}/calls/${id}/status`, { status })
      .then((r) => r.data),
  forms: () => api.get<ScholarshipForm[]>(`${root}/forms`).then((r) => r.data),
  setFormActive: (id: string, active: boolean) =>
    api
      .put<ScholarshipForm>(`${root}/forms/${id}/status`, { active })
      .then((r) => r.data),
  form: (id: string) =>
    api.get<ScholarshipForm>(`${root}/forms/${id}`).then((r) => r.data),
  createForm: (
    name: string,
    purpose: ScholarshipForm["purpose"],
    fields: FormField[],
  ) =>
    api
      .post<ScholarshipForm>(`${root}/forms`, { name, purpose, fields })
      .then((r) => r.data),
  addVersion: (id: string, fields: FormField[]) =>
    api
      .post<ScholarshipForm>(`${root}/forms/${id}/versions`, { fields })
      .then((r) => r.data),
  callForms: (id: string) =>
    api.get<CallForm[]>(`${root}/calls/${id}/forms`).then((r) => r.data),
  assignForm: (
    id: string,
    formVersionId: string,
    applicationType: ApplicationType | null,
  ) =>
    api
      .post<CallForm>(`${root}/calls/${id}/forms`, {
        formVersionId,
        applicationType,
      })
      .then((r) => r.data),
  openCalls: () =>
    api.get<OpenCall[]>(`${root}/open-calls`).then((r) => r.data),
  applications: () =>
    api
      .get<ScholarshipApplication[]>(`${root}/applications/mine`)
      .then((r) => r.data),
  application: (id: string) =>
    api
      .get<ScholarshipApplication>(`${root}/applications/${id}`)
      .then((r) => r.data),
  createApplication: (callId: string) =>
    api
      .post<ScholarshipApplication>(`${root}/applications`, { callId })
      .then((r) => r.data),
  saveAnswers: (id: string, answers: Answers) =>
    api
      .put<ScholarshipApplication>(`${root}/applications/${id}/answers`, {
        answers,
      })
      .then((r) => r.data),
  upload: (id: string, key: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api.post(
      `${root}/applications/${id}/files/${encodeURIComponent(key)}`,
      body,
      { headers: { "Content-Type": undefined } },
    );
  },
  download: (id: string, fileId: string) =>
    api
      .get<Blob>(`${root}/applications/${id}/files/${fileId}`, {
        responseType: "blob",
      })
      .then((r) => r.data),
  submit: (id: string) =>
    api
      .post<ScholarshipApplication>(`${root}/applications/${id}/submit`)
      .then((r) => r.data),
  adminApplications: (id: string) =>
    api
      .get<AdminApplication[]>(`${root}/admin/calls/${id}/applications`)
      .then((r) => r.data),
  reviewFile: (
    id: string,
    fileId: string,
    status: "APPROVED" | "REJECTED",
    comment: string,
  ) =>
    api
      .put<ScholarshipApplication>(
        `${root}/admin/applications/${id}/files/${fileId}/review`,
        { status, comment },
      )
      .then((r) => r.data),
  exams: (id: string) =>
    api.get<Exam[]>(`${root}/applications/${id}/exams`).then((r) => r.data),
  submitExam: (id: string, versionId: string, answers: Answers) =>
    api
      .post<Exam>(`${root}/applications/${id}/exams/${versionId}`, { answers })
      .then((r) => r.data),
  sessions: (id: string) =>
    api
      .get<TrainingSession[]>(`${root}/admin/calls/${id}/training-sessions`)
      .then((r) => r.data),
  saveSession: (callId: string, name: string, weight: number, id?: string) =>
    (id
      ? api.put<TrainingSession>(`${root}/admin/training-sessions/${id}`, {
          name,
          weight,
        })
      : api.post<TrainingSession>(
          `${root}/admin/calls/${callId}/training-sessions`,
          { name, weight },
        )
    ).then((r) => r.data),
  attendance: (id: string) =>
    api
      .get<Attendance[]>(`${root}/admin/training-sessions/${id}/attendance`)
      .then((r) => r.data),
  markAttendance: (id: string, studentId: string, present: boolean) =>
    present
      ? api.post(
          `${root}/admin/training-sessions/${id}/attendance/${studentId}`,
        )
      : api.delete(
          `${root}/admin/training-sessions/${id}/attendance/${studentId}`,
        ),
  merit: (id: string) =>
    api
      .get<MeritList>(`${root}/admin/calls/${id}/merit-list`)
      .then((r) => r.data),
  grants: (id: string) =>
    api.get<Grant[]>(`${root}/calls/${id}/grants`).then((r) => r.data),
  award: (id: string, studentId: string, categoryId: string) =>
    api
      .post<Grant>(`${root}/calls/${id}/grants`, { studentId, categoryId })
      .then((r) => r.data),
  myGrants: () => api.get<Grant[]>(`${root}/my-grants`).then((r) => r.data),
  months: (id: string, admin = false) =>
    api
      .get<
        MonthlyHours[]
      >(`${root}/${admin ? "admin/" : ""}grants/${id}/months`)
      .then((r) => r.data),
  recordHours: (id: string, month: number, hours: number) =>
    api
      .put<MonthlyHours>(
        `${root}/admin/grants/${id}/months/${month}/clock-hours`,
        { hours },
      )
      .then((r) => r.data),
  extraHours: (id: string, month: number, hours: number) =>
    api
      .post<MonthlyHours>(
        `${root}/admin/grants/${id}/months/${month}/extra-hours`,
        { hours },
      )
      .then((r) => r.data),
  transferHours: (id: string, month: number, hours: number) =>
    api
      .post<MonthlyHours>(
        `${root}/admin/grants/${id}/months/${month}/transfer-excess`,
        { hours },
      )
      .then((r) => r.data),
  dailyAttendance: (id: string) =>
    api
      .get<DailyAttendance[]>(`${root}/admin/grants/${id}/attendance`)
      .then((r) => r.data),
  resolveIncident: (id: string, exitTime: string | null, explanation: string) =>
    api
      .put<DailyAttendance>(`${root}/admin/attendance/${id}/resolve`, {
        exitTime,
        explanation,
      })
      .then((r) => r.data),
};
