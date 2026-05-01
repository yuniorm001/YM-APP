import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  Wallet,
  CreditCard,
  Gear,
  Plus,
  PlusCircle,
  CurrencyDollar,
  CaretRight,
  Sparkle,
  DoorOpen,
} from '@phosphor-icons/react';

const navigationItems = [
  { id: 'home', icon: House, label: 'Inicio', type: 'tab' },
  { id: 'expenses', icon: Wallet, label: 'Dinero', type: 'tab' },
  { id: 'cards', icon: CreditCard, label: 'Tarjetas', type: 'tab' },
  { id: 'new-expense', icon: PlusCircle, label: '', type: 'action', variant: 'expense' },
  { id: 'new-income', icon: CurrencyDollar, label: '', type: 'action', variant: 'income' },
];

// Mobile bottom-bar tabs (4 slots, with center FAB occupying the 5th visual position)
const mobileBottomTabs = [
  { id: 'home', icon: House, label: 'Inicio' },
  { id: 'expenses', icon: Wallet, label: 'Dinero' },
  { id: 'cards', icon: CreditCard, label: 'Tarjetas' },
  { id: 'settings', icon: Gear, label: 'Ajustes' },
];

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
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [appLanguage, setAppLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'ES';
    return window.localStorage?.getItem('gastospro-language') || 'ES';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('gastospro-language', appLanguage);
    }
  }, [appLanguage]);

  const powerGlyph = '⏻';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMobileTabClick = (id) => {
    setActiveTab(id);
    setIsFabOpen(false);
  };

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

  return (
    <div className="min-h-screen bg-transparent" data-testid="app-layout">
      {/* ============= DESKTOP SIDEBAR ============= */}
      {!isMobile && (
        <motion.aside
          initial={{ x: -280, opacity: 0.98 }}
          animate={{ x: 0, opacity: 1, width: isDesktopSidebarCollapsed ? 96 : 296 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="fixed left-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(251,248,242,0.94))] backdrop-blur-xl border-r border-white/50 z-40 flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.04)] overflow-hidden"
          data-testid="desktop-sidebar"
        >
          {/* Decorative ambient glow background */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -left-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(212,139,63,0.10),transparent_70%)] blur-2xl" />
            <div className="absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(42,123,95,0.08),transparent_70%)] blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-44 bg-[radial-gradient(ellipse_at_bottom,rgba(212,139,63,0.06),transparent_70%)]" />
          </div>

          {/* HERO HEADER */}
          <div className="relative p-4 border-b border-black/5">
            <div className={`flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
              <div className="flex items-center justify-center w-full">
                {isDesktopSidebarCollapsed ? (
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[20px] border border-[#E7DED0] bg-[linear-gradient(145deg,#FFFDF8_0%,#F4EEE6_100%)] shadow-[0_12px_28px_rgba(42,77,59,0.10)]" aria-label="Pulso Smart mini">
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,123,95,0.18),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(212,139,63,0.14),transparent_48%)]" />
                    <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-[#2A7B5F] shadow-[0_0_0_4px_rgba(42,123,95,0.10)]" />
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-[14px] border border-[#DCCFBC] bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <CurrencyDollar weight="bold" className="h-3.5 w-3.5 text-[#2A7B5F]" />
                    </span>
                    <span className="absolute bottom-2 right-2 h-3.5 w-5 rounded-[5px] border border-[#DCCFBC] bg-[#F7F1E8]/90">
                      <span className="absolute left-1 right-1 top-1 h-px rounded-full bg-[#2A4D3B]/35" />
                    </span>
                  </div>
                ) : (
                  <div className="relative flex h-[74px] w-full max-w-[198px] items-center justify-center overflow-visible rounded-[18px] bg-transparent">
                    <motion.div
                      animate={{
                        scale: [1, 1.045, 1],
                        filter: [
                          'drop-shadow(0 0 0px rgba(109,255,151,0.0))',
                          'drop-shadow(0 0 12px rgba(109,255,151,0.42))',
                          'drop-shadow(0 0 0px rgba(109,255,151,0.0))',
                        ],
                      }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="ai-agent-logo"
                      aria-label="Agente virtual AI"
                    >
                      <span className="ai-agent-core">
                        <span className="ai-agent-headset-ring" />
                        <span className="ai-agent-support-head" />
                        <span className="ai-agent-support-body" />
                        <span className="ai-agent-mic" />
                        <span className="ai-agent-eye ai-agent-eye-left" />
                        <span className="ai-agent-eye ai-agent-eye-right" />
                        <span className="ai-agent-signal" />
                      </span>
                      <span className="ai-agent-chip">AI</span>
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

            {/* Status pill — premium accent */}
            {!isDesktopSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.32 }}
                className="mt-4 relative overflow-hidden rounded-[18px] border border-[#E7DED0] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,243,235,0.94))] px-3 py-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.04)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(42,123,95,0.10),transparent_55%)]" />
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#E8F4EE,#C9E4D6)] border border-[#BBD9C8]">
                    <span className="absolute inset-0 rounded-full animate-ping bg-[#2A7B5F]/20" style={{ animationDuration: '2.4s' }} />
                    <Sparkle weight="fill" className="relative h-3.5 w-3.5 text-[#2A7B5F]" />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A907F]">Estado</p>
                    <p className="text-[12px] font-semibold text-[#1E3328] truncate">Pulso Smart · Online</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* MAIN NAV */}
          <nav className={`relative flex-1 overflow-y-auto ${isDesktopSidebarCollapsed ? 'px-3 py-5' : 'px-4 py-6'} flex flex-col`}>
            {!isDesktopSidebarCollapsed && (
              <div className="px-1 pb-2 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A907F]">Navegar</span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#E5DCCB] to-transparent" />
              </div>
            )}

            <div className="space-y-1.5">
              {navigationItems
                .filter((item) => item.type === 'tab')
                .map((item, index) => {
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
                      className={`group relative w-full flex items-center ${
                        isDesktopSidebarCollapsed ? 'justify-center px-3 py-3.5' : 'gap-3 justify-start px-4 py-3.5'
                      } rounded-2xl transition-all duration-200 ${getDesktopItemClasses(item)}`}
                      title={item.label}
                    >
                      {!isActive && !isDesktopSidebarCollapsed ? (
                        <div className="absolute inset-y-2 left-2 w-1 rounded-full bg-transparent group-hover:bg-[#E9E2D6] transition-colors" />
                      ) : null}
                      <item.icon
                        weight={isActive ? 'fill' : 'duotone'}
                        className={`w-5 h-5 ${!isActive ? 'group-hover:scale-110 transition-transform duration-200' : ''}`}
                      />
                      {!isDesktopSidebarCollapsed ? <span className="font-medium">{item.label}</span> : null}
                      {!isDesktopSidebarCollapsed && isActive ? (
                        <motion.div layoutId="desktop-active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                      ) : null}
                    </motion.button>
                  );
                })}
            </div>

            {/* QUICK ACTIONS */}
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
                {navigationItems
                  .filter((item) => item.type === 'action')
                  .map((item, index) => {
                    const actionLabel = item.variant === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto';
                    const actionSubLabel = item.variant === 'income' ? 'Registrar cobro' : 'Registrar consumo';
                    return (
                      <motion.button
                        custom={index}
                        variants={quickActionVariants}
                        initial="hidden"
                        animate="visible"
                        whileTap={{ scale: 0.985 }}
                        key={item.id}
                        onClick={() => handleNavigationItemClick(item)}
                        data-testid={`nav-${item.id}`}
                        className={`group relative w-full flex items-center ${
                          isDesktopSidebarCollapsed ? 'justify-center px-3 py-3.5' : 'gap-3 justify-start px-4 py-3.5'
                        } rounded-[22px] transition-all duration-300 overflow-hidden ring-1 ring-transparent hover:ring-white/28 hover:shadow-[0_20px_44px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.20),inset_0_0_28px_rgba(255,255,255,0.08)] hover:saturate-[1.08] ${getDesktopItemClasses(
                          item
                        )}`}
                        title={actionLabel}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_46%)] opacity-80" />
                        <div className="pointer-events-none absolute inset-y-0 -left-[40%] w-[42%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] skew-x-[-22deg] opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-100" />
                        <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
                        <div className="relative z-10 w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] flex-shrink-0">
                          <item.icon weight="fill" className="w-4 h-4 text-white" />
                        </div>
                        {!isDesktopSidebarCollapsed && (
                          <div className="relative z-10 flex flex-col items-start min-w-0 text-left">
                            <span className="text-sm font-semibold leading-none">{actionLabel}</span>
                            <span className="text-[11px] text-white/80 leading-none mt-1">{actionSubLabel}</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
              </div>
            </motion.div>

            {/* COLLAPSED RAIL — premium mini dashboard, related to cash, cards and Pulso Smart */}
            {isDesktopSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.34 }}
                className="mt-7 flex flex-1 flex-col items-center justify-between pb-2"
                aria-hidden="true"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#D9CFBE] to-transparent" />

                  <div className="relative flex h-[104px] w-[58px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[#E7DED0] bg-[linear-gradient(180deg,#FFFCF6_0%,#F3EEE5_100%)] shadow-[0_18px_36px_rgba(45,36,22,0.07)]">
                    <span className="absolute -top-8 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(42,123,95,0.18),transparent_62%)] blur-md" />
                    <span className="absolute -bottom-8 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(212,139,63,0.18),transparent_62%)] blur-md" />
                    <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-[16px] border border-[#DCCFBC] bg-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <Wallet weight="duotone" className="h-[18px] w-[18px] text-[#2A7B5F]" />
                    </span>
                    <span className="mt-3 h-1.5 w-8 rounded-full bg-[#2A4D3B]/28" />
                    <span className="mt-1.5 h-1.5 w-5 rounded-full bg-[#D48B3F]/45" />
                    <span className="mt-1.5 h-1.5 w-7 rounded-full bg-[#DCCFBC]" />
                  </div>

                  <div className="relative flex h-[92px] w-[58px] flex-col items-center justify-center rounded-[28px] border border-[#E7DED0] bg-[linear-gradient(180deg,#FDFBF7,#F4EEE5)] shadow-[0_16px_30px_rgba(45,36,22,0.055)]">
                    <span className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(212,139,63,0.12),transparent_56%)]" />
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E2D4BF] bg-white/82">
                      <Sparkle weight="fill" className="h-4 w-4 text-[#D48B3F]" />
                    </span>
                    <span className="mt-3 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2A7B5F]/55" />
                      <span className="h-1.5 w-4 rounded-full bg-[#DCCFBC]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D48B3F]/60" />
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="relative flex h-[96px] w-[58px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[#E7DED0] bg-[linear-gradient(180deg,#FFFCF7,#F5EFE7)] shadow-[0_16px_32px_rgba(45,36,22,0.06)]">
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(42,77,59,0.13),transparent_56%)]" />
                    <span className="absolute top-4 h-1.5 w-8 rounded-full bg-[#DCCFBC]" />
                    <span className="absolute top-8 h-1.5 w-5 rounded-full bg-[#DCCFBC]/70" />
                    <span className="relative mt-7 flex h-9 w-9 items-center justify-center rounded-[15px] border border-[#DCCFBC] bg-white/84">
                      <CreditCard weight="duotone" className="h-4 w-4 text-[#2A4D3B]" />
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 pb-1">
                    <span className="h-px w-12 bg-gradient-to-r from-transparent via-[#D9CFBE] to-transparent" />
                    <span className="h-1 w-6 rounded-full bg-[#DCCFBC]/65" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* PREMIUM TIP CARD — fills empty space, only when expanded */}
            {!isDesktopSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="mt-6 relative overflow-hidden rounded-[22px] border border-[#1E3328]/10 bg-[linear-gradient(135deg,#0F2A1F_0%,#1E3A2B_45%,#2A4D3B_100%)] p-4 shadow-[0_18px_40px_rgba(15,42,31,0.22)]"
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(212,139,63,0.32),transparent_60%)] blur-xl" />
                  <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(109,255,151,0.18),transparent_60%)] blur-2xl" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_55%)]" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/15 backdrop-blur">
                      <Sparkle weight="fill" className="h-3.5 w-3.5 text-[#F0C99A]" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F0C99A]">Pulso Smart Tip</span>
                  </div>
                  <p className="mt-2.5 text-[13px] font-semibold leading-snug text-white">
                    Registra cada gasto al momento — tu yo del futuro lo va a agradecer.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      <span className="h-5 w-5 rounded-full bg-[#D48B3F] border-2 border-[#1E3A2B] flex items-center justify-center text-[9px] font-bold text-white">
                        $
                      </span>
                      <span className="h-5 w-5 rounded-full bg-[#2A7B5F] border-2 border-[#1E3A2B] flex items-center justify-center">
                        <CaretRight weight="bold" className="h-2.5 w-2.5 text-white" />
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-white/60">Hábito diario · 2 min</span>
                  </div>
                </div>
              </motion.div>
            )}
          </nav>

          {/* FOOTER — settings + logout */}
          <div className="relative p-3 border-t border-black/5">
            <motion.div
              className={`rounded-[22px] border border-[#ECE6DC] bg-gradient-to-br from-[#FCFBF8] to-[#F3EEE6] px-3 py-3 shadow-[0_10px_22px_rgba(0,0,0,0.025)]`}
            >
              {isDesktopSidebarCollapsed ? (
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`group relative mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-[20px] border transition-all duration-300 ${
                      activeTab === 'settings'
                        ? 'border-[#D8C19D] bg-[linear-gradient(135deg,#FFFDF8_0%,#F6EDDD_100%)] text-[#A06125] shadow-[0_14px_28px_rgba(118,91,50,0.12)]'
                        : 'border-[#E9E2D6] bg-[linear-gradient(135deg,#FFFFFF_0%,#F6F0E6_100%)] text-[#667067] hover:border-[#D8C19D] hover:text-[#A06125]'
                    }`}
                    data-testid="sidebar-collapsed-settings-button"
                    aria-label="Ajustes"
                    title="Ajustes"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,139,63,0.16),transparent_48%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#E5D8C4] bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
                      <Gear weight={activeTab === 'settings' ? 'fill' : 'duotone'} className="h-4 w-4" />
                    </span>
                  </motion.button>

                  <motion.button
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
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-[22px] border border-[#E7DED0] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(244,239,230,0.96))] p-2 shadow-[0_14px_34px_rgba(45,36,22,0.07)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,139,63,0.12),transparent_42%)]" />
                  <div className="relative z-10 flex flex-col gap-2">
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] border px-3 py-3 text-left transition-all duration-300 ${
                        activeTab === 'settings'
                          ? 'border-[#D8C19D] bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(249,243,232,0.99))] text-[#1E3328] shadow-[0_12px_26px_rgba(118,91,50,0.12)]'
                          : 'border-white/70 bg-white/55 text-[#334238] hover:border-[#D8C19D]/70 hover:bg-white/80'
                      }`}
                      data-testid="sidebar-settings-button"
                    >
                      {activeTab === 'settings' ? <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#D48B3F]" /> : null}
                      <span
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-300 ${
                          activeTab === 'settings'
                            ? 'border-[#D8C19D] bg-[#FFF8EC] text-[#A06125]'
                            : 'border-[#E9E0D2] bg-white text-[#506052] group-hover:text-[#A06125]'
                        }`}
                      >
                        <Gear weight={activeTab === 'settings' ? 'fill' : 'duotone'} className="h-4 w-4" />
                      </span>
                      <div className="relative z-10 min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9A8870]">Sistema</p>
                        <p className="text-[12px] font-semibold text-[#24382E]">Ajustes</p>
                      </div>
                      {activeTab === 'settings' ? <span className="ml-auto h-2 w-2 rounded-full bg-[#D48B3F] shadow-[0_0_0_4px_rgba(212,139,63,0.12)]" /> : null}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={onLogout}
                      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] border border-[#E7CACA] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,242,242,0.98))] px-3 py-3 text-left text-[#8E2F2F] transition-all duration-300 hover:border-[#D87D7D] hover:bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(255,236,236,1))] hover:shadow-[0_12px_26px_rgba(142,47,47,0.08)]"
                      data-testid="sidebar-logout-button"
                    >
                      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.62),transparent_48%)] opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="pointer-events-none absolute inset-y-0 -left-[42%] w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.58),transparent)] skew-x-[-20deg] opacity-0 transition-all duration-500 group-hover:left-[112%] group-hover:opacity-100" />
                      <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-[#EDC3C3] bg-white/94 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-300 group-hover:border-[#D87D7D] group-hover:bg-white">
                        <DoorOpen weight="fill" className="h-4 w-4 text-[#B23A3A] transition-all duration-300 group-hover:scale-[1.06]" />
                      </span>
                      <div className="relative z-10 min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A47777]">Sesión</p>
                        <p className="text-[12px] font-semibold text-[#8E2F2F]">Cerrar sesión</p>
                      </div>
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.aside>
      )}

      {/* ============= MAIN CONTENT ============= */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          isMobile ? 'pb-[120px]' : isDesktopSidebarCollapsed ? 'ml-[96px]' : 'ml-[296px]'
        }`}
        data-testid="main-content"
      >
        <div
          className={`mx-auto max-w-7xl box-border ${
            isMobile && ['home', 'expenses', 'cards'].includes(activeTab) ? 'px-5 py-4' : 'p-3'
          } md:p-5 lg:p-7 pb-8 md:pb-6`}
        >
          <div
            className={`app-shell relative box-border rounded-[28px] md:rounded-[34px] ${
              isMobile && ['home', 'expenses', 'cards'].includes(activeTab) ? 'px-4 py-5' : 'px-3 py-4'
            } md:px-5 md:py-5 lg:px-6 lg:py-6`}
          >
            {children}
          </div>
        </div>
      </main>

      {/* ============= MOBILE PREMIUM BOTTOM NAV ============= */}
      {isMobile && (
        <>
          {/* Backdrop when FAB is open */}
          <AnimatePresence>
            {isFabOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setIsFabOpen(false);
                              }}
                className="fixed inset-0 bg-black/45 backdrop-blur-[6px] z-40"
                data-testid="mobile-nav-backdrop"
              />
            )}
          </AnimatePresence>

          {/* FAB Action Menu (expands above bottom bar) */}
          <AnimatePresence>
            {isFabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="fixed bottom-[158px] left-0 right-0 z-50 px-5 flex flex-col items-center gap-3.5 pointer-events-none"
                data-testid="mobile-fab-menu"
              >
                {/* New Expense */}
                <motion.button
                  initial={{ opacity: 0, y: 24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.9 }}
                  transition={{ delay: 0.04, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onAddExpense();
                    setIsFabOpen(false);
                  }}
                  className="pointer-events-auto group relative w-full max-w-[340px] flex items-center gap-3.5 rounded-[22px] px-5 py-4 text-white overflow-hidden bg-gradient-to-r from-[#D48B3F] via-[#C9734A] to-[#B65C47] shadow-[0_22px_44px_rgba(180,95,71,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] ring-1 ring-white/15"
                  data-testid="mobile-fab-new-expense"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_46%)]" />
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
                  <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/18 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] flex-shrink-0">
                    <PlusCircle weight="fill" className="h-5 w-5 text-white" />
                  </span>
                  <div className="relative z-10 flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-[15px] font-bold leading-none">Nuevo gasto</span>
                    <span className="text-[11.5px] font-medium text-white/80 leading-none mt-1.5">Registrar consumo</span>
                  </div>
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 border border-white/15">
                    <CaretRight weight="bold" className="h-3.5 w-3.5 text-white/90" />
                  </span>
                </motion.button>

                {/* New Income */}
                <motion.button
                  initial={{ opacity: 0, y: 24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.9 }}
                  transition={{ delay: 0, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onAddIncome();
                    setIsFabOpen(false);
                  }}
                  className="pointer-events-auto group relative w-full max-w-[340px] flex items-center gap-3.5 rounded-[22px] px-5 py-4 text-white overflow-hidden bg-gradient-to-r from-[#2A7B5F] via-[#246A52] to-[#1F5E47] shadow-[0_22px_44px_rgba(42,123,95,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] ring-1 ring-white/15"
                  data-testid="mobile-fab-new-income"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_46%)]" />
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
                  <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/18 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] flex-shrink-0">
                    <CurrencyDollar weight="fill" className="h-5 w-5 text-white" />
                  </span>
                  <div className="relative z-10 flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-[15px] font-bold leading-none">Nuevo ingreso</span>
                    <span className="text-[11.5px] font-medium text-white/80 leading-none mt-1.5">Registrar cobro</span>
                  </div>
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 border border-white/15">
                    <CaretRight weight="bold" className="h-3.5 w-3.5 text-white/90" />
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THE PILL — premium dark bottom bar */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 safe-area-bottom pointer-events-none"
            data-testid="bottom-nav"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 240, delay: 0.1 }}
              className="pointer-events-auto mx-auto max-w-md relative"
            >
              {/* Floating FAB */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-20">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.04 }}
                  animate={{ rotate: isFabOpen ? 45 : 0 }}
                  transition={{ type: 'spring', damping: 16, stiffness: 280 }}
                  onClick={() => setIsFabOpen((v) => !v)}
                  data-testid="mobile-fab-toggle"
                  aria-label={isFabOpen ? 'Cerrar acciones' : 'Abrir acciones'}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full overflow-hidden ring-4 ring-[#1E3328]/15 shadow-[0_18px_40px_rgba(212,139,63,0.55),0_0_0_1px_rgba(255,255,255,0.10),inset_0_1px_0_rgba(255,255,255,0.30)]"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,#E8A95A_0%,#D48B3F_45%,#B85F2E_100%)]" />
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_55%)]" />
                  <span className="absolute inset-x-2 top-1 h-px bg-white/40" />
                  <AnimatePresence>
                    {isFabOpen && (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0.6 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full bg-[#D48B3F]/40"
                      />
                    )}
                  </AnimatePresence>
                  <Plus weight="bold" className="relative z-10 h-7 w-7 text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />
                </motion.button>
              </div>

              {/* The dark pill with notch for FAB */}
              <div className="relative">
                <svg viewBox="0 0 360 76" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
                  <defs>
                    <linearGradient id="pillBg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#243025" />
                      <stop offset="55%" stopColor="#1A2218" />
                      <stop offset="100%" stopColor="#141A12" />
                    </linearGradient>
                    <linearGradient id="pillStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
                    </linearGradient>
                    <filter id="pillShadow" x="-10%" y="-50%" width="120%" height="220%">
                      <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#000" floodOpacity="0.30" />
                    </filter>
                  </defs>
                  {/* Pill with circular notch in the top-center for the FAB */}
                  <path
                    d="M 38 0 H 145 C 152 0 155 4 158 9 A 28 28 0 0 0 202 9 C 205 4 208 0 215 0 H 322 A 38 38 0 0 1 360 38 A 38 38 0 0 1 322 76 H 38 A 38 38 0 0 1 0 38 A 38 38 0 0 1 38 0 Z"
                    fill="url(#pillBg)"
                    stroke="url(#pillStroke)"
                    strokeWidth="1"
                    filter="url(#pillShadow)"
                  />
                </svg>

                {/* Tabs over the SVG */}
                <div className="relative grid grid-cols-5 items-center h-[76px] px-2">
                  {/* Tab 1: Inicio */}
                  {(() => {
                    const item = mobileBottomTabs[0];
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleMobileTabClick(item.id)}
                        data-testid={`bottom-nav-${item.id}`}
                        className="relative flex flex-col items-center justify-center h-full focus:outline-none"
                        aria-label={item.label}
                      >
                        <motion.span
                          animate={{ backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0)' }}
                          transition={{ type: 'spring', damping: 20, stiffness: 320 }}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                            isActive ? 'shadow-[0_8px_20px_rgba(0,0,0,0.30)]' : ''
                          }`}
                        >
                          <item.icon
                            weight={isActive ? 'fill' : 'regular'}
                            className={`h-[22px] w-[22px] transition-colors duration-200 ${isActive ? 'text-[#1E3328]' : 'text-white/65'}`}
                          />
                        </motion.span>
                      </motion.button>
                    );
                  })()}

                  {/* Tab 2: Dinero */}
                  {(() => {
                    const item = mobileBottomTabs[1];
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleMobileTabClick(item.id)}
                        data-testid={`bottom-nav-${item.id}`}
                        className="relative flex flex-col items-center justify-center h-full focus:outline-none"
                        aria-label={item.label}
                      >
                        <motion.span
                          animate={{ backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0)' }}
                          transition={{ type: 'spring', damping: 20, stiffness: 320 }}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                            isActive ? 'shadow-[0_8px_20px_rgba(0,0,0,0.30)]' : ''
                          }`}
                        >
                          <item.icon
                            weight={isActive ? 'fill' : 'regular'}
                            className={`h-[22px] w-[22px] transition-colors duration-200 ${isActive ? 'text-[#1E3328]' : 'text-white/65'}`}
                          />
                        </motion.span>
                      </motion.button>
                    );
                  })()}

                  {/* Center spacer for the FAB */}
                  <div aria-hidden />

                  {/* Tab 3: Tarjetas */}
                  {(() => {
                    const item = mobileBottomTabs[2];
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleMobileTabClick(item.id)}
                        data-testid={`bottom-nav-${item.id}`}
                        className="relative flex flex-col items-center justify-center h-full focus:outline-none"
                        aria-label={item.label}
                      >
                        <motion.span
                          animate={{ backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0)' }}
                          transition={{ type: 'spring', damping: 20, stiffness: 320 }}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                            isActive ? 'shadow-[0_8px_20px_rgba(0,0,0,0.30)]' : ''
                          }`}
                        >
                          <item.icon
                            weight={isActive ? 'fill' : 'regular'}
                            className={`h-[22px] w-[22px] transition-colors duration-200 ${isActive ? 'text-[#1E3328]' : 'text-white/65'}`}
                          />
                        </motion.span>
                      </motion.button>
                    );
                  })()}

                  {/* Tab 4: Ajustes */}
                  {(() => {
                    const item = mobileBottomTabs[3];
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleMobileTabClick(item.id)}
                        data-testid={`bottom-nav-${item.id}`}
                        className="relative flex flex-col items-center justify-center h-full focus:outline-none"
                        aria-label={item.label}
                      >
                        <motion.span
                          animate={{ backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0)' }}
                          transition={{ type: 'spring', damping: 20, stiffness: 320 }}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                            isActive ? 'shadow-[0_8px_20px_rgba(0,0,0,0.30)]' : ''
                          }`}
                        >
                          <item.icon
                            weight={isActive ? 'fill' : 'regular'}
                            className={`h-[22px] w-[22px] transition-colors duration-200 ${isActive ? 'text-[#1E3328]' : 'text-white/65'}`}
                          />
                        </motion.span>
                      </motion.button>
                    );
                  })()}
                </div>


              </div>
            </motion.div>
          </nav>
        </>
      )}
    </div>
  );
}
