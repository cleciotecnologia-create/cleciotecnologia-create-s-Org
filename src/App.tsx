import { useState, useMemo, useEffect } from 'react';
import { 
  Bell, Plus, MapPin, Users, AlertTriangle, Sparkles, Shield, Building2, 
  Home, Map as MapIcon, Copyright, Search, SlidersHorizontal, Star, 
  DollarSign, Filter, CheckCircle2, ChevronRight, LayoutDashboard, 
  MessageSquare, Calendar, CreditCard, LogOut, Menu, X, UserPlus,
  ArrowRight, Smartphone, BarChart3, Settings, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { User as AppUser, Condo, Resident, Occurrence, Reservation, PLANS, Plan } from './types';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
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
  getDocFromServer
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
  address: 'Av. das Nações Unidas, 12901',
  city: 'São Paulo',
  units: 248,
  planId: 'PRO',
  subscriptionStatus: 'ACTIVE',
  adminId: 'u1',
  createdAt: '2024-01-15'
};

const MOCK_RESIDENTS: Resident[] = [
  { id: 'r1', condoId: 'c1', name: 'Ana Silva', unit: '101A', email: 'ana@email.com', phone: '(11) 98888-7777', status: 'ACTIVE' },
  { id: 'r2', condoId: 'c1', name: 'Bruno Santos', unit: '202B', email: 'bruno@email.com', phone: '(11) 97777-6666', status: 'ACTIVE' },
  { id: 'r3', condoId: 'c1', name: 'Carla Dias', unit: '303C', email: 'carla@email.com', phone: '(11) 96666-5555', status: 'INACTIVE' },
];

const MOCK_OCCURRENCES: Occurrence[] = [
  { id: 'o1', condoId: 'c1', residentId: 'r1', title: 'Vazamento no 10º andar', description: 'Infiltração vindo do teto do corredor.', status: 'OPEN', createdAt: '2024-04-10' },
  { id: 'o2', condoId: 'c1', residentId: 'r2', title: 'Barulho excessivo', description: 'Festa após as 22h no apto 202.', status: 'RESOLVED', createdAt: '2024-04-08' },
];

// --- Components ---

const LandingPage = ({ onLogin }: { onLogin: () => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-primary font-headline tracking-tight">CondoPro</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary">Recursos</a>
          <a href="#plans" className="text-sm font-medium text-gray-600 hover:text-primary">Planos</a>
          <button onClick={onLogin} className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-all">
            <Smartphone className="w-4 h-4" /> Entrar com Google
          </button>
          <button onClick={onLogin} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
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
                <button onClick={onLogin} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3">
                  <Smartphone className="w-6 h-6" /> Entrar com Google
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
            <button onClick={onLogin} className="bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-3">
              <Smartphone className="w-6 h-6" /> Entrar com Google
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
            {PLANS.map((plan) => (
              <div key={plan.id} className={`p-10 rounded-[2.5rem] border-2 flex flex-col ${plan.id === 'PRO' ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/30 scale-105 z-10' : 'border-gray-100 bg-white text-primary'}`}>
                {plan.id === 'PRO' && <span className="bg-white text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-6">Mais Escolhido</span>}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black">R$ {plan.price}</span>
                  <span className={plan.id === 'PRO' ? 'text-white/60' : 'text-gray-400'}>/mês</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 className={`w-5 h-5 ${plan.id === 'PRO' ? 'text-white' : 'text-primary'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onLogin} className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.id === 'PRO' ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:opacity-90'}`}>
                  Selecionar Plano
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-20 px-6 text-white/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white font-headline">Gestão Condomínio Pro</span>
            </div>
            <p className="max-w-sm leading-relaxed">
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

const Dashboard = ({ user, onLogout }: { user: AppUser, onLogout: () => void }) => {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [selectedVisitorForQR, setSelectedVisitorForQR] = useState<any>(null);
  const [visitorRequests, setVisitorRequests] = useState([
    { id: 'req1', name: 'Marcos Oliveira', type: 'Prestador de Serviço', reason: 'Manutenção Ar Condicionado', time: '10:30' },
  ]);
  const [condo, setCondo] = useState<Condo | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

  useEffect(() => {
    if (!user.condoId) return;

    const condoRef = doc(db, 'condos', user.condoId);
    const unsubCondo = onSnapshot(condoRef, (docSnap) => {
      if (docSnap.exists()) {
        setCondo({ id: docSnap.id, ...docSnap.data() } as Condo);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `condos/${user.condoId}`));

    const residentsRef = collection(db, 'condos', user.condoId, 'residents');
    const unsubResidents = onSnapshot(residentsRef, (snap) => {
      setResidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/residents`));

    const occurrencesRef = collection(db, 'condos', user.condoId, 'occurrences');
    const unsubOccurrences = onSnapshot(occurrencesRef, (snap) => {
      setOccurrences(snap.docs.map(d => ({ id: d.id, ...d.data() } as Occurrence)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/occurrences`));

    return () => {
      unsubCondo();
      unsubResidents();
      unsubOccurrences();
    };
  }, [user.condoId]);

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'residents', label: 'Moradores', icon: Users },
    { id: 'occurrences', label: 'Ocorrências', icon: AlertTriangle },
    { id: 'reservations', label: 'Reservas', icon: Calendar },
    { id: 'concierge', label: 'Portaria Remota', icon: Shield },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const currentCondoName = condo?.name || MOCK_CONDO.name;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-500 ease-in-out flex flex-col relative z-50 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-3 border-b border-white/5">
          <div className="bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white flex-shrink-0" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-black text-xl font-headline tracking-tight"
            >
              CondoPro
            </motion.span>
          )}
        </div>
        
        <nav className="flex-grow p-4 space-y-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
                activeMenu === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110 ${activeMenu === item.id ? 'text-white' : 'text-slate-500'}`} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-bold text-sm"
                >
                  {item.label}
                </motion.span>
              )}
              {activeMenu === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </button>
          ))}
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
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-2xl w-80 border border-slate-200/50">
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
        <div className="flex-grow overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            {activeMenu === 'overview' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                className="space-y-10"
              >
                {/* Welcome Banner */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                  <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-headline font-extrabold mb-4 leading-tight">
                      Olá, {user.name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                      Bem-vindo ao painel do <span className="text-white font-bold">{currentCondoName}</span>. 
                      Tudo parece em ordem por aqui hoje.
                    </p>
                    <div className="flex gap-4">
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                        Novo Comunicado
                      </button>
                      <button className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10">
                        Ver Relatórios
                      </button>
                    </div>
                  </div>
                  <Sparkles className="absolute -right-10 -top-10 w-64 h-64 text-white/5 rotate-12" />
                  <Building2 className="absolute right-10 bottom-0 w-48 h-48 text-white/5" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Moradores', value: '742', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12 este mês' },
                    { label: 'Ocorrências', value: '08', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', trend: '3 urgentes' },
                    { label: 'Reservas Hoje', value: '12', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Salão ocupado' },
                    { label: 'Inadimplência', value: '4.2%', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50', trend: '-0.5% vs mês ant.' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 hover:shadow-md transition-all group">
                      <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-7 h-7" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                      <h3 className="text-3xl font-black text-slate-800 mb-2">{stat.value}</h3>
                      <p className={`text-[10px] font-bold ${stat.color}`}>{stat.trend}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Recent Activity */}
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200/60">
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-2xl font-headline font-extrabold text-slate-800">Últimas Ocorrências</h3>
                        <p className="text-sm text-slate-400 mt-1">Acompanhe o que está acontecendo agora.</p>
                      </div>
                      <button className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                        Ver todas
                      </button>
                    </div>
                    <div className="space-y-6">
                      {MOCK_OCCURRENCES.map((occ) => (
                        <div key={occ.id} className="flex items-center gap-6 p-6 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${occ.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{occ.title}</h4>
                            <p className="text-sm text-slate-500 line-clamp-1">{occ.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{occ.createdAt}</p>
                            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${occ.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {occ.status === 'OPEN' ? 'Pendente' : 'Resolvido'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200/60">
                    <h3 className="text-2xl font-headline font-extrabold text-slate-800 mb-10">Ações Rápidas</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: 'Novo Morador', icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
                        { label: 'Comunicado', icon: MessageSquare, color: 'bg-purple-50 text-purple-600' },
                        { label: 'Nova Reserva', icon: Calendar, color: 'bg-emerald-50 text-emerald-600' },
                        { label: 'Financeiro', icon: DollarSign, color: 'bg-rose-50 text-rose-600' },
                      ].map((action, i) => (
                        <button key={i} className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group relative overflow-hidden">
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
                  <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5" /> Novo Morador
                  </button>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Unidade</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contato</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {MOCK_RESIDENTS.map((res) => (
                        <tr key={res.id} className="hover:bg-gray-50 transition-all">
                          <td className="px-8 py-4 font-bold text-primary">{res.name}</td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-600">{res.unit}</td>
                          <td className="px-8 py-4">
                            <p className="text-sm text-gray-600">{res.email}</p>
                            <p className="text-xs text-gray-400">{res.phone}</p>
                          </td>
                          <td className="px-8 py-4">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${res.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {res.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                            </span>
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

            {activeMenu === 'subscription' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-8">
                <div className="bg-primary text-white rounded-[2.5rem] p-10 shadow-2xl shadow-primary/30 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">Plano Atual</p>
                    <h3 className="text-4xl font-black mb-6">Plano Profissional</h3>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                        <p className="text-[10px] font-bold uppercase text-white/60">Status</p>
                        <p className="font-bold">Ativo</p>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                        <p className="text-[10px] font-bold uppercase text-white/60">Próximo Vencimento</p>
                        <p className="font-bold">15/05/2024</p>
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
                  <h3 className="text-2xl font-bold text-primary">Gestão de Ocorrências</h3>
                  <div className="flex gap-2">
                    <button className="bg-white text-primary border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold">Filtrar</button>
                    <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
                      <Plus className="w-5 h-5" /> Nova Ocorrência
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {MOCK_OCCURRENCES.map((occ) => (
                    <div key={occ.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${occ.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-primary text-lg">{occ.title}</h4>
                          <p className="text-gray-500 text-sm mb-2">{occ.description}</p>
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Apto {MOCK_RESIDENTS.find(r => r.id === occ.residentId)?.unit}</span>
                            <span>•</span>
                            <span>{occ.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-primary focus:outline-none">
                          <option value="OPEN">Aberto</option>
                          <option value="IN_PROGRESS">Em Andamento</option>
                          <option value="RESOLVED">Resolvido</option>
                        </select>
                        <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
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
                      {[
                        { id: 'v1', name: 'João Pereira', type: 'Visitante', status: 'AUTHORIZED', validUntil: 'Hoje, 22:00' },
                        { id: 'v2', name: 'Carlos Entregas', type: 'Delivery', status: 'AUTHORIZED', validUntil: 'Hoje, 19:30' },
                      ].map((visitor, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-primary">{visitor.name}</p>
                              <p className="text-xs text-gray-400">{visitor.type} • Válido até {visitor.validUntil}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedVisitorForQR(visitor)}
                              className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                              title="Ver QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
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
                    <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                      Gerar QR Code de Acesso
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'finance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Receita Mensal</p>
                    <p className="text-3xl font-black text-primary">R$ 42.500,00</p>
                    <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 -rotate-45" /> +12% vs mês anterior
                    </p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Inadimplência</p>
                    <p className="text-3xl font-black text-red-500">R$ 1.840,00</p>
                    <p className="text-xs text-red-400 font-bold mt-2">4 moradores pendentes</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Fundo de Reserva</p>
                    <p className="text-3xl font-black text-green-600">R$ 128.400,00</p>
                    <p className="text-xs text-gray-400 font-bold mt-2">Meta: R$ 150k</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-primary">Fluxo de Caixa Recente</h3>
                    <button className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold">Exportar PDF</button>
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
                            <p className="font-bold text-primary">{item.desc}</p>
                            <p className="text-xs text-gray-400">{item.date}</p>
                          </div>
                        </div>
                        <span className={`font-black ${item.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                
                <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 transition-all">
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
              onClick={() => setShowVisitorModal(false)}
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
                <button onClick={() => setShowVisitorModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome do Visitante</label>
                  <input type="text" placeholder="Nome completo" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Acesso</label>
                  <select className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Visitante</option>
                    <option>Prestador de Serviço</option>
                    <option>Delivery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Validade</label>
                  <input type="datetime-local" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <button 
                  onClick={() => setShowVisitorModal(false)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-4 shadow-lg shadow-primary/20"
                >
                  Gerar Convite Digital
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SuperAdminDashboard = ({ user, onLogout }: { user: AppUser, onLogout: () => void }) => {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const condosRef = collection(db, 'condos');
    const unsubCondos = onSnapshot(condosRef, (snap) => {
      setCondos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Condo)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'condos'));

    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => {
      unsubCondos();
      unsubUsers();
    };
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'condos', label: 'Condomínios', icon: Building2 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'plans', label: 'Planos & SaaS', icon: CreditCard },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const stats = [
    { label: 'Total Condomínios', value: condos.length, icon: Building2, color: 'bg-blue-500' },
    { label: 'Total Usuários', value: allUsers.length, icon: Users, color: 'bg-purple-500' },
    { label: 'Receita Mensal', value: `R$ ${(condos.length * 119).toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Assinaturas Ativas', value: condos.filter(c => c.subscriptionStatus === 'ACTIVE').length, icon: CheckCircle2, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <Shield className="w-8 h-8 text-orange-400 flex-shrink-0" />
          {isSidebarOpen && <span className="font-bold font-headline truncate">SuperAdmin</span>}
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeMenu === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-4 p-3 rounded-xl text-white/40 hover:text-red-400 transition-all">
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-xl font-bold text-slate-800">Administração Global</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-xs text-orange-500 font-bold uppercase">Proprietário SaaS</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                SA
              </div>
            </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeMenu === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-current/20`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Condomínios Recentes</h3>
                    <div className="space-y-4">
                      {condos.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                              <Building2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{c.name}</p>
                              <p className="text-xs text-gray-400">{c.city} • {c.units} unidades</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${c.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
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
                </div>
              </motion.div>
            )}

            {activeMenu === 'condos' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Todos os Condomínios</h3>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
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
                            <p className="text-xs text-gray-400">{c.city}</p>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-sm font-bold text-blue-600">{c.planId}</span>
                          </td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-600">{c.units}</td>
                          <td className="px-8 py-4">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${c.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {c.subscriptionStatus}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <button className="text-blue-600 hover:underline text-sm font-bold">Gerenciar</button>
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
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Usuário</th>
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
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${u.role === 'SUPER_ADMIN' ? 'bg-orange-100 text-orange-600' : u.role === 'CONDO_ADMIN' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-600">
                            {condos.find(c => c.id === u.condoId)?.name || '-'}
                          </td>
                          <td className="px-8 py-4">
                            <button className="text-slate-600 hover:underline text-sm font-bold">Editar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Placeholder for other menus */}
            {!['overview', 'condos', 'users'].includes(activeMenu) && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gray-100 p-8 rounded-full mb-6">
                  <Settings className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo Administrativo</h3>
                <p className="text-gray-500 max-w-xs">Configurações globais do SaaS e gestão de planos em desenvolvimento.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser({ id: firebaseUser.uid, ...userSnap.data() } as AppUser);
        } else {
          // Create initial profile if it doesn't exist
          const isSuperAdmin = firebaseUser.email === 'cleciotecnologia@gmail.com';
          const newUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Usuário',
            role: isSuperAdmin ? 'SUPER_ADMIN' : 'CONDO_ADMIN', // Default for first login in this demo
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      console.log("Iniciando login com Google...");
      console.log("Domínio atual:", window.location.hostname);
      console.log("Configuração AuthDomain:", auth.config.authDomain);
      
      const result = await signInWithPopup(auth, provider);
      console.log("Login bem-sucedido:", result.user.email);
    } catch (error: any) {
      console.error("Erro detalhado no login:", error);
      
      let errorMessage = "Ocorreu um erro ao tentar entrar com o Google.";
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "A janela de login foi fechada antes de completar a autenticação.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = `Este domínio (${window.location.hostname}) não está autorizado no Firebase.\n\nPara corrigir:\n1. Vá ao Console do Firebase\n2. Autenticação > Configurações > Domínios Autorizados\n3. Adicione "${window.location.hostname}"`;
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "O login com Google não está ativado no seu projeto Firebase. Ative-o em Autenticação > Provedores de Login.";
      }
      
      alert(errorMessage + "\n\nCódigo do Erro: " + error.code);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="font-sans text-primary">
      {user ? (
        user.role === 'SUPER_ADMIN' ? (
          <SuperAdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )
      ) : (
        <LandingPage onLogin={handleLogin} />
      )}
    </div>
  );
}
