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
  address: string;
  city: string;
  units: number;
  planId: 'BASIC' | 'PRO' | 'PREMIUM';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  adminId: string;
  createdAt: string;
}

export interface Resident {
  id: string;
  condoId: string;
  name: string;
  unit: string;
  email: string;
  phone: string;
  cpf?: string;
  login?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Occurrence {
  id: string;
  condoId: string;
  residentId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
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

export interface Plan {
  id: string;
  name: string;
  price: number;
  maxUnits: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'BASIC',
    name: 'Básico',
    price: 59,
    maxUnits: 30,
    features: ['Cadastro de moradores', 'Comunicados', 'App do morador', 'Notificações']
  },
  {
    id: 'PRO',
    name: 'Profissional',
    price: 119,
    maxUnits: 100,
    features: ['Tudo do básico', 'Reservas de áreas', 'Controle de visitantes', 'Relatórios', 'Suporte prioritário']
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 199,
    maxUnits: 9999,
    features: ['Tudo incluso', 'Financeiro completo', 'Integrações', 'Personalização', 'Suporte VIP']
  }
];
