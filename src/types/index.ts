export type Role = "client" | "provider" | "admin";
export type JobStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded";
export type PaymentProvider = "mercadopago" | "stripe";

export interface User {
  id: string; role: Role; name: string; email: string; phone?: string;
  avatar_url?: string; lat?: number; lng?: number; city?: string;
  province?: string; country: string; is_blocked: boolean; created_at: string;
}
export interface PriceItem { service: string; price: number; unit: string; }
export interface Provider {
  id: string; user_id: string; categories: string[]; bio?: string;
  price_list: PriceItem[]; photos: string[]; service_radius_km: number;
  service_zones: string[]; documents_verified: boolean; cuit_cuil?: string;
  rating_avg: number; reviews_count: number; is_available: boolean;
  created_at: string; users?: User;
}
export interface Job {
  id: string; client_id: string; provider_id?: string; category: string;
  description: string; price?: number; status: JobStatus; scheduled_at?: string;
  address: string; lat?: number; lng?: number; photos: string[];
  created_at: string; updated_at: string;
  clients?: User; providers?: Provider & { users?: User };
}
export interface Message {
  id: string; job_id: string; sender_id: string; text: string;
  read: boolean; created_at: string; users?: User;
}
export interface Review {
  id: string; job_id: string; client_id: string; provider_id: string;
  rating: number; comment?: string; reply?: string; created_at: string; clients?: User;
}
export interface Payment {
  id: string; job_id: string; amount: number; provider_share?: number;
  platform_fee?: number; status: PaymentStatus; payment_provider?: PaymentProvider;
  provider_payment_id?: string; preference_id?: string; checkout_url?: string;
  created_at: string; updated_at: string;
}
export interface Notification {
  id: string; user_id: string; title: string; body: string;
  type?: string; data: Record<string, unknown>; read: boolean; created_at: string;
}
export interface SearchFilters {
  category?: string; maxDistanceKm?: number; minRating?: number;
  available?: boolean; city?: string;
}
