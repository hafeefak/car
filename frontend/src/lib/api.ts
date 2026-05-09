import type { AuthResponse, Booking, BookingPayload, FollowUp, Lead, LeadPayload, Snapshot, Stat, User, Vehicle, VehiclePayload } from "../types";
import { clearToken, getToken } from "./storage";

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type RawSnapshot = {
  totalLeads: number;
  openLeads: number;
  availableVehicles: number;
  pendingFollowUps: number;
  totalBookings: number;
};

type RawLead = {
  id: number;
  source: string | null;
  interest: string;
  status: string;
  expectedPrice: number;
  customer: {
    name: string;
    phone: string;
    city: string | null;
  };
};

type RawVehicle = {
  id: number;
  stockCode: string;
  title: string;
  makeName: string;
  modelName: string;
  vehicleYear: number;
  fuel: string;
  transmission: string;
  mileageKm: number;
  price: number;
  purchasePrice: number;
  color: string | null;
  status: string;
};

type RawFollowUp = {
  id: number;
  title: string;
  dueAt: string;
  notes: string | null;
  status: string;
  customer: {
    name: string;
  };
  lead?: {
    id: number;
    interest: string;
  } | null;
};

type RawBooking = {
  id: number;
  amount: number;
  paymentMode: string;
  deliveryDate: string;
  customer: {
    name: string;
  };
  vehicle: {
    title: string;
  };
  lead?: {
    id: number;
    interest: string;
  } | null;
  finalPrice?: number | null;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 || response.status === 403) {
    clearToken();
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Request failed.");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function formatAmount(value: number) {
  return inr.format(value ?? 0);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDueLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatDeliveryLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(date);
}

function mapLead(lead: RawLead): Lead {
  return {
    id: lead.id,
    customerName: lead.customer.name,
    phone: lead.customer.phone,
    interest: lead.interest,
    source: lead.source ?? "Unknown",
    status: formatStatus(lead.status),
    rawStatus: lead.status,
    city: lead.customer.city ?? "-",
    budget: formatAmount(lead.expectedPrice),
    budgetMin: undefined,
    budgetMax: undefined,
    expectedPrice: lead.expectedPrice
  };
}

function mapVehicle(vehicle: RawVehicle): Vehicle {
  return {
    id: vehicle.id,
    stockCode: vehicle.stockCode,
    title: vehicle.title,
    make: vehicle.makeName,
    model: vehicle.modelName,
    year: vehicle.vehicleYear,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    mileageKm: vehicle.mileageKm,
    price: vehicle.price,
    purchasePrice: vehicle.purchasePrice,
    color: vehicle.color,
    status: formatStatus(vehicle.status),
    rawStatus: vehicle.status
  };
}

function mapFollowUp(followUp: RawFollowUp): FollowUp {
  return {
    id: followUp.id,
    title: followUp.title,
    customerName: followUp.customer.name,
    dueLabel: formatDueLabel(followUp.dueAt),
    notes: followUp.notes ?? "",
    status: formatStatus(followUp.status),
    leadId: followUp.lead?.id ?? null,
    leadInterest: followUp.lead?.interest ?? null
  };
}

function mapBooking(booking: RawBooking): Booking {
  return {
    id: booking.id,
    customerName: booking.customer.name,
    vehicleTitle: booking.vehicle.title,
    amount: booking.amount,
    paymentMode: booking.paymentMode,
    deliveryLabel: formatDeliveryLabel(booking.deliveryDate),
    leadId: booking.lead?.id ?? null,
    leadInterest: booking.lead?.interest ?? null,
    finalPrice: booking.finalPrice ?? null
  };
}

function buildStats(snapshot: RawSnapshot, bookings: Booking[]): Stat[] {
  const bookingRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);

  return [
    {
      label: "Total leads",
      value: String(snapshot.totalLeads),
      hint: `${snapshot.openLeads} currently open`
    },
    {
      label: "Available vehicles",
      value: String(snapshot.availableVehicles),
      hint: "Ready to pitch"
    },
    {
      label: "Pending follow-ups",
      value: String(snapshot.pendingFollowUps),
      hint: "Need attention"
    },
    {
      label: "Bookings",
      value: String(snapshot.totalBookings),
      hint: `${formatAmount(bookingRevenue)} advanced`
    }
  ];
}

function toLeadRequest(payload: LeadPayload) {
  const expectedPrice =
    payload.budgetMax ?? payload.budgetMin ?? undefined;

  return {
    customerName: payload.customerName,
    customerPhone: payload.phone,
    customerCity: payload.city || null,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    source: payload.source,
    interest: payload.interest,
    status: payload.status,
    expectedPrice,
    followUpTitle: payload.followUpTitle || null,
    dueAt: payload.dueAt || null,
    notes: payload.notes || null
  };
}

function toVehicleRequest(payload: VehiclePayload) {
  return {
    stockCode: payload.stockCode,
    title: payload.title,
    makeName: payload.make,
    modelName: payload.model,
    vehicleYear: payload.year,
    fuel: payload.fuel,
    transmission: payload.transmission,
    mileageKm: payload.mileageKm,
    price: payload.price,
    purchasePrice: payload.purchasePrice,
    color: payload.color || null,
    status: payload.status
  };
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  register(name: string, email: string, password: string, dealershipName: string, city: string) {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, dealershipName, city })
    });
  },
  me() {
    return request<User>("/api/auth/me");
  },
  async snapshot(): Promise<Snapshot> {
    const [snapshot, rawLeads, rawVehicles, rawFollowUps, rawBookings] = await Promise.all([
      request<RawSnapshot>("/api/crm/snapshot"),
      request<RawLead[]>("/api/leads"),
      request<RawVehicle[]>("/api/vehicles"),
      request<RawFollowUp[]>("/api/follow-ups"),
      request<RawBooking[]>("/api/bookings")
    ]);

    const leads = rawLeads.map(mapLead);
    const vehicles = rawVehicles.map(mapVehicle);
    const followUps = rawFollowUps.map(mapFollowUp);
    const bookings = rawBookings.map(mapBooking);

    return {
      stats: buildStats(snapshot, bookings),
      leads,
      vehicles,
      followUps,
      bookings,
      revenue: formatAmount(bookings.reduce((sum, booking) => sum + booking.amount, 0))
    };
  },
  async leads() {
    return request<RawLead[]>("/api/leads").then((items) => items.map(mapLead));
  },
  createLead(payload: LeadPayload) {
    return request<RawLead>("/api/leads", {
      method: "POST",
      body: JSON.stringify(toLeadRequest(payload))
    }).then(mapLead);
  },
  updateLead(leadId: number, payload: LeadPayload) {
    return request<RawLead>(`/api/leads/${leadId}`, {
      method: "PUT",
      body: JSON.stringify(toLeadRequest(payload))
    }).then(mapLead);
  },
  deleteLead(leadId: number) {
    return request<void>(`/api/leads/${leadId}`, { method: "DELETE" });
  },
  async vehicles() {
    return request<RawVehicle[]>("/api/vehicles").then((items) => items.map(mapVehicle));
  },
  createVehicle(payload: VehiclePayload) {
    return request<RawVehicle>("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(toVehicleRequest(payload))
    }).then(mapVehicle);
  },
  updateVehicle(vehicleId: number, payload: VehiclePayload) {
    return request<RawVehicle>(`/api/vehicles/${vehicleId}`, {
      method: "PUT",
      body: JSON.stringify(toVehicleRequest(payload))
    }).then(mapVehicle);
  },
  deleteVehicle(vehicleId: number) {
    return request<void>(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
  },
  async followUps() {
    return request<RawFollowUp[]>("/api/follow-ups").then((items) => items.map(mapFollowUp));
  },
  async bookings() {
    return request<RawBooking[]>("/api/bookings").then((items) => items.map(mapBooking));
  },
  createBooking(payload: BookingPayload) {
    return request<RawBooking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        leadId: payload.leadId,
        vehicleId: payload.vehicleId,
        amount: payload.amount,
        paymentMode: payload.paymentMode,
        deliveryDate: payload.deliveryDate || null,
        finalPrice: payload.finalPrice
      })
    }).then(mapBooking);
  }
};
