const API_BASE = '/api';

interface PaginatedResults<T> {
  results: T[];
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

function extractApiErrorMessage(status: number, err: unknown): string {
  if (!err || typeof err !== 'object') return `HTTP ${status}`;
  const obj = err as Record<string, unknown>;
  const top = obj.detail ?? obj.message ?? obj.error;
  if (typeof top === 'string' && top.trim()) return top;
  if (Array.isArray(top) && top[0]) return String(top[0]);

  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v) && v[0]) return `${k}: ${String(v[0])}`;
    if (typeof v === 'string' && v.trim()) return `${k}: ${v}`;
  }
  return `HTTP ${status}`;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Token ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (!path.startsWith('/public/')) window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let err: unknown = {};
    if (raw) {
      try {
        err = JSON.parse(raw);
      } catch {
        err = { detail: raw };
      }
    }
    throw new Error(extractApiErrorMessage(res.status, err));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function apiList<T>(path: string, options: RequestInit = {}): Promise<T[]> {
  const data = await api<T[] | PaginatedResults<T>>(path, options);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function login(username: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.non_field_errors?.[0] || 'Invalid credentials');
  }
  return res.json();
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export async function downloadBlob(path: string, filename: string): Promise<void> {
  const blob = await apiBlob(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  role: string;
  member_id: number | null;
  member_number?: string;
}
export const auth = {
  me: () => api<CurrentUser>('/auth/me/'),
};

// List helpers with pagination
export function listUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === '') return;
      if (v === false) return;
      sp.set(k, String(v));
    });
  }
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}

export interface MembershipFeeKpis {
  reference_fees_kes: {
    registration: number;
    retention_per_year: number;
    welfare_allocation_per_retention: number;
    student_membership: number;
  };
  registration_fee: {
    members_paid_count: number;
    receipts_count: number;
    total_kes: number;
  };
  retention_fee: {
    members_paid_count: number;
    receipts_count: number;
    total_kes: number;
  };
  welfare_from_retention: {
    estimated_total_kes: number;
    note: string;
  };
  student_membership: {
    members_paid_count: number;
    receipts_count: number;
    total_kes: number;
  };
}

export interface KPIs {
  members: {
    active: number;
    pending_approval: number;
    new_this_month: number;
    expiring_30_days: number;
    expiring_60_days: number;
    expiring_90_days: number;
    expired: number;
  };
  events: { upcoming: number; registrations_pending_payment: number };
  savings: { total_balance: number };
  payments: { today: number; this_month: number };
  contributions: { defaulters_this_month: number };
  /** Present for super_admin, admin, loan_officer only */
  membership_fees?: MembershipFeeKpis;
}

// Public website API (no auth required)
export interface NavLink {
  label: string;
  url: string;
}

export interface FooterSection {
  title: string;
  links: NavLink[];
}

export interface NoticeItem {
  text: string;
  url?: string;
  file?: string;
}

export interface HeroSlide {
  id: number;
  image: string;
  title?: string;
  link_url?: string;
  link_label?: string;
  display_order?: number;
}

export interface SiteSettings {
  site_name: string;
  logo: string | null;
  favicon: string | null;
  tagline: string;
  phone_numbers: string;
  email: string;
  address: string;
  google_map_embed: string;
  social_links: Record<string, string>;
  announcements: Array<string | NoticeItem>;
  hero_slides: HeroSlide[];
  footer_sections: FooterSection[];
  nav_links: NavLink[];
  footer_links: NavLink[];
  opening_hours: string;
  emergency_number: string;
}

export interface SeoPage {
  page_name: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  og_image: string | null;
}

export interface TeamMember {
  id: number;
  name: string;
  photo: string | null;
  designation: string;
  department: string;
  region?: string;
  qualifications: string;
  years_of_experience: number | null;
  bio: string;
}

export interface HomePageContent {
  chairperson_name: string;
  chairperson_title: string;
  chairperson_photo: string | null;
  chairperson_message: string;
  intro_text: string;
  quick_links: Array<{ label: string; url: string }>;
  updated_at: string;
}

export interface AboutPageContent {
  history: string;
  vision: string;
  mission: string;
  core_values: string;
  objectives: string;
  constitution_file: string | null;
  governance_document: string | null;
  updated_at: string;
}

export interface MembershipPageContent {
  intro_text: string;
  eligibility: string;
  requirements: string;
  benefits: string;
  renewal_info: string;
  /** KES amounts — API may return decimal strings; optional until backend is migrated. */
  registration_fee_kes?: string | number;
  retention_fee_kes_per_year?: string | number;
  retention_welfare_allocation_kes?: string | number;
  student_membership_fee_kes?: string | number;
  mpesa_paybill?: string;
  mpesa_account_format?: string;
  updated_at: string;
}

export interface Resource {
  id: number;
  title: string;
  resource_type: string;
  description: string;
  file: string | null;
  external_url: string | null;
  display_order: number;
  created_at: string;
}

export interface Download {
  id: number;
  title: string;
  category: string;
  description: string;
  file: string;
  display_order: number;
  created_at: string;
}

export interface Job {
  id: number;
  title: string;
  job_type: string;
  organization: string;
  description: string;
  requirements: string;
  location: string;
  application_deadline: string | null;
  application_url: string | null;
  contact_email: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  partners: string;
  project_type: string;
  image: string | null;
  external_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface GalleryMedia {
  id: number;
  title: string;
  media_type: string;
  image: string | null;
  video_url: string | null;
  display_order: number;
  created_at: string;
}

export interface GalleryAlbum {
  id: number;
  title: string;
  description: string;
  cover_image: string | null;
  event: number | null;
  media: GalleryMedia[];
  media_count: number;
  created_at: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  featured_image: string | null;
  excerpt: string;
  content?: string;
  category?: number | { id: number; name: string; slug: string; description?: string } | null;
  category_name?: string;
  category_slug?: string | null;
  tags: { name: string; slug: string }[];
  is_featured?: boolean;
  author_name?: string;
  reading_time_minutes: number;
  views_count?: number;
  published_at: string | null;
  created_at: string;
  related_posts?: BlogPost[];
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const publicApi = {
  settings: () => api<SiteSettings>('/public/settings/'),
  heroSlides: () => apiList<HeroSlide>('/public/hero-slides/'),
  team: () => apiList<TeamMember>('/public/team/'),
  homeContent: () => api<HomePageContent>('/public/home/'),
  aboutContent: () => api<AboutPageContent>('/public/about-content/'),
  membershipContent: () => api<MembershipPageContent>('/public/membership-content/'),
  blogCategories: () => apiList<BlogCategory>('/public/blog/categories/'),
  blogPosts: (params?: Record<string, string | number | boolean | undefined>) =>
    api<Paginated<BlogPost> | BlogPost[]>(listUrl('/public/blog/posts/', params)),
  blogPost: (slug: string) => api<BlogPost>(`/public/blog/posts/${slug}/`),
  contact: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    api<{ detail: string }>('/public/contact/', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: Partial<Member>) =>
    api<{ detail: string; member_number: string }>('/public/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resources: (params?: Record<string, string>) =>
    apiList<Resource>(listUrl('/public/resources/', params)),
  downloads: (params?: Record<string, string>) =>
    apiList<Download>(listUrl('/public/downloads/', params)),
  jobs: (params?: Record<string, string>) =>
    apiList<Job>(listUrl('/public/jobs/', params)),
  projects: (params?: Record<string, string>) =>
    apiList<Project>(listUrl('/public/projects/', params)),
  gallery: (params?: Record<string, string>) =>
    apiList<GalleryAlbum>(listUrl('/public/gallery/', params)),
  seoPage: (pageName: string) => api<SeoPage>(`/public/seo/${encodeURIComponent(pageName)}/`),
};

export const dashboard = {
  kpis: () => api<KPIs>('/dashboard/kpis/'),
};

export const members = {
  list: (params?: Record<string, string>) =>
    api<{ results: Member[]; count?: number }>(listUrl('/members/', params)),
  get: (id: number) => api<Member>(`/members/${id}/`),
  create: (data: Partial<Member>) => api<Member>('/members/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Member>) =>
    api<Member>(`/members/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  approve: (id: number) => api<Member>(`/members/${id}/approve/`, { method: 'POST' }),
  downloadIdCard: (id: number) => downloadBlob(`/members/${id}/id_card/`, `member_id_${id}.pdf`),
};

export interface MemberDocument {
  id: number;
  member: number;
  document_type: string;
  file: string;
  uploaded_at: string;
}
export const documents = {
  list: (params?: Record<string, string>) =>
    api<{ results: MemberDocument[] }>(listUrl('/documents/', params)),
  create: async (formData: FormData): Promise<MemberDocument> => {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/documents/`, { method: 'POST', body: formData, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.file?.[0] || `HTTP ${res.status}`);
    }
    return res.json();
  },
};

export const membershipTypes = {
  list: () => apiList<MembershipType>('/membership-types/'),
};

export interface EventRegistration {
  id: number;
  event: number;
  member: number | null;
  ticket_number: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  is_guest: boolean;
  dietary_requirements: string;
  special_needs: string;
  amount_payable: string;
  paid: boolean;
  qr_code: string;
}
export interface CpdSummary {
  total_cpd_points: number;
  events: { event_title: string; event_date: string | null; cpd_points: number }[];
}

export const events = {
  list: (params?: Record<string, string>) =>
    api<{ results: Event[] }>(listUrl('/events/', params)),
  cpdList: (params?: Record<string, string>) =>
    api<{ results: Event[] }>(listUrl('/events/', { ...params, has_cpd: 'true' })),
  get: (id: number) => api<Event>(`/events/${id}/`),
  registrations: {
    list: (params?: Record<string, string>) =>
      api<{ results: EventRegistration[] }>(listUrl('/registrations/', params)),
    create: (data: Partial<EventRegistration>) =>
      api<EventRegistration>('/registrations/', { method: 'POST', body: JSON.stringify(data) }),
    myCpdSummary: () => api<CpdSummary>('/registrations/my-cpd-summary/'),
    downloadCertificate: (regId: number) =>
      downloadBlob(`/registrations/${regId}/certificate/`, `certificate_${regId}.pdf`),
  },
  checkIn: (ticketNumber: string) =>
    api<{ id: number; registration: number }>('/registrations/check-in/', {
      method: 'POST',
      body: JSON.stringify({ ticket_number: ticketNumber }),
    }),
};

export const payments = {
  list: (params?: Record<string, string>) =>
    api<{ results: Payment[] }>(listUrl('/payments/', params)),
  create: (data: Partial<Payment>) =>
    api<Payment>('/payments/', { method: 'POST', body: JSON.stringify(data) }),
  downloadReceipt: (id: number) => downloadBlob(`/payments/${id}/receipt_pdf/`, `receipt_${id}.pdf`),
  emailReceipt: (id: number) => api<{ detail: string }>(`/payments/${id}/email_receipt/`, { method: 'POST' }),
  mpesaStkPush: (data: { phone_number: string; event_registration_id: number }) =>
    api<{ detail: string }>('/payments/mpesa/stk-push/', { method: 'POST', body: JSON.stringify(data) }),
  publicEventPaymentStatus: (ticketNumber: string) =>
    api<{
      registration_id: number;
      ticket_number: string;
      event_title: string;
      guest_name: string;
      guest_email: string;
      amount_payable: string;
      paid: boolean;
      receipt_number: string | null;
      payment_method: string | null;
    }>(`/payments/public/event-payment/${encodeURIComponent(ticketNumber)}/`),
  publicGuestStkPush: (data: { ticket_number: string; phone_number: string; guest_email?: string }) =>
    api<{ detail: string; CheckoutRequestID: string }>('/payments/public/guest/stk-push/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  publicGuestPaybillConfirm: (data: { ticket_number: string; transaction_code: string; phone_number?: string; guest_email?: string }) =>
    api<{ detail: string; receipt_number: string }>('/payments/public/guest/paybill-confirm/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  memberEventPaybillConfirm: (data: { event_registration_id: number; transaction_code: string; phone_number?: string }) =>
    api<{ detail: string; receipt_number: string }>('/payments/member/event/paybill-confirm/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface Member {
  id: number;
  member_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  kvb_number?: string;
  status: string;
  membership_expiry: string | null;
  membership_type: number | null;
  date_joined: string;
  [key: string]: unknown;
}

export interface MembershipType {
  id: number;
  name: string;
  code: string;
  annual_fee: string;
  registration_fee: string;
  validity_months: number;
  [key: string]: unknown;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  status: string;
  price_member: string;
  price_non_member: string;
  cpd_points?: number;
  banner?: string | null;
  agenda?: string | null;
  location?: string | null;
  address?: string | null;
  city?: string | null;
  map_link?: string | null;
  [key: string]: unknown;
}

export interface Payment {
  id: number;
  receipt_number: string;
  member: number | null;
  member_number?: string | null;
  event_registration?: number | null;
  event_ticket_number?: string | null;
  payment_type: string;
  amount: string;
  method: string;
  payment_date: string;
  [key: string]: unknown;
}

export interface SavingsAccount {
  id: number;
  member: number;
  member_number: string;
  account_type: number;
  account_type_name: string;
  account_number: string;
  balance: string | number;
  opened_at: string;
  is_active: boolean;
}

export const savings = {
  list: (params?: Record<string, string>) =>
    api<{ results: SavingsAccount[] }>(listUrl('/accounts/', params)),
};

export interface ContributionType {
  id: number;
  name: string;
  code: string;
  description: string;
  amount: string;
  is_active: boolean;
  created_at: string;
}

export const contributions = {
  types: () => apiList<ContributionType>('/contributions/types/'),
};

export interface ReportItem {
  id: string;
  name: string;
  url: string;
  params: string[];
}
export const reports = {
  list: () => api<{ reports: ReportItem[] }>('/reports/'),
  download: (path: string, filename: string) => downloadBlob(path.replace(/^\/api/, ''), filename),
};

