export type User = {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  dealershipName: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Stat = {
  label: string;
  value: string;
  hint: string;
};

export type Lead = {
  id: number;
  customerName: string;
  phone: string;
  interest: string;
  source: string;
  status: string;
  rawStatus: string;
  city: string;
  budget: string;
  budgetMin?: number;
  budgetMax?: number;
  expectedPrice?: number;
};

export type Vehicle = {
  id: number;
  stockCode: string;
  title: string;
  make: string;
  model: string;
  year: number;
  fuel: string;
  transmission: string;
  mileageKm: number;
  price: number;
  purchasePrice: number;
  color?: string | null;
  status: string;
  rawStatus: string;
};

export type FollowUp = {
  id: number;
  title: string;
  customerName: string;
  dueLabel: string;
  notes: string;
  status: string;
  leadId?: number | null;
  leadInterest?: string | null;
};

export type Booking = {
  id: number;
  customerName: string;
  vehicleTitle: string;
  amount: number;
  paymentMode: string;
  deliveryLabel: string;
  leadId?: number | null;
  leadInterest?: string | null;
  finalPrice?: number | null;
};

export type Snapshot = {
  stats: Stat[];
  leads: Lead[];
  vehicles: Vehicle[];
  followUps: FollowUp[];
  bookings: Booking[];
  revenue: string;
};

export type LeadPayload = {
  customerName: string;
  phone: string;
  city: string;
  source: string;
  interest: string;
  status: string;
  budgetMin?: number;
  budgetMax?: number;
  followUpTitle?: string;
  dueAt?: string;
  notes?: string;
};

export type VehiclePayload = {
  stockCode: string;
  title: string;
  make: string;
  model: string;
  year: number;
  fuel: string;
  transmission: string;
  mileageKm: number;
  price: number;
  purchasePrice: number;
  color?: string;
  status: string;
};

export type BookingPayload = {
  leadId: number;
  vehicleId: number;
  amount: number;
  paymentMode: string;
  deliveryDate?: string;
  finalPrice?: number;
};
