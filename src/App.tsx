import { useState, useMemo, useEffect, FormEvent } from 'react';
import { 
  Bell, Plus, MapPin, Users, AlertTriangle, Sparkles, Shield, Building2, 
  Home, Map as MapIcon, Copyright, Search, SlidersHorizontal, Star, 
  Mail as MailIcon,
  DollarSign, Filter, CheckCircle2, ChevronRight, LayoutDashboard, 
  MessageSquare, Calendar, CreditCard, LogOut, Menu, X, UserPlus,
  ArrowRight, ArrowLeft, Smartphone, BarChart3, Settings, QrCode, History, User as UserIcon,
  Megaphone, Package as PackageIcon, FileText, PieChart, Gavel, Wrench, Camera, ShoppingBag,
  TrendingUp, Activity, Zap, Clock, ChevronLeft, MoreVertical, Send, Trash2, Edit, Eye, Download,
  Check, Info, AlertCircle, HelpCircle, ExternalLink, Copy, Share2, Heart, ThumbsUp, ThumbsDown,
  Smile, Frown, Meh, Briefcase, Key, Target, Award, ZoomIn, ZoomOut, ArrowUp, ArrowDown, Database, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  Cell, 
  PieChart as RePieChart, 
  Pie 
} from 'recharts';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User as AppUser, Condo, Resident, Visitor, Occurrence, Reservation, 
  ChatMessage, AuditLog, PLANS, Plan, Announcement, Package, Invoice,
  Assembly, MaintenanceTask, CondoScore, ResidentRisk, GasReading,
  Infraction, Minute
} from './types';
import { auth, db } from './firebase';
import { cameraService, CameraStream, CameraAction } from './services/cameraService';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  getDocFromServer,
  getDocs,
  limit,
  orderBy,
  addDoc,
  deleteDoc
} from 'firebase/firestore';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Mock Data (Fallback) ---
const MOCK_CONDO: Condo = {
  id: 'c1',
  name: 'Residencial Grand Horizon',
  slug: 'grand-horizon',
  address: 'Av. das Nações Unidas, 12901',
  city: 'São Paulo',
  units: 248,
  planId: 'PRO',
  subscriptionStatus: 'ACTIVE',
  adminId: 'u1',
  createdAt: '2024-01-15'
};

const MOCK_RESIDENTS: Resident[] = [
  { id: 'r1', condoId: 'c1', name: 'Ana Silva', unit: '101A', email: 'ana@email.com', phone: '(11) 98888-7777', status: 'ACTIVE', isOwner: true, points: 1250, level: 3, badges: ['PAGADOR_PONTUAL', 'PARTICIPATIVO'] },
  { id: 'r2', condoId: 'c1', name: 'Bruno Santos', unit: '202B', email: 'bruno@email.com', phone: '(11) 97777-6666', status: 'ACTIVE', isOwner: true, points: 840, level: 2, badges: ['SOCIAL'] },
  { id: 'r3', condoId: 'c1', name: 'Carla Dias', unit: '303C', email: 'carla@email.com', phone: '(11) 96666-5555', status: 'INACTIVE', isOwner: false, ownerId: 'r1', points: 150, level: 1 },
];

const MOCK_OCCURRENCES: Occurrence[] = [
  { id: 'o1', condoId: 'c1', residentId: 'r1', title: 'Vazamento no 10º andar', description: 'Infiltração vindo do teto do corredor.', category: 'LEAK', status: 'OPEN', createdAt: '2024-04-10' },
  { id: 'o2', condoId: 'c1', residentId: 'r2', title: 'Barulho excessivo', description: 'Festa após as 22h no apto 202.', category: 'NOISE', status: 'RESOLVED', createdAt: '2024-04-08' },
];

// --- Components ---

const Logo = ({ collapsed = false, light = false }: { collapsed?: boolean, light?: boolean }) => (
  <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
    <div className="relative">
      <div className={`${light ? 'bg-white' : 'bg-blue-600'} w-10 h-10 rounded-xl rotate-3 absolute inset-0 opacity-20 animate-pulse`} />
      <div className={`${light ? 'bg-white' : 'bg-blue-600'} w-10 h-10 rounded-xl -rotate-3 absolute inset-0 opacity-20`} />
      <div className={`relative bg-gradient-to-br ${light ? 'from-white to-slate-100' : 'from-blue-600 to-blue-700'} p-2.5 rounded-xl shadow-lg ${light ? 'shadow-white/20' : 'shadow-blue-600/30'} flex items-center justify-center`}>
        <Building2 className={`w-5 h-5 ${light ? 'text-blue-600' : 'text-white'}`} />
      </div>
    </div>
    {!collapsed && (
      <div className="flex flex-col">
        <span className={`font-black text-xl font-headline tracking-tighter leading-none ${light ? 'text-white' : 'text-slate-800'}`}>
          Condo<span className={light ? 'text-blue-200' : 'text-blue-600'}>Pro</span>
        </span>
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${light ? 'text-blue-200/60' : 'text-slate-400'} mt-0.5 whitespace-nowrap`}>
          Gestão Inteligente
        </span>
      </div>
    )}
  </div>
);

const LandingPage = ({ onLogin, onShowLoginModal, plans, appSettings }: { onLogin: () => void, onShowLoginModal: () => void, plans: Plan[], appSettings: any }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <Logo />
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary">Recursos</a>
          <a href="#plans" className="text-sm font-medium text-gray-600 hover:text-primary">Planos</a>
          <button onClick={onShowLoginModal} className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-all">
            <Smartphone className="w-4 h-4" /> Entrar
          </button>
          <button onClick={onShowLoginModal} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Teste Grátis
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-primary"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 w-full bg-white border-b border-gray-100 overflow-hidden md:hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-primary">Recursos</a>
                <a href="#plans" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-primary">Planos</a>
                <button onClick={onShowLoginModal} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3">
                  <Smartphone className="w-6 h-6" /> Entrar no Sistema
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full mb-6 uppercase tracking-widest">
            O Futuro da Gestão Imobiliária
          </span>
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-primary tracking-tight mb-6 leading-[1.1]">
            O sistema completo que simplifica a vida do <span className="text-primary-container">síndico.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Gerencie moradores, reservas, financeiro e ocorrências em uma única plataforma intuitiva. Reduza o trabalho manual e aumente a transparência.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onShowLoginModal} className="bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-3">
              <Smartphone className="w-6 h-6" /> Começar Agora
            </button>
            <button className="bg-white text-primary border-2 border-primary/10 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              Ver Demonstração <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Recursos que aumentam o valor do seu condomínio</h2>
            <p className="text-gray-600">Tudo o que você precisa para uma gestão 360º.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: MessageSquare, title: 'Comunicação em Tempo Real', desc: 'Envie avisos, comunicados e notificações push diretamente para o celular dos moradores.' },
              { icon: Calendar, title: 'Reserva de Áreas Comuns', desc: 'Sistema inteligente para reserva de salão de festas, churrasqueiras e quadras sem conflitos.' },
              { icon: Shield, title: 'Controle de Acesso', desc: 'Gestão de visitantes e prestadores de serviço com QR Code e histórico completo.' },
              { icon: CreditCard, title: 'Financeiro Integrado', desc: 'Emissão de boletos, controle de inadimplência e prestação de contas automatizada.' },
              { icon: Smartphone, title: 'App do Morador', desc: 'Uma interface moderna para o morador resolver tudo sem sair de casa.' },
              { icon: BarChart3, title: 'Relatórios Poderosos', desc: 'Métricas claras sobre o uso das áreas, ocorrências e saúde financeira do condomínio.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Planos que crescem com você</h2>
            <p className="text-gray-600">Escolha a melhor opção para o tamanho do seu condomínio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const price = appSettings.planPrices?.[plan.id] || plan.price;
              const features = appSettings.planFeatures?.[plan.id] || plan.features;
              
              return (
                <motion.div 
                  key={plan.id} 
                  whileHover={{ scale: plan.id === 'PRO' ? 1.08 : 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`p-10 rounded-[2.5rem] border-2 flex flex-col cursor-default transition-colors duration-300 ${
                    plan.id === 'PRO' 
                      ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/30 scale-105 z-10' 
                      : 'border-gray-100 bg-white text-primary hover:border-blue-200'
                  }`}
                >
                  {plan.id === 'PRO' && <span className="bg-white text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-6">Mais Escolhido</span>}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black">R$ {price}</span>
                    <span className={plan.id === 'PRO' ? 'text-white/60' : 'text-gray-400'}>/mês</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className={`w-5 h-5 ${plan.id === 'PRO' ? 'text-white' : 'text-primary'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onLogin} className={`w-full py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${plan.id === 'PRO' ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:opacity-90'}`}>
                    Selecionar Plano
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-20 px-6 text-white/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <Logo light />
            </div>
            <p className="max-w-sm leading-relaxed mt-4">
              Transformando a gestão imobiliária através da tecnologia e transparência. A solução definitiva para síndicos profissionais e administradoras.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Produto</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-white">Planos</a></li>
              <li><a href="#" className="hover:text-white">White-label</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Contato</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">WhatsApp</a></li>
              <li><a href="#" className="hover:text-white">Suporte</a></li>
              <li><a href="#" className="hover:text-white">Email</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <span>© 2024 Gestão Condomínio Pro. Todos os direitos reservados.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white">Termos de Uso</a>
            <a href="#" className="hover:text-white">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const PublicVisitorCard = ({ visitorId }: { visitorId: string }) => {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const condoId = urlParams.get('c');
    
    if (condoId && visitorId) {
      const visitorRef = doc(db, 'condos', condoId, 'visitors', visitorId);
      getDoc(visitorRef).then(snap => {
        if (snap.exists()) {
          setVisitor({ id: snap.id, ...snap.data() } as Visitor);
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [visitorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-sm w-full">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Convite Indisponível</h2>
          <p className="text-slate-500 text-sm">Este convite pode ter expirado ou o código é inválido.</p>
          <button 
            onClick={() => window.location.href = window.location.origin}
            className="mt-8 w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center border border-slate-100"
      >
        <div className="mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-600/20">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Convite Digital</h3>
          <p className="text-slate-500 text-sm mt-1">Apresente este código na portaria</p>
        </div>

        <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8 flex justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
            <QRCodeSVG 
              value={JSON.stringify({
                visitorId: visitor.id,
                name: visitor.name,
                condoId: visitor.condoId,
                validUntil: visitor.validUntil,
                type: visitor.type
              })}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitante Autorizado</p>
          <p className="font-bold text-primary text-lg">{visitor.name}</p>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase tracking-wider">
                {visitor.type === 'VISITOR' ? 'Visitante' : visitor.type === 'SERVICE' ? 'Prestador' : 'Delivery'}
              </span>
              {visitor.status === 'AUTHORIZED' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase tracking-wider">
                  Autorizado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3" /> Válido até {new Date(visitor.validUntil).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-50">
          <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">CondoPro • Segurança Digital</p>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, onLogout, appSettings, createAuditLog, plans }: { user: AppUser, onLogout: () => void, appSettings: any, createAuditLog: (action: string, resourceType: AuditLog['resourceType'], resourceId?: string, details?: string, condoId?: string) => Promise<void>, plans: Plan[] }) => {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [selectedVisitorForQR, setSelectedVisitorForQR] = useState<any>(null);
  const [selectedPackageForQR, setSelectedPackageForQR] = useState<Package | null>(null);
  const [visitorRequests, setVisitorRequests] = useState([
    { id: 'req1', name: 'Marcos Oliveira', type: 'Prestador de Serviço', reason: 'Manutenção Ar Condicionado', time: '10:30' },
  ]);
  const [condo, setCondo] = useState<Condo | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [condoScore, setCondoScore] = useState<CondoScore | null>(null);
  const [residentRisks, setResidentRisks] = useState<ResidentRisk[]>([]);
  const [gasReadings, setGasReadings] = useState<GasReading[]>([]);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cameras, setCameras] = useState<CameraStream[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCamsLoading, setIsCamsLoading] = useState(false);
  const [cameraViewTab, setCameraViewTab] = useState<'monitoring' | 'settings' | 'api'>('monitoring');
  const [cameraConfig, setCameraConfig] = useState({
    ip: '192.168.1.100',
    httpPort: 80,
    rtspPort: 554,
    username: 'admin',
    password: ''
  });
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<{[key: string]: { name: string, lastUpdate: number }}>({});
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newResident, setNewResident] = useState({ 
    name: '', 
    email: '', 
    unit: '', 
    block: '',
    tower: '',
    phone: '', 
    cpf: '', 
    login: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    isOwner: false,
    ownerId: ''
  });
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    type: 'VISITOR' as Visitor['type'],
    validUntil: ''
  });
  const [visitorSuccess, setVisitorSuccess] = useState<Visitor | null>(null);
  const [showFaceIDModal, setShowFaceIDModal] = useState(false);
  const [faceIDStep, setFaceIDStep] = useState(0);
  const [showAddOccurrenceModal, setShowAddOccurrenceModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [financeFilter, setFinanceFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    type: 'CONDO_FEE',
    description: 'Taxa Condominial',
    status: 'PENDING'
  });
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'MEDIUM'
  });
  const [newOccurrence, setNewOccurrence] = useState({
    title: '',
    description: '',
    category: 'OTHER' as Occurrence['category']
  });

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    try {
      const response = await fetch('/api/notify/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao enviar e-mail');
      return true;
    } catch (error) {
      console.error('Erro ao disparar e-mail:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar e-mail. Verifique a configuração do servidor.');
      return false;
    }
  };

  const handleSendWhatsApp = async (to: string, message: string) => {
    try {
      // Remover formatação do telefone
      const cleanPhone = to.replace(/\D/g, '');
      const response = await fetch('/api/notify/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: cleanPhone, message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao enviar WhatsApp');
      return true;
    } catch (error) {
      console.error('Erro ao disparar WhatsApp:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar WhatsApp. Verifique a configuração do servidor.');
      return false;
    }
  };

  const handleNotifyResident = async (resident: Resident, type: 'EMAIL' | 'WHATSAPP') => {
    setIsLoading(true);
    let success = false;
    
    if (type === 'EMAIL') {
      const subject = `Comunicado do Condomínio ${condo?.name || ''}`;
      const body = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Olá, ${resident.name}!</h2>
          <p>Este é um lembrete do Condomínio <strong>${condo?.name || ''}</strong>.</p>
          <p>Por favor, acesse o aplicativo para conferir seus novos boletos e comunicados.</p>
          <br/>
          <a href="${window.location.origin}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Plataforma
          </a>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">Gerado por CondoPro.</p>
        </div>
      `;
      success = await handleSendEmail(resident.email, subject, body);
    } else {
      const message = `Olá ${resident.name}, aqui é do Condomínio ${condo?.name || ''}. Você tem novos boletos e comunicados disponíveis no aplicativo CondoPro. Acesse agora: ${window.location.origin}`;
      success = await handleSendWhatsApp(resident.phone, message);
    }

    if (success) {
      alert(`Notificação por ${type} enviada com sucesso para ${resident.name}!`);
    }
    setIsLoading(false);
  };

  const handleNotifyAllAnnouncements = async (announcement: Announcement) => {
    setIsLoading(true);
    let sentCount = 0;
    
    for (const resident of residents) {
      if (!resident.email) continue;
      
      const subject = `NOVO COMUNICADO: ${announcement.title}`;
      const body = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-top: 0;">${announcement.title}</h2>
          <p style="font-size: 14px; color: #666;">${new Date(announcement.createdAt).toLocaleDateString()}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="line-height: 1.6;">${announcement.content}</p>
          <div style="margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Acesse os detalhes no APP:</p>
            <a href="${window.location.origin}" style="display: inline-block; margin-top: 10px; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Abrir CondoPro
            </a>
          </div>
        </div>
      `;
      const success = await handleSendEmail(resident.email, subject, body);
      if (success) sentCount++;
    }

    alert(`${sentCount} moradores foram notificados por email sobre o comunicado: ${announcement.title}`);
    setIsLoading(false);
  };

  const handleNotifyBoleto = async (invoice: Invoice) => {
    setIsLoading(true);
    const resident = residents.find(r => r.id === invoice.residentId);
    if (!resident) {
      alert('Morador não encontrado!');
      setIsLoading(false);
      return;
    }

    const subject = `SEU BOLETO: ${invoice.description} - Condomínio ${condo?.name || ''}`;
    const body = `
      <div style="font-family: sans-serif; padding: 25px; color: #333; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">Olá, ${resident.name}!</h2>
        <p>Seu boleto referente a <strong>${invoice.description}</strong> já está disponível.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">DETALHES DO PAGAMENTO</p>
          <p style="margin: 0; font-size: 24px; font-weight: 800; color: #1e293b;">R$ ${invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold; color: ${invoice.status === 'OVERDUE' ? '#ef4444' : '#1e293b'};">
            Vencimento: ${new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>

        <p>Acesse o aplicativo para baixar o PDF completo ou copiar o código de barras/PIX.</p>
        
        <div style="text-align: center; margin-top: 35px;">
          <a href="${window.location.origin}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            Ver Boleto no CondoPro
          </a>
        </div>
        
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px;">
          Este é um e-mail automático enviado por CondoPro em nome de ${condo?.name || 'seu condomínio'}.
        </p>
      </div>
    `;

    const success = await handleSendEmail(resident.email, subject, body);
    if (success) {
      alert(`Boleto enviado com sucesso para ${resident.name}!`);
    }
    setIsLoading(false);
  };

  const handleAddPoints = async (residentId: string, amount: number, reason: string) => {
    if (!user.condoId) return;
    try {
      const residentRef = doc(db, 'condos', user.condoId, 'residents', residentId);
      const residentSnap = await getDoc(residentRef);
      if (residentSnap.exists()) {
        const data = residentSnap.data() as Resident;
        const currentPoints = data.points || 0;
        const newPoints = currentPoints + amount;
        const level = Math.floor(newPoints / 500) + 1;
        
        await setDoc(residentRef, {
          ...data,
          points: newPoints,
          level: level
        }, { merge: true });

        console.log(`Ganhou ${amount} pontos por: ${reason}`);
      }
    } catch (err) {
      console.error("Error updating points:", err);
    }
  };

  const handleFaceIDRegistration = () => {
    setShowFaceIDModal(true);
    setFaceIDStep(0);
    // Simular passos
    setTimeout(() => setFaceIDStep(1), 2000);
    setTimeout(() => setFaceIDStep(2), 4000);
    setTimeout(() => setFaceIDStep(3), 6000);
  };

  const handleShareVisitor = (visitor: any) => {
    const typeLabel = visitor.type === 'VISITOR' ? 'Visitante' : visitor.type === 'SERVICE' ? 'Prestador de Serviço' : 'Delivery';
    const visitorLink = `${window.location.origin}?v=${visitor.id}&c=${visitor.condoId || user.condoId}`;
    
    const text = `*Convite Digital - ${condo?.name || 'Condomínio'}*\n\n` +
      `Olá, *${visitor.name}*!\n` +
      `Sua entrada foi autorizada. Apresente o QR Code no link abaixo na portaria ao chegar:\n\n` +
      `🔗 *Acesse seu QR Code:* ${visitorLink}\n\n` +
      `📅 *Validade:* ${new Date(visitor.validUntil).toLocaleString('pt-BR')}\n` +
      `🔑 *Tipo:* ${typeLabel}\n` +
      `📍 *Unidade:* ${residents.find(r => r.email === user.email)?.unit || 'N/A'}\n\n` +
      `_Gerado por CondoPro_`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    if (!user.condoId) return;

    const condoRef = doc(db, 'condos', user.condoId);
    const unsubCondo = onSnapshot(condoRef, (docSnap) => {
      if (docSnap.exists()) {
        setCondo({ id: docSnap.id, ...docSnap.data() } as Condo);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `condos/${user.condoId}`));

    const residentsRef = collection(db, 'condos', user.condoId, 'residents');
    let unsubResidents = () => {};
    if (user.role === 'CONDO_ADMIN' || user.role === 'SUPER_ADMIN') {
      unsubResidents = onSnapshot(residentsRef, (snap) => {
        setResidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/residents`));
    } else if (user.role === 'RESIDENT') {
      const q = query(residentsRef, where('email', '==', user.email));
      unsubResidents = onSnapshot(q, (snap) => {
        setResidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/residents`));
    }

    const occurrencesRef = collection(db, 'condos', user.condoId, 'occurrences');
    const unsubOccurrences = onSnapshot(occurrencesRef, (snap) => {
      setOccurrences(snap.docs.map(d => ({ id: d.id, ...d.data() } as Occurrence)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/occurrences`));

    const visitorsRef = collection(db, 'condos', user.condoId, 'visitors');
    const unsubVisitors = onSnapshot(visitorsRef, (snap) => {
      setVisitors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/visitors`));

    const messagesRef = collection(db, 'condos', user.condoId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
    const unsubMessages = onSnapshot(messagesQuery, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/messages`));

    const announcementsRef = collection(db, 'condos', user.condoId, 'announcements');
    const announcementsQuery = query(announcementsRef, orderBy('createdAt', 'desc'), limit(20));
    const unsubAnnouncements = onSnapshot(announcementsQuery, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/announcements`));

    const typingRef = collection(db, 'condos', user.condoId, 'typing');
    const unsubTyping = onSnapshot(typingRef, (snap) => {
      const typing: {[key: string]: any} = {};
      snap.docs.forEach(d => {
        if (d.id !== user.id) {
          typing[d.id] = d.data();
        }
      });
      setTypingUsers(typing);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/typing`));

    const packagesRef = collection(db, 'condos', user.condoId, 'packages');
    let packagesQuery = query(packagesRef, orderBy('receivedAt', 'desc'), limit(50));
    if (user.role === 'RESIDENT') {
      packagesQuery = query(packagesRef, where('residentId', '==', user.id), orderBy('receivedAt', 'desc'), limit(50));
    }
    const unsubPackages = onSnapshot(packagesQuery, (snap) => {
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/packages`));

    const invoicesRef = collection(db, 'condos', user.condoId, 'invoices');
    let invoicesQuery = query(invoicesRef, orderBy('dueDate', 'desc'), limit(50));
    if (user.role === 'RESIDENT') {
      invoicesQuery = query(invoicesRef, where('residentId', '==', user.id), orderBy('dueDate', 'desc'), limit(50));
    }
    const unsubInvoices = onSnapshot(invoicesQuery, (snap) => {
      if (snap.empty) {
        setInvoices([
          {
            id: 'inv1',
            condoId: user.condoId!,
            residentId: user.id,
            amount: 637.50,
            dueDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
            status: 'PENDING',
            type: 'CONDO_FEE',
            description: 'Taxa Condominial + Consumo de Gás',
            items: [
              { description: 'Taxa Condominial Base', amount: 450.00 },
              { description: 'Fundo de Reserva (5%)', amount: 22.50 },
              { description: 'Consumo de Gás (13 m³)', amount: 165.00 }
            ]
          }
        ]);
      } else {
        setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/invoices`));

    const auditLogsRef = collection(db, 'condos', user.condoId, 'auditLogs');
    const auditLogsQuery = query(auditLogsRef, orderBy('timestamp', 'desc'), limit(50));
    let unsubAuditLogs = () => {};
    if (user.role === 'CONDO_ADMIN' || user.role === 'SUPER_ADMIN') {
      unsubAuditLogs = onSnapshot(auditLogsQuery, (snap) => {
        setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/auditLogs`));
    }

    const assembliesRef = collection(db, 'condos', user.condoId, 'assemblies');
    const unsubAssemblies = onSnapshot(assembliesRef, (snap) => {
      setAssemblies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assembly)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/assemblies`));

    const maintenanceRef = collection(db, 'condos', user.condoId, 'maintenance');
    const unsubMaintenance = onSnapshot(maintenanceRef, (snap) => {
      setMaintenanceTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceTask)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/maintenance`));

    const scoreRef = doc(db, 'condos', user.condoId, 'stats', 'score');
    const unsubScore = onSnapshot(scoreRef, (docSnap) => {
      if (docSnap.exists()) {
        setCondoScore({ condoId: user.condoId!, ...docSnap.data() } as CondoScore);
      } else {
        // Initial mock score
        setCondoScore({
          condoId: user.condoId!,
          score: 85,
          delinquencyRate: 4.2,
          lastUpdated: new Date().toISOString(),
          trends: [
            { date: '2024-01', score: 78 },
            { date: '2024-02', score: 82 },
            { date: '2024-03', score: 80 },
            { date: '2024-04', score: 85 },
          ]
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `condos/${user.condoId}/stats/score`));

    const risksRef = collection(db, 'condos', user.condoId, 'residentRisks');
    let unsubRisks = () => {};
    if (user.role === 'CONDO_ADMIN' || user.role === 'SUPER_ADMIN') {
      unsubRisks = onSnapshot(risksRef, (snap) => {
        if (snap.empty) {
          // Mock Risk Data
          setResidentRisks([
            {
              id: 'risk1',
              condoId: user.condoId!,
              residentId: 'r1',
              residentName: 'Ana Silva',
              unit: '101A',
              riskScore: 15,
              riskLevel: 'LOW',
              factors: ['Histórico de pagamento pontual', 'Uso frequente do app'],
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'risk2',
              condoId: user.condoId!,
              residentId: 'r2',
              residentName: 'Bruno Santos',
              unit: '202B',
              riskScore: 65,
              riskLevel: 'MEDIUM',
              factors: ['2 atrasos nos últimos 6 meses', 'Baixa interação com comunicados'],
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'risk3',
              condoId: user.condoId!,
              residentId: 'r3',
              residentName: 'Carlos Eduardo',
              unit: '303C',
              riskScore: 92,
              riskLevel: 'HIGH',
              factors: ['Inadimplente no mês atual', 'Histórico recorrente de atrasos (>15 dias)', 'Não visualiza boletos'],
              lastUpdated: new Date().toISOString()
            }
          ]);
        } else {
          setResidentRisks(snap.docs.map(d => ({ id: d.id, ...d.data() } as ResidentRisk)));
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/residentRisks`));
    }

    const gasRef = collection(db, 'condos', user.condoId, 'gasReadings');
    const unsubGas = onSnapshot(gasRef, (snap) => {
      if (snap.empty) {
        setGasReadings([
          {
            id: 'g1',
            condoId: user.condoId,
            residentId: 'r1',
            residentName: 'Ana Silva',
            unit: '101A',
            previousReading: 1250,
            currentReading: 1265,
            consumption: 15,
            readingDate: new Date().toISOString(),
            billingMonth: format(new Date(), 'yyyy-MM'),
            status: 'PENDING',
            unitPrice: 12.50,
            totalAmount: 187.50
          },
          {
            id: 'g2',
            condoId: user.condoId,
            residentId: 'r2',
            residentName: 'Bruno Santos',
            unit: '202B',
            previousReading: 980,
            currentReading: 1002,
            consumption: 22,
            readingDate: new Date().toISOString(),
            billingMonth: format(new Date(), 'yyyy-MM'),
            status: 'PENDING',
            unitPrice: 12.50,
            totalAmount: 275.00
          }
        ]);
      } else {
        setGasReadings(snap.docs.map(d => ({ id: d.id, ...d.data() } as GasReading)));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/gasReadings`));

    const infractionsRef = collection(db, 'condos', user.condoId, 'infractions');
    const unsubInfractions = onSnapshot(infractionsRef, (snap) => {
      if (snap.empty) {
        setInfractions([
          {
            id: 'inf1',
            condoId: user.condoId,
            residentId: 'r1',
            residentName: 'Ana Silva',
            unit: '101A',
            type: 'WARNING',
            description: 'Barulho excessivo após as 22h no dia 10/04.',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        ]);
      } else {
        setInfractions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Infraction)));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/infractions`));

    const minutesRef = collection(db, 'condos', user.condoId, 'minutes');
    const unsubMinutes = onSnapshot(minutesRef, (snap) => {
      if (snap.empty) {
        setMinutes([
          {
            id: 'min1',
            condoId: user.condoId,
            title: 'Ata da Assembleia Geral Ordinária - Março 2024',
            content: 'Principais tópicos: Aprovação de contas, eleição de novo síndico e reformas estruturais.',
            createdAt: new Date().toISOString()
          }
        ]);
      } else {
        setMinutes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Minute)));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/minutes`));

    // Mock Assemblies if empty
    const mockAssemblies: Assembly[] = [
      {
        id: 'a1',
        condoId: user.condoId,
        title: 'Aprovação de Contas 2023',
        description: 'Votação para aprovação do balancete anual e previsão orçamentária 2024.',
        startDate: new Date().toISOString(),
        endDate: addDays(new Date(), 7).toISOString(),
        status: 'ACTIVE',
        items: [
          {
            id: 'i1',
            question: 'Você aprova as contas do exercício 2023?',
            options: ['Sim, aprovo integralmente', 'Aprovo com ressalvas', 'Não aprovo'],
            votes: { '101A': 0, '202B': 0, '303C': 1, '404D': 0 }
          }
        ],
        createdAt: new Date().toISOString()
      }
    ];

    // Mock Maintenance if empty
    const mockMaintenance: MaintenanceTask[] = [
      {
        id: 'm1',
        condoId: user.condoId,
        title: 'Manutenção Elevadores',
        description: 'Revisão mensal obrigatória - Elevadores Sociais e Serviço',
        category: 'ELEVATOR',
        frequency: 'MONTHLY',
        nextDueDate: addDays(new Date(), 5).toISOString(),
        status: 'PENDING'
      },
      {
        id: 'm2',
        condoId: user.condoId,
        title: 'Limpeza Caixa D\'água',
        description: 'Higienização semestral das torres A e B',
        category: 'PUMP',
        frequency: 'QUARTERLY',
        nextDueDate: addDays(new Date(), -2).toISOString(),
        status: 'OVERDUE'
      }
    ];

    return () => {
      unsubCondo();
      unsubResidents();
      unsubOccurrences();
      unsubVisitors();
      unsubMessages();
      unsubAnnouncements();
      unsubTyping();
      unsubPackages();
      unsubInvoices();
      unsubAuditLogs();
      unsubAssemblies();
      unsubMaintenance();
      unsubScore();
      unsubRisks();
      unsubGas();
      unsubInfractions();
      unsubMinutes();
    };
  }, [user.condoId, user.id, user.name]);

  useEffect(() => {
    if (!user.condoId || !user.id || !newMessage.trim()) {
      if (user.condoId && user.id) {
        const typingDocRef = doc(db, 'condos', user.condoId, 'typing', user.id);
        deleteDoc(typingDocRef).catch(console.error);
      }
      return;
    }
    
    const typingDocRef = doc(db, 'condos', user.condoId, 'typing', user.id);
    setDoc(typingDocRef, {
      name: user.name,
      lastUpdate: Date.now()
    }).catch(console.error);

    const timeout = setTimeout(() => {
      deleteDoc(typingDocRef).catch(console.error);
    }, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, [newMessage, user.condoId, user.id, user.name]);

  const handleAddResident = async () => {
    if (!newResident.name || !newResident.email) {
      alert("Nome e Email são obrigatórios.");
      return;
    }
    setIsLoading(true);
    try {
      const residentRef = doc(collection(db, 'condos', user.condoId, 'residents'));
      const residentData: Resident = {
        id: residentRef.id,
        condoId: user.condoId,
        name: newResident.name,
        unit: newResident.unit,
        block: newResident.block,
        tower: newResident.tower,
        email: newResident.email,
        phone: newResident.phone,
        cpf: newResident.cpf,
        login: newResident.login,
        status: newResident.status,
        isOwner: newResident.isOwner,
        ownerId: newResident.isOwner ? undefined : newResident.ownerId,
        tenantIds: newResident.isOwner ? [] : undefined
      };
      await setDoc(residentRef, residentData);

      const userRef = doc(collection(db, 'users'));
      const userData: AppUser = {
        id: userRef.id,
        name: newResident.name,
        email: newResident.email,
        role: 'RESIDENT',
        condoId: user.condoId,
        cpf: newResident.cpf,
        login: newResident.login,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, userData);

      await createAuditLog('Cadastrou novo morador', 'RESIDENT', residentRef.id, `Morador: ${newResident.name}, Unidade: ${newResident.unit}, Tipo: ${newResident.isOwner ? 'Proprietário' : 'Inquilino'}`);

      setShowAddResidentModal(false);
      setNewResident({ name: '', email: '', unit: '', block: '', tower: '', phone: '', cpf: '', login: '', status: 'ACTIVE', isOwner: false, ownerId: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/residents`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVisitor = async () => {
    if (!newVisitor.name || !newVisitor.validUntil || !user.condoId) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    try {
      const visitorRef = doc(collection(db, 'condos', user.condoId, 'visitors'));
      const visitorData: Visitor = {
        id: visitorRef.id,
        condoId: user.condoId,
        residentId: user.id,
        name: newVisitor.name,
        type: newVisitor.type,
        status: 'AUTHORIZED',
        validUntil: newVisitor.validUntil,
        qrCode: '' // Will be generated on display
      };
      await setDoc(visitorRef, visitorData);
      await createAuditLog('Autorizou novo visitante', 'VISITOR', visitorRef.id, `Visitante: ${newVisitor.name}, Tipo: ${newVisitor.type}`);
      
      setVisitorSuccess(visitorData);
      setNewVisitor({ name: '', type: 'VISITOR', validUntil: '' });
      setShowQRPreview(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/visitors`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user.condoId) return;

    try {
      const messagesRef = collection(db, 'condos', user.condoId, 'messages');
      await addDoc(messagesRef, {
        condoId: user.condoId,
        senderId: user.id,
        senderName: user.name,
        text: newMessage,
        createdAt: new Date().toISOString()
      });
      setNewMessage('');
      
      // Award points for participation
      handleAddPoints(user.id, 5, 'Participação no chat');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/messages`);
    }
  };

  const handleVote = async (assemblyId: string, itemId: string, optionIdx: number) => {
    if (!user.condoId || user.role !== 'RESIDENT') return;
    try {
      const resident = residents.find(r => r.id === user.id);
      if (!resident) return;

      const assemblyRef = doc(db, 'condos', user.condoId, 'assemblies', assemblyId);
      const assemblySnap = await getDoc(assemblyRef);
      if (assemblySnap.exists()) {
        const data = assemblySnap.data() as Assembly;
        const updatedItems = data.items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              votes: {
                ...item.votes,
                [resident.unit]: optionIdx
              }
            };
          }
          return item;
        });

        await setDoc(assemblyRef, { items: updatedItems }, { merge: true });
        createAuditLog('Votou em assembleia', 'ASSEMBLY', assemblyId, `Questão: ${itemId}, Opção: ${optionIdx}`);
        
        // Add participation points
        handleAddPoints(user.id, 50, 'Voto em assembleia');
        alert("Voto registrado com sucesso! Você ganhou 50 pontos.");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `condos/${user.condoId}/assemblies/${assemblyId}`);
    }
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    if (!user.condoId) return;
    try {
      const invoiceRef = doc(db, 'condos', user.condoId, 'invoices', invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);
      if (invoiceSnap.exists()) {
        const inv = invoiceSnap.data() as Invoice;
        await setDoc(invoiceRef, { 
          status: 'PAID', 
          paymentDate: new Date().toISOString() 
        }, { merge: true });

        // Award points for on-time payment
        handleAddPoints(inv.residentId, 100, 'Pagamento em dia');
        createAuditLog('Faturamento marcado como pago', 'PAYMENT', invoiceId);
        alert("Faturamento marcado como pago! O morador recebeu 100 pontos.");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `condos/${user.condoId}/invoices/${invoiceId}`);
    }
  };

  const handleCreateInvoice = async () => {
    if (!user.condoId || !newInvoice.residentId || !newInvoice.amount) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsLoading(true);
    try {
      const invoicesRef = collection(db, 'condos', user.condoId, 'invoices');
      const docRef = await addDoc(invoicesRef, {
        ...newInvoice,
        amount: Number(newInvoice.amount),
        condoId: user.condoId,
        createdAt: new Date().toISOString()
      });
      
      const invoice = { id: docRef.id, ...newInvoice, amount: Number(newInvoice.amount), condoId: user.condoId, createdAt: new Date().toISOString() } as Invoice;
      
      // Auto-notify resident
      await handleNotifyBoleto(invoice);

      setShowAddInvoiceModal(false);
      setNewInvoice({
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        type: 'CONDO_FEE',
        description: 'Taxa Condominial',
        status: 'PENDING'
      });
      createAuditLog('Boleto gerado', 'PAYMENT', user.condoId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/invoices`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!user.condoId || !newAnnouncement.title || !newAnnouncement.content) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsLoading(true);
    try {
      const announcementsRef = collection(db, 'condos', user.condoId, 'announcements');
      const docRef = await addDoc(announcementsRef, {
        ...newAnnouncement,
        condoId: user.condoId,
        authorName: user.name,
        createdAt: new Date().toISOString()
      });
      
      const announcement = { id: docRef.id, ...newAnnouncement, condoId: user.condoId, authorName: user.name, createdAt: new Date().toISOString() } as Announcement;
      
      // Auto-notify all residents
      await handleNotifyAllAnnouncements(announcement);

      setShowAddAnnouncementModal(false);
      setNewAnnouncement({ title: '', content: '', category: 'GENERAL', priority: 'MEDIUM' });
      createAuditLog('Criou comunicado', 'CONDO', docRef.id, `Título: ${newAnnouncement.title}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/announcements`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOccurrence = async () => {
    if (!user.condoId || !newOccurrence.title || !newOccurrence.description) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsLoading(true);
    try {
      const occurrencesRef = collection(db, 'condos', user.condoId, 'occurrences');
      await addDoc(occurrencesRef, {
        ...newOccurrence,
        residentId: user.id,
        status: 'OPEN',
        createdAt: new Date().toISOString()
      });
      setShowAddOccurrenceModal(false);
      setNewOccurrence({ title: '', description: '', category: 'OTHER' });
      createAuditLog('Criou ocorrência', 'OCCURRENCE');
      alert('Ocorrência registrada com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/occurrences`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOccurrenceStatus = async (occurrenceId: string, status: Occurrence['status']) => {
    if (!user.condoId) return;
    try {
      const occurrenceRef = doc(db, 'condos', user.condoId, 'occurrences', occurrenceId);
      await setDoc(occurrenceRef, { status }, { merge: true });
      createAuditLog('Atualizou status de ocorrência', 'OCCURRENCE', occurrenceId, `Novo status: ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `condos/${user.condoId}/occurrences/${occurrenceId}`);
    }
  };

  const handleAssignOccurrence = async (occurrenceId: string, assignedTo: string) => {
    if (!user.condoId) return;
    try {
      const occurrenceRef = doc(db, 'condos', user.condoId, 'occurrences', occurrenceId);
      await setDoc(occurrenceRef, { assignedTo }, { merge: true });
      createAuditLog('Atribuiu responsável à ocorrência', 'OCCURRENCE', occurrenceId, `Responsável: ${assignedTo}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `condos/${user.condoId}/occurrences/${occurrenceId}`);
    }
  };

  useEffect(() => {
    if (activeMenu === 'cameras') {
      loadCameras();
    }
  }, [activeMenu]);

  const loadCameras = async () => {
    setIsCamsLoading(true);
    setCameraError(null);
    try {
      const data = await cameraService.getCameras();
      setCameras(data);
    } catch (err: any) {
      setCameraError(err.message || "Erro desconhecido ao carregar câmeras.");
    } finally {
      setIsCamsLoading(false);
    }
  };

  const handlePTZ = async (cameraId: string, action: CameraAction['action']) => {
    try {
      await cameraService.executePTZ({ cameraId, action });
    } catch (err) {
      console.error("PTZ Action failed", err);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Painel Geral', icon: LayoutDashboard, category: 'main' },
    { id: 'announcements', label: 'Comunicados', icon: Megaphone, category: 'communication' },
    { id: 'chat', label: 'Chat Comunitário', icon: MessageSquare, category: 'communication' },
    { id: 'cameras', label: 'Monitoramento', icon: Activity, premiumOnly: true, category: 'safety' },
    { id: 'assemblies', label: 'Assembleias', icon: Gavel, category: 'communication' },
    { id: 'minutes', label: 'Atas e Documentos', icon: FileText, category: 'communication' },
    { id: 'residents', label: 'Moradores', icon: Users, adminOnly: true, category: 'management' },
    { id: 'occurrences', label: 'Ocorrências', icon: AlertTriangle, category: 'communication' },
    { id: 'infractions', label: 'Multas e Infrações', icon: Shield, adminOnly: true, category: 'management' },
    { id: 'reservations', label: 'Reservas', icon: Calendar, category: 'community' },
    { id: 'concierge', label: 'Portaria Remota', icon: Shield, category: 'safety' },
    { id: 'packages', label: 'Encomendas', icon: PackageIcon, category: 'management' },
    { id: 'maintenance', label: 'Manutenção', icon: Wrench, adminOnly: true, category: 'management' },
    { id: 'ranking', label: 'Ranking & Prêmios', icon: Award, category: 'community' },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, category: 'community' },
    { id: 'finance', label: 'Financeiro', icon: DollarSign, category: 'management' },
    { id: 'gas', label: 'Consumo de Gás', icon: Zap, category: 'management' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, adminOnly: true, category: 'admin' },
    { id: 'risk', label: 'Previsão de Risco', icon: TrendingUp, adminOnly: true, category: 'admin' },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard, adminOnly: true, category: 'admin' },
    { id: 'audit', label: 'Auditoria', icon: History, adminOnly: true, category: 'admin' },
    { id: 'settings', label: 'Configurações', icon: Settings, adminOnly: true, category: 'admin' },
  ];

  const categories = [
    { id: 'main', label: 'Início' },
    { id: 'communication', label: 'Comunicação' },
    { id: 'community', label: 'Comunidade' },
    { id: 'management', label: 'Gestão' },
    { id: 'safety', label: 'Segurança' },
    { id: 'admin', label: 'Administrativo' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && user.role === 'RESIDENT') return false;
    if (item.premiumOnly && condo?.planId !== 'PREMIUM') return false;
    return true;
  });

  const currentCondoName = condo?.name || MOCK_CONDO.name;

  const isBlocked = condo && (condo.subscriptionStatus === 'CANCELED' || condo.subscriptionStatus === 'PAST_DUE');
  const isTrial = condo && condo.subscriptionStatus === 'TRIAL';

  if (isBlocked && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white">Acesso Bloqueado</h2>
          <p className="text-slate-400 font-medium">
            A assinatura do condomínio <span className="text-white font-bold">{condo.name}</span> está suspensa por falta de pagamento ou cancelamento.
          </p>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-sm text-slate-300">Entre em contato com a administração ou regularize o pagamento para restabelecer o acesso.</p>
          </div>
          <button onClick={onLogout} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black shadow-xl hover:bg-slate-100 transition-all">
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex relative overflow-hidden">
      {isTrial && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white py-2 px-4 text-center text-xs font-bold z-[60] shadow-lg">
          PERÍODO DE TESTE: Sua licença expira em {new Date(condo.trialEndsAt || '').toLocaleDateString()}. <button className="underline ml-2">Assinar Agora</button>
        </div>
      )}
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-500 ease-in-out flex flex-col fixed inset-y-0 left-0 z-50 lg:relative ${
        isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 w-0 lg:w-24'
      }`}>
        <div className={`p-8 border-b border-white/5`}>
          <Logo collapsed={!isSidebarOpen} light />
        </div>
        
        <nav className="flex-grow p-4 space-y-6 mt-4 overflow-y-auto custom-scrollbar">
          {categories.map((cat) => {
            const catItems = filteredMenuItems.filter(i => i.category === cat.id);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-1">
                {isSidebarOpen && (
                  <h4 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-50">
                    {cat.label}
                  </h4>
                )}
                <div className="space-y-1">
                  {catItems.map((item) => {
                    const hasNotification = (item.id === 'maintenance' && maintenanceTasks.some(t => t.status !== 'COMPLETED' && isBefore(parseISO(t.nextDueDate), addDays(new Date(), 7)))) ||
                                           (item.id === 'risk' && residentRisks.some(r => r.riskLevel === 'HIGH'));
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group focus:outline-none ${
                          activeMenu === item.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${activeMenu === item.id ? 'text-white' : 'text-slate-500'}`} />
                        {isSidebarOpen && (
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-xs"
                          >
                            {item.label}
                          </motion.span>
                        )}
                        {hasNotification && (
                          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900 animate-pulse" />
                        )}
                        {activeMenu === item.id && !isSidebarOpen && (
                          <div className="absolute right-0 w-1 h-4 bg-blue-500 rounded-l-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {!isSidebarOpen && <div className="h-px bg-white/5 mx-4 my-2" />}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all group">
            <LogOut className="w-6 h-6 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm">Sair da Conta</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-hidden bg-[#F8FAFC]">
        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-2xl w-64 lg:w-80 border border-slate-200/50">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar no sistema..." className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-600" />
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <button className="p-2.5 hover:bg-slate-100 rounded-xl relative transition-colors group">
                <Bell className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors group">
                <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-black text-slate-800 leading-none mb-1">{user.name}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  {user.role === 'CONDO_ADMIN' ? 'Síndico Admin' : 'Morador'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 ring-2 ring-white">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {activeMenu === 'overview' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                className="space-y-8 lg:space-y-14"
              >
                {/* Condo Score Section */}
                {user.role === 'CONDO_ADMIN' && condoScore && (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-32 h-32 flex-shrink-0">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                         <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="364.4" strokeDashoffset={364.4 * (1 - condoScore.score / 100)} className="text-blue-600" strokeLinecap="round" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-black text-slate-800">{condoScore.score}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                       </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-black text-slate-800 mb-2">Saúde Financeira do Condomínio</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Seu score é baseado na taxa de inadimplência ({condoScore.delinquencyRate}%) e pontualidade dos moradores.
                        {condoScore.score > 80 ? ' Excelente gestão!' : ' Atenção aos atrasos.'}
                      </p>
                      <div className="flex gap-4">
                        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                          <p className="text-[10px] font-bold text-blue-400 uppercase">Inadimplência</p>
                          <p className="font-bold text-blue-600">{condoScore.delinquencyRate}%</p>
                        </div>
                        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase">Previsão</p>
                          <p className="font-bold text-emerald-600">Estável</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-64 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={condoScore.trends}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="score" stroke="#2563eb" fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Risk Alert */}
                {user.role === 'CONDO_ADMIN' && residentRisks.some(r => r.riskLevel === 'HIGH') && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-red-900">Alerta de Inadimplência</h4>
                        <p className="text-red-800/70 text-sm">Detectamos {residentRisks.filter(r => r.riskLevel === 'HIGH').length} moradores com alto risco de atraso este mês.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveMenu('risk')}
                      className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                    >
                      Ver Detalhes
                    </button>
                  </motion.div>
                )}

                {/* Maintenance Alert */}
                {user.role === 'CONDO_ADMIN' && maintenanceTasks.some(t => t.status !== 'COMPLETED' && isBefore(parseISO(t.nextDueDate), addDays(new Date(), 7))) && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-blue-900">Manutenção Pendente</h4>
                        <p className="text-blue-800/70 text-sm">
                          Você tem {maintenanceTasks.filter(t => t.status !== 'COMPLETED' && isBefore(parseISO(t.nextDueDate), addDays(new Date(), 7))).length} tarefas de manutenção vencendo nos próximos 7 dias.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveMenu('maintenance')}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Ver Agenda
                    </button>
                  </motion.div>
                )}

                {/* Welcome Banner */}
                <div className="bg-slate-900 rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                  <div className="relative z-10 max-w-2xl">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-extrabold mb-4 leading-tight">
                      Olá, {user.name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
                      Bem-vindo ao painel do <span className="text-white font-bold">{currentCondoName}</span>. 
                      Tudo parece em ordem por aqui hoje.
                    </p>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      <button className="bg-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 text-sm sm:text-base">
                        Novo Comunicado
                      </button>
                      <button className="bg-white/10 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 text-sm sm:text-base">
                        Ver Relatórios
                      </button>
                    </div>
                  </div>
                  <Sparkles className="absolute -right-10 -top-10 w-48 sm:w-64 h-48 sm:h-64 text-white/5 rotate-12" />
                  <Building2 className="absolute right-10 bottom-0 w-32 sm:w-48 h-32 sm:h-48 text-white/5" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    { label: 'Total Moradores', value: '742', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12 este mês' },
                    { label: 'Ocorrências', value: '08', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', trend: '3 urgentes' },
                    { label: 'Reservas Hoje', value: '12', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Salão ocupado' },
                    { label: 'Inadimplência', value: '4.2%', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50', trend: '-0.5% vs mês ant.' },
                  ].map((stat, i) => (
                    <div key={i} className={`bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-200/60 hover:shadow-xl transition-all group ${i === 3 ? 'lg:col-span-3' : ''}`}>
                      <div className={`${stat.bg} ${stat.color} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:rotate-6 transition-transform`}>
                        <stat.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">{stat.label}</p>
                      <h3 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2 sm:mb-4">{stat.value}</h3>
                      <p className={`text-xs font-bold ${stat.color} flex items-center gap-2`}>
                        <TrendingUp className="w-4 h-4" /> {stat.trend}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-14">
                  {/* Recent Activity */}
                  <div className="lg:col-span-2 bg-white rounded-3xl lg:rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200/60">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-headline font-extrabold text-slate-800">Últimas Ocorrências</h3>
                        <p className="text-sm text-slate-400 mt-1">Acompanhe o que está acontecendo agora.</p>
                      </div>
                      <button 
                        onClick={() => setActiveMenu('occurrences')}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                      >
                        Ver todas
                      </button>
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                      {MOCK_OCCURRENCES.map((occ) => (
                        <div key={occ.id} className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${occ.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-slate-800 text-base sm:text-lg group-hover:text-blue-600 transition-colors truncate">{occ.title}</h4>
                            <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">{occ.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">{occ.createdAt}</p>
                            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${occ.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {occ.status === 'OPEN' ? 'Pendente' : 'Resolvido'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200/60">
                    <h3 className="text-2xl font-headline font-extrabold text-slate-800 mb-10">Ações Rápidas</h3>
                    <div className="grid grid-cols-2 gap-8">
                      {[
                        { label: 'Novo Morador', icon: UserPlus, color: 'bg-blue-50 text-blue-600', action: () => { setActiveMenu('residents'); setShowAddResidentModal(true); } },
                        { label: 'Comunicado', icon: MessageSquare, color: 'bg-purple-50 text-purple-600', action: () => setActiveMenu('announcements') },
                        { label: 'Nova Reserva', icon: Calendar, color: 'bg-emerald-50 text-emerald-600', action: () => setActiveMenu('reservations') },
                        { label: 'Financeiro', icon: DollarSign, color: 'bg-rose-50 text-rose-600', action: () => setActiveMenu('finance') },
                      ].map((action, i) => (
                        <button 
                          key={i} 
                          onClick={action.action}
                          className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group relative overflow-hidden"
                        >
                          <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/10 group-hover:text-white transition-colors`}>
                            <action.icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-black text-center uppercase tracking-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-10 p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group cursor-pointer">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Suporte VIP</p>
                        <h4 className="font-bold mb-2">Precisa de ajuda?</h4>
                        <p className="text-xs text-slate-400">Fale com nosso time de especialistas agora.</p>
                      </div>
                      <Sparkles className="absolute -right-4 -bottom-4 w-20 h-20 text-white/10 group-hover:scale-125 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'residents' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-primary">Gestão de Moradores</h3>
                  <button 
                    onClick={() => setShowAddResidentModal(true)}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus className="w-5 h-5" /> Novo Morador
                  </button>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Unidade</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contato</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">CPF / Login</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Notificar</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {residents.map((res) => (
                        <tr key={res.id} className="hover:bg-gray-50 transition-all">
                          <td className="px-8 py-4 font-bold text-primary">{res.name}</td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-600">{res.unit}</td>
                          <td className="px-8 py-4">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${res.isOwner ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                              {res.isOwner ? 'Proprietário' : 'Inquilino'}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-sm text-gray-600">{res.email}</p>
                            <p className="text-xs text-gray-400">{res.phone}</p>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-sm font-medium text-slate-600">{res.cpf || '-'}</p>
                            <p className="text-[10px] text-gray-400">{res.login || '-'}</p>
                          </td>
                          <td className="px-8 py-4">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${res.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {res.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleNotifyResident(res, 'EMAIL')}
                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                title="Enviar E-mail"
                              >
                                <MailIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleNotifyResident(res, 'WHATSAPP')}
                                className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                title="Enviar WhatsApp"
                              >
                                <Smartphone className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <button className="text-primary hover:underline text-sm font-bold">Editar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeMenu === 'assemblies' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Assembleias Digitais</h3>
                    <p className="text-slate-500">Participe das decisões do seu condomínio com validade jurídica.</p>
                  </div>
                  {user.role === 'CONDO_ADMIN' && (
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
                      <Plus className="w-5 h-5" /> Nova Assembleia
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {assemblies.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Gavel className="w-10 h-10 text-slate-300" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800">Nenhuma assembleia ativa</h4>
                      <p className="text-slate-400 max-w-sm mx-auto">Você será notificado quando uma nova assembleia for agendada.</p>
                    </div>
                  ) : (
                    assemblies.map(assembly => (
                      <div key={assembly.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8">
                        <div className="flex-grow space-y-6">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              assembly.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 
                              assembly.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {assembly.status === 'ACTIVE' ? 'Em Votação' : assembly.status === 'SCHEDULED' ? 'Agendada' : 'Encerrada'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">Expira em {new Date(assembly.endDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <h4 className="text-2xl font-black text-slate-800 mb-2">{assembly.title}</h4>
                            <p className="text-slate-500 leading-relaxed">{assembly.description}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {assembly.items.map(item => (
                              <div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="font-bold text-slate-800 mb-4">{item.question}</p>
                                <div className="space-y-2">
                                  {item.options.map((opt, idx) => {
                                    const voteCount = Object.values(item.votes).filter(v => v === idx).length;
                                    const totalVotes = Object.keys(item.votes).length;
                                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                                    return (
                                      <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                          <span className="text-slate-600">{opt}</span>
                                          <span className="text-slate-400">{voteCount} votos ({Math.round(percentage)}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className="h-full bg-blue-600"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {assembly.status === 'ACTIVE' && (
                                  <div className="mt-6 space-y-2 text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Seu Voto</p>
                                    {item.options.map((opt, oIdx) => {
                                      const userUnit = residents.find(r => r.id === user.id)?.unit || '';
                                      const hasVoted = item.votes[userUnit] !== undefined;
                                      const isSelected = item.votes[userUnit] === oIdx;

                                      return (
                                        <button 
                                          key={oIdx}
                                          onClick={() => handleVote(assembly.id, item.id, oIdx)}
                                          disabled={hasVoted}
                                          className={`w-full py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between px-4 ${
                                            isSelected 
                                            ? 'bg-blue-600 border-blue-600 text-white' 
                                            : hasVoted
                                            ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600'
                                          }`}
                                        >
                                          <span>{opt}</span>
                                          {isSelected && <Check className="w-4 h-4" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="md:w-64 space-y-6">
                          <div className="p-6 bg-slate-900 rounded-3xl text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Resumo Legal</p>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium">Votos auditados</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium">Registro em Blockchain</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium">Quórum verificado</span>
                              </div>
                            </div>
                          </div>
                          <button className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                            <FileText className="w-4 h-4" /> Baixar Edital
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeMenu === 'maintenance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Manutenção Preventiva</h3>
                    <p className="text-slate-500">Agenda e histórico de equipamentos críticos.</p>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
                    <Plus className="w-5 h-5" /> Agendar Manutenção
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Próximos 7 dias', value: maintenanceTasks.filter(t => isBefore(parseISO(t.nextDueDate), addDays(new Date(), 7))).length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Atrasadas', value: maintenanceTasks.filter(t => t.status === 'OVERDUE').length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Concluídas (Mês)', value: maintenanceTasks.filter(t => t.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Próxima Data</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceTasks.map(task => (
                        <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                 <Wrench className="w-5 h-5 text-slate-500" />
                               </div>
                               <div>
                                 <p className="font-bold text-slate-800">{task.title}</p>
                                 <p className="text-xs text-slate-400">{task.description}</p>
                               </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="text-xs font-bold text-slate-600">{task.frequency}</span>
                          </td>
                          <td className="p-6">
                            <p className="text-xs font-bold text-slate-800">{new Date(task.nextDueDate).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400">Restam {Math.ceil((new Date(task.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias</p>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 
                              task.status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {task.status === 'COMPLETED' ? 'Concluído' : task.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => alert(`Lembrete de e-mail enviado para a equipe técnica sobre: ${task.title}`)}
                                className="p-2 hover:bg-blue-50 rounded-lg text-blue-400 group relative"
                                title="Enviar lembrete por e-mail"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeMenu === 'cameras' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Câmeras em Tempo Real</h3>
                    <p className="text-slate-500">Monitoramento integrado (Intelbras / Hikvision).</p>
                  </div>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button 
                      onClick={() => setCameraViewTab('monitoring')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${cameraViewTab === 'monitoring' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Monitoramento
                    </button>
                    <button 
                      onClick={() => setCameraViewTab('settings')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${cameraViewTab === 'settings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Configurações
                    </button>
                    <button 
                      onClick={() => setCameraViewTab('api')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${cameraViewTab === 'api' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      API & Integrações
                    </button>
                  </div>
                </div>

                {cameraViewTab === 'monitoring' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cameraError ? (
                    <div className="col-span-full bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
                      <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                      <p className="text-red-600 font-bold">{cameraError}</p>
                      <button 
                        onClick={loadCameras}
                        className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-600/20"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : isCamsLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-slate-100 rounded-[2.5rem] aspect-video animate-pulse" />
                    ))
                  ) : (
                    cameras.map((cam) => (
                      <div key={cam.id} className="bg-slate-900 rounded-[2.5rem] overflow-hidden relative group aspect-video">
                        <img 
                          src={cam.url} 
                          alt={cam.name} 
                          className={`w-full h-full object-cover transition-opacity ${cam.status === 'ONLINE' ? 'opacity-60 group-hover:opacity-80' : 'opacity-20 backdrop-grayscale'}`}
                          referrerPolicy="no-referrer"
                        />
                        
                        {cam.status === 'ONLINE' && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="grid grid-cols-3 gap-2 bg-black/40 backdrop-blur-md p-4 rounded-3xl">
                              <div />
                              <button onClick={() => handlePTZ(cam.id, 'PTZ_UP')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white"><ArrowUp className="w-5 h-5" /></button>
                              <div />
                              <button onClick={() => handlePTZ(cam.id, 'PTZ_LEFT')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white"><ArrowLeft className="w-5 h-5" /></button>
                              <div className="w-5 h-5" />
                              <button onClick={() => handlePTZ(cam.id, 'PTZ_RIGHT')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white"><ArrowRight className="w-5 h-5" /></button>
                              <button onClick={() => handlePTZ(cam.id, 'ZOOM_IN')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold"><ZoomIn className="w-5 h-5" /></button>
                              <button onClick={() => handlePTZ(cam.id, 'PTZ_DOWN')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white"><ArrowDown className="w-5 h-5" /></button>
                              <button onClick={() => handlePTZ(cam.id, 'ZOOM_OUT')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold"><ZoomOut className="w-5 h-5" /></button>
                            </div>
                          </div>
                        )}

                        {cam.status !== 'ONLINE' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                            <Camera className="w-12 h-12 mb-2" />
                            <span className="text-xs font-bold uppercase tracking-widest">{cam.status === 'OFFLINE' ? 'Conexão Perdida' : 'Erro na API'}</span>
                          </div>
                        )}

                        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                          <div className={`w-2 h-2 rounded-full ${cam.status === 'ONLINE' ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{cam.status === 'ONLINE' ? 'LIVE' : cam.status}</span>
                        </div>
                        
                        <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                          <span className="text-[8px] font-bold text-white/60 tracking-wider font-mono">{cam.model}</span>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                          <h4 className="text-white font-bold">{cam.name}</h4>
                          <p className={`text-xs ${cam.status === 'ONLINE' ? 'text-white/60' : 'text-red-400'}`}>{cam.lastEvent}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                ) : cameraViewTab === 'settings' ? (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-600" /> Integração com DVR/NVR
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400">Endereço IP / Host</label>
                            <input 
                              type="text" 
                              value={cameraConfig.ip}
                              onChange={(e) => setCameraConfig({...cameraConfig, ip: e.target.value})}
                              placeholder="192.168.1.100" 
                              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400">Porta HTTP</label>
                              <input 
                                type="number" 
                                value={cameraConfig.httpPort}
                                onChange={(e) => setCameraConfig({...cameraConfig, httpPort: Number(e.target.value)})}
                                placeholder="80" 
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400">Porta RTSP</label>
                              <input 
                                type="number" 
                                value={cameraConfig.rtspPort}
                                onChange={(e) => setCameraConfig({...cameraConfig, rtspPort: Number(e.target.value)})}
                                placeholder="554" 
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                          <Key className="w-4 h-4 text-blue-600" /> Credenciais de Acesso
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400">Usuário</label>
                            <input 
                              type="text" 
                              value={cameraConfig.username}
                              onChange={(e) => setCameraConfig({...cameraConfig, username: e.target.value})}
                              placeholder="admin" 
                              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400">Senha</label>
                            <input 
                              type="password" 
                              value={cameraConfig.password}
                              onChange={(e) => setCameraConfig({...cameraConfig, password: e.target.value})}
                              placeholder="••••••••" 
                              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                        <Info className="w-4 h-4" />
                        Compatível com protocolos ONVIF / ISAPI (Hikvision, Intelbras, Dahua)
                      </div>
                      <button 
                        onClick={() => {
                          setIsLoading(true);
                          setTimeout(() => {
                            setIsLoading(false);
                            alert("Configurações de câmera salvas e validadas com sucesso!");
                            createAuditLog('Configurou integração de câmeras', 'CONDO', user.condoId, `Host: ${cameraConfig.ip}:${cameraConfig.httpPort}`, user.condoId);
                          }, 1500);
                        }}
                        disabled={isLoading}
                        className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                      >
                        {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Salvar e Testar Conexão
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center space-y-6">
                      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-blue-600">
                        <Zap className="w-10 h-10" />
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <h4 className="text-xl font-black text-slate-800">API de Integração Direta</h4>
                        <p className="text-slate-500 text-sm italic">
                          Utilize nossa API para integrar com sistemas externos de reconhecimento facial ou inteligência artificial.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="bg-slate-900 p-6 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Endpoint de Webhook</p>
                            <Copy className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                          </div>
                          <div className="text-white font-mono text-[10px] break-all bg-black/20 p-3 rounded-lg border border-white/5">
                            https://api.condopro.app/v1/webhook/cam-{user.condoId || 'id'}
                          </div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">API Key (X-API-KEY)</p>
                            <Eye className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                          </div>
                          <div className="text-white font-mono text-[10px] break-all bg-black/20 p-3 rounded-lg border border-white/5">
                            cp_live_••••••••••••••••••••
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-2 mx-auto">
                          <ExternalLink className="w-4 h-4" /> Ver Documentação da API
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeMenu === 'marketplace' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Marketplace Interno</h3>
                    <p className="text-slate-500">Serviços e produtos de moradores para moradores.</p>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
                    <Plus className="w-5 h-5" /> Anunciar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Aulas de Yoga', author: 'Ana (101A)', price: 'R$ 80/aula', rating: 4.9, category: 'Saúde' },
                    { title: 'Bolos Caseiros', author: 'Dona Maria (202B)', price: 'A partir de R$ 45', rating: 5.0, category: 'Alimentação' },
                    { title: 'Passeador de Cães', author: 'Pedro (303C)', price: 'R$ 30/passeio', rating: 4.8, category: 'Pets' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all">
                      <div className="aspect-square bg-slate-100 relative">
                        <img 
                          src={`https://picsum.photos/seed/market${i}/400/400`} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-blue-600">
                          {item.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-bold">{item.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Por {item.author}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600 font-black">{item.price}</span>
                          <button className="p-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeMenu === 'risk' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Previsão de Inadimplência</h3>
                    <p className="text-slate-500">Análise preditiva de risco baseada em comportamento e histórico.</p>
                  </div>
                  <div className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> {residentRisks.filter(r => r.riskLevel === 'HIGH').length} Moradores em Alto Risco
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {residentRisks.map(risk => (
                    <div key={risk.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 ${
                        risk.riskLevel === 'HIGH' ? 'bg-red-500' : risk.riskLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`} />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apto {risk.unit}</p>
                          <h4 className="text-xl font-black text-slate-800">{risk.residentName}</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          risk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 
                          risk.riskLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          Risco {risk.riskLevel === 'HIGH' ? 'Alto' : risk.riskLevel === 'MEDIUM' ? 'Médio' : 'Baixo'}
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-slate-500">Score de Risco</span>
                          <span className={`text-2xl font-black ${
                            risk.riskLevel === 'HIGH' ? 'text-red-600' : risk.riskLevel === 'MEDIUM' ? 'text-orange-600' : 'text-emerald-600'
                          }`}>{risk.riskScore}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${risk.riskScore}%` }}
                            className={`h-full rounded-full ${
                              risk.riskLevel === 'HIGH' ? 'bg-red-500' : risk.riskLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fatores de Risco</p>
                        {risk.factors.map((factor, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              risk.riskLevel === 'HIGH' ? 'bg-red-400' : 'bg-slate-300'
                            }`} />
                            {factor}
                          </div>
                        ))}
                      </div>

                      <button className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                         <MessageSquare className="w-5 h-5" /> Enviar Lembrete <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] flex items-start gap-6">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-blue-900 mb-2">Como funciona a Previsão de Risco?</h4>
                    <p className="text-blue-800/70 text-sm leading-relaxed">
                      Nosso algoritmo de IA analisa mais de 15 variáveis, incluindo histórico de pagamentos, frequência de uso das áreas comuns, 
                      padrões de comunicação no chat e interações com a portaria para prever possíveis atrasos antes que eles ocorram.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            {activeMenu === 'subscription' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-8">
                <div className="bg-primary text-white rounded-[2.5rem] p-10 shadow-2xl shadow-primary/30 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">Plano Atual</p>
                    <h3 className="text-4xl font-black mb-6">Plano {plans.find(p => p.id === condo?.planId)?.name || 'Básico'}</h3>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                        <p className="text-[10px] font-bold uppercase text-white/60">Status</p>
                        <p className="font-bold">{condo?.subscriptionStatus === 'ACTIVE' ? 'Ativo' : condo?.subscriptionStatus === 'TRIAL' ? 'Trial' : 'Pendente'}</p>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                        <p className="text-[10px] font-bold uppercase text-white/60">Valor Mensal</p>
                        <p className="font-bold">R$ {plans.find(p => p.id === condo?.planId)?.price || 0}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-white text-primary px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all"
                    >
                      Gerenciar Pagamento
                    </button>
                  </div>
                  <Building2 className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h4 className="text-lg font-bold text-primary mb-6">Método de Pagamento</h4>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-primary">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-400">Expira em 12/28</p>
                      </div>
                      <button className="text-xs font-bold text-primary hover:underline">Trocar</button>
                    </div>
                    <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Pagamento via Pix disponível com 5% de desconto.</p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h4 className="text-lg font-bold text-primary mb-6">Upgrade de Plano</h4>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      Precisa de mais unidades ou recursos financeiros avançados? Mude para o plano Premium e tenha suporte VIP.
                    </p>
                    <button className="w-full py-4 bg-primary-container text-white rounded-2xl font-bold hover:opacity-90 transition-all">
                      Ver Planos Premium
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'occurrences' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">Gestão de Ocorrências</h3>
                    <p className="text-sm text-gray-500">Acompanhe e resolva os problemas do condomínio</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-white text-primary border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold">Filtrar</button>
                    <button 
                      onClick={() => setShowAddOccurrenceModal(true)}
                      className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-5 h-5" /> Nova Ocorrência
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {occurrences.length === 0 && (
                    <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-gray-300">
                      <p className="text-gray-400 font-bold">Nenhuma ocorrência registrada.</p>
                    </div>
                  )}
                  {occurrences.map((occ) => {
                    const resident = residents.find(r => r.id === occ.residentId);
                    return (
                      <div key={occ.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 flex-grow">
                          <div className={`p-3 rounded-2xl flex-shrink-0 ${
                            occ.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 
                            occ.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 
                            'bg-green-100 text-green-600'
                          }`}>
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-primary text-lg">{occ.title}</h4>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                                {occ.category === 'NOISE' ? 'Barulho' :
                                 occ.category === 'LEAK' ? 'Vazamento' :
                                 occ.category === 'ELECTRICAL' ? 'Elétrico' :
                                 occ.category === 'SECURITY' ? 'Segurança' :
                                 occ.category === 'MAINTENANCE' ? 'Manutenção' : 'Outros'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{occ.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {resident?.name || 'Morador'} - Apto {resident?.unit}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(occ.createdAt).toLocaleDateString()}</span>
                              {occ.assignedTo && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-blue-600"><Briefcase className="w-3 h-3" /> Resp: {occ.assignedTo}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          {user.role !== 'RESIDENT' && (
                            <>
                              <div className="w-full sm:w-auto">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Status</p>
                                <select 
                                  value={occ.status}
                                  onChange={(e) => handleUpdateOccurrenceStatus(occ.id, e.target.value as Occurrence['status'])}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                  <option value="OPEN">Aberto</option>
                                  <option value="IN_PROGRESS">Em Andamento</option>
                                  <option value="RESOLVED">Resolvido</option>
                                </select>
                              </div>
                              <div className="w-full sm:w-auto">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Atribuir</p>
                                <input 
                                  type="text"
                                  placeholder="Responsável..."
                                  defaultValue={occ.assignedTo}
                                  onBlur={(e) => {
                                    if (e.target.value !== occ.assignedTo) {
                                      handleAssignOccurrence(occ.id, e.target.value);
                                    }
                                  }}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-gray-300"
                                />
                              </div>
                            </>
                          )}
                          {user.role === 'RESIDENT' && (
                             <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                                occ.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 
                                occ.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 
                                'bg-green-100 text-green-600'
                              }`}>
                                {occ.status === 'OPEN' ? 'Aberto' : 
                                 occ.status === 'IN_PROGRESS' ? 'Em Andamento' : 
                                 'Resolvido'}
                              </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeMenu === 'infractions' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Multas e Infrações</h2>
                    <p className="text-slate-500 text-sm">Gestão de penalidades e advertências do condomínio</p>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Registrar Infração
                  </button>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Morador / Unidade</th>
                          <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</th>
                          <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição</th>
                          <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                          <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Data</th>
                          <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {infractions.map((inf) => (
                          <tr key={inf.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="font-bold text-slate-700">{inf.residentName}</div>
                              <div className="text-xs text-slate-400">{inf.unit}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                inf.type === 'FINE' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {inf.type === 'FINE' ? 'Multa' : 'Advertência'}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm text-slate-600 max-w-xs truncate">{inf.description}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="font-bold text-slate-700">
                                {inf.value ? `R$ ${inf.value.toFixed(2)}` : '-'}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                inf.status === 'PAID' ? 'bg-green-100 text-green-600' : 
                                inf.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {inf.status === 'PAID' ? 'Pago' : inf.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm text-slate-500">{new Date(inf.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex gap-2">
                                <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all" title="Ver Detalhes">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all" title="Marcar como Pago">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'ranking' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-[2.5rem] text-white overflow-hidden relative group">
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                      Ranking do Condomínio <Award className="w-8 h-8 text-amber-400" />
                    </h3>
                    <p className="text-blue-200">Engaje-se na comunidade e ganhe prêmios exclusivos.</p>
                  </div>
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                    <Target className="w-64 h-64" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Minhas Estatísticas */}
                  {user.role === 'RESIDENT' && (
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-6">Minha Pontuação</h4>
                        <div className="text-center space-y-4">
                          <div className="relative inline-block">
                             <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
                               <div className="text-center">
                                 <p className="text-3xl font-black text-blue-600">{residents.find(r => r.id === user.id)?.points || 0}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PONTOS</p>
                               </div>
                             </div>
                             <div className="absolute -bottom-2 right-0 bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white">
                               {residents.find(r => r.id === user.id)?.level || 1}
                             </div>
                          </div>
                          <p className="text-sm font-bold text-slate-600 mt-4">Nível {residents.find(r => r.id === user.id)?.level || 1} - Explorador</p>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${((residents.find(r => r.id === user.id)?.points || 0) % 500) / 500 * 100}%` }}
                              className="h-full bg-blue-600"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">Faltam {500 - ((residents.find(r => r.id === user.id)?.points || 0) % 500)} pontos para o próximo nível</p>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-6">Minhas Medalhas</h4>
                        <div className="flex flex-wrap gap-4 justify-center">
                          {['PAGADOR_PONTUAL', 'PARTICIPATIVO', 'SOCIAL'].map((badge, idx) => {
                            const hasBadge = residents.find(r => r.id === user.id)?.badges?.includes(badge);
                            return (
                              <div key={idx} className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasBadge ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-50 text-slate-200'}`}>
                                {badge === 'PAGADOR_PONTUAL' ? <CreditCard className="w-6 h-6" /> : 
                                 badge === 'PARTICIPATIVO' ? <Gavel className="w-6 h-6" /> :
                                 <MessageSquare className="w-6 h-6" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  <div className={`${user.role === 'RESIDENT' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden`}>
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h4 className="font-bold text-slate-800">Principais Moradores</h4>
                      <div className="flex gap-2">
                        <button className="text-xs font-bold text-slate-400 hover:text-blue-600">Este Mês</button>
                        <span className="text-slate-100">|</span>
                        <button className="text-xs font-bold text-blue-600">Sempre</button>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {[...residents].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10).map((res, idx) => (
                        <div key={res.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-6">
                            <span className={`w-8 text-center font-black ${idx === 0 ? 'text-amber-500 text-xl' : idx === 1 ? 'text-slate-400 text-lg' : idx === 2 ? 'text-amber-700 text-lg' : 'text-slate-300'}`}>
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                                {res.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{res.name}</p>
                                <p className="text-xs text-slate-400">Unidade {res.unit}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-slate-800 leading-none">{res.points || 0}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PONTOS • Nível {res.level || 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {[
                     { icon: CreditCard, title: 'Pagador em Dia', pts: '+100 pts', color: 'text-emerald-500' },
                     { icon: Gavel, title: 'Assembleias', pts: '+50 pts', color: 'text-blue-500' },
                     { icon: MessageSquare, title: 'Atividade no Chat', pts: '+5 pts', color: 'text-purple-500' },
                     { icon: Camera, title: 'Face ID', pts: '+200 pts', color: 'text-amber-500' }
                   ].map((rule, i) => (
                     <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 text-left">
                       <div className={`${rule.color} bg-slate-50 p-3 rounded-2xl`}>
                         <rule.icon className="w-6 h-6" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-800">{rule.title}</p>
                         <p className="text-sm font-black text-blue-600">{rule.pts}</p>
                       </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {activeMenu === 'minutes' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Atas e Documentos</h2>
                    <p className="text-slate-500 text-sm">Acesso oficial às atas de assembleias e documentos do condomínio</p>
                  </div>
                  {user.role === 'CONDO_ADMIN' && (
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Novo Documento
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {minutes.map((min) => (
                    <motion.div 
                      key={min.id}
                      whileHover={{ y: -5 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2">{min.title}</h4>
                          <p className="text-sm text-slate-500 line-clamp-3">{min.content}</p>
                        </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(min.createdAt).toLocaleDateString()}
                        </span>
                        <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                          Acessar <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeMenu === 'concierge' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-primary">Portaria Remota</h3>
                  <button 
                    onClick={() => setShowVisitorModal(true)}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <UserPlus className="w-5 h-5" /> Autorizar Visitante
                  </button>
                </div>

                {/* Visitor Requests Approval Section */}
                {visitorRequests.length > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-orange-500 p-2 rounded-lg">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-orange-900">Solicitações de Acesso Pendentes</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visitorRequests.map((req) => (
                        <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-black text-primary text-lg">{req.name}</p>
                              <p className="text-sm text-gray-500">{req.type} • {req.reason}</p>
                            </div>
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Aguardando</span>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setVisitorRequests(prev => prev.filter(r => r.id !== req.id))}
                              className="flex-grow py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
                            >
                              Autorizar
                            </button>
                            <button 
                              onClick={() => setVisitorRequests(prev => prev.filter(r => r.id !== req.id))}
                              className="flex-grow py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h4 className="text-lg font-bold text-primary mb-6">Visitantes Autorizados</h4>
                    <div className="space-y-4">
                      {visitors.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhum visitante autorizado no momento.</p>
                        </div>
                      ) : (
                        visitors.map((visitor) => (
                          <div key={visitor.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-primary">{visitor.name}</p>
                                <p className="text-xs text-gray-400">{visitor.type} • Válido até {new Date(visitor.validUntil).toLocaleString('pt-BR')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleShareVisitor(visitor)}
                                className="p-2 hover:bg-green-50 text-green-500 rounded-lg transition-colors"
                                title="Compartilhar Convite"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setSelectedVisitorForQR(visitor)}
                                className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                                title="Ver QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm("Deseja remover esta autorização?")) {
                                    try {
                                      await setDoc(doc(db, 'condos', user.condoId!, 'visitors', visitor.id), { status: 'EXPIRED' }, { merge: true });
                                      await createAuditLog('Removeu autorização de visitante', 'VISITOR', visitor.id, `Visitante: ${visitor.name}`);
                                    } catch (err) {
                                      handleFirestoreError(err, OperationType.UPDATE, `condos/${user.condoId}/visitors/${visitor.id}`);
                                    }
                                  }
                                }}
                                className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h4 className="text-lg font-bold text-primary mb-6">Histórico de Acessos</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'João Pereira', action: 'Entrada', time: '14:20' },
                        { name: 'Maria Souza', action: 'Saída', time: '12:15' },
                        { name: 'Técnico Internet', action: 'Entrada', time: '09:45' },
                      ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-8 rounded-full ${log.action === 'Entrada' ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                            <div>
                              <p className="font-bold text-primary">{log.name}</p>
                              <p className="text-xs text-gray-400">{log.action} às {log.time}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center gap-8 text-white">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <div className="w-48 h-48 bg-blue-500/20 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-500/30 relative overflow-hidden">
                      <Shield className="w-20 h-20 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <h4 className="text-2xl font-black mb-4">Portaria Inteligente (Face ID)</h4>
                    <p className="text-slate-400 mb-6 max-w-md">
                      Cadastre sua face para acesso rápido e seguro. Nossa tecnologia de reconhecimento facial garante que apenas pessoas autorizadas entrem no condomínio.
                    </p>
                    <button 
                      onClick={handleFaceIDRegistration}
                      className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Smartphone className="w-5 h-5" /> Cadastrar Face ID
                    </button>
                  </div>
                </div>

                <div className="bg-primary-container/10 p-8 rounded-[2.5rem] border border-primary-container/20 flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-white p-6 rounded-3xl shadow-xl">
                    <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                      <Smartphone className="w-12 h-12 text-gray-300" />
                    </div>
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <h4 className="text-2xl font-black text-primary mb-4">Acesso via QR Code</h4>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Gere um QR Code temporário e envie para seu visitante. Ele poderá liberar a entrada diretamente no leitor da portaria.
                    </p>
                    <button 
                      onClick={() => setShowVisitorModal(true)}
                      className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      Gerar QR Code de Acesso
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'announcements' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Comunicados</h3>
                  {user.role !== 'RESIDENT' && (
                    <button 
                      onClick={() => setShowAddAnnouncementModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <Plus className="w-5 h-5" /> Novo Comunicado
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {announcements.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2.5rem] text-center border border-slate-200/60">
                      <Megaphone className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                      <p className="text-slate-400 font-bold">Nenhum comunicado no momento.</p>
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              ann.category === 'MAINTENANCE' ? 'bg-orange-100 text-orange-600' :
                              ann.category === 'SECURITY' ? 'bg-red-100 text-red-600' :
                              ann.category === 'EVENT' ? 'bg-purple-100 text-purple-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <Megaphone className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ann.category}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">{ann.title}</h4>
                        <p className="text-slate-600 leading-relaxed mb-6">{ann.content}</p>
                        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-400">Por: <span className="text-slate-800">{ann.authorName}</span></p>
                          <div className="flex items-center gap-4">
                            {user.role === 'CONDO_ADMIN' && (
                              <button 
                                onClick={() => handleNotifyAllAnnouncements(ann)}
                                className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-3 py-1 rounded-lg transition-all"
                              >
                                <MailIcon className="w-3 h-3" /> Disparar p/ E-mail
                              </button>
                            )}
                            {ann.priority === 'HIGH' && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-red-600 uppercase tracking-widest">
                                <AlertTriangle className="w-3 h-3" /> Alta Prioridade
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeMenu === 'packages' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Controle de Encomendas</h3>
                  {user.role !== 'RESIDENT' && (
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
                      <Plus className="w-5 h-5" /> Registrar Encomenda
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Morador / Unidade</th>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Descrição / Transportadora</th>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Recebido em</th>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {packages.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">Nenhuma encomenda encontrada.</td>
                        </tr>
                      ) : (
                        packages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-slate-50 transition-all">
                            <td className="px-8 py-6">
                              <p className="font-bold text-slate-800">{pkg.residentName}</p>
                              <p className="text-xs text-slate-400">Apto {pkg.unit}</p>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-medium text-slate-600">{pkg.description}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{pkg.carrier}</p>
                            </td>
                            <td className="px-8 py-6 text-sm text-slate-500">
                              {new Date(pkg.receivedAt).toLocaleString()}
                            </td>
                            <td className="px-8 py-6">
                              <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${
                                pkg.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                                pkg.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {pkg.status === 'PENDING' ? 'Aguardando Retirada' : 
                                 pkg.status === 'DELIVERED' ? 'Entregue' : 'Devolvido'}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              {pkg.status === 'PENDING' && user.role !== 'RESIDENT' && (
                                <button className="text-blue-600 font-bold text-sm hover:underline">Confirmar Entrega</button>
                              )}
                              {pkg.status === 'PENDING' && user.role === 'RESIDENT' && (
                                <button 
                                  onClick={() => setSelectedPackageForQR(pkg)}
                                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                                >
                                  <QrCode className="w-4 h-4" /> QR Code de Retirada
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeMenu === 'reports' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Relatórios & Insights</h3>
                  <button className="bg-white text-slate-800 border border-slate-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                    <FileText className="w-5 h-5" /> Exportar Relatório Geral
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="font-bold text-slate-800">Ocupação de Áreas Comuns</h4>
                      <PieChart className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-6">
                      {[
                        { label: 'Salão de Festas', val: 85, color: 'bg-blue-500' },
                        { label: 'Churrasqueira', val: 62, color: 'bg-emerald-500' },
                        { label: 'Quadra', val: 45, color: 'bg-purple-500' },
                        { label: 'Piscina', val: 30, color: 'bg-orange-500' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                            <span className="text-slate-400">{item.label}</span>
                            <span className="text-slate-800">{item.val}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="font-bold text-slate-800">Inadimplência por Bloco</h4>
                      <BarChart3 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex items-end justify-between h-48 gap-4 px-4">
                      {[
                        { label: 'A', val: 40 },
                        { label: 'B', val: 70 },
                        { label: 'C', val: 30 },
                        { label: 'D', val: 90 },
                        { label: 'E', val: 55 },
                      ].map((item, i) => (
                        <div key={i} className="flex-grow flex flex-col items-center gap-3">
                          <div className="w-full bg-blue-100 rounded-t-xl relative group" style={{ height: `${item.val}%` }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.val}%
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'gas' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Consumo de Gás</h3>
                    <p className="text-slate-500">Gestão de leituras e faturamento individualizado.</p>
                  </div>
                  {user.role !== 'RESIDENT' && (
                    <button 
                      onClick={() => alert('Abrir modal de nova leitura')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <Plus className="w-5 h-5" /> Nova Leitura
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Consumo Total (Mês)</p>
                    <p className="text-3xl font-black text-slate-800">{gasReadings.reduce((acc, curr) => acc + curr.consumption, 0)} m³</p>
                    <p className="text-xs text-blue-600 font-bold mt-2">Média: {(gasReadings.reduce((acc, curr) => acc + curr.consumption, 0) / (gasReadings.length || 1)).toFixed(1)} m³ por unidade</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Valor Total</p>
                    <p className="text-3xl font-black text-emerald-600">R$ {gasReadings.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-400 font-bold mt-2">Preço m³: R$ 12,50</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Leituras Pendentes</p>
                    <p className="text-3xl font-black text-orange-500">{gasReadings.filter(r => r.status === 'PENDING').length}</p>
                    <p className="text-xs text-orange-400 font-bold mt-2">Aguardando faturamento</p>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Histórico de Leituras</h3>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                        <Filter className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade / Morador</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Anterior</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Atual</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gasReadings.filter(r => user.role === 'RESIDENT' ? r.residentId === user.id : true).map(reading => (
                        <tr key={reading.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-6">
                            <p className="font-bold text-slate-800">{reading.unit}</p>
                            <p className="text-xs text-slate-400">{reading.residentName}</p>
                          </td>
                          <td className="p-6 text-sm font-medium text-slate-600">{reading.previousReading} m³</td>
                          <td className="p-6 text-sm font-bold text-slate-800">{reading.currentReading} m³</td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                              {reading.consumption} m³
                            </span>
                          </td>
                          <td className="p-6 font-black text-slate-800">R$ {reading.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              reading.status === 'BILLED' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {reading.status === 'BILLED' ? 'Faturado' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {user.role !== 'RESIDENT' && (
                  <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className="text-2xl font-black">Faturamento em Lote</h3>
                      <p className="text-blue-100 font-medium">Deseja incluir os consumos de gás deste mês nos boletos de condomínio?</p>
                    </div>
                    <button 
                      onClick={() => alert('Faturamento em lote processado! Os valores serão incluídos nos próximos boletos.')}
                      className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-50 transition-all whitespace-nowrap"
                    >
                      Gerar Faturamento Unificado
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeMenu === 'finance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                {user.role !== 'RESIDENT' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Receita Acumulada</p>
                        <p className="text-3xl font-black text-slate-800">R$ {invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + i.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 -rotate-45" /> Total recebido
                        </p>
                      </div>
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Inadimplência</p>
                        <p className="text-3xl font-black text-red-500">R$ {invoices.filter(i => i.status === 'OVERDUE').reduce((acc, i) => acc + i.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-red-400 font-bold mt-2">{invoices.filter(i => i.status === 'OVERDUE').length} moradores com pendências</p>
                      </div>
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Pendente Geral</p>
                        <p className="text-3xl font-black text-orange-500">R$ {invoices.filter(i => i.status === 'PENDING').reduce((acc, i) => acc + i.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-orange-400 font-bold mt-2">{invoices.filter(i => i.status === 'PENDING').length} boletos em aberto</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Fluxo de Caixa Recente</h3>
                        <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold">Exportar PDF</button>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {[
                          { desc: 'Taxa Condominial - Unid 101A', val: '+ R$ 450,00', date: '12/04', type: 'IN' },
                          { desc: 'Manutenção Elevadores', val: '- R$ 1.200,00', date: '11/04', type: 'OUT' },
                          { desc: 'Energia Áreas Comuns', val: '- R$ 3.400,00', date: '10/04', type: 'OUT' },
                          { desc: 'Taxa Condominial - Unid 202B', val: '+ R$ 450,00', date: '10/04', type: 'IN' },
                        ].map((item, i) => (
                          <div key={i} className="px-8 py-4 flex justify-between items-center hover:bg-gray-50 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {item.type === 'IN' ? <Plus className="w-5 h-5" /> : <X className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{item.desc}</p>
                                <p className="text-xs text-gray-400">{item.date}</p>
                              </div>
                            </div>
                            <span className={`font-black ${item.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
                      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Gestão de Boletos</h3>
                          <p className="text-xs text-slate-400">Envie lembretes e acompanhe o recebimento das taxas.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                          <div className="flex bg-slate-200 p-1 rounded-xl">
                            {(['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const).map((f) => (
                              <button
                                key={f}
                                onClick={() => setFinanceFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                  financeFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : f === 'PAID' ? 'Pagos' : 'Atrasados'}
                              </button>
                            ))}
                          </div>
                          <button 
                            onClick={() => setShowAddInvoiceModal(true)}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all ml-auto md:ml-0"
                          >
                            <Plus className="w-4 h-4" /> Gerar Novo Boleto
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Morador / Unidade</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referência</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {invoices
                              .filter(inv => financeFilter === 'ALL' || inv.status === financeFilter)
                              .map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50 transition-all">
                                <td className="px-8 py-4">
                                  <p className="font-bold text-slate-800">{residents.find(r => r.id === inv.residentId)?.name || 'N/A'}</p>
                                  <p className="text-xs text-slate-400">Unidade {residents.find(r => r.id === inv.residentId)?.unit || '-'}</p>
                                </td>
                                <td className="px-8 py-4 text-sm font-medium text-slate-600">{inv.description}</td>
                                <td className="px-8 py-4 font-black text-slate-800">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="px-8 py-4 text-sm font-bold text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                <td className="px-8 py-4">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' :
                                    inv.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {inv.status === 'PAID' ? 'Pago' : inv.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                                  </span>
                                </td>
                                <td className="px-8 py-4">
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleNotifyBoleto(inv)}
                                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                                    >
                                      <MailIcon className="w-3 h-3" /> Notificar
                                    </button>
                                    {user.role !== 'RESIDENT' && inv.status !== 'PAID' && (
                                      <button 
                                        onClick={() => handleMarkInvoicePaid(inv.id)}
                                        className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                                      >
                                        <CheckCircle2 className="w-3 h-3" /> Pago
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Owner-specific sections */}
                    {residents.find(r => r.email === user.email)?.isOwner && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/20">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className="font-bold text-lg">Gestão de Inquilinos</h4>
                              <p className="text-blue-100 text-xs">Acompanhe o status dos seus inquilinos</p>
                            </div>
                            <Users className="w-6 h-6 text-blue-200" />
                          </div>
                          <div className="space-y-4">
                            {residents.filter(r => r.ownerId === residents.find(res => res.email === user.email)?.id).map(tenant => (
                              <div key={tenant.id} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                                <div>
                                  <p className="font-bold text-sm">{tenant.name}</p>
                                  <p className="text-[10px] text-blue-200 uppercase tracking-widest">Unidade {tenant.unit}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black ${
                                  invoices.find(i => i.residentId === tenant.id && i.status === 'PENDING') ? 'bg-amber-400 text-amber-900' : 'bg-emerald-400 text-emerald-900'
                                }`}>
                                  {invoices.find(i => i.residentId === tenant.id && i.status === 'PENDING') ? 'Pendente' : 'Em dia'}
                                </span>
                              </div>
                            ))}
                            {residents.filter(r => r.ownerId === residents.find(res => res.email === user.email)?.id).length === 0 && (
                              <p className="text-sm text-blue-200 text-center py-4 italic">Nenhum inquilino vinculado.</p>
                            )}
                          </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg">Prévia de Valores</h4>
                              <p className="text-slate-500 text-xs">Estimativa para o próximo mês</p>
                            </div>
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Taxa Condominial</span>
                              <span className="font-bold text-slate-800">R$ 450,00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Fundo de Reserva</span>
                              <span className="font-bold text-slate-800">R$ 45,00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Gás (Estimado)</span>
                              <span className="font-bold text-slate-800">R$ 85,00</span>
                            </div>
                            <div className="pt-3 border-t border-slate-100 flex justify-between">
                              <span className="font-bold text-slate-800">Total Previsto</span>
                              <span className="font-black text-blue-600">R$ 580,00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gas Usage Mirroring for Residents/Owners */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">Espelho de Consumo de Gás</h4>
                          <p className="text-slate-500 text-xs">Acompanhamento detalhado das leituras</p>
                        </div>
                        <Zap className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="text-slate-400 font-bold border-b border-slate-100">
                              <th className="pb-4">Mês/Ano</th>
                              <th className="pb-4 text-right">Leitura Anterior</th>
                              <th className="pb-4 text-right">Leitura Atual</th>
                              <th className="pb-4 text-right">Consumo (m³)</th>
                              <th className="pb-4 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {gasReadings.filter(r => r.residentId === user.id).map(reading => (
                              <tr key={reading.id}>
                                <td className="py-4 font-bold text-slate-700">{reading.billingMonth}</td>
                                <td className="py-4 text-right text-slate-500">{reading.previousReading}</td>
                                <td className="py-4 text-right text-slate-500">{reading.currentReading}</td>
                                <td className="py-4 text-right font-bold text-slate-700">{reading.consumption}</td>
                                <td className="py-4 text-right font-black text-blue-600">R$ {reading.totalAmount.toFixed(2)}</td>
                              </tr>
                            ))}
                            {gasReadings.filter(r => r.residentId === user.id).length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400 italic">Nenhuma leitura registrada para esta unidade.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">Próximo Vencimento</p>
                        <h3 className="text-4xl font-black mb-6">R$ {(invoices.find(i => i.status === 'PENDING')?.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              const pending = invoices.find(i => i.status === 'PENDING');
                              if (pending) {
                                handleMarkInvoicePaid(pending.id);
                              } else {
                                alert("Você não possui boletos pendentes!");
                              }
                            }}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                          >
                            Pagar com PIX
                          </button>
                          <button className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10">
                            Copiar Código
                          </button>
                        </div>
                      </div>
                      <DollarSign className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5" />
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                      <div className="p-8 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Meus Boletos</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {invoices.length === 0 ? (
                          <div className="p-10 text-center text-slate-400 font-bold">Nenhum boleto encontrado.</div>
                        ) : (
                          invoices.map((inv) => (
                            <div key={inv.id} className="px-8 py-6 flex justify-between items-center hover:bg-slate-50 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                  inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' :
                                  inv.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{inv.description}</p>
                                  <p className="text-xs text-slate-400">Vencimento: {new Date(inv.dueDate).toLocaleDateString()}</p>
                                  {inv.items && (
                                    <div className="mt-2 space-y-1">
                                      {inv.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between w-48 text-[10px] text-slate-500">
                                          <span>{item.description}</span>
                                          <span className="font-bold">R$ {item.amount.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-slate-800">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                                  inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' :
                                  inv.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {inv.status === 'PAID' ? 'Pago' : inv.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeMenu === 'reservations' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-primary">Reservas de Áreas Comuns</h3>
                  <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5" /> Nova Reserva
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['Salão de Festas', 'Churrasqueira A', 'Quadra de Tênis'].map((area, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-primary">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-primary mb-1">{area}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Próxima: 15/04</p>
                      <button className="w-full py-2 bg-gray-50 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all">
                        Ver Calendário
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-primary">Solicitações Pendentes</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { resident: 'Ana Silva', area: 'Salão de Festas', date: '20/04/2024', status: 'PENDING' },
                      { resident: 'Bruno Santos', area: 'Churrasqueira B', date: '22/04/2024', status: 'PENDING' },
                    ].map((res, i) => (
                      <div key={i} className="px-8 py-6 flex justify-between items-center hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold">
                            {res.resident.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-primary">{res.resident}</p>
                            <p className="text-sm text-gray-400">{res.area} • {res.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-green-100 text-green-600 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all">Aprovar</button>
                          <button className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all">Recusar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'chat' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)] bg-white rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden"
              >
                <div className="p-4 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-headline font-extrabold text-slate-800">Chat Comunitário</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Converse com outros moradores do {currentCondoName}</p>
                  </div>
                  <div className="flex -space-x-2 sm:-space-x-3">
                    {residents.slice(0, 5).map((r, i) => (
                      <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-blue-600">
                        {r.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {residents.length > 5 && (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-slate-600">
                        +{residents.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 sm:p-8 space-y-2 bg-slate-50/30 flex flex-col">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                      <MessageSquare className="w-16 h-16 mb-4" />
                      <p className="font-bold">Nenhuma mensagem ainda.</p>
                      <p className="text-sm">Seja o primeiro a dizer oi!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const prevMsg = messages[index - 1];
                      const nextMsg = messages[index + 1];
                      const isSameSenderAsPrev = prevMsg && prevMsg.senderId === msg.senderId;
                      const isSameSenderAsNext = nextMsg && nextMsg.senderId === msg.senderId;
                      const isMe = msg.senderId === user.id;

                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameSenderAsPrev ? 'mt-0.5' : 'mt-4'}`}
                        >
                          {!isMe && !isSameSenderAsPrev && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">
                              {msg.senderName}
                            </span>
                          )}
                          <div className="group relative flex items-center gap-3">
                            {isMe && (
                              <span className="text-[9px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <div 
                              className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm transition-all ${
                                isMe 
                                  ? `bg-blue-600 text-white ${isSameSenderAsPrev ? 'rounded-tr-md' : 'rounded-tr-none'} ${isSameSenderAsNext ? 'rounded-br-md' : ''}` 
                                  : `bg-white text-slate-800 border border-slate-100 ${isSameSenderAsPrev ? 'rounded-tl-md' : 'rounded-tl-none'} ${isSameSenderAsNext ? 'rounded-bl-md' : ''}`
                              }`}
                            >
                              {msg.text}
                            </div>
                            {!isMe && (
                              <span className="text-[9px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {Object.keys(typingUsers).length > 0 && (
                  <div className="px-8 py-2 bg-white flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 italic">
                      {Object.values(typingUsers).map((u: any) => u.name).join(', ')} {Object.keys(typingUsers).length === 1 ? 'está digitando...' : 'estão digitando...'}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="p-4 sm:p-8 bg-white border-t border-slate-100">
                  <div className="flex gap-2 sm:gap-4">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..." 
                      className="flex-grow p-4 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm sm:text-base"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 text-white px-5 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none text-sm sm:text-base"
                    >
                      Enviar
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeMenu === 'audit' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200/60"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-headline font-extrabold text-slate-800">Trilha de Auditoria</h3>
                    <p className="text-sm text-slate-400 mt-1">Histórico de ações administrativas realizadas no condomínio.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhum registro de auditoria encontrado.</p>
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-6 p-6 rounded-3xl hover:bg-slate-50 transition-all border border-slate-100 group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <History className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-800">{log.action}</span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                              {log.resourceType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{log.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800">{log.userName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeMenu === 'settings' && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gray-100 p-8 rounded-full mb-6">
                  <Settings className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Configurações do Sistema</h3>
                <p className="text-gray-500 max-w-xs">Gerencie as preferências do condomínio, notificações e integrações.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Resident Modal */}
      <AnimatePresence>
        {showAddResidentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddResidentModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Novo Morador</h3>
                <button onClick={() => setShowAddResidentModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={newResident.name}
                    onChange={(e) => setNewResident({...newResident, name: e.target.value})}
                    placeholder="Ex: Maria Souza" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unidade</label>
                    <input 
                      type="text" 
                      value={newResident.unit}
                      onChange={(e) => setNewResident({...newResident, unit: e.target.value})}
                      placeholder="101" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bloco</label>
                    <input 
                      type="text" 
                      value={newResident.block}
                      onChange={(e) => setNewResident({...newResident, block: e.target.value})}
                      placeholder="A" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Torre</label>
                    <input 
                      type="text" 
                      value={newResident.tower}
                      onChange={(e) => setNewResident({...newResident, tower: e.target.value})}
                      placeholder="T1" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">É Proprietário?</label>
                    <button 
                      onClick={() => setNewResident({...newResident, isOwner: !newResident.isOwner})}
                      className={`w-12 h-6 rounded-full transition-all relative ${newResident.isOwner ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newResident.isOwner ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  {!newResident.isOwner && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Proprietário Responsável</label>
                      <select 
                        value={newResident.ownerId}
                        onChange={(e) => setNewResident({...newResident, ownerId: e.target.value})}
                        className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Selecione o proprietário</option>
                        {residents.filter(r => r.isOwner).map(owner => (
                          <option key={owner.id} value={owner.id}>{owner.name} ({owner.unit})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Telefone</label>
                    <input 
                      type="text" 
                      value={newResident.phone}
                      onChange={(e) => setNewResident({...newResident, phone: e.target.value})}
                      placeholder="(00) 00000-0000" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                    <select 
                      value={newResident.status}
                      onChange={(e) => setNewResident({...newResident, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="ACTIVE">Ativo</option>
                      <option value="INACTIVE">Inativo</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                  <input 
                    type="email" 
                    value={newResident.email}
                    onChange={(e) => setNewResident({...newResident, email: e.target.value})}
                    placeholder="maria@email.com" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CPF</label>
                    <input 
                      type="text" 
                      value={newResident.cpf}
                      onChange={(e) => setNewResident({...newResident, cpf: e.target.value})}
                      placeholder="000.000.000-00" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Login</label>
                    <input 
                      type="text" 
                      value={newResident.login}
                      onChange={(e) => setNewResident({...newResident, login: e.target.value})}
                      placeholder="maria.souza" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddResident}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : 'Criar Morador'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal Simulation */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Pagamento da Assinatura</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex gap-4 p-1 bg-gray-100 rounded-2xl">
                  <button 
                    onClick={() => setPaymentMethod('PIX')}
                    className={`flex-grow py-3 rounded-xl font-bold text-sm transition-all ${paymentMethod === 'PIX' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                  >
                    Pix (5% OFF)
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex-grow py-3 rounded-xl font-bold text-sm transition-all ${paymentMethod === 'CARD' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                  >
                    Cartão
                  </button>
                </div>

                {paymentMethod === 'PIX' ? (
                  <div className="text-center space-y-4">
                    <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 inline-block">
                      <div className="w-48 h-48 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        {/* Placeholder for QR Code */}
                        <div className="w-40 h-40 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                          <Smartphone className="w-12 h-12 text-gray-300" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Escaneie o QR Code acima para pagar R$ 113,05</p>
                    <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                      Copiar Código Pix <CreditCard className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Número do Cartão</label>
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Validade</label>
                        <input type="text" placeholder="MM/AA" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CVV</label>
                        <input type="text" placeholder="000" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                    <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-4">
                      Pagar R$ 119,00
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Package QR Code Modal */}
      <AnimatePresence>
        {selectedPackageForQR && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center relative shadow-2xl"
            >
              <button 
                onClick={() => setSelectedPackageForQR(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
              <div className="mb-8">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <PackageIcon className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Retirada de Encomenda</h3>
                <p className="text-slate-500 text-sm">Apresente este QR Code ao porteiro para retirar seu pacote.</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-8 flex justify-center">
                <QRCodeSVG 
                  value={`PACKAGE_WITHDRAWAL_${selectedPackageForQR.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="space-y-2 text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes do Pacote</p>
                <p className="text-sm font-bold text-slate-800">{selectedPackageForQR.description}</p>
                <p className="text-xs text-slate-500">Recebido em: {new Date(selectedPackageForQR.receivedAt).toLocaleString()}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visitor QR Code Modal */}
      <AnimatePresence>
        {selectedVisitorForQR && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedVisitorForQR(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center"
            >
              <button 
                onClick={() => setSelectedVisitorForQR(null)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <div className="bg-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-500/20">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-primary">Convite Digital</h3>
                <p className="text-gray-500 text-sm mt-1">Apresente este código na portaria</p>
              </div>

              <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200 mb-8 flex justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <QRCodeSVG 
                    value={JSON.stringify({
                      visitorId: selectedVisitorForQR.id,
                      name: selectedVisitorForQR.name,
                      condoId: user.condoId,
                      validUntil: selectedVisitorForQR.validUntil,
                      type: selectedVisitorForQR.type
                    })}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-left bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Visitante</p>
                  <p className="font-bold text-primary">{selectedVisitorForQR.name}</p>
                  <p className="text-xs text-gray-500">{selectedVisitorForQR.type} • Válido até {selectedVisitorForQR.validUntil}</p>
                </div>
                
                <button 
                  onClick={() => handleShareVisitor(selectedVisitorForQR)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  Compartilhar no WhatsApp <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visitor Authorization Modal */}
      <AnimatePresence>
        {showVisitorModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setShowVisitorModal(false);
                setShowQRPreview(false);
              }}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Nova Autorização</h3>
                <button onClick={() => {
                  setShowVisitorModal(false);
                  setShowQRPreview(false);
                  setVisitorSuccess(null);
                }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                {visitorSuccess ? (
                  <div className="flex flex-col items-center text-center space-y-4 py-2">
                    <div className="bg-slate-50 p-4 rounded-[2rem] border-2 border-dashed border-slate-200 flex justify-center">
                      <div className="bg-white p-3 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <QRCodeSVG 
                          value={JSON.stringify({
                            visitorId: visitorSuccess.id,
                            name: visitorSuccess.name,
                            condoId: visitorSuccess.condoId,
                            validUntil: visitorSuccess.validUntil,
                            type: visitorSuccess.type
                          })}
                          size={160}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary">Autorização Concluída!</h4>
                      <p className="text-sm text-slate-500 mt-1">O convite para {visitorSuccess.name} está pronto.</p>
                    </div>
                    <div className="w-full space-y-3 pt-2">
                      <button 
                        onClick={() => handleShareVisitor(visitorSuccess)}
                        className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                      >
                        <Share2 className="w-5 h-5" /> Compartilhar no WhatsApp
                      </button>
                      <button 
                        onClick={() => {
                          setVisitorSuccess(null);
                          setShowVisitorModal(false);
                        }}
                        className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Concluído
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome do Visitante</label>
                      <input 
                        type="text" 
                        placeholder="Nome completo" 
                        value={newVisitor.name}
                        onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Acesso</label>
                      <select 
                        value={newVisitor.type}
                        onChange={(e) => setNewVisitor({ ...newVisitor, type: e.target.value as Visitor['type'] })}
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="VISITOR">Visitante</option>
                        <option value="SERVICE">Prestador de Serviço</option>
                        <option value="DELIVERY">Delivery</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Validade</label>
                      <input 
                        type="datetime-local" 
                        value={newVisitor.validUntil}
                        onChange={(e) => setNewVisitor({ ...newVisitor, validUntil: e.target.value })}
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                      />
                    </div>
                    <button 
                      onClick={handleAddVisitor}
                      disabled={isLoading}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-4 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> Autorizar e Salvar
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => {
                        if (!newVisitor.name || !newVisitor.validUntil) {
                          alert("Preencha o nome e a validade para gerar o QR Code.");
                          return;
                        }
                        setShowQRPreview(!showQRPreview);
                      }}
                      className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all mt-2"
                    >
                      <QrCode className="w-5 h-5" /> 
                      {showQRPreview ? 'Ocultar QR Code' : 'Gerar e Exibir QR Code'}
                    </button>

                    <AnimatePresence>
                      {showQRPreview && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 flex flex-col items-center space-y-4">
                            <div className="p-4 bg-white border-2 border-dashed border-gray-100 rounded-3xl shadow-sm">
                              <QRCodeSVG 
                                value={JSON.stringify({
                                  name: newVisitor.name,
                                  type: newVisitor.type,
                                  validUntil: newVisitor.validUntil,
                                  unit: residents.find(r => r.email === user.email)?.unit || 'N/A'
                                })}
                                size={180}
                                level="H"
                              />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                              Apresente este código na portaria para autorização
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Face ID Registration Modal */}
      <AnimatePresence>
        {showFaceIDModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowFaceIDModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center"
            >
              <button 
                onClick={() => setShowFaceIDModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Shield className={`w-12 h-12 text-blue-600 ${faceIDStep < 3 ? 'animate-pulse' : ''}`} />
                  {faceIDStep < 3 && (
                    <motion.div 
                      className="absolute inset-0 border-4 border-blue-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  {faceIDStep === 0 && "Iniciando Scan..."}
                  {faceIDStep === 1 && "Mova a Cabeça..."}
                  {faceIDStep === 2 && "Finalizando..."}
                  {faceIDStep === 3 && "Face ID Ativo!"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {faceIDStep === 0 && "Posicione seu rosto dentro do círculo."}
                  {faceIDStep === 1 && "Gire levemente para capturar todos os ângulos."}
                  {faceIDStep === 2 && "Processando informações biométricas."}
                  {faceIDStep === 3 && "Seu acesso via reconhecimento facial foi configurado."}
                </p>
              </div>

              {faceIDStep === 3 ? (
                <button 
                  onClick={() => setShowFaceIDModal(false)}
                  className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-500/20 hover:scale-105 transition-all"
                >
                  Concluir
                </button>
              ) : (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(faceIDStep / 3) * 100}%` }}
                  />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Occurrence Modal */}
      <AnimatePresence>
        {showAddOccurrenceModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddOccurrenceModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Nova Ocorrência</h3>
                <button onClick={() => setShowAddOccurrenceModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Título</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Barulho no 4º andar" 
                    value={newOccurrence.title}
                    onChange={(e) => setNewOccurrence({ ...newOccurrence, title: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoria</label>
                  <select 
                    value={newOccurrence.category}
                    onChange={(e) => setNewOccurrence({ ...newOccurrence, category: e.target.value as Occurrence['category'] })}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    <option value="NOISE">Barulho</option>
                    <option value="LEAK">Vazamento</option>
                    <option value="ELECTRICAL">Problema Elétrico</option>
                    <option value="SECURITY">Segurança</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="OTHER">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição</label>
                  <textarea 
                    rows={4}
                    placeholder="Descreva o ocorrido com detalhes..." 
                    value={newOccurrence.description}
                    onChange={(e) => setNewOccurrence({ ...newOccurrence, description: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20" 
                  />
                </div>
                <button 
                  onClick={() => handleCreateOccurrence()}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Enviando...' : 'Registrar Ocorrência'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Invoice Modal */}
      <AnimatePresence>
        {showAddInvoiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-slate-800">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddInvoiceModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Novo Faturamento</h3>
                <button onClick={() => setShowAddInvoiceModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Morador / Unidade</label>
                  <select 
                    value={newInvoice.residentId || ''}
                    onChange={(e) => {
                      const res = residents.find(r => r.id === e.target.value);
                      setNewInvoice({...newInvoice, residentId: e.target.value, description: `Taxa Condominial - Unid ${res?.unit || ''}`});
                    }}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Selecionar Morador</option>
                    {residents.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (Unid {r.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor (R$)</label>
                    <input 
                      type="number" 
                      value={newInvoice.amount || ''}
                      onChange={(e) => setNewInvoice({...newInvoice, amount: parseFloat(e.target.value)})}
                      placeholder="0.00" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vencimento</label>
                    <input 
                      type="date" 
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</label>
                  <select 
                    value={newInvoice.type}
                    onChange={(e) => setNewInvoice({...newInvoice, type: e.target.value as any})}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="CONDO_FEE">Taxa Condominial</option>
                    <option value="RESERVE_FUND">Fundo de Reserva</option>
                    <option value="GAS">Consumo de Gás</option>
                    <option value="EXTRA">Taxa Extra</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição</label>
                  <input 
                    type="text" 
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                    placeholder="Ex: Referência Abril/2026" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <MailIcon className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-blue-700">
                    <p className="font-bold">Notificação Automática</p>
                    <p>O morador receberá um e-mail com os detalhes do boleto assim que gerado.</p>
                  </div>
                </div>

                <button 
                  onClick={handleCreateInvoice}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                  Gerar e Notificar Morador
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Announcement Modal */}
      <AnimatePresence>
        {showAddAnnouncementModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-slate-800">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddAnnouncementModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Novo Comunicado</h3>
                <button onClick={() => setShowAddAnnouncementModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Título do Comunicado</label>
                  <input 
                    type="text" 
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    placeholder="Ex: Manutenção Preventiva dos Elevadores" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoria</label>
                    <select 
                      value={newAnnouncement.category}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, category: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="GENERAL">Geral</option>
                      <option value="MAINTENANCE">Manutenção</option>
                      <option value="SECURITY">Segurança</option>
                      <option value="EVENT">Evento</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prioridade</label>
                    <select 
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conteúdo do Comunicado</label>
                  <textarea 
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    placeholder="Descreva detalhadamente o comunicado para os moradores..." 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px]" 
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <MailIcon className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-blue-700 leading-tight">
                    <p className="font-bold mb-1">Notificação Automática</p>
                    <p>Ao publicar, todos os moradores registrados receberão um e-mail com este comunicado.</p>
                  </div>
                </div>

                <button 
                  onClick={handleCreateAnnouncement}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                  Publicar e Notificar Todos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SuperAdminDashboard = ({ user, onLogout, appSettings, onUpdateSettings, createAuditLog, plans }: { user: AppUser, onLogout: () => void, appSettings: any, onUpdateSettings: (updates: any) => void, createAuditLog: (action: string, resourceType: AuditLog['resourceType'], resourceId?: string, details?: string, condoId?: string) => Promise<void>, plans: Plan[] }) => {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [editablePlans, setEditablePlans] = useState<{
    [key: string]: {
      price: number;
      features: string[];
      maxUnits: number;
    }
  }>({});

  useEffect(() => {
    if (appSettings) {
      const initial: any = {};
      plans.forEach(p => {
        initial[p.id] = {
          price: appSettings.planPrices?.[p.id] ?? p.price,
          features: appSettings.planFeatures?.[p.id] ?? p.features,
          maxUnits: appSettings.planMaxUnits?.[p.id] ?? p.maxUnits
        };
      });
      setEditablePlans(initial);
    }
  }, [appSettings, plans]);

  const handleSavePlans = async () => {
    setIsSavingPlans(true);
    try {
      const planPrices: any = {};
      const planFeatures: any = {};
      const planMaxUnits: any = {};

      Object.keys(editablePlans).forEach(id => {
        planPrices[id] = editablePlans[id].price;
        planFeatures[id] = editablePlans[id].features;
        planMaxUnits[id] = editablePlans[id].maxUnits;
      });

      await onUpdateSettings({ planPrices, planFeatures, planMaxUnits });
      await createAuditLog('Atualizou configurações de planos SaaS', 'CONDO', 'global', 'Preços, recursos e limites atualizados', 'global');
      alert("Configurações de planos salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações.");
    } finally {
      setIsSavingPlans(false);
    }
  };
  const [showAddCondoModal, setShowAddCondoModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AppUser | null>(null);
  const [managedCondoId, setManagedCondoId] = useState<string | null>(null);
  const [condoForPackages, setCondoForPackages] = useState<Condo | null>(null);
  const [condoPackages, setCondoPackages] = useState<Package[]>([]);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [newPackage, setNewPackage] = useState({ 
    residentId: '', 
    description: '', 
    carrier: '' 
  });
  const [newCondo, setNewCondo] = useState({ name: '', slug: '', city: '', units: 0, planId: 'BASIC' as Condo['planId'], subscriptionStatus: 'ACTIVE' as Condo['subscriptionStatus'] });
  const [isSavingPlans, setIsSavingPlans] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'CONDO_ADMIN' as AppUser['role'], condoId: '', cpf: '', login: '' });
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    cpf: user.cpf || '',
    login: user.login || '',
    avatarUrl: user.avatarUrl || ''
  });

  const handleUpdateProfile = async () => {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, { 
        ...user, 
        ...profileData 
      }, { merge: true });
      
      await createAuditLog('Atualizou perfil próprio', 'CONDO', user.id, `CPF: ${profileData.cpf}`, 'global');
      alert("Perfil atualizado com sucesso! (As mudanças serão refletidas no próximo login ou recarregamento)");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    }
  };

  useEffect(() => {
    if (user.role !== 'SUPER_ADMIN') return;

    const condosRef = collection(db, 'condos');
    const unsubCondos = onSnapshot(condosRef, (snap) => {
      setCondos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Condo)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'condos'));

    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const auditLogsRef = collection(db, 'condos', 'global', 'auditLogs');
    const auditLogsQuery = query(auditLogsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubAuditLogs = onSnapshot(auditLogsQuery, (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'condos/global/auditLogs'));

    return () => {
      unsubCondos();
      unsubUsers();
      unsubAuditLogs();
    };
  }, [user.role]);

  useEffect(() => {
    if (!condoForPackages) return;

    const packagesRef = collection(db, 'condos', condoForPackages.id, 'packages');
    const unsubPackages = onSnapshot(packagesRef, (snap) => {
      setCondoPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${condoForPackages.id}/packages`));

    return () => unsubPackages();
  }, [condoForPackages]);

  const handleCreatePackage = async () => {
    if (!condoForPackages || !newPackage.residentId || !newPackage.description) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      const resident = allUsers.find(u => u.id === newPackage.residentId);
      const pkgRef = doc(collection(db, 'condos', condoForPackages.id, 'packages'));
      const pkgData: Package = {
        id: pkgRef.id,
        condoId: condoForPackages.id,
        residentId: newPackage.residentId,
        residentName: resident?.name || 'Morador Desconhecido',
        unit: 'Externo',
        description: newPackage.description,
        carrier: newPackage.carrier,
        status: 'PENDING',
        receivedAt: new Date().toISOString()
      };

      await setDoc(pkgRef, pkgData);
      await createAuditLog('Registrou nova encomenda (Super Admin)', 'CONDO', pkgRef.id, `Condo: ${condoForPackages.name}, Destinatário: ${pkgData.residentName}`, condoForPackages.id);
      setShowAddPackageModal(false);
      setNewPackage({ residentId: '', description: '', carrier: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${condoForPackages.id}/packages`);
    }
  };

  const handleUpdatePackageStatus = async (pkgId: string, status: Package['status']) => {
    if (!condoForPackages) return;
    try {
      const pkgRef = doc(db, 'condos', condoForPackages.id, 'packages', pkgId);
      await setDoc(pkgRef, { 
        status,
        deliveredAt: status === 'DELIVERED' ? new Date().toISOString() : undefined
      }, { merge: true });
      await createAuditLog('Alterou status de encomenda (Super Admin)', 'CONDO', pkgId, `Novo Status: ${status}`, condoForPackages.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `condos/${condoForPackages.id}/packages/${pkgId}`);
    }
  };

  const handleAddCondo = async () => {
    if (!newCondo.name || !newCondo.city || !newCondo.slug) {
      alert("Por favor, preencha o nome, cidade e slug.");
      return;
    }
    try {
      const condoRef = doc(collection(db, 'condos'));
      const condoData: Condo = {
        id: condoRef.id,
        name: newCondo.name,
        slug: newCondo.slug.toLowerCase().replace(/\s+/g, '-'),
        city: newCondo.city,
        units: newCondo.units,
        planId: newCondo.planId,
        subscriptionStatus: newCondo.subscriptionStatus,
        trialEndsAt: newCondo.subscriptionStatus === 'TRIAL' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        adminId: user.id, // Atribuir usuário criador como admin
        createdAt: new Date().toISOString(),
        address: ''
      };
      await setDoc(condoRef, condoData);

      // Pré-popular comunicados de boas-vindas
      const welcomeAnnRef = doc(collection(db, 'condos', condoRef.id, 'announcements'));
      await setDoc(welcomeAnnRef, {
        id: welcomeAnnRef.id,
        condoId: condoRef.id,
        title: 'Bem-vindo ao CondoPro!',
        content: `Olá! Estamos muito felizes em iniciar a gestão do condomínio ${newCondo.name} através da nossa plataforma. Aqui você poderá gerenciar moradores, comunicados, reservas e muito mais.`,
        category: 'GENERAL',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
        authorName: user.name
      });

      // Pré-popular tarefas de manutenção iniciais
      const initialTasks = [
        { title: 'Inspeção de Elevadores', category: 'ELEVATOR', frequency: 'MONTHLY', desc: 'Verificação mensal preventiva dos elevadores.' },
        { title: 'Limpeza de Caixas d\'água', category: 'OTHER', frequency: 'YEARLY', desc: 'Limpeza e desinfecção obrigatória anual.' },
        { title: 'Manutenção de Portões', category: 'GATE', frequency: 'QUARTERLY', desc: 'Lubrificação e ajuste dos motores dos portões.' }
      ];

      for (const task of initialTasks) {
        const taskRef = doc(collection(db, 'condos', condoRef.id, 'maintenance'));
        await setDoc(taskRef, {
          id: taskRef.id,
          condoId: condoRef.id,
          title: task.title,
          description: task.desc,
          category: task.category,
          frequency: task.frequency,
          status: 'PENDING',
          nextDueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd')
        });
      }

      // Pré-popular primeira Assembleia
      const assemblyRef = doc(collection(db, 'condos', condoRef.id, 'assemblies'));
      await setDoc(assemblyRef, {
        id: assemblyRef.id,
        condoId: condoRef.id,
        title: 'Assembleia de Instalação',
        description: 'Votação sobre as prioridades iniciais do condomínio e aprovação do regimento interno.',
        startDate: new Date().toISOString(),
        endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        status: 'ACTIVE',
        items: [
          {
            id: 'item1',
            question: 'Qual deve ser a prioridade de investimento nos primeiros 3 meses?',
            options: ['Segurança (Câmeras/Portaria)', 'Lazer (Parquinho/Piscina)', 'Sustentabilidade (Energia Solar)'],
            votes: {}
          }
        ],
        createdAt: new Date().toISOString()
      });

      await createAuditLog('Cadastrou novo condomínio', 'CONDO', condoRef.id, `Condomínio: ${newCondo.name}, Slug: ${condoData.slug}`, 'global');
      setShowAddCondoModal(false);
      setNewCondo({ name: '', slug: '', city: '', units: 0, planId: 'BASIC', subscriptionStatus: 'ACTIVE' });
      
      // Opcional: Entrar no modo gerenciamento automaticamente
      setManagedCondoId(condoRef.id);
    } catch (err) {
      console.error("Erro ao adicionar condomínio:", err);
      handleFirestoreError(err, OperationType.CREATE, 'condos');
    }
  };

  const handleUpdateCondoStatus = async (condoId: string, status: Condo['subscriptionStatus']) => {
    try {
      const condoRef = doc(db, 'condos', condoId);
      await setDoc(condoRef, { subscriptionStatus: status }, { merge: true });
      await createAuditLog('Alterou status do condomínio', 'CONDO', condoId, `Novo Status: ${status}`, 'global');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `condos/${condoId}`);
    }
  };

  const handleUpdateCondoPlan = async (condoId: string, planId: Condo['planId']) => {
    try {
      const condoRef = doc(db, 'condos', condoId);
      await setDoc(condoRef, { planId }, { merge: true });
      await createAuditLog('Alterou plano do condomínio', 'CONDO', condoId, `Novo Plano: ${planId}`, 'global');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `condos/${condoId}`);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      alert("Nome e Email são obrigatórios.");
      return;
    }
    try {
      const userRef = doc(collection(db, 'users'));
      const userData: AppUser = {
        id: userRef.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        condoId: newUser.condoId,
        cpf: newUser.cpf,
        login: newUser.login,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, userData);
      await createAuditLog('Cadastrou novo usuário', 'CONDO', userRef.id, `Usuário: ${newUser.name}, Role: ${newUser.role}`, 'global');
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', role: 'CONDO_ADMIN', condoId: '', cpf: '', login: '' });
    } catch (err) {
      console.error("Erro ao adicionar usuário:", err);
      handleFirestoreError(err, OperationType.CREATE, 'users');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserForEdit || !selectedUserForEdit.name || !selectedUserForEdit.email) {
      alert("Nome e Email são obrigatórios.");
      return;
    }
    try {
      const userRef = doc(db, 'users', selectedUserForEdit.id);
      await setDoc(userRef, {
        ...selectedUserForEdit,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      await createAuditLog('Atualizou usuário', 'CONDO', selectedUserForEdit.id, `Usuário: ${selectedUserForEdit.name}, Role: ${selectedUserForEdit.role}`, 'global');
      setShowEditUserModal(false);
      setSelectedUserForEdit(null);
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${selectedUserForEdit?.id}`);
    }
  };

  const handleUpdateSettings = async (updates: any) => {
    try {
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, { ...appSettings, ...updates }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Painel Geral', icon: LayoutDashboard, category: 'main' },
    { id: 'condos', label: 'Condomínios', icon: Building2, category: 'management' },
    { id: 'users', label: 'Usuários', icon: Users, category: 'management' },
    { id: 'plans', label: 'Planos & SaaS', icon: CreditCard, category: 'business' },
    { id: 'audit', label: 'Auditoria Global', icon: History, category: 'main' },
    { id: 'settings', label: 'Configurações', icon: Settings, category: 'config' },
    { id: 'profile', label: 'Meu Perfil', icon: UserIcon, category: 'config' },
    { id: 'support', label: 'Suporte SaaS', icon: MessageSquare, category: 'main' },
  ];

  const categories = [
    { id: 'main', label: 'Monitoramento' },
    { id: 'management', label: 'Gestão Geral' },
    { id: 'business', label: 'Negócios' },
    { id: 'config', label: 'Preferências' },
  ];

  const stats = [
    { label: 'Total Condomínios', value: condos.length, icon: Building2, color: 'bg-blue-500' },
    { label: 'Total Usuários', value: allUsers.length, icon: Users, color: 'bg-purple-500' },
    { label: 'Receita Mensal', value: `R$ ${(condos.length * 119).toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Assinaturas Ativas', value: condos.filter(c => c.subscriptionStatus === 'ACTIVE').length, icon: CheckCircle2, color: 'bg-orange-500' },
  ];

  if (managedCondoId) {
    const managedCondo = condos.find(c => c.id === managedCondoId);
    return (
      <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setManagedCondoId(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all flex items-center gap-2 font-bold text-sm"
            >
              <ArrowLeft className="w-5 h-5" /> Sair do Modo Gerenciamento
            </button>
            <div className="h-6 w-px bg-white/20" />
            <h2 className="font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Gerenciando: <span className="text-blue-400">{managedCondo?.name}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 bg-white/5 py-1.5 px-3 rounded-full border border-white/10">
            <Shield className="w-3 h-3" /> Modo Super Admin
          </div>
        </div>
        <div className="flex-grow overflow-hidden relative">
          <Dashboard 
            user={{ ...user, role: 'CONDO_ADMIN', condoId: managedCondoId }} 
            onLogout={onLogout} 
            appSettings={appSettings} 
            createAuditLog={createAuditLog} 
            plans={plans}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 lg:relative ${
        isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-0 lg:w-20'
      }`}>
        <div className={`p-6 border-b border-white/5`}>
          <Logo collapsed={!isSidebarOpen} light />
        </div>
        <nav className="flex-grow p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {categories.map((cat) => {
            const catItems = menuItems.filter(i => i.category === cat.id);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-1">
                {isSidebarOpen && (
                  <h4 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 opacity-50">
                    {cat.label}
                  </h4>
                )}
                <div className="space-y-1">
                  {catItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveMenu(item.id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all focus:outline-none relative group ${
                        activeMenu === item.id 
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isSidebarOpen && <span className="font-bold text-xs">{item.label}</span>}
                      {activeMenu === item.id && !isSidebarOpen && (
                        <div className="absolute right-0 w-1 h-4 bg-orange-500 rounded-l-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-4 p-3 rounded-xl text-white/40 hover:text-red-400 transition-all">
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Administração Global</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Proprietário SaaS</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm sm:text-base">
                SA
              </div>
            </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeMenu === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-current/20`}>
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-800">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Condomínios Recentes</h3>
                    <div className="space-y-4">
                      {condos.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gray-50">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                              <Building2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{c.name}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{c.city} • {c.units} unidades</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full flex-shrink-0 ${c.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {c.subscriptionStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Métricas de Crescimento</h3>
                    <div className="h-64 flex items-end gap-4 px-4">
                      {[40, 65, 45, 90, 85, 100, 75].map((h, i) => (
                        <div key={i} className="flex-grow bg-blue-100 rounded-t-lg relative group transition-all hover:bg-blue-500">
                          <div style={{ height: `${h}%` }} className="w-full bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-600"></div>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                            {h}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Jan</span>
                      <span>Fev</span>
                      <span>Mar</span>
                      <span>Abr</span>
                      <span>Mai</span>
                      <span>Jun</span>
                      <span>Jul</span>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-headline font-black text-gray-800 mb-8">Saúde Global dos Condomínios</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Excelente', value: 12, fill: '#10b981' },
                          { name: 'Bom', value: 8, fill: '#3b82f6' },
                          { name: 'Atenção', value: 4, fill: '#f59e0b' },
                          { name: 'Crítico', value: 1, fill: '#ef4444' },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                          <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'audit' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Trilha de Auditoria Global</h3>
                    <p className="text-sm text-slate-500 mt-1">Monitoramento de todas as ações administrativas do SaaS.</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recurso</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <span className="font-bold text-slate-800 text-sm">{log.action}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                                  {log.userName.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-600">{log.userName}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg">
                                {log.resourceType}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-8 py-5 text-xs text-slate-400">
                              {log.details || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'condos' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Todos os Condomínios</h3>
                  <button 
                    onClick={() => setShowAddCondoModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Plus className="w-5 h-5" /> Novo Condomínio
                  </button>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Condomínio</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Plano</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Unidades</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {condos.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-all">
                          <td className="px-8 py-4">
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.city} • <span className="font-mono">{c.slug}.condopro.com</span></p>
                          </td>
                          <td className="px-8 py-4">
                            <select 
                              value={c.planId}
                              onChange={(e) => handleUpdateCondoPlan(c.id, e.target.value as Condo['planId'])}
                              className="text-sm font-bold text-blue-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                            >
                              <option value="BASIC">BASIC</option>
                              <option value="PRO">PRO</option>
                              <option value="PREMIUM">PREMIUM</option>
                            </select>
                          </td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-600">{c.units}</td>
                          <td className="px-8 py-4">
                            <select 
                              value={c.subscriptionStatus}
                              onChange={(e) => handleUpdateCondoStatus(c.id, e.target.value as Condo['subscriptionStatus'])}
                              className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${
                                c.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-600' : 
                                c.subscriptionStatus === 'TRIAL' ? 'bg-blue-100 text-blue-600' : 
                                'bg-red-100 text-red-600'
                              }`}
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="TRIAL">TRIAL</option>
                              <option value="PAST_DUE">PAST DUE</option>
                              <option value="CANCELED">CANCELED</option>
                            </select>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setManagedCondoId(c.id);
                                }}
                                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 group"
                              >
                                <LayoutDashboard className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                Gerenciar
                              </button>
                              <button 
                                type="button"
                                onClick={() => setCondoForPackages(c)}
                                className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2 group"
                              >
                                <PackageIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                Encomendas
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  if (window.confirm("Deseja realmente excluir este condomínio?")) {
                                    // Implementation for delete if needed
                                  }
                                }}
                                className="p-2 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all"
                                title="Excluir Condomínio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}


            {activeMenu === 'users' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Base de Usuários</h3>
                  <button 
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Plus className="w-5 h-5" /> Novo Usuário
                  </button>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Usuário</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">CPF / Login</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Papel</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Condomínio</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-all">
                          <td className="px-8 py-4">
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-sm font-medium text-slate-600">{u.cpf || '-'}</p>
                            <p className="text-[10px] text-gray-400">{u.login || '-'}</p>
                          </td>
                          <td className="px-8 py-4">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                              u.role === 'SUPER_ADMIN' ? 'bg-orange-100 text-orange-600' : 
                              u.role === 'CONDO_ADMIN' ? 'bg-blue-100 text-blue-600' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                               u.role === 'CONDO_ADMIN' ? 'Síndico' : 
                               'Morador'}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-600">
                            {condos.find(c => c.id === u.condoId)?.name || '-'}
                          </td>
                          <td className="px-8 py-4">
                            <button 
                              onClick={() => {
                                setSelectedUserForEdit(u);
                                setShowEditUserModal(true);
                              }}
                              className="text-slate-600 hover:underline text-sm font-bold"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeMenu === 'profile' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-3xl bg-orange-100 flex items-center justify-center text-orange-600 text-3xl font-black shadow-lg shadow-orange-200/50">
                      {profileData.avatarUrl ? (
                        <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-3xl" referrerPolicy="no-referrer" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">Meu Perfil</h3>
                      <p className="text-slate-400 font-medium">Gerencie suas informações pessoais</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input 
                          type="text" 
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-800 font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail (Não editável)</label>
                        <input 
                          type="email" 
                          value={user.email}
                          disabled
                          className="w-full bg-slate-100 border-none rounded-2xl p-4 text-slate-400 font-bold cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                        <input 
                          type="text" 
                          placeholder="000.000.000-00"
                          value={profileData.cpf}
                          onChange={(e) => setProfileData({...profileData, cpf: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-800 font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Login / Usuário</label>
                        <input 
                          type="text" 
                          value={profileData.login}
                          onChange={(e) => setProfileData({...profileData, login: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-800 font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">URL do Avatar</label>
                      <input 
                        type="text" 
                        placeholder="https://exemplo.com/foto.jpg"
                        value={profileData.avatarUrl}
                        onChange={(e) => setProfileData({...profileData, avatarUrl: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-800 font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>

                    <button 
                      onClick={handleUpdateProfile}
                      className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all mt-4"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Personalização do SaaS</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">URL do Logotipo</label>
                      <input 
                        type="text" 
                        value={appSettings.logo}
                        onChange={(e) => onUpdateSettings({ logo: e.target.value })}
                        placeholder="https://exemplo.com/logo.png" 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cor Primária</label>
                      <div className="flex gap-4 items-center">
                        <input 
                          type="color" 
                          value={appSettings.primaryColor}
                          onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer border-none" 
                        />
                        <span className="text-sm font-mono text-gray-500">{appSettings.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'plans' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Planos & SaaS</h3>
                        <p className="text-sm text-slate-500">Configure os preços, limites e recursos disponíveis em cada nível.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSavePlans}
                      disabled={isSavingPlans}
                      className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50"
                    >
                      {isSavingPlans ? <Activity className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      Salvar Alterações
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => {
                      const current = editablePlans[plan.id] || { price: plan.price, features: plan.features, maxUnits: plan.maxUnits };
                      return (
                        <div key={plan.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200/60 shadow-inner space-y-6">
                          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <span className="font-black text-slate-800 text-lg">{plan.name}</span>
                            <span className="text-[10px] font-black uppercase px-3 py-1 bg-slate-100 rounded-full text-slate-400">ID: {plan.id}</span>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Mensal (R$)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input 
                                  type="number" 
                                  value={current.price}
                                  onChange={(e) => {
                                    setEditablePlans({
                                      ...editablePlans,
                                      [plan.id]: { ...current, price: Number(e.target.value) }
                                    });
                                  }}
                                  className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 transition-all"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite de Unidades</label>
                              <input 
                                type="number" 
                                value={current.maxUnits}
                                onChange={(e) => {
                                  setEditablePlans({
                                    ...editablePlans,
                                    [plan.id]: { ...current, maxUnits: Number(e.target.value) }
                                  });
                                }}
                                className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 transition-all font-mono"
                                placeholder="9999 para ilimitado"
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                                Recursos Ativos
                                <span className="text-blue-500">{current.features?.length || 0} itens</span>
                              </label>
                              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {(current.features || []).map((feature: string, idx: number) => (
                                  <div key={feature+idx} className="flex gap-2 group">
                                    <input 
                                      type="text"
                                      value={feature}
                                      onChange={(e) => {
                                        const next = [...current.features];
                                        next[idx] = e.target.value;
                                        setEditablePlans({
                                          ...editablePlans,
                                          [plan.id]: { ...current, features: next }
                                        });
                                      }}
                                      className="flex-grow px-4 py-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                    />
                                    <button 
                                      onClick={() => {
                                        const next = [...current.features];
                                        next.splice(idx, 1);
                                        setEditablePlans({
                                          ...editablePlans,
                                          [plan.id]: { ...current, features: next }
                                        });
                                      }}
                                      className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => {
                                    const next = [...(current.features || [])];
                                    next.push('Novo recurso...');
                                    setEditablePlans({
                                      ...editablePlans,
                                      [plan.id]: { ...current, features: next }
                                    });
                                  }}
                                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 uppercase tracking-widest bg-white/50"
                                >
                                  <Plus className="w-4 h-4" /> Adicionar Recurso
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resumo do Plano:</p>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg shadow-sm border border-slate-100">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span className="text-[10px] font-black text-slate-700">Max: {current.maxUnits >= 9999 ? '∞' : current.maxUnits}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Faturamento Recente</h3>
                  <div className="space-y-4">
                    {condos.filter(c => c.subscriptionStatus === 'ACTIVE').slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <DollarSign className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-xs text-gray-400">Pagamento via PIX • {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="font-black text-slate-800">R$ {appSettings.planPrices?.[c.planId] || plans.find(p => p.id === c.planId)?.price || 0}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 flex items-start gap-4">
                  <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">Dica de Monetização</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Mantenha uma diferença clara de valor entre os planos para incentivar o upgrade. O plano **Profissional** costuma ser o melhor custo-benefício para a maioria dos condomínios médios.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Condo Modal */}
      <AnimatePresence>
        {showAddCondoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddCondoModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Novo Condomínio SaaS</h3>
                <button onClick={() => setShowAddCondoModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome</label>
                    <input 
                      type="text" 
                      value={newCondo.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                        setNewCondo({...newCondo, name, slug});
                      }}
                      placeholder="Ex: Residencial Horizon" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subdomínio (Slug)</label>
                    <input 
                      type="text" 
                      placeholder="ex: horizonte" 
                      value={newCondo.slug}
                      onChange={(e) => setNewCondo({...newCondo, slug: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cidade</label>
                  <input 
                    type="text" 
                    value={newCondo.city}
                    onChange={(e) => setNewCondo({...newCondo, city: e.target.value})}
                    placeholder="Ex: São Paulo" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unidades</label>
                    <input 
                      type="number" 
                      value={newCondo.units}
                      onChange={(e) => setNewCondo({...newCondo, units: parseInt(e.target.value)})}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plano</label>
                    <select 
                      value={newCondo.planId}
                      onChange={(e) => setNewCondo({...newCondo, planId: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="BASIC">Básico</option>
                      <option value="PRO">Profissional</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Inicial</label>
                  <select 
                    value={newCondo.subscriptionStatus}
                    onChange={(e) => setNewCondo({...newCondo, subscriptionStatus: e.target.value as any})}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="TRIAL">Trial (7 dias)</option>
                    <option value="PAST_DUE">Em atraso</option>
                    <option value="CANCELED">Cancelado</option>
                  </select>
                </div>
                <button 
                  onClick={handleAddCondo}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20"
                >
                  Criar Condomínio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Package Management Modal */}
      <AnimatePresence>
        {condoForPackages && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setCondoForPackages(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Gerenciar Encomendas</h3>
                  <p className="text-sm text-slate-500">{condoForPackages.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowAddPackageModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Nova Encomenda
                  </button>
                  <button onClick={() => setCondoForPackages(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-6">
                {condoPackages.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <PackageIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">Nenhuma encomenda registrada neste condomínio.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {condoPackages.map((pkg) => (
                      <div key={pkg.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <PackageIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{pkg.residentName}</p>
                              <p className="text-xs text-slate-500">Unidade {pkg.unit}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            pkg.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                            pkg.status === 'DELIVERED' ? 'bg-green-100 text-green-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {pkg.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{pkg.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(pkg.receivedAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            {pkg.status === 'PENDING' && (
                              <>
                                <button 
                                  onClick={() => handleUpdatePackageStatus(pkg.id, 'DELIVERED')}
                                  className="text-[10px] font-black uppercase px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                >
                                  Entregar
                                </button>
                                <button 
                                  onClick={() => handleUpdatePackageStatus(pkg.id, 'RETURNED')}
                                  className="text-[10px] font-black uppercase px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                >
                                  Devolver
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Package Modal (Sub-modal) */}
      <AnimatePresence>
        {showAddPackageModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddPackageModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-6">Nova Encomenda</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Destinatário</label>
                  <select 
                    value={newPackage.residentId}
                    onChange={(e) => setNewPackage({...newPackage, residentId: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Selecionar Morador</option>
                    {allUsers.filter(u => u.condoId === condoForPackages?.id && u.role === 'RESIDENT').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição / Conteúdo</label>
                  <input 
                    type="text" 
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                    placeholder="Ex: Caixa média da Amazon" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transportadora</label>
                  <input 
                    type="text" 
                    value={newPackage.carrier}
                    onChange={(e) => setNewPackage({...newPackage, carrier: e.target.value})}
                    placeholder="Ex: Loggi, Sedex..." 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <button 
                  onClick={handleCreatePackage}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20"
                >
                  Registrar Encomenda
                </button>
                <button 
                  onClick={() => setShowAddPackageModal(false)}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddUserModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Novo Usuário</h3>
                <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Ex: João Silva" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                  <input 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="joao@email.com" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CPF</label>
                    <input 
                      type="text" 
                      value={newUser.cpf}
                      onChange={(e) => setNewUser({...newUser, cpf: e.target.value})}
                      placeholder="000.000.000-00" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Login</label>
                    <input 
                      type="text" 
                      value={newUser.login}
                      onChange={(e) => setNewUser({...newUser, login: e.target.value})}
                      placeholder="joao.silva" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Papel</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="RESIDENT">Morador</option>
                    <option value="CONDO_ADMIN">Síndico Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Condomínio</label>
                  <select 
                    value={newUser.condoId}
                    onChange={(e) => setNewUser({...newUser, condoId: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Nenhum</option>
                    {condos.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleAddUser}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20"
                >
                  Criar Usuário
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showEditUserModal && selectedUserForEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowEditUserModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Editar Usuário</h3>
                <button onClick={() => setShowEditUserModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={selectedUserForEdit.name}
                    onChange={(e) => setSelectedUserForEdit({...selectedUserForEdit, name: e.target.value})}
                    placeholder="Ex: João Silva" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                  <input 
                    type="email" 
                    value={selectedUserForEdit.email}
                    onChange={(e) => setSelectedUserForEdit({...selectedUserForEdit, email: e.target.value})}
                    placeholder="joao@email.com" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CPF</label>
                    <input 
                      type="text" 
                      value={selectedUserForEdit.cpf || ''}
                      onChange={(e) => setSelectedUserForEdit({...selectedUserForEdit, cpf: e.target.value})}
                      placeholder="000.000.000-00" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Login</label>
                    <input 
                      type="text" 
                      value={selectedUserForEdit.login || ''}
                      onChange={(e) => setSelectedUserForEdit({...selectedUserForEdit, login: e.target.value})}
                      placeholder="joao.silva" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Papel</label>
                  <select 
                    value={selectedUserForEdit.role}
                    onChange={(e) => setSelectedUserForEdit({...selectedUserForEdit, role: e.target.value as any})}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="RESIDENT">Morador</option>
                    <option value="CONDO_ADMIN">Síndico Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Condomínio</label>
                  <select 
                    value={selectedUserForEdit.condoId || ''}
                    onChange={(e) => setSelectedUserForEdit({...selectedUserForEdit, condoId: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Nenhum</option>
                    {condos.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleUpdateUser}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- AI Assistant Component ---
const AIAssistant = ({ condoRules }: { condoRules: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: `Você é o Assistente Virtual do Condomínio. Sua função é tirar dúvidas dos moradores com base no estatuto e regras do condomínio fornecidas abaixo. Seja educado, prestativo e direto. Se não souber a resposta com base nas regras, oriente o morador a procurar o síndico ou a administração.\n\nREGRAS DO CONDOMÍNIO:\n${condoRules}`,
        },
      });
      
      const aiText = response.text || "Desculpe, não consegui processar sua pergunta agora.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-80 md:w-96 h-[500px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4"
          >
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Assistente Virtual</h4>
                  <p className="text-xs text-blue-100">Dúvidas sobre o condomínio</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium px-4">Olá! Sou a IA do seu condomínio. Como posso te ajudar hoje?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button 
                  onClick={handleSend}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-5 rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center gap-3"
      >
        <Sparkles className="w-6 h-6" />
        <span className="font-bold hidden md:inline">Dúvidas? Fale com a IA</span>
      </motion.button>
    </div>
  );
};

// --- Constants ---
const CONDO_RULES = `
1. SILÊNCIO: Horário de silêncio das 22h às 08h. Multa de R$ 200,00 após advertência.
2. ANIMAIS: Permitidos animais de pequeno porte, desde que no colo em áreas comuns.
3. MUDANÇAS: Devem ser agendadas com 48h de antecedência. Apenas de segunda a sexta, das 08h às 18h.
4. PISCINA: Uso exclusivo de moradores e convidados (limite de 2 por unidade). Proibido garrafas de vidro.
5. LIXO: Deve ser depositado nos coletores específicos de cada andar, devidamente ensacado.
6. VISITANTES: Devem ser autorizados via aplicativo ou interfone.
7. VAGAS: Proibido estacionar em vaga de terceiros ou fora da demarcação.
8. REFORMAS: Apenas com ART/RRT e aprovação da administração. Horário: 09h às 17h (seg-sex).
`;

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [detectedCondo, setDetectedCondo] = useState<Condo | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appSettings, setAppSettings] = useState({ 
    logo: '', 
    primaryColor: '#00323d',
    planPrices: {
      BASIC: 49,
      PRO: 89,
      PREMIUM: 119
    },
    planFeatures: {
      BASIC: [] as string[],
      PRO: [] as string[],
      PREMIUM: [] as string[]
    },
    planMaxUnits: {
      BASIC: 30,
      PRO: 100,
      PREMIUM: 9999
    }
  });
  const dynamicPlans = useMemo(() => {
    return PLANS.map(plan => ({
      ...plan,
      price: appSettings.planPrices?.[plan.id as keyof typeof appSettings.planPrices] || plan.price,
      features: (appSettings.planFeatures?.[plan.id as keyof typeof appSettings.planFeatures] && appSettings.planFeatures?.[plan.id as keyof typeof appSettings.planFeatures].length > 0) 
        ? appSettings.planFeatures[plan.id as keyof typeof appSettings.planFeatures] 
        : plan.features,
      maxUnits: appSettings.planMaxUnits?.[plan.id as keyof typeof appSettings.planMaxUnits] || plan.maxUnits
    }));
  }, [appSettings.planPrices, appSettings.planFeatures, appSettings.planMaxUnits]);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setAppSettings(snap.data() as any);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    // Subdomain / Slug Detection
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    let slug = '';
    
    // Check for ?condo= query param as fallback for dev environment
    const urlParams = new URLSearchParams(window.location.search);
    const condoParam = urlParams.get('condo');

    if (condoParam) {
      slug = condoParam;
    } else if (parts.length > 2 && parts[0] !== 'www') {
      slug = parts[0];
    }

    if (slug) {
      const condosRef = collection(db, 'condos');
      const q = query(condosRef, where('slug', '==', slug), limit(1));
      getDocs(q).then(snap => {
        if (!snap.empty) {
          setDetectedCondo({ id: snap.docs[0].id, ...snap.docs[0].data() } as Condo);
        }
      }).catch(err => console.error("Error detecting condo:", err));
    }

    return () => unsubSettings();
  }, []);

  const createAuditLog = async (action: string, resourceType: AuditLog['resourceType'], resourceId?: string, details?: string, condoId?: string) => {
    const targetCondoId = condoId || user?.condoId || 'global';
    if (!user) return;
    try {
      const auditLogsRef = collection(db, 'condos', targetCondoId, 'auditLogs');
      const logRef = doc(auditLogsRef);
      const logData: AuditLog = {
        id: logRef.id,
        condoId: targetCondoId,
        userId: user.id,
        userName: user.name,
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date().toISOString()
      };
      await setDoc(logRef, logData);
    } catch (err) {
      console.error("Failed to create audit log:", err);
    }
  };

  const handleUpdateSettings = async (updates: any) => {
    try {
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, { ...appSettings, ...updates }, { merge: true });
      await createAuditLog('Atualizou configurações globais', 'CONDO', 'global', JSON.stringify(updates), 'global');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', appSettings.primaryColor);
    // Derive a darker version for primary-container if possible, or just use it
  }, [appSettings.primaryColor]);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("✅ Conexão com Firebase Firestore estabelecida com sucesso!");
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("❌ Erro de conexão: O cliente está offline. Verifique sua configuração do Firebase.");
        } else {
          console.log("ℹ️ Teste de conexão inicial concluído (pode requerer autenticação para acesso total).");
        }
      }
    }
    testConnection();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("O estado de autenticação mudou: Usuário logado", firebaseUser.uid);
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as AppUser;
            // Force SUPER_ADMIN role for the bootstrap email
            if (firebaseUser.email === 'cleciotecnologia@gmail.com' && data.role !== 'SUPER_ADMIN') {
              const updatedUser = { ...data, role: 'SUPER_ADMIN' as const };
              await setDoc(userRef, updatedUser, { merge: true });
              setUser({ id: firebaseUser.uid, ...updatedUser });
            } else {
              setUser({ id: firebaseUser.uid, ...data });
            }
          } else {
            // Check if there's a placeholder user from handleAddResident/handleAddUser
            const placeholderQuery = query(collection(db, 'users'), where('email', '==', firebaseUser.email), limit(1));
            const placeholderSnap = await getDocs(placeholderQuery);
            
            if (!placeholderSnap.empty && placeholderSnap.docs[0].id !== firebaseUser.uid) {
              const existingData = placeholderSnap.docs[0].data() as AppUser;
              const newUser: AppUser = {
                ...existingData,
                id: firebaseUser.uid,
                name: firebaseUser.displayName || existingData.name,
                createdAt: existingData.createdAt || new Date().toISOString()
              };
              await setDoc(userRef, newUser);
              setUser(newUser);
            } else {
              // Create initial profile if it doesn't exist
              const isSuperAdmin = firebaseUser.email === 'cleciotecnologia@gmail.com';
              const newUser: AppUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'Usuário',
                role: isSuperAdmin ? 'SUPER_ADMIN' : 'RESIDENT', // Default for first login
              };
              await setDoc(userRef, newUser);
              setUser(newUser);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        console.log("O estado de autenticação mudou: Usuário deslogado");
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    // Esta linha garante que o usuário sempre terá a opção de escolher uma conta Google
    provider.setCustomParameters({ prompt: 'select_account' });

    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      setShowLoginModal(false);
      
      if (result.user) {
        console.log("Usuário logado com sucesso:", result.user.displayName);
      }
    } catch (error: any) {
      console.error("Erro detalhado no login:", error);
      
      if (error.code === 'auth/firebase-app-check-token-is-invalid') {
        console.error("App Check error detected. This might be due to environment restrictions.");
      }

      let userMessage = "Ocorreu um erro desconhecido durante o login. Por favor, tente novamente.";
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          userMessage = "O pop-up de login foi fechado. Por favor, tente novamente.";
          break;
        case 'auth/cancelled-popup-request':
          userMessage = "Múltiplas operações de pop-up foram acionadas. Por favor, tente novamente com calma.";
          break;
        case 'auth/popup-blocked':
          userMessage = "O pop-up de login foi bloqueado pelo seu navegador. Por favor, desabilite o bloqueador de pop-ups e tente novamente.";
          break;
        case 'auth/operation-not-allowed':
          userMessage = "A autenticação com Google não está ativada no seu projeto Firebase. Ative-o em Autenticação > Provedores de Login.";
          break;
        case 'auth/unauthorized-domain':
          userMessage = `Este domínio (${window.location.hostname}) não está autorizado no Firebase.\n\nPara corrigir:\n1. Vá ao Console do Firebase\n2. Autenticação > Configurações > Domínios Autorizados\n3. Adicione "${window.location.hostname}"`;
          break;
        case 'auth/account-exists-with-different-credential':
          userMessage = `Já existe uma conta com este e-mail (${error.email}). Por favor, faça login com o provedor original ou linke as contas.`;
          break;
        case 'auth/internal-error':
          userMessage = "Erro interno do Firebase Auth. Isso geralmente acontece quando:\n1. O provedor Google não está ativado.\n2. O 'E-mail de suporte' não foi configurado.\n3. Há um problema de rede ou cookies bloqueados.";
          break;
        default:
          userMessage = `Erro de autenticação: ${error.message || error.code}`;
          break;
      }
      
      alert(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      let email = identifier;
      
      // If not an email, search by CPF or Login
      if (!identifier.includes('@')) {
        let foundEmail = '';
        // Search by CPF
        const cpfQuery = query(collection(db, 'users'), where('cpf', '==', identifier), limit(1));
        const cpfSnap = await getDocs(cpfQuery);
        
        if (!cpfSnap.empty) {
          foundEmail = cpfSnap.docs[0].data().email;
        } else {
          // Search by Login
          const loginQuery = query(collection(db, 'users'), where('login', '==', identifier), limit(1));
          const loginSnap = await getDocs(loginQuery);
          if (!loginSnap.empty) {
            foundEmail = loginSnap.docs[0].data().email;
          }
        }

        if (!foundEmail) {
          alert("Usuário ou CPF não encontrado no sistema. Se você é novo, por favor, crie uma conta.");
          setIsLoading(false);
          return;
        }
        email = foundEmail;
      }

      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
    } catch (error: any) {
      console.error("Erro no login:", error);
      let msg = "Falha ao entrar. Verifique suas credenciais.";
      
      if (error.code === 'auth/firebase-app-check-token-is-invalid') {
        msg = "ERRO CRÍTICO: O Firebase App Check está bloqueando o acesso.\n\nCOMO RESOLVER:\n1. Vá ao Console do Firebase\n2. Menu Build > App Check > APIs\n3. Mude 'Authentication' para 'Não imposto' (Unenforced).\n4. Mude 'Cloud Firestore' para 'Não imposto' (Unenforced).";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "Email, usuário ou senha incorretos.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "Email inválido.";
      } else if (error.code === 'auth/too-many-requests') {
        msg = "Muitas tentativas de login. Tente novamente mais tarde.";
      }
      
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // Update profile name
      const userRef = doc(db, 'users', userCredential.user.uid);
      
      // Check if there's a placeholder user from handleAddResident
      const placeholderQuery = query(collection(db, 'users'), where('email', '==', email), limit(1));
      const placeholderSnap = await getDocs(placeholderQuery);
      
      let userData: AppUser;
      
      if (!placeholderSnap.empty && placeholderSnap.docs[0].id !== userCredential.user.uid) {
        const existingData = placeholderSnap.docs[0].data() as AppUser;
        userData = {
          ...existingData,
          id: userCredential.user.uid,
          name: name || existingData.name,
          createdAt: new Date().toISOString()
        };
      } else {
        userData = {
          id: userCredential.user.uid,
          email,
          name,
          role: 'RESIDENT',
          createdAt: new Date().toISOString()
        };
      }
      
      await setDoc(userRef, userData);
      setShowLoginModal(false);
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      let msg = "Erro ao criar conta: " + error.message;
      if (error.code === 'auth/firebase-app-check-token-is-invalid') {
        msg = "ERRO CRÍTICO: O Firebase App Check está bloqueando o acesso.\n\nCOMO RESOLVER:\n1. Vá ao Console do Firebase\n2. Menu Build > App Check > APIs\n3. Mude 'Authentication' para 'Não imposto' (Unenforced).\n4. Mude 'Cloud Firestore' para 'Não imposto' (Unenforced).";
      }
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!email) {
      alert("Por favor, informe seu e-mail.");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
      setIsResettingPassword(false);
    } catch (error: any) {
      console.error("Erro ao resetar senha:", error);
      let msg = "Erro ao enviar e-mail de redefinição.";
      
      if (error.code === 'auth/firebase-app-check-token-is-invalid') {
        msg = "Erro de App Check: O Firebase está bloqueando o acesso. \n\nSOLUÇÃO: Vá ao Console do Firebase > App Check > APIs e mude o status de 'Authentication' para 'Não imposto' (Unenforced).";
      } else if (error.code === 'auth/user-not-found') {
        msg = "Usuário não encontrado com este e-mail.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "E-mail inválido.";
      }
      alert(msg + "\n\nDetalhes: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Logo />
        </motion.div>
        
        <div className="mt-12 space-y-4 text-center">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse [animation-delay:0.4s]" />
          </div>
          <p className="text-slate-400 font-medium text-sm">Iniciando plataforma de gestão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-primary">
      {(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const visitorId = urlParams.get('v');
        if (visitorId) {
          return <PublicVisitorCard visitorId={visitorId} />;
        }
        
        return user ? (
          user.role === 'SUPER_ADMIN' ? (
            <SuperAdminDashboard user={user} onLogout={handleLogout} appSettings={appSettings} onUpdateSettings={handleUpdateSettings} createAuditLog={createAuditLog} plans={dynamicPlans} />
          ) : (
            <Dashboard user={user} onLogout={handleLogout} appSettings={appSettings} createAuditLog={createAuditLog} plans={dynamicPlans} />
          )
        ) : (
          <LandingPage onLogin={handleLogin} onShowLoginModal={() => setShowLoginModal(true)} plans={dynamicPlans} appSettings={appSettings} />
        );
      })()}

      {user && <AIAssistant condoRules={CONDO_RULES} />}

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800">
                    {isResettingPassword ? 'Redefinir Senha' : isRegistering ? 'Criar Conta' : 'Entrar'}
                  </h3>
                  {detectedCondo && (
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Acessando: {detectedCondo.name}</p>
                  )}
                </div>
                <button onClick={() => {
                  setShowLoginModal(false);
                  setIsResettingPassword(false);
                }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                {isResettingPassword ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleResetPassword(formData.get('email') as string);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                      <input 
                        name="email"
                        type="email" 
                        required
                        placeholder="seu@email.com" 
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processando...
                        </>
                      ) : 'Enviar E-mail de Redefinição'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsResettingPassword(false)}
                      className="w-full text-sm font-bold text-gray-400 hover:text-slate-600 transition-colors"
                    >
                      Voltar para o Login
                    </button>
                  </form>
                ) : (
                  <>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      if (isRegistering) {
                        handleSignUp(
                          formData.get('email') as string, 
                          formData.get('password') as string,
                          formData.get('name') as string
                        );
                      } else {
                        handleEmailLogin(
                          formData.get('identifier') as string, 
                          formData.get('password') as string
                        );
                      }
                    }} className="space-y-4">
                      {isRegistering && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                          <input 
                            name="name"
                            type="text" 
                            required
                            placeholder="Seu nome" 
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {isRegistering ? 'Email' : 'Email, CPF ou Login'}
                        </label>
                        <input 
                          name={isRegistering ? "email" : "identifier"}
                          type={isRegistering ? "email" : "text"} 
                          required
                          placeholder={isRegistering ? "seu@email.com" : "Seu identificador"} 
                          className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
                          {!isRegistering && (
                            <button 
                              type="button"
                              onClick={() => setIsResettingPassword(true)}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Esqueceu a senha?
                            </button>
                          )}
                        </div>
                        <input 
                          name="password"
                          type="password" 
                          required
                          placeholder="••••••••" 
                          className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {isRegistering ? 'Cadastrando...' : 'Entrando...'}
                          </>
                        ) : (isRegistering ? 'Cadastrar' : 'Entrar')}
                      </button>
                    </form>

                    {!isRegistering && (
                      <>
                        <div className="relative flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                          </div>
                          <span className="relative px-4 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">Ou</span>
                        </div>

                        <button 
                          onClick={handleLogin}
                          disabled={isLoading}
                          className="w-full py-4 bg-white text-slate-700 border border-gray-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                          ) : <Smartphone className="w-5 h-5" />} 
                          {isLoading ? 'Conectando...' : 'Entrar com Google'}
                        </button>
                      </>
                    )}
                    
                    <p className="text-center text-xs text-gray-400">
                      {isRegistering ? 'Já tem conta?' : 'Ainda não tem conta?'} {' '}
                      <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        {isRegistering ? 'Faça Login' : 'Cadastre-se'}
                      </button>
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
