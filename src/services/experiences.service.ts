import api from "@/services/api.ts";
import type  { CategoryKey } from "@/pages/public/ExperiencesPage.tsx";
import type { AdminExperience, ExperienceStatus } from "@/pages/experiences/experience.data.ts";
import type  { ExperienceFormValues } from "@/pages/experiences/ExperienceForm.tsx";

export type BackendTopic = "FISICA" | "ASTRONOMIA" | "OPTICA" | "INFANTIL" | "AMBIENTE" | "TECNOLOGIA";
export type BackendStatus = "DRAFT" | "PUBLISHED" | "INACTIVE" | "REVIEW";

export interface ActivityResponse {
    id: number;
    name: string;
    description: string;
    duration: number;
    topic: BackendTopic;
    status: BackendStatus;
    minAge?: number | null;
    maxAge?: number | null;
    maxCapacity: number;
    location: string;
    targetAudience?: string | null;
    catalogOrder?: number | null;
    color?: string | null;
    tag?: string | null;
    showInCatalog: boolean;
    isReservable: boolean;
    createdAt?: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface ActivityRequest {
    name: string;
    description: string;
    duration: number;
    topic: BackendTopic;
    status: BackendStatus;
    minAge?: number | null;
    maxAge?: number | null;
    maxCapacity: number;
    location: string;
    targetAudience?: string | null;
    catalogOrder?: number | null;
    color?: string | null;
    tag?: string | null;
    showInCatalog: boolean;
    isReservable: boolean;
}

const TOPIC_TO_BACKEND: Record<CategoryKey, BackendTopic> = {
    fisica: "FISICA",
    astronomia: "ASTRONOMIA",
    optica: "OPTICA",
    infantil: "INFANTIL",
    ambiente: "AMBIENTE",
    tecnologia: "TECNOLOGIA",
};

const TOPIC_FROM_BACKEND: Record<BackendTopic, CategoryKey> = {
    FISICA: "fisica",
    ASTRONOMIA: "astronomia",
    OPTICA: "optica",
    INFANTIL: "infantil",
    AMBIENTE: "ambiente",
    TECNOLOGIA: "tecnologia",
}

const STATUS_TO_BACKEND: Record<ExperienceStatus, BackendStatus> = {
    borrador: "DRAFT",
    publicada: "PUBLISHED",
    revision: "REVIEW",
    desactivada: "INACTIVE",
};

const STATUS_FROM_BACKEND: Record<BackendStatus, ExperienceStatus> = {
    DRAFT: "borrador",
    PUBLISHED: "publicada",
    REVIEW: "revision",
    INACTIVE: "desactivada",
}

export const toAdminExperience = (dto: ActivityResponse): AdminExperience => {
    const topicKey = (TOPIC_FROM_BACKEND[dto.topic]||"fisica") as CategoryKey;
    const audiencesList = dto.targetAudience ? dto.targetAudience.split(",").map((s) => s.trim()).filter(Boolean) : ["General"];

    return {
        id: dto.id,
        name: dto.name,
        description: dto.description || "",
        topic: topicKey,
        audiences: audiencesList.length > 0 ? audiencesList : ["General"],
        durationMinutes: dto.duration || 0,
        capacity: dto.maxCapacity || 0,
        price: 0,
        location: dto.location || "General",
        status: STATUS_FROM_BACKEND[dto.status] || "borrador",
        order: dto.catalogOrder ?? null,
        tagLabel: dto.tag || dto.topic,
        showInCatalog: dto.showInCatalog ?? true,
        availableForBooking: dto.isReservable ?? true,
        updatedAt: dto.updatedAt
            ? new Date(dto.updatedAt).toLocaleDateString("es-MX", {day: "2-digit", month: "short", year: "numeric"})
            : "Reciente",
        updatedBy: dto.updatedBy || "Administrador",
    }
}

export const toActivityRequest = (form: ExperienceFormValues): ActivityRequest => {
    const backendTopic: BackendTopic = form.topic ? TOPIC_TO_BACKEND[form.topic] || "FISICA" : "FISICA";
    const backendStatus: BackendStatus = STATUS_TO_BACKEND[form.status] || "DRAFT";

    return {
        name: form.name.trim(),
        description: form.description.trim(),
        duration: Number(form.durationMinutes) || 30,
        topic: backendTopic,
        status: backendStatus,
        minAge: null,
        maxAge: null,
        maxCapacity: Number(form.capacity) || 1,
        location: form.location.trim() || "Sala principal",
        targetAudience: form.audiences.join(", "),
        catalogOrder: form.order ? Number(form.order) : null,
        color: null,
        tag: form.tagLabel.trim() || null,
        showInCatalog: form.showInCatalog,
        isReservable: form.availableForBooking,
    };
};

export const toFormValues = (dto: ActivityResponse | AdminExperience): ExperienceFormValues => {
    if ("durationMinutes" in dto) {
        return {
            name: dto.name,
            description: dto.description,
            topic: dto.topic,
            audiences: dto.audiences,
            durationMinutes: String(dto.durationMinutes),
            capacity: String(dto.capacity),
            location: dto.location,
            status: dto.status,
            order: dto.order == null ? "" : String(dto.order),
            tagLabel: dto.tagLabel,
            showInCatalog: dto.showInCatalog,
            availableForBooking: dto.availableForBooking,
        };
    }

    const admin = toAdminExperience(dto);
    return toFormValues(admin);
};

/* ───────────── Métodos de Servicio ───────────── */

export const experiencesService = {
    async getActivities(): Promise<AdminExperience[]> {
        const res = await api.get<ActivityResponse[]>("/catalog/activities");
        return res.data.map(toAdminExperience);
    },

    async getActivityById(id: string): Promise<AdminExperience> {
        const res = await api.get<ActivityResponse>(`/catalog/activities/${id}`);
        return toAdminExperience(res.data);
    },

    async createActivity(form: ExperienceFormValues): Promise<AdminExperience> {
        const payload = toActivityRequest(form);
        const res = await api.post<ActivityResponse>("/catalog/activities", payload);
        return toAdminExperience(res.data);
    },

    async updateActivity(id: string, form: ExperienceFormValues): Promise<AdminExperience> {
        const payload = toActivityRequest(form);
        const res = await api.put<ActivityResponse>(`/catalog/activities/${id}`, payload);
        return toAdminExperience(res.data);
    },

    async deleteActivity(id: string): Promise<void> {
        await api.delete(`/catalog/activities/${id}`);
    },

    async updateActivityStatus(id: string, status: ExperienceStatus): Promise<AdminExperience> {
        const current = await experiencesService.getActivityById(id);
        const form = toFormValues(current);
        form.status = status;
        return experiencesService.updateActivity(id, form);
    },
};
