const configuredApiUrl = import.meta.env.VITE_API_URL;

function normalizeApiUrl(value: string | undefined) {
  if (!value) return import.meta.env.PROD ? "" : "http://localhost:4000/api";
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const API_URL = normalizeApiUrl(configuredApiUrl);

export type Role = "STUDENT" | "OWNER" | "ADMIN";
export type User = { id: string; name: string; email: string; phone?: string; role: Role; isPro: boolean };
export type Price = { name: string; amount: number };
export type LibraryImage = { id: string; url: string; isCover: boolean; type?: "EXTERIOR" | "STUDY_HALL" | "SEAT" | "FACILITIES" | "OTHER"; alt?: string };
export type Library = {
  id: string; name: string; slug: string; description: string; address: string; area: string; city: string; state: string;
  phone: string; whatsapp?: string; timings: string; capacity?: number; facilities: string[]; pricing: Price[];
  latitude?: number; longitude?: number; images: LibraryImage[]; coverImage?: string | null; mapsUrl?: string; rating?: number | null; reviewCount?: number;
  announcements?: { id: string; title: string; message: string; createdAt: string }[]; _count?: Record<string, number>;
  reviews?: { id: string; rating: number; comment?: string; createdAt: string; student?: { name: string } }[];
};

export type CommunityMessageType = "TEXT" | "VACANCY" | "CURRENT_AFFAIRS" | "EXAM_UPDATE" | "NOTE" | "FILE";
export type CommunityMember = { id: string; userId: string; user: { id: string; name: string; role: Role } };
export type CommunityChannel = {
  id: string; type: "GLOBAL" | "LIBRARY" | "DIRECT"; name: string; description?: string; libraryId?: string;
  members?: CommunityMember[]; latestMessage?: CommunityMessage | null; unreadCount?: number;
};
export type CommunityMessage = {
  id: string; channelId: string; senderId: string; type: CommunityMessageType; body?: string | null;
  attachmentUrl?: string | null; attachmentName?: string | null; attachmentMime?: string | null;
  isDeleted: boolean; createdAt: string; sender: { id: string; name: string; role: Role };
  replyTo?: CommunityMessage | null; reactions: { id?: string; emoji: string; userId: string; user?: { id: string; name: string } }[];
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("VITE_API_URL is required in production.");
  const token = localStorage.getItem("bms_token");
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach BookMySeat API. Check VITE_API_URL and Render CLIENT_URL/CORS settings.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
