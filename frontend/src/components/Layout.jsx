import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  Wallet,
  CreditCard,
  ChartBar,
  CalendarBlank,
  Gear,
  List,
  X,
  PlusCircle,
  CurrencyDollar,
  CaretRight,
  CaretUp,
  CaretDown,
  Sparkle,
  GlobeHemisphereWest,
  Calendar,
  DoorOpen
} from '@phosphor-icons/react';

const navigationItems = [
  { id: 'home', icon: House, label: 'Inicio', type: 'tab' },
  { id: 'expenses', icon: Wallet, label: 'Gastos', type: 'tab' },
  { id: 'cards', icon: CreditCard, label: 'Tarjetas', type: 'tab' },
  { id: 'stats', icon: ChartBar, label: 'Estadísticas', type: 'tab' },
  { id: 'calendar', icon: CalendarBlank, label: 'Calendario', type: 'tab' },
  { id: 'settings', icon: Gear, label: 'Configuración', type: 'tab' },
  { id: 'new-expense', icon: PlusCircle, label: '', type: 'action', variant: 'expense' },
  { id: 'new-income', icon: CurrencyDollar, label: '', type: 'action', variant: 'income' },
];

const mobileTabItems = navigationItems.filter((item) => item.type === 'tab');
const mobileActionItems = navigationItems.filter((item) => item.type === 'action');
const mobileCompactItems = [
  ...mobileTabItems.slice(0, 3),
  mobileActionItems.find((item) => item.id === 'new-expense'),
  ...mobileTabItems.slice(3),
  mobileActionItems.find((item) => item.id === 'new-income'),
].filter(Boolean);

const sidebarItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.04,
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const quickActionVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.14 + index * 0.06,
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Layout({ children, activeTab, setActiveTab, onAddExpense, onAddIncome, onAddCash, onLogout }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileBottomNavCollapsed, setIsMobileBottomNavCollapsed] = useState(true);
  const [appLanguage, setAppLanguage] = useState(() => localStorage.getItem('gastospro-language') || 'ES');

  useEffect(() => {
    localStorage.setItem('gastospro-language', appLanguage);
  }, [appLanguage]);

  const toggleAppLanguage = () => {
    setAppLanguage((prev) => (prev === 'ES' ? 'EN' : 'ES'));
  };

  const currentDateLabel = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const powerGlyph = '⏻';


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigationItemClick = (item) => {
    if (item.type === 'action') {
      if (item.id === 'new-expense') onAddExpense();
      if (item.id === 'new-income') onAddIncome();
      return;
    }
    setActiveTab(item.id);
  };

  const getDesktopItemClasses = (item) => {
    const isActive = item.type === 'tab' && activeTab === item.id;
    const isAction = item.type === 'action';

    if (isActive) {
      return 'bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B] text-white shadow-[0_16px_40px_rgba(42,77,59,0.24)] ring-1 ring-white/10';
    }

    if (isAction) {
      if (item.variant === 'income') {
        return 'bg-gradient-to-r from-[#2A7B5F] via-[#246A52] to-[#1F5E47] text-white shadow-[0_18px_38px_rgba(42,123,95,0.22)] ring-1 ring-white/10 hover:shadow-[0_22px_44px_rgba(42,123,95,0.28)]';
      }
      return 'bg-gradient-to-r from-[#D48B3F] via-[#C9734A] to-[#B65C47] text-white shadow-[0_18px_38px_rgba(180,95,71,0.24)] ring-1 ring-white/10 hover:shadow-[0_22px_44px_rgba(180,95,71,0.3)]';
    }

    return 'text-[#737573] hover:bg-[#F2F0EB] hover:text-[#1A1C1A] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)]';
  };

  const getMobileItemClasses = (item) => {
    const isActive = item.type === 'tab' && activeTab === item.id;
    const isAction = item.type === 'action';

    if (isActive) {
      return 'bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B] text-white shadow-[0_16px_36px_rgba(42,77,59,0.22)] ring-1 ring-white/10';
    }

    if (isAction) {
      if (item.variant === 'income') {
        return 'bg-gradient-to-r from-[#2A7B5F] via-[#246A52] to-[#1F5E47] text-white shadow-[0_16px_34px_rgba(42,123,95,0.24)] ring-1 ring-white/10';
      }
      return 'bg-gradient-to-r from-[#D48B3F] via-[#C9734A] to-[#B65C47] text-white shadow-[0_16px_34px_rgba(180,95,71,0.26)] ring-1 ring-white/10';
    }

    return 'text-[#737573] hover:bg-[#F2F0EB]';
  };

  return (
    <div className="min-h-screen bg-transparent" data-testid="app-layout">
      {!isMobile && (
        <motion.aside
          initial={{ x: -280, opacity: 0.98 }}
          animate={{ x: 0, opacity: 1, width: isDesktopSidebarCollapsed ? 96 : 280 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="fixed left-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,248,242,0.92))] backdrop-blur-xl border-r border-white/50 z-40 flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.04)]"
          data-testid="desktop-sidebar"
        >
          <div className="p-4 border-b border-black/5">
            <div className={`flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
              <div className={`flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-center'} w-full`}>
                {isDesktopSidebarCollapsed ? (
                  <div className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-[20px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,240,232,0.94))] shadow-[0_12px_28px_rgba(0,0,0,0.05)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#2A4D3B]" />
                    <div className="h-1.5 w-5 rounded-full bg-[#DCCFBC]" />
                    <div className="h-1.5 w-3 rounded-full bg-[#E8DED0]" />
                  </div>
                ) : (
                  <div className="relative flex h-[74px] w-full max-w-[198px] items-center justify-center overflow-visible rounded-[18px] bg-transparent">
                    <motion.div
                      animate={{ scale: [1, 1.045, 1], filter: ["drop-shadow(0 0 0px rgba(109,255,151,0.0))", "drop-shadow(0 0 12px rgba(109,255,151,0.42))", "drop-shadow(0 0 0px rgba(109,255,151,0.0))"] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      className="ai-agent-logo"
                      aria-label="Agente virtual AI"
                    >
                      <span className="ai-agent-core"><span className="ai-agent-headset-ring" /><span className="ai-agent-support-head" /><span className="ai-agent-support-body" /><span className="ai-agent-mic" /><span className="ai-agent-eye ai-agent-eye-left" /><span className="ai-agent-eye ai-agent-eye-right" /><span className="ai-agent-signal" /></span><span className="ai-agent-chip">AI</span>
                    </motion.div>
                  </div>
                )}
              </div>

              {!isDesktopSidebarCollapsed && (
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#EFE7DA' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsDesktopSidebarCollapsed(true)}
                  className="w-10 h-10 rounded-2xl border border-black/5 bg-[#F7F3EB] text-[#5E605D] transition-all duration-200 flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.04)]"
                  data-testid="collapse-desktop-sidebar"
                >
                  <CaretRight className="w-5 h-5 rotate-180" />
                </motion.button>
              )}
            </div>

            {isDesktopSidebarCollapsed && (
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: '#EFE7DA' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsDesktopSidebarCollapsed(false)}
                className="mt-3 w-full rounded-2xl border border-black/5 bg-[#F7F3EB] py-2 text-[#5E605D] transition-all duration-200 flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.04)]"
                data-testid="expand-desktop-sidebar"
              >
                <CaretRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          <nav className={`flex-1 overflow-y-auto ${isDesktopSidebarCollapsed ? 'px-3 py-6' : 'px-4 py-8'} flex flex-col justify-center`}>
            <div className="space-y-2">
              {navigationItems.filter((item) => item.type === 'tab').map((item, index) => {
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    custom={index}
                    variants={sidebarItemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ x: isDesktopSidebarCollapsed ? 0 : 4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    key={item.id}
                    onClick={() => handleNavigationItemClick(item)}
                    data-testid={`nav-${item.id}`}
                    className={`group relative w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center px-3 py-3.5' : 'gap-3 justify-start px-4 py-3.5'} rounded-2xl transition-all duration-200 ${getDesktopItemClasses(item)}`}
                    title={item.label}
                  >
                    {!isActive && !isDesktopSidebarCollapsed ? <div className="absolute inset-y-2 left-2 w-1 rounded-full bg-transparent group-hover:bg-[#E9E2D6] transition-colors" /> : null}
                    <item.icon
                      weight={isActive ? 'fill' : 'duotone'}
                      className={`w-5 h-5 ${!isActive ? 'group-hover:scale-110 transition-transform duration-200' : ''}`}
                    />
                    {!isDesktopSidebarCollapsed ? <span className="font-medium">{item.label}</span> : null}
                    {!isDesktopSidebarCollapsed && isActive ? <motion.div layoutId="desktop-active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" /> : null}
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className={`${isDesktopSidebarCollapsed ? 'mt-5 pt-4' : 'mt-6 pt-5'} border-t border-[#EAE3D8]`}
            >
              {!isDesktopSidebarCollapsed && (
                <div className="px-1 pb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D9CFBE] to-transparent" />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F3EB] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A907F] border border-[#E9E2D6]">
                    <Sparkle weight="fill" className="w-3 h-3 text-[#D48B3F]" />
                    Acciones rápidas
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D9CFBE] to-transparent" />
                </div>
              )}
              <div className="space-y-3">
                {navigationItems.filter((item) => item.type === 'action').map((item, index) => {
                  const actionLabel = item.variant === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto';
                  const actionSubLabel = item.variant === 'income' ? 'Registrar cobro' : 'Registrar consumo';
                  return (
                    <motion.button
                      custom={index}
                      variants={quickActionVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{}}
                      whileTap={{ scale: 0.985 }}
                      key={item.id}
                      onClick={() => handleNavigationItemClick(item)}
                      data-testid={`nav-${item.id}`}
                      className={`group relative w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center px-3 py-3.5' : 'gap-3 justify-start px-4 py-3.5'} rounded-[22px] transition-all duration-300 overflow-hidden ring-1 ring-transparent hover:ring-white/28 hover:shadow-[0_20px_44px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.20),inset_0_0_28px_rgba(255,255,255,0.08)] hover:saturate-[1.08] ${getDesktopItemClasses(item)}`}
                      title={actionLabel}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.20),transparent_46%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="pointer-events-none absolute inset-y-0 -left-[40%] w-[42%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] skew-x-[-22deg] opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-100" />
                      <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
                      <div className="relative z-10 w-11 h-11 rounded-full bg-white/15 border border-white/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_0_rgba(255,255,255,0)] transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/18 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_0_22px_rgba(255,255,255,0.14)] flex-shrink-0">
                        <item.icon weight="fill" className="w-4 h-4 text-white transition-all duration-300 group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.5)]" />
                      </div>
                      {!isDesktopSidebarCollapsed ? (
                        <div className="relative z-10 min-w-0 text-left">
                          <span className="block font-semibold leading-none">{actionLabel}</span>
                          <span className="block text-xs text-white/78 mt-1">{actionSubLabel}</span>
                        </div>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </nav>

          <div className="p-3 border-t border-black/5">
            <motion.div
              className={`rounded-[22px] border border-[#ECE6DC] bg-gradient-to-br from-[#FCFBF8] to-[#F3EEE6] ${isDesktopSidebarCollapsed ? 'px-3 py-3' : 'px-3 py-3'} shadow-[0_10px_22px_rgba(0,0,0,0.025)]`}
            >
              {isDesktopSidebarCollapsed ? (
                <motion.button
                  whileHover={{}}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={onLogout}
                  className="group relative mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-[20px] border border-[#E9B5B5] bg-[linear-gradient(135deg,#FFF6F6_0%,#FFE9E9_36%,#FFDCDC_100%)] text-[#C62828] transition-all duration-300 hover:border-[#D96B6B] hover:saturate-[1.08]"
                  data-testid="sidebar-power-logout-button"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.58),transparent_48%)] opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-white/20 transition-all duration-300 group-hover:ring-white/40" />
                  <span className="pointer-events-none absolute inset-y-0 -left-[45%] w-[46%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.62),transparent)] skew-x-[-22deg] opacity-0 transition-all duration-500 group-hover:left-[118%] group-hover:opacity-100" />
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#E9B5B5] bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-300 group-hover:border-[#D96B6B] group-hover:bg-white/88">
                    <span className="text-[21px] font-semibold leading-none tracking-[-0.02em] transition-all duration-300 group-hover:scale-[1.04]">{powerGlyph}</span>
                  </span>
                </motion.button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex w-full items-center gap-2 rounded-[14px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(246,240,230,0.94))] px-2.5 py-2 shadow-[0_6px_14px_rgba(0,0,0,0.035)]">
                    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/80 bg-white/80">
                      <Calendar weight="duotone" className="h-3.5 w-3.5 text-[#2A4D3B]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#7E745E]">Fecha</p>
                      <p className="truncate text-[10px] font-semibold text-[#234333]">{currentDateLabel}</p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={onLogout}
                    className="group relative flex w-full items-center gap-2 overflow-hidden rounded-[14px] border border-[#E4CACA] bg-[linear-gradient(135deg,rgba(255,251,251,0.98),rgba(255,241,241,0.99))] px-2.5 py-2 text-left text-[#8E2F2F] transition-all duration-300 hover:border-[#D87D7D] hover:bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(255,236,236,1))]"
                    data-testid="sidebar-logout-button"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_48%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="pointer-events-none absolute inset-y-0 -left-[42%] w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.56),transparent)] skew-x-[-20deg] opacity-0 transition-all duration-500 group-hover:left-[112%] group-hover:opacity-100" />
                    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[#EDC3C3] bg-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 group-hover:border-[#D87D7D] group-hover:bg-white">
                      <DoorOpen weight="fill" className="h-3.5 w-3.5 text-[#B23A3A] transition-all duration-300 group-hover:scale-[1.06]" />
                    </span>
                    <div className="relative z-10 min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9D6A6A]">Sesión</p>
                      <p className="text-[10px] font-semibold text-[#8E2F2F]">Cerrar sesión</p>
                    </div>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </motion.aside>
      )}

      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              data-testid="sidebar-overlay"
            />
            <motion.aside
              initial={{ x: '-100%', opacity: 0.98 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0.98 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-[300px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,236,0.95))] z-50 flex flex-col safe-area-top shadow-2xl pb-20"
              data-testid="mobile-sidebar"
            >
              <div className="p-5 border-b border-black/5 bg-[linear-gradient(180deg,rgba(249,246,239,0.9),rgba(255,255,255,0.92))]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-[74px] min-w-[172px] flex-1 items-center justify-center overflow-visible rounded-[18px] bg-transparent">
                      <motion.div
                        animate={{ scale: [1, 1.045, 1], filter: ["drop-shadow(0 0 0px rgba(109,255,151,0.0))", "drop-shadow(0 0 12px rgba(109,255,151,0.42))", "drop-shadow(0 0 0px rgba(109,255,151,0.0))"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        className="ai-agent-logo"
                        aria-label="Agente virtual AI"
                      >
                        <span className="ai-agent-core"><span className="ai-agent-headset-ring" /><span className="ai-agent-support-head" /><span className="ai-agent-support-body" /><span className="ai-agent-mic" /><span className="ai-agent-eye ai-agent-eye-left" /><span className="ai-agent-eye ai-agent-eye-right" /><span className="ai-agent-signal" /></span><span className="ai-agent-chip">AI</span>
                      </motion.div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#EFE7DA' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSidebarOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-[18px] border border-black/5 bg-[#F7F3EB] text-[#5E605D] shadow-[0_8px_18px_rgba(0,0,0,0.04)]"
                    data-testid="close-sidebar"
                  >
                    <CaretRight className="w-5 h-5 rotate-180" />
                  </motion.button>
                </div>
              </div>

              <nav className="flex-1 px-4 py-6 overflow-y-auto flex flex-col justify-center">
                <div className="space-y-2">
                  {mobileTabItems.map((item, index) => {
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        custom={index}
                        variants={sidebarItemVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ x: 4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        key={item.id}
                        onClick={() => {
                          handleNavigationItemClick(item);
                          setSidebarOpen(false);
                        }}
                        className={`group relative w-full flex items-center gap-3 px-4 py-3.5 justify-start rounded-[22px] transition-all duration-200 ${getMobileItemClasses(item)}`}
                      >
                        {!isActive ? <div className="absolute inset-y-2 left-2 w-1 rounded-full bg-transparent group-hover:bg-[#E9E2D6] transition-colors" /> : null}
                        <item.icon weight={isActive ? 'fill' : 'duotone'} className={`w-5 h-5 ${!isActive ? 'group-hover:scale-110 transition-transform duration-200' : ''}`} />
                        <span className="font-medium">{item.label}</span>
                        <CaretRight className="w-4 h-4 ml-auto opacity-50" />
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.3 }}
                  className="mt-7 pt-5 border-t border-[#EAE3D8]"
                >
                  <div className="px-1 pb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D9CFBE] to-transparent" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F3EB] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A907F] border border-[#E9E2D6]">
                      <Sparkle weight="fill" className="w-3 h-3 text-[#D48B3F]" />
                      Acciones rápidas
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D9CFBE] to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {mobileActionItems.map((item, index) => {
                      const isIncome = item.variant === 'income';
                      const actionLabel = isIncome ? 'Nuevo ingreso' : 'Nuevo gasto';
                      const actionSubLabel = isIncome ? 'Registrar cobro' : 'Registrar consumo';

                      return (
                        <motion.button
                          custom={index}
                          variants={quickActionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{}}
                          whileTap={{ scale: 0.985 }}
                          key={item.id}
                          onClick={() => {
                            handleNavigationItemClick(item);
                            setSidebarOpen(false);
                          }}
                          className={`group relative w-full flex items-center gap-3 rounded-[24px] px-4 py-4 text-white transition-all duration-300 overflow-hidden ring-1 ring-transparent hover:ring-white/18 hover:shadow-[0_20px_38px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.16)] hover:brightness-[1.03] ${
                            isIncome
                              ? 'bg-gradient-to-r from-[#2A7B5F] via-[#246A52] to-[#1F5E47] shadow-[0_16px_34px_rgba(42,123,95,0.24)]'
                              : 'bg-gradient-to-r from-[#D48B3F] via-[#C9734A] to-[#B65C47] shadow-[0_16px_34px_rgba(180,95,71,0.24)]'
                          }`}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_46%)] opacity-80" />
                          <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
                          <div className="relative z-10 w-11 h-11 rounded-full bg-white/15 border border-white/15 flex items-center justify-center shadow-inner flex-shrink-0">
                            <item.icon weight="fill" className="w-4 h-4 text-white transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
                          </div>
                          <div className="relative z-10 flex flex-col items-start min-w-0 text-left">
                            <span className="text-base font-semibold leading-none">{actionLabel}</span>
                            <span className="text-xs text-white/80 leading-none mt-1">{actionSubLabel}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </nav>

              <div className="p-3 border-t border-black/5 mt-auto safe-area-bottom bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(249,246,239,0.8))]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 overflow-hidden rounded-[22px] border border-[#ECE6DC] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,238,228,0.96))] px-3 py-3 shadow-[0_12px_24px_rgba(0,0,0,0.045)]">
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-[14px] border border-white/80 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.05)]">
                      <div className="absolute inset-0 rounded-[14px] bg-[radial-gradient(circle_at_top_left,rgba(42,77,59,0.12),transparent_58%)]" />
                      <Calendar weight="duotone" className="relative z-10 w-4 h-4 text-[#2A4D3B]" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7E745E]">Fecha</p>
                      <p className="mt-1 truncate text-[12px] font-semibold text-[#234333]">{currentDateLabel}</p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={onLogout}
                    className="group relative flex w-full items-center gap-2 overflow-hidden rounded-[22px] border border-[#E4CACA] bg-[linear-gradient(135deg,rgba(255,251,251,0.98),rgba(255,241,241,0.99))] px-3 py-3 text-left font-semibold text-[#8E2F2F] transition-all duration-300 hover:border-[#D87D7D] hover:bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(255,236,236,1))]"
                    data-testid="mobile-logout-button"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_48%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="pointer-events-none absolute inset-y-0 -left-[42%] w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.58),transparent)] skew-x-[-20deg] opacity-0 transition-all duration-500 group-hover:left-[112%] group-hover:opacity-100" />
                    <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-[14px] border border-[#EDC3C3] bg-white/94 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-300 group-hover:border-[#D87D7D] group-hover:bg-white">
                      <DoorOpen weight="fill" className="h-4 w-4 text-[#B23A3A] transition-all duration-300 group-hover:scale-[1.06]" />
                    </span>
                    <div className="relative z-10 text-left min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9D6A6A]">Sesión</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#8E2F2F]">Cerrar sesión</p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        className={`min-h-screen transition-all duration-300 ${
          isMobile ? (isMobileBottomNavCollapsed ? 'pb-[96px]' : 'pb-[320px]') : isDesktopSidebarCollapsed ? 'ml-[96px]' : 'ml-[280px]'
        }`}
        data-testid="main-content"
      >
        <div
          className={`mx-auto max-w-7xl box-border ${
            isMobile && ['home', 'expenses', 'calendar'].includes(activeTab)
              ? 'px-5 py-4'
              : 'p-3'
          } md:p-5 lg:p-7 pb-8 md:pb-6`}
        >
          <div
            className={`app-shell relative box-border rounded-[28px] md:rounded-[34px] ${
              isMobile && ['home', 'expenses', 'calendar'].includes(activeTab)
                ? 'px-4 py-5'
                : 'px-3 py-4'
            } md:px-5 md:py-5 lg:px-6 lg:py-6`}
          >
            {children}
          </div>
        </div>
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 safe-area-bottom" data-testid="bottom-nav">
          <AnimatePresence initial={false}>
            {isMobileBottomNavCollapsed ? (
              <motion.div
                key="mobile-center-trigger"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto flex max-w-md justify-center"
              >
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsMobileBottomNavCollapsed(false)}
                  className="group flex h-14 w-14 items-center justify-center rounded-full border border-[#E9E2D6] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,235,0.96))] text-[#6F6C66] shadow-[0_16px_34px_rgba(0,0,0,0.14)]"
                  data-testid="toggle-bottom-nav"
                  aria-label="Abrir menú móvil"
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#F1EBE0]">
                    <List className="h-5 w-5 text-[#7A756D]" weight="bold" />
                  </span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="mobile-expanded-menu"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ delay: 0.05, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-md rounded-[30px] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,238,0.96))] backdrop-blur-xl shadow-[0_-16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
              >
                <div className="flex justify-center pt-2 pb-1">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsMobileBottomNavCollapsed(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E9E2D6] bg-[#F7F3EB] px-3 py-1.5 text-[11px] font-semibold text-[#6F6C66] shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                    data-testid="toggle-bottom-nav"
                    aria-label="Minimizar menú inferior"
                  >
                    <span className="block h-1.5 w-10 rounded-full bg-[#D6CCBC]" />
                    <span>Deslizar abajo</span>
                    <CaretDown className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-3 gap-2 px-3 pt-2 pb-3">
                  {mobileTabItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        key={item.id}
                        onClick={() => handleNavigationItemClick(item)}
                        data-testid={`bottom-nav-${item.id}`}
                        className={`relative flex flex-col items-center justify-center gap-1.5 min-h-[68px] rounded-2xl px-2 py-2 transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B] text-white shadow-[0_14px_30px_rgba(42,77,59,0.24)]'
                            : 'text-[#737573] hover:bg-[#F2F0EB]'
                        }`}
                      >
                        {isActive ? <div className="absolute inset-x-4 top-0 h-px bg-white/30" /> : null}
                        <item.icon
                          weight={isActive ? 'fill' : 'duotone'}
                          className="w-[18px] h-[18px]"
                        />
                        <span className="text-[10px] leading-tight font-semibold text-center">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="px-3 pt-1 pb-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#DDD4C7] to-transparent" />
                </div>

                <div className="grid grid-cols-[1fr_1fr_auto] items-stretch gap-2 px-3 pb-3 pt-1">
                  {mobileActionItems.map((item) => {
                    const isIncome = item.variant === 'income';
                    const actionLabel = isIncome ? 'Nuevo ingreso' : 'Nuevo gasto';
                    const actionSubLabel = isIncome ? 'Registrar cobro' : 'Registrar consumo';

                    return (
                      <motion.button
                        whileHover={{}}
                        whileTap={{ scale: 0.97 }}
                        key={item.id}
                        onClick={() => handleNavigationItemClick(item)}
                        data-testid={`bottom-nav-${item.id}`}
                        className={`group relative w-full flex items-center justify-center gap-3 rounded-[24px] px-3 py-4 text-white transition-all duration-300 overflow-hidden ring-1 ring-transparent hover:ring-white/28 hover:shadow-[0_20px_42px_rgba(0,0,0,0.16),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_28px_rgba(255,255,255,0.08)] hover:saturate-[1.08] ${
                          isIncome
                            ? 'bg-gradient-to-r from-[#2A7B5F] via-[#246A52] to-[#1F5E47] shadow-[0_14px_34px_rgba(42,123,95,0.28)]'
                            : 'bg-gradient-to-r from-[#D48B3F] via-[#C9734A] to-[#B65C47] shadow-[0_14px_34px_rgba(180,95,71,0.32)]'
                        }`}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_46%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="pointer-events-none absolute inset-y-0 -left-[40%] w-[42%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] skew-x-[-22deg] opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-100" />
                        <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
                        <div className="relative z-10 w-8 h-8 rounded-full bg-white/15 border border-white/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_0_rgba(255,255,255,0)] transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/18 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_0_22px_rgba(255,255,255,0.14)] flex-shrink-0">
                          <item.icon weight="fill" className="w-4 h-4 text-white transition-all duration-300 group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.5)]" />
                        </div>
                        <div className="relative z-10 flex flex-col items-start min-w-0">
                          <span className="text-sm font-semibold leading-none">{actionLabel}</span>
                          <span className="text-[11px] text-white/80 leading-none mt-1">{actionSubLabel}</span>
                        </div>
                      </motion.button>
                    );
                  })}

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={onLogout}
                    data-testid="bottom-nav-logout"
                    aria-label="Cerrar sesión"
                    className="group relative flex h-full min-h-[92px] w-[78px] items-center justify-center overflow-hidden rounded-[24px] border border-[#E4CACA] bg-[linear-gradient(135deg,rgba(255,251,251,0.98),rgba(255,241,241,0.99))] transition-all duration-300"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_48%)] opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="pointer-events-none absolute inset-y-0 -left-[42%] w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.58),transparent)] skew-x-[-20deg] opacity-0 transition-all duration-500 group-hover:left-[112%] group-hover:opacity-100" />
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#E7B3B3] bg-white/88 transition-all duration-300 group-hover:border-[#D87D7D] group-hover:bg-white">
                      <span className="text-[22px] leading-none text-[#C62828]">{powerGlyph}</span>
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      )}
    </div>
  );
}
