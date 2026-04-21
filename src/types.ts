export type UserRole = 'SUPER_ADMIN' | 'CONDO_ADMIN' | 'RESIDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  login?: string;
  role: UserRole;
  condoId?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Condo {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  units: number;
  planId: 'BASIC' | 'PRO' | 'PREMIUM';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIAL';
  trialEndsAt?: string;
  adminId: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  condoId: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  method: 'PIX' | 'CARD';
  date: string;
}

export interface Resident {
  id: string;
  condoId: string;
  name: string;
  unit: string;
  block?: string;
  tower?: string;
  email: string;
  phone: string;
  cpf?: string;
  login?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isOwner: boolean;
  ownerId?: string;
  tenantIds?: string[];
  points?: number;
  level?: number;
  badges?: string[];
  acceptedTerms?: boolean;
  acceptedTermsAt?: string;
}

export interface Occurrence {
  id: string;
  condoId: string;
  residentId: string;
  title: string;
  description: string;
  category: 'NOISE' | 'LEAK' | 'ELECTRICAL' | 'SECURITY' | 'MAINTENANCE' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTo?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  condoId: string;
  residentId: string;
  areaName: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
}

export interface Visitor {
  id: string;
  condoId: string;
  residentId: string;
  name: string;
  cpf?: string;
  type: 'VISITOR' | 'SERVICE' | 'DELIVERY';
  status: 'PENDING' | 'AUTHORIZED' | 'EXPIRED';
  validUntil: string;
  qrCode?: string;
}

export interface AccessLog {
  id: string;
  condoId: string;
  visitorId: string;
  timestamp: string;
  action: 'ENTRY' | 'EXIT';
}

export interface ChatMessage {
  id: string;
  condoId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  condoId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: 'RESIDENT' | 'CONDO' | 'PAYMENT' | 'OCCURRENCE' | 'VISITOR' | 'ASSEMBLY' | 'MAINTENANCE' | 'MOVING' | 'PARKING' | 'TAG';
  resourceId?: string;
  details?: string;
  timestamp: string;
}

export interface MovingRequest {
  id: string;
  condoId: string;
  residentId: string;
  residentName: string;
  unit: string;
  type: 'IN' | 'OUT';
  date: string;
  startTime: string;
  endTime: string;
  carModel: string;
  carPlate: string;
  driverName: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED';
  observations?: string;
  qrCode?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface ParkingSlot {
  id: string;
  condoId: string;
  number: string;
  type: 'RESIDENT' | 'VISITOR';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  residentId?: string; 
  residentName?: string;
  visitorId?: string;
  reservedUntil?: string;
}

export interface AccessTag {
  id: string;
  condoId: string;
  residentId: string;
  residentName: string;
  carPlate: string;
  tagId: string; // The physical TAG identifier
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Announcement {
  id: string;
  condoId: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'MAINTENANCE' | 'SECURITY' | 'EVENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  authorName: string;
}

export interface Package {
  id: string;
  condoId: string;
  residentId: string;
  residentName: string;
  unit: string;
  description: string;
  carrier: string;
  status: 'PENDING' | 'DELIVERED' | 'RETURNED';
  receivedAt: string;
  deliveredAt?: string;
  qrCodeData?: string;
}

export interface Assembly {
  id: string;
  condoId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
  items: {
    id: string;
    question: string;
    options: string[];
    votes: { [unit: string]: number }; // unit -> option index
  }[];
  createdAt: string;
}

export interface MaintenanceTask {
  id: string;
  condoId: string;
  title: string;
  description: string;
  category: 'ELEVATOR' | 'GATE' | 'PUMP' | 'ELECTRICAL' | 'OTHER';
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  lastDoneAt?: string;
  nextDueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
}

export interface CondoScore {
  condoId: string;
  score: number;
  delinquencyRate: number;
  lastUpdated: string;
  trends: { date: string; score: number }[];
}

export interface Invoice {
  id: string;
  condoId: string;
  residentId: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  type: 'CONDO_FEE' | 'RESERVE_FUND' | 'EXTRA' | 'GAS';
  description: string;
  paymentDate?: string;
  items?: { description: string; amount: number }[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  maxUnits: number;
  features: string[];
}

export interface ResidentRisk {
  id: string;
  condoId: string;
  residentId: string;
  residentName: string;
  unit: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  lastUpdated: string;
}

export interface Infraction {
  id: string;
  condoId: string;
  residentId: string;
  residentName: string;
  unit: string;
  type: 'WARNING' | 'FINE';
  description: string;
  value?: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
}

export interface Minute {
  id: string;
  condoId: string;
  assemblyId?: string;
  title: string;
  content: string;
  fileUrl?: string;
  createdAt: string;
}

export interface GasReading {
  id: string;
  condoId: string;
  residentId: string;
  residentName: string;
  unit: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  readingDate: string;
  billingMonth: string; // YYYY-MM
  status: 'PENDING' | 'BILLED';
  unitPrice: number;
  totalAmount: number;
}

export const PLANS: Plan[] = [
  {
    id: 'BASIC',
    name: 'Básico',
    price: 49,
    maxUnits: 30,
    features: ['Cadastro de moradores', 'Comunicados', 'App do morador', 'Notificações']
  },
  {
    id: 'PRO',
    name: 'Profissional',
    price: 89,
    maxUnits: 100,
    features: ['Tudo do básico', 'Reservas de áreas', 'Controle de visitantes', 'Relatórios', 'Suporte prioritário']
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 119,
    maxUnits: 9999,
    features: ['Tudo incluso', 'Financeiro completo', 'Controle de encomendas', 'Personalização', 'Suporte VIP']
  }
];
