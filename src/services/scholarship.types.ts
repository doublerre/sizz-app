export type ApplicationType = "NEW_ENTRY" | "RENEWAL";
export type CallStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";
export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "DOCUMENTS_INCOMPLETE"
  | "VALIDATED"
  | "REJECTED"
  | "AWARDED";
export type FieldType =
  | "SHORT_TEXT"
  | "PARAGRAPH"
  | "NUMBER"
  | "DATE"
  | "TIME"
  | "PHONE"
  | "EMAIL"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "YES_NO"
  | "FILE";
export type Answer = string | number | boolean | string[];
export type Answers = Record<string, Answer>;
export interface FormField {
  id?: string;
  key: string;
  label: string;
  helpText: string | null;
  type: FieldType;
  required: boolean;
  sortOrder: number;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  maxFileBytes: number | null;
  allowedFileTypes: ("PDF" | "IMAGE")[];
  correctAnswer: Answer | null;
  scoreWeight: number | null;
  options: { value: string; label: string }[];
}
export interface FormVersion {
  id: string;
  version: number;
  createdAt: string;
  fields: FormField[];
}
export interface ScholarshipForm {
  id: string;
  name: string;
  purpose: "APPLICATION" | "EXAM";
  active: boolean;
  versions: FormVersion[];
}
export interface CallForm {
  id: string;
  formId: string;
  formName: string;
  purpose: "APPLICATION" | "EXAM";
  formVersionId: string;
  version: number;
  applicationType: ApplicationType | null;
}
export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
}
export interface Category {
  id: string;
  code: string;
  name: string;
  monthlyAmount: number;
  monthlyHours: number;
  active: boolean;
}
export interface ScholarshipCall {
  id: string;
  periodId: string;
  name: string;
  opensOn: string;
  closesOn: string;
  durationMonths: number;
  totalBudget: number;
  committedBudget: number;
  availableBudget: number;
  status: CallStatus;
  applicationTypes: ApplicationType[];
  categories: Category[];
}
export type CreateCall = Pick<
  ScholarshipCall,
  | "periodId"
  | "name"
  | "opensOn"
  | "closesOn"
  | "durationMonths"
  | "totalBudget"
  | "applicationTypes"
> & { categoryIds: string[] };
export interface OpenCall {
  id: string;
  name: string;
  periodId: string;
  periodName: string;
  opensOn: string;
  closesOn: string;
  durationMonths: number;
  applicationType: ApplicationType;
  applicationTypes: ApplicationType[];
  form: FormVersion;
}
export interface ApplicationFile {
  id: string;
  fieldKey: string;
  originalName: string;
  mediaType: string;
  sizeBytes: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewComment: string | null;
  uploadedAt: string;
  downloadUrl: string;
}
export interface ScholarshipApplication {
  id: string;
  callId: string;
  periodId: string;
  periodName: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  createdAt: string;
  submittedAt: string | null;
  form: FormVersion;
  answers: Answers;
  files: ApplicationFile[];
}
export interface AdminApplication {
  application: ScholarshipApplication;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
}
export interface Exam {
  formVersionId: string;
  name: string;
  form: FormVersion;
  scorePercent: number | null;
  submittedAt: string | null;
}
export interface TrainingSession {
  id: string;
  callId: string;
  name: string;
  weight: number;
  presentCount: number;
}
export interface Attendance {
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  markedAt: string;
}
export interface Merit {
  rank: number;
  applicationId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  examPercent: number;
  attendancePercent: number;
  finalPercent: number;
}
export interface MeritList {
  callId: string;
  examWeight: number;
  attendanceWeight: number;
  applicants: Merit[];
}
export interface Grant {
  id: string;
  callId: string;
  studentId: string;
  categoryCode: string;
  categoryName: string;
  monthlyAmount: number;
  monthlyHours: number;
  durationMonths: number;
  committedAmount: number;
  awardedAt: string;
}
export interface MonthlyHours {
  grantId: string;
  monthNumber: number;
  monthlyHours: number;
  minimumHours: number;
  clockHours: number;
  extraHours: number;
  carriedInHours: number;
  creditedHours: number;
  remainingHours: number;
  eligible: boolean;
  payableHours: number;
  estimatedAmount: number;
  excessHours: number;
  carryableExcessHours: number;
  carriedOutHours: number;
}
export interface DailyAttendance {
  id: string;
  grantId: string;
  date: string;
  firstPunch: string | null;
  lastPunch: string | null;
  workedHours: number;
  status: string;
  explanation: string | null;
}
