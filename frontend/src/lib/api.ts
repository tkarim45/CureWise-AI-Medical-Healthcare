/**
 * Typed client for the CureWise FastAPI backend.
 * Token is kept in localStorage and attached to every request.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const TOKEN_KEY = "curewise-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) return data.detail.map((d: { msg?: string }) => d.msg).join(", ");
    return res.statusText;
  } catch {
    return res.statusText || "Request failed";
  }
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  form?: FormData;
  auth?: boolean;
};

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", body, form, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: form ? form : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Types ----------

export type User = { id: string; username: string; email: string };
export type AuthResponse = { token: string; user: User };

export type Profile = {
  id: string;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  profile_picture?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
};

export type MedicalHistory = {
  id: string;
  user_id: string;
  conditions?: string | null;
  allergies?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
};

export type DiseaseModel = {
  key: string;
  label: string;
  kind: "classification" | "segmentation";
  labels: string[];
  has_chat: boolean;
};

export type Classification = {
  predicted_class: string;
  confidence?: number | null;
  images?: string[] | null;
};

export type StructuredReport = {
  patient_info?: { age?: string; gender?: string };
  haematology_results?: Array<{
    test: string;
    patient_value: string;
    unit?: string;
    reference_value?: string;
    remark?: string;
  }>;
  [k: string]: unknown;
};

export type Hospital = { name: string; address: string; lat: number; lng: number };

// ---------- API surface ----------

export const api = {
  signup: (username: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: { username, email, password },
      auth: false,
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    }),

  me: () => request<User>("/api/auth/me"),

  getProfile: () => request<Profile>("/api/profile"),
  updateProfile: (data: Partial<Profile>) =>
    request<Profile>("/api/profile", { method: "PUT", body: data }),

  listMedicalHistory: () => request<MedicalHistory[]>("/api/medical-history"),
  addMedicalHistory: (data: {
    conditions?: string;
    allergies?: string;
    notes?: string;
  }) => request<MedicalHistory>("/api/medical-history", { method: "POST", body: data }),

  chat: (query: string) =>
    request<{ response: string }>("/api/chat", { method: "POST", body: { query } }),

  medicalReport: (query: string | null, file: File | null) => {
    const form = new FormData();
    if (query) form.append("query", query);
    if (file) form.append("file", file);
    return request<{ structured_report: StructuredReport | null; response: string }>(
      "/api/medical-report/query",
      { method: "POST", form }
    );
  },

  acneAnalysis: (image: File) => {
    const form = new FormData();
    form.append("image", image);
    return request<{ response: string }>("/api/skin/acne-analysis", {
      method: "POST",
      form,
    });
  },

  nearbyHospitals: (lat: number, lng: number) =>
    request<{ hospitals: Hospital[] }>(
      `/api/emergency/hospitals?lat=${lat}&lng=${lng}`
    ),

  listDiseaseModels: () => request<DiseaseModel[]>("/api/disease-detection"),

  classifyDisease: (disease: string, image: File) => {
    const form = new FormData();
    form.append("image", image);
    return request<Classification>(`/api/disease-detection/${disease}/classify`, {
      method: "POST",
      form,
    });
  },

  diseaseChat: (disease: string, message: string) =>
    request<{ response: string }>(`/api/disease-detection/${disease}/chat`, {
      method: "POST",
      body: { message },
    }),
};
