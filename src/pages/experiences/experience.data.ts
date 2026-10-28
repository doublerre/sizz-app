import type { CategoryKey } from "../public/ExperiencesPage";

export type ExperienceStatus = "publicada" | "borrador" | "revision" | "desactivada";

export interface AdminExperience {
  id: string | number;
  name: string;
  description: string;
  topic: CategoryKey;
  audiences: string[];
  durationMinutes: number;
  capacity: number;
  price: number;
  location: string;
  status: ExperienceStatus;
  order: number | null; // null = automático
  tagLabel: string;
  showInCatalog: boolean;
  availableForBooking: boolean;
  updatedAt: string;
  updatedBy: string;
}

export const EXPERIENCE_ROUTES = {
  list: "/app/experiences",
  new: "/app/experiences/new",
  edit: (id: number | string) => `/app/experiences/${id}/edit`,
};

export const AUDIENCES = [
  "Primera infancia",
  "Familias",
  "Escolar",
  "Jóvenes",
  "General",
];

export const LOCATIONS = [
  "Sala de Física",
  "Sala de Astronomía",
  "Sala de Óptica",
  "Sala infantil",
  "Sala de Ambiente",
  "Sala de Tecnología",
];

// TODO: reemplazar por la llamada al servicio de administración (ej. adminService.getActivities()).
const base = {
  showInCatalog: true,
  availableForBooking: true,
  updatedAt: "24 ago 2026",
  updatedBy: "Ana López",
};

export const MOCK_EXPERIENCES: AdminExperience[] = [
  {
    ...base,
    id: 1,
    name: "Energía en movimiento",
    description:
      "Experimenta con fuerzas, movimiento y energía mediante retos interactivos.",
    topic: "fisica",
    tagLabel: "FÍSICA",
    audiences: ["Familias", "Escolar"],
    durationMinutes: 45,
    capacity: 30,
    price: 40,
    location: "Sala de Física",
    status: "publicada",
    order: 1,
  },
  {
    ...base,
    id: 2,
    name: "Exploradores del espacio",
    description: "Recorre el sistema solar y aprende a leer el cielo nocturno.",
    topic: "astronomia",
    tagLabel: "ASTRONOMÍA",
    audiences: ["Escolar", "Jóvenes"],
    durationMinutes: 60,
    capacity: 25,
    price: 45,
    location: "Sala de Astronomía",
    status: "publicada",
    order: 2,
  },
  {
    ...base,
    id: 3,
    name: "Laboratorio de luz",
    description:
      "Descubre cómo se comporta la luz con espejos, lentes y prismas.",
    topic: "optica",
    tagLabel: "ÓPTICA",
    audiences: ["Familias", "Escolar"],
    durationMinutes: 40,
    capacity: 20,
    price: 35,
    location: "Sala de Óptica",
    status: "borrador",
    order: 3,
    showInCatalog: false,
    availableForBooking: false,
  },
  {
    ...base,
    id: 4,
    name: "Ciencia para peques",
    description:
      "Juegos sensoriales para que los más pequeños exploren su entorno.",
    topic: "infantil",
    tagLabel: "INFANTIL",
    audiences: ["Primera infancia", "Familias"],
    durationMinutes: 30,
    capacity: 15,
    price: 30,
    location: "Sala infantil",
    status: "publicada",
    order: 4,
  },
  {
    ...base,
    id: 5,
    name: "Planeta vivo",
    description: "Conoce los ecosistemas y cómo cuidarlos desde casa.",
    topic: "ambiente",
    tagLabel: "AMBIENTE",
    audiences: ["Familias", "Escolar", "General"],
    durationMinutes: 50,
    capacity: 35,
    price: 40,
    location: "Sala de Ambiente",
    status: "publicada",
    order: 5,
  },
  {
    ...base,
    id: 6,
    name: "Robótica creativa",
    description: "Arma y programa pequeños robots para resolver retos.",
    topic: "tecnologia",
    tagLabel: "TECNOLOGÍA",
    audiences: ["Jóvenes", "Escolar"],
    durationMinutes: 75,
    capacity: 16,
    price: 55,
    location: "Sala de Tecnología",
    status: "borrador",
    order: null,
    showInCatalog: false,
    availableForBooking: false,
  },
];
