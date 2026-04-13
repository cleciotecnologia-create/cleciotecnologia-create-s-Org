import { useState, useMemo, useEffect, FormEvent } from 'react';
import { 
  Bell, Plus, MapPin, Users, AlertTriangle, Sparkles, Shield, Building2, 
  Home, Map as MapIcon, Copyright, Search, SlidersHorizontal, Star, 
  DollarSign, Filter, CheckCircle2, ChevronRight, LayoutDashboard, 
  MessageSquare, Calendar, CreditCard, LogOut, Menu, X, UserPlus,
  ArrowRight, Smartphone, BarChart3, Settings, QrCode, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { User as AppUser, Condo, Resident, Occurrence, Reservation, ChatMessage, AuditLog, PLANS, Plan } from './types';
import { auth, db } from './firebase';
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
  addDoc
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

const LandingPage = ({ onLogin, onShowLoginModal }: { onLogin: () => void, onShowLoginModal: () => void }) => {
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

const Dashboard = ({ user, onLogout, appSettings, createAuditLog }: { user: AppUser, onLogout: () => void, appSettings: any, createAuditLog: (action: string, resourceType: AuditLog['resourceType'], resourceId?: string, details?: string, condoId?: string) => Promise<void> }) => {
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [newResident, setNewResident] = useState({ name: '', email: '', unit: '', phone: '', cpf: '', login: '' });

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

    const messagesRef = collection(db, 'condos', user.condoId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
    const unsubMessages = onSnapshot(messagesQuery, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/messages`));

    const auditLogsRef = collection(db, 'condos', user.condoId, 'auditLogs');
    const auditLogsQuery = query(auditLogsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubAuditLogs = onSnapshot(auditLogsQuery, (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `condos/${user.condoId}/auditLogs`));

    return () => {
      unsubCondo();
      unsubResidents();
      unsubOccurrences();
      unsubMessages();
      unsubAuditLogs();
    };
  }, [user.condoId]);

  const handleAddResident = async () => {
    if (!newResident.name || !newResident.email) {
      alert("Nome e Email são obrigatórios.");
      return;
    }
    try {
      const residentRef = doc(collection(db, 'condos', user.condoId, 'residents'));
      const residentData: Resident = {
        id: residentRef.id,
        condoId: user.condoId,
        name: newResident.name,
        unit: newResident.unit,
        email: newResident.email,
        phone: newResident.phone,
        cpf: newResident.cpf,
        login: newResident.login,
        status: 'ACTIVE'
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

      await createAuditLog('Cadastrou novo morador', 'RESIDENT', residentRef.id, `Morador: ${newResident.name}, Unidade: ${newResident.unit}`);

      setShowAddResidentModal(false);
      setNewResident({ name: '', email: '', unit: '', phone: '', cpf: '', login: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/residents`);
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
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `condos/${user.condoId}/messages`);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat Comunitário', icon: MessageSquare },
    { id: 'residents', label: 'Moradores', icon: Users },
    { id: 'occurrences', label: 'Ocorrências', icon: AlertTriangle },
    { id: 'reservations', label: 'Reservas', icon: Calendar },
    { id: 'concierge', label: 'Portaria Remota', icon: Shield },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'audit', label: 'Auditoria', icon: History },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const currentCondoName = condo?.name || MOCK_CONDO.name;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-500 ease-in-out flex flex-col relative z-50 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-3 border-b border-white/5">
          <div className="bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            {appSettings.logo ? (
              <img src={appSettings.logo} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Building2 className="w-6 h-6 text-white flex-shrink-0" />
            )}
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

            {activeMenu === 'chat' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="h-[calc(100vh-200px)] flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl font-headline font-extrabold text-slate-800">Chat Comunitário</h3>
                    <p className="text-sm text-slate-400 mt-1">Converse com seus vizinhos em tempo real.</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Online agora
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-6 flex flex-col">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div 
                        className={`max-w-[70%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                          msg.senderId === user.id 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                      <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <MessageSquare className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium">Nenhuma mensagem ainda. Seja o primeiro a dizer oi!</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-8 bg-slate-50 border-t border-slate-100">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..." 
                      className="flex-grow p-4 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      Enviar
                    </button>
                  </div>
                </form>
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
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contato</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">CPF / Login</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {residents.map((res) => (
                        <tr key={res.id} className="hover:bg-gray-50 transition-all">
                          <td className="px-8 py-4 font-bold text-primary">{res.name}</td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-600">{res.unit}</td>
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
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-2">
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

            {activeMenu === 'chat' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl font-headline font-extrabold text-slate-800">Chat Comunitário</h3>
                    <p className="text-sm text-slate-400 mt-1">Converse com outros moradores do {currentCondoName}</p>
                  </div>
                  <div className="flex -space-x-3">
                    {residents.slice(0, 5).map((r, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {r.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {residents.length > 5 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        +{residents.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                      <MessageSquare className="w-16 h-16 mb-4" />
                      <p className="font-bold">Nenhuma mensagem ainda.</p>
                      <p className="text-sm">Seja o primeiro a dizer oi!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[70%] p-5 rounded-3xl shadow-sm ${
                          msg.senderId === user.id 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          {msg.senderId !== user.id && (
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">{msg.senderName}</p>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 px-2">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-8 bg-white border-t border-slate-100">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..." 
                      className="flex-grow p-5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 text-white px-8 py-5 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unidade</label>
                    <input 
                      type="text" 
                      value={newResident.unit}
                      onChange={(e) => setNewResident({...newResident, unit: e.target.value})}
                      placeholder="Ex: 101A" 
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                  </div>
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
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-600/20"
                >
                  Criar Morador
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

const SuperAdminDashboard = ({ user, onLogout, appSettings, onUpdateSettings, createAuditLog }: { user: AppUser, onLogout: () => void, appSettings: any, onUpdateSettings: (updates: any) => void, createAuditLog: (action: string, resourceType: AuditLog['resourceType'], resourceId?: string, details?: string, condoId?: string) => Promise<void> }) => {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [condos, setCondos] = useState<Condo[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAddCondoModal, setShowAddCondoModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newCondo, setNewCondo] = useState({ name: '', city: '', units: 0, planId: 'BASIC' as Condo['planId'] });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'CONDO_ADMIN' as AppUser['role'], condoId: '', cpf: '', login: '' });

  useEffect(() => {
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
  }, []);

  const handleAddCondo = async () => {
    if (!newCondo.name || !newCondo.city) {
      alert("Por favor, preencha o nome e a cidade.");
      return;
    }
    try {
      const condoRef = doc(collection(db, 'condos'));
      const condoData: Condo = {
        id: condoRef.id,
        name: newCondo.name,
        city: newCondo.city,
        units: newCondo.units,
        planId: newCondo.planId,
        subscriptionStatus: 'ACTIVE',
        adminId: '',
        createdAt: new Date().toISOString(),
        address: ''
      };
      await setDoc(condoRef, condoData);
      await createAuditLog('Cadastrou novo condomínio', 'CONDO', condoRef.id, `Condomínio: ${newCondo.name}, Cidade: ${newCondo.city}`, 'global');
      setShowAddCondoModal(false);
      setNewCondo({ name: '', city: '', units: 0, planId: 'BASIC' });
    } catch (err) {
      console.error("Erro ao adicionar condomínio:", err);
      handleFirestoreError(err, OperationType.CREATE, 'condos');
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

  const handleUpdateSettings = async (updates: any) => {
    try {
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, { ...appSettings, ...updates }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'condos', label: 'Condomínios', icon: Building2 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'plans', label: 'Planos & SaaS', icon: CreditCard },
    { id: 'audit', label: 'Auditoria', icon: History },
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
          {appSettings.logo ? (
            <img src={appSettings.logo} alt="Logo" className="w-8 h-8 object-contain flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <Shield className="w-8 h-8 text-orange-400 flex-shrink-0" />
          )}
          {isSidebarOpen && <span className="font-bold font-headline truncate">{appSettings.logo ? 'CondoPro' : 'SuperAdmin'}</span>}
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

            {/* Placeholder for other menus */}
            {!['overview', 'condos', 'users', 'settings'].includes(activeMenu) && (
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
                <h3 className="text-xl font-bold text-slate-800">Novo Condomínio</h3>
                <button onClick={() => setShowAddCondoModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome do Condomínio</label>
                  <input 
                    type="text" 
                    value={newCondo.name}
                    onChange={(e) => setNewCondo({...newCondo, name: e.target.value})}
                    placeholder="Ex: Residencial Horizon" 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
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

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddUserModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
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
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [appSettings, setAppSettings] = useState({ logo: '', primaryColor: '#00323d' });

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setAppSettings(snap.data() as any);
      }
    });
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
            // We could delete the placeholder here, but it's safer to just leave it or handle it carefully
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
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
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

  const handleEmailLogin = async (identifier: string, password: string) => {
    try {
      let email = identifier;
      
      // If not an email, search by CPF or Login
      if (!identifier.includes('@')) {
        // Search by CPF
        const cpfQuery = query(collection(db, 'users'), where('cpf', '==', identifier), limit(1));
        const cpfSnap = await getDocs(cpfQuery);
        
        if (!cpfSnap.empty) {
          email = cpfSnap.docs[0].data().email;
        } else {
          // Search by Login
          const loginQuery = query(collection(db, 'users'), where('login', '==', identifier), limit(1));
          const loginSnap = await getDocs(loginQuery);
          if (!loginSnap.empty) {
            email = loginSnap.docs[0].data().email;
          }
        }
      }

      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
    } catch (error: any) {
      console.error("Erro no login:", error);
      let msg = "Falha ao entrar. Verifique suas credenciais.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = "Email ou senha incorretos.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "Email inválido.";
      }
      alert(msg);
    }
  };

  const handleSignUp = async (email: string, pass: string, name: string) => {
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
        // Delete placeholder
        // await deleteDoc(placeholderSnap.docs[0].ref); // We'll handle this in onAuthStateChanged or here
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
      alert("Erro ao criar conta: " + error.message);
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
          <SuperAdminDashboard user={user} onLogout={handleLogout} appSettings={appSettings} onUpdateSettings={handleUpdateSettings} createAuditLog={createAuditLog} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} appSettings={appSettings} createAuditLog={createAuditLog} />
        )
      ) : (
        <LandingPage onLogin={handleLogin} onShowLoginModal={() => setShowLoginModal(true)} />
      )}

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
                <h3 className="text-xl font-bold text-slate-800">
                  {isRegistering ? 'Criar Conta no CondoPro' : 'Entrar no CondoPro'}
                </h3>
                <button onClick={() => setShowLoginModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
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
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
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
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
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
                      className="w-full py-4 bg-white text-slate-700 border border-gray-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
                    >
                      <Smartphone className="w-5 h-5" /> Entrar com Google
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
