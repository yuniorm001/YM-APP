import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyDollar,
  TrendUp,
  TrendDown,
  Calendar,
  Target,
  Lightning,
  ArrowRight,
  Sparkle,
  Heart,
  ShieldCheck,
  Wallet,
  DoorOpen,
  Check,
  Info,
  CaretDown,
  CreditCard,
  Coins
} from '@phosphor-icons/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CATEGORY_COLORS = {
  Comida: '#2A4D3B',
  Transporte: '#B65C47',
  Hogar: '#D48B3F',
  Servicios: '#737573',
  Salud: '#4A7C6F',
  Trabajo: '#8B6B5C',
  Ocio: '#6B8E7D',
  Compras: '#A67C52',
  Otros: '#9CA39C'
};

const frequencyLabels = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  'one-time': 'Único'
};

const getMonthlyIncomeContribution = (entry) => {
  const amount = Number(entry?.amount || 0);
  const frequency = entry?.frequency || (entry?.type === 'primary' ? 'monthly' : 'one-time');

  if (frequency === 'weekly') return amount * 4.33;
  if (frequency === 'biweekly') return amount * 2;
  return amount;
};

const getMonthlyCardPaymentsTotal = (payments = [], currentDate = new Date().toISOString()) => (
  (payments || [])
    .filter((payment) => {
      const paymentDate = new Date(payment.date || payment.createdAt || currentDate);
      const current = new Date(currentDate);
      return paymentDate.getMonth() === current.getMonth() && paymentDate.getFullYear() === current.getFullYear();
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
);



const getSavingsBalance = (cash = {}) => (
  (cash?.savings?.entries || []).reduce((sum, entry) => (
    sum + (entry.type === 'withdraw' ? -Number(entry.amount || 0) : Number(entry.amount || 0))
  ), 0)
);

const getSavingsDeposits = (cash = {}) => (
  (cash?.savings?.entries || []).filter((entry) => entry.type !== 'withdraw')
);

const getSavingsDepositsInRange = (cash = {}, startDate, endDate) => (
  getSavingsDeposits(cash).filter((entry) => {
    const entryDate = new Date(entry.date || entry.createdAt || new Date().toISOString());
    return entryDate >= startDate && entryDate <= endDate;
  })
);

const getCardSavingsTotal = (cash = {}, cardId = '') => (
  getSavingsDeposits(cash)
    .filter((entry) => entry.purpose === 'card-payment' && entry.cardId === cardId)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
);

const getProgressStrokeOffset = (percentage, radius = 56) => {
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(percentage, 100));
  return circumference - (safePercentage / 100) * circumference;
};

const getCreditTone = (value) => {
  const valueEntero = Math.floor(value || 0);
  if (valueEntero <= 19) {
    return {
      stroke: '#2A4D3B',
      glow: 'shadow-[0_18px_40px_rgba(42,77,59,0.18)]',
      pill: 'bg-[#E9F5EE] text-[#2A4D3B] border-[#CFE3D8]',
      label: 'Saludable'
    };
  }
  if (valueEntero <= 29) {
    return {
      stroke: '#D48B3F',
      glow: 'shadow-[0_18px_40px_rgba(212,139,63,0.18)]',
      pill: 'bg-[#FFF4E7] text-[#A5661F] border-[#F0D2A8]',
      label: 'Moderado'
    };
  }
  return {
    stroke: '#9C382A',
    glow: 'shadow-[0_18px_40px_rgba(156,56,42,0.18)]',
    pill: 'bg-[#FFF0EC] text-[#9C382A] border-[#EDC4BB]',
    label: 'Alto'
  };
};

const getCashTone = (value) => {
  if (value >= 75) {
    return {
      stroke: '#2A4D3B',
      glow: 'shadow-[0_18px_40px_rgba(42,77,59,0.18)]',
      pill: 'bg-[#E9F5EE] text-[#2A4D3B] border-[#CFE3D8]',
      label: 'Fuerte'
    };
  }
  if (value >= 40) {
    return {
      stroke: '#4A7C6F',
      glow: 'shadow-[0_18px_40px_rgba(74,124,111,0.16)]',
      pill: 'bg-[#EEF8F5] text-[#2F6154] border-[#CFE2DB]',
      label: 'Vas bien'
    };
  }
  if (value > 0) {
    return {
      stroke: '#D48B3F',
      glow: 'shadow-[0_18px_40px_rgba(212,139,63,0.18)]',
      pill: 'bg-[#FFF4E7] text-[#A5661F] border-[#F0D2A8]',
      label: 'Justo'
    };
  }
  return {
    stroke: '#9C382A',
    glow: 'shadow-[0_18px_40px_rgba(156,56,42,0.18)]',
    pill: 'bg-[#FFF0EC] text-[#9C382A] border-[#EDC4BB]',
    label: 'Vacío'
  };
};

const getNextPaymentDate = (paymentDate, currentDate = new Date().toISOString()) => {
  if (!paymentDate) return null;

  const base = new Date(paymentDate);
  const current = new Date(currentDate);

  if (Number.isNaN(base.getTime()) || Number.isNaN(current.getTime())) return null;

  const next = new Date(current);
  next.setHours(0, 0, 0, 0);
  next.setDate(Math.min(base.getDate(), new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()));

  if (next < new Date(current.getFullYear(), current.getMonth(), current.getDate())) {
    next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(base.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  }

  return next;
};

const getDaysUntilDate = (targetDate, currentDate = new Date().toISOString()) => {
  if (!targetDate) return null;
  const current = new Date(currentDate);
  const target = new Date(targetDate);
  current.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - current) / (1000 * 60 * 60 * 24));
};

const formatCurrency = (value = 0) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(Number(value || 0));

const getCardDisplayName = (card) => {
  if (!card) return 'Tu tarjeta';
  const suffix = card.number ? ` •${card.number}` : '';
  return `${card.name || 'Tarjeta'}${suffix}`;
};

function PremiumRadialCard({
  title,
  subtitle,
  icon,
  percentage,
  valueLabel,
  hint,
  accent,
  tone,
  footer,
  onClick,
  buttonLabel,
  testId,
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(percentage, 100));
  const dashOffset = getProgressStrokeOffset(safePercentage, radius);

  return (
    <motion.div
      variants={itemVariants}
      className={`premium-card p-6 relative overflow-hidden h-full flex flex-col ${tone.glow}`}
      data-testid={testId}
    >
      <div className="absolute inset-x-6 top-0 h-24 rounded-b-[32px] opacity-70 blur-2xl" style={{ background: `linear-gradient(180deg, ${accent}22 0%, transparent 100%)` }} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]" style={{ background: `linear-gradient(135deg, ${accent} 0%, #161816 140%)` }}>
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-medium text-lg text-[#1A1C1A] leading-none">{title}</h3>
              <p className="text-sm text-[#737573] mt-1 truncate">{subtitle}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${tone.pill}`}>{tone.label}</span>
        </div>

        <div className="relative w-40 h-40 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: `radial-gradient(circle, ${accent}24 0%, transparent 70%)` }} />
          <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r={radius} fill="none" stroke="#ECE9E2" strokeWidth="12" />
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke={tone.stroke}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-[18px] rounded-full bg-white/90 backdrop-blur-sm border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] flex flex-col items-center justify-center text-center">
            <span className="metric-value text-[2rem] leading-none text-[#171917]">{valueLabel}</span>
            <span className="text-xs uppercase tracking-[0.22em] text-[#8A8D88] mt-2">Nivel actual</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#ECE9E2] bg-[#FCFBF8] p-4 mb-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8A8D88] mb-1">Resumen</p>
              <p className="metric-value text-lg text-[#1A1C1A]">{hint}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8A8D88] mb-1">Progreso</p>
              <p className="text-sm font-semibold" style={{ color: tone.stroke }}>{safePercentage.toFixed(0)}%</p>
            </div>
          </div>
          {footer && <div className="mt-3 pt-3 border-t border-[#ECE9E2]">{footer}</div>}
        </div>

        {buttonLabel && onClick && (
          <button
            onClick={onClick}
            className="w-full mt-1 flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-[#F7F5F0] py-3 text-sm font-semibold text-[#1A1C1A] transition-all hover:bg-white hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
          >
            {buttonLabel}
            <ArrowRight weight="bold" className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard({ data, onNavigate, onLogout = () => {} }) {
  const { cash, expenses, cards, goals, currentDate } = data;
  const [showDetails, setShowDetails] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const todayExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    const today = new Date(currentDate);
    return expDate.toDateString() === today.toDateString();
  });
  
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(currentDate);
  weekEnd.setHours(23, 59, 59, 999);
  
  const weekExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate >= weekStart && expDate <= weekEnd;
  });
  const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Gastos de la semana SOLO en Cash (para la meta semanal)
  const weekCashExpenses = weekExpenses.filter(e => e.method === 'Cash');
  const weekCashTotal = weekCashExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const monthExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    const current = new Date(currentDate);
    return expDate.getMonth() === current.getMonth() && expDate.getFullYear() === current.getFullYear();
  });
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Gastos del mes SOLO en Cash (para calcular disponible)
  const monthCashExpenses = monthExpenses.filter(e => e.method === 'Cash');
  const monthCashTotal = monthCashExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthEntries = (cash?.entries || []).filter((entry) => {
    const entryDate = new Date(entry.date || entry.createdAt || currentDate);
    const current = new Date(currentDate);
    return entryDate.getMonth() === current.getMonth() && entryDate.getFullYear() === current.getFullYear();
  });
  const primaryIncomeEntry = monthEntries.find((entry) => entry.type === 'primary');
  const recurringIncomeLabel = frequencyLabels[primaryIncomeEntry?.frequency || 'monthly'] || 'Mensual';
  const recurringPayAmount = Number(primaryIncomeEntry?.amount || 0);

  const monthCardPaymentsTotal = getMonthlyCardPaymentsTotal(cash.payments, currentDate);

  // Cash disponible = ingreso - gastos en cash - pagos simulados de tarjetas - dinero apartado en ahorro
  const savingsBalance = getSavingsBalance(cash);
  const savingsThisWeek = getSavingsDepositsInRange(cash, weekStart, weekEnd).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const cashAvailable = cash.income - monthCashTotal - monthCardPaymentsTotal - savingsBalance;
  const canUseSmartGoal = cashAvailable > 0;

  const totalCreditUsed = cards.reduce((sum, c) => sum + c.used, 0);
  const totalCreditLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;
  const creditUtilizationEntero = Math.floor(creditUtilization || 0);
  const getUtilizationEntero = (value) => Math.floor(value || 0);
  const totalMonthlyIncomeCapacity = Math.max(cash.income || 0, 0);
  const cashHealthPercentage = totalMonthlyIncomeCapacity > 0
    ? Math.max(0, Math.min((cashAvailable / totalMonthlyIncomeCapacity) * 100, 100))
    : (cashAvailable > 0 ? 100 : 0);
  const creditTone = getCreditTone(creditUtilization);
  const cashTone = getCashTone(cashHealthPercentage);

  // ESTADO DEL CLIENTE - Cobertura de efectivo sobre crédito usado
  const gastoCredito = totalCreditUsed;
  const cobertura = gastoCredito > 0 ? cashAvailable / gastoCredito : (cashAvailable >= 0 ? 999 : 0);
  
  const getClientStatus = () => {
    // Si no hay tarjetas, siempre saludable
    if (cards.length === 0 || gastoCredito === 0) {
      return {
        estado: 'Saludable',
        color: '#2A4D3B',
        bgColor: '#2A4D3B',
        icon: '🟢',
        mensaje: 'No usas crédito, tu situación es óptima'
      };
    }
    
    if (cobertura >= 1) {
      return {
        estado: 'Saludable',
        color: '#2A4D3B',
        bgColor: '#2A4D3B',
        icon: '🟢',
        mensaje: 'Tu efectivo cubre completamente tu crédito usado'
      };
    } else if (cobertura >= 0.5) {
      return {
        estado: 'Moderado',
        color: '#D48B3F',
        bgColor: '#D48B3F',
        icon: '🟡',
        mensaje: 'Tu efectivo cubre parcialmente tu crédito'
      };
    } else {
      return {
        estado: 'Actúa hoy',
        color: '#9C382A',
        bgColor: '#9C382A',
        icon: '🔴',
        mensaje: 'Estás usando más tarjeta de lo que tu dinero disponible puede cubrir'
      };
    }
  };
  
  const clientStatus = getClientStatus();

  const categoryData = Object.entries(
    monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#737573' }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (6 - i));
    const dayExpenses = expenses.filter(e => new Date(e.date).toDateString() === date.toDateString());
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      day: date.toLocaleDateString('es', { weekday: 'short' }),
      amount: total
    };
  });

  const current = new Date(currentDate);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const currentWeekOfMonth = Math.ceil(current.getDate() / 7);
  const totalWeeksInMonth = Math.ceil(getDaysInMonth(current) / 7);
  const remainingDaysInWeek = Math.max(7 - current.getDay(), 1);
  const remainingDaysInMonth = Math.max(getDaysInMonth(current) - current.getDate() + 1, 1);
  const remainingWeeksInMonth = Math.max(totalWeeksInMonth - currentWeekOfMonth + 1, 1);

  const totalExpenseMonth = monthTotal;
  const averageDailySpend = current.getDate() > 0 ? totalExpenseMonth / current.getDate() : 0;
  const projectedMonthSpend = averageDailySpend * getDaysInMonth(current);
  const savingsRate = totalMonthlyIncomeCapacity > 0 ? Math.max(0, Math.min((cashAvailable / totalMonthlyIncomeCapacity) * 100, 100)) : 0;
  const monthRunwayDays = averageDailySpend > 0 ? Math.max(cashAvailable, 0) / averageDailySpend : 0;
  const financialPulseData = [
    {
      label: 'Ingreso',
      value: totalMonthlyIncomeCapacity,
      color: '#2A4D3B',
      width: totalMonthlyIncomeCapacity > 0 ? 100 : 0,
      helper: 'Base mensual'
    },
    {
      label: 'Gastos',
      value: totalExpenseMonth,
      color: '#B65C47',
      width: totalMonthlyIncomeCapacity > 0 ? Math.min((totalExpenseMonth / totalMonthlyIncomeCapacity) * 100, 100) : 0,
      helper: `${monthExpenses.length} movimientos`
    },
    {
      label: 'Pagos tarjetas',
      value: monthCardPaymentsTotal,
      color: '#D48B3F',
      width: totalMonthlyIncomeCapacity > 0 ? Math.min((monthCardPaymentsTotal / totalMonthlyIncomeCapacity) * 100, 100) : 0,
      helper: 'Impacto mensual'
    },
  ];

  const isWeeklyGoal = goals.type === 'weekly';
  const goalSpent = isWeeklyGoal ? weekCashTotal : monthCashTotal;
  const goalProgress = goals.amount > 0 ? Math.min((goalSpent / goals.amount) * 100, 100) : 0;
  const remainingGoal = Math.max(goals.amount - goalSpent, 0);
  const suggestedDailyBudget = remainingGoal / (isWeeklyGoal ? remainingDaysInWeek : remainingDaysInMonth);
  const suggestedWeeklyBudget = remainingGoal / remainingWeeksInMonth;

  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(weekStart);
  previousWeekEnd.setMilliseconds(previousWeekEnd.getMilliseconds() - 1);

  const previousWeekExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date);
    return expDate >= previousWeekStart && expDate <= previousWeekEnd;
  });
  const previousWeekTotal = previousWeekExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const previousWeekCashTotal = previousWeekExpenses
    .filter((e) => e.method === 'Cash')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const previousMonthDate = new Date(current);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === previousMonthDate.getMonth() && expDate.getFullYear() === previousMonthDate.getFullYear();
  });
  const previousMonthCashTotal = previousMonthExpenses
    .filter((e) => e.method === 'Cash')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const getMostRecentPaymentDate = (paymentDate) => {
    const nextPaymentDate = getNextPaymentDate(paymentDate, currentDate);
    if (!nextPaymentDate) return null;

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const recentPaymentDate = new Date(nextPaymentDate);
    if (recentPaymentDate > today) {
      recentPaymentDate.setMonth(recentPaymentDate.getMonth() - 1);
    }
    recentPaymentDate.setHours(0, 0, 0, 0);
    return recentPaymentDate;
  };

  const getStatementCycleStatus = (card, daysLeft) => {
    const lastPaymentDate = getMostRecentPaymentDate(card?.paymentDate);
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    if (!lastPaymentDate || daysLeft === null) {
      return {
        isConfirmed: false,
        needsConfirmation: false,
        isFuturePayment: false,
        daysSincePayment: null,
        title: 'Estado de cuenta no configurado',
        badge: 'Sin dato',
        color: '#737573'
      };
    }

    const statementClosedAt = card?.statementClosedAt ? new Date(card.statementClosedAt) : null;
    const isConfirmed = Boolean(
      statementClosedAt &&
      !Number.isNaN(statementClosedAt.getTime()) &&
      statementClosedAt >= lastPaymentDate
    );
    const daysSincePayment = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
    const paymentArrived = daysLeft <= 0;

    if (isConfirmed) {
      return {
        isConfirmed: true,
        needsConfirmation: false,
        isFuturePayment: false,
        daysSincePayment,
        title: 'Estado de cuenta confirmado',
        badge: 'Confirmado',
        color: '#2A4D3B'
      };
    }

    if (paymentArrived) {
      return {
        isConfirmed: false,
        needsConfirmation: true,
        isFuturePayment: false,
        daysSincePayment,
        title: 'Esperando estado de cuenta',
        badge: 'No usar aún',
        color: '#D48B3F'
      };
    }

    return {
      isConfirmed: false,
      needsConfirmation: false,
      isFuturePayment: true,
      daysSincePayment,
      title: 'Ciclo en preparación',
      badge: 'Pago pendiente',
      color: '#737573'
    };
  };

  const cardInsights = cards.map((card) => {
    const limit = Number(card.limit || 0);
    const used = Number(card.used || 0);
    const utilization = limit > 0 ? (used / limit) * 100 : 0;
    const nextPaymentDate = getNextPaymentDate(card.paymentDate, currentDate);
    const daysLeft = getDaysUntilDate(nextPaymentDate, currentDate);
    const targetTenPercent = Math.max(0, used - limit * 0.10);
    const targetThirtyPercent = Math.max(0, used - limit * 0.30);
    const weeklyCardSpend = weekExpenses
      .filter((expense) => expense.cardId === card.id)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const monthlyCardSpend = monthExpenses
      .filter((expense) => expense.cardId === card.id)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const statementStatus = getStatementCycleStatus(card, daysLeft);

    return {
      ...card,
      limit,
      used,
      utilization,
      nextPaymentDate,
      daysLeft,
      targetTenPercent,
      targetThirtyPercent,
      weeklyCardSpend,
      monthlyCardSpend,
      statementStatus
    };
  });

  const highestUtilizationCard = [...cardInsights].sort((a, b) => b.utilization - a.utilization)[0] || null;
  const nearestPaymentCard = [...cardInsights]
    .filter((card) => card.daysLeft !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0] || null;
  const mostUsedCard = [...cardInsights].sort((a, b) => b.used - a.used)[0] || null;
  const mostDangerousCard = [...cardInsights].sort((a, b) => (b.utilization + (b.daysLeft !== null && b.daysLeft <= 5 ? 8 : 0)) - (a.utilization + (a.daysLeft !== null && a.daysLeft <= 5 ? 8 : 0)))[0] || null;

  const topCategory = categoryData.length > 0
    ? [...categoryData].sort((a, b) => b.value - a.value)[0]
    : null;
  const lowestCategory = categoryData.length > 1
    ? [...categoryData].filter((item) => item.value > 0).sort((a, b) => a.value - b.value)[0]
    : null;

  const weekdayTotals = monthExpenses.reduce((acc, expense) => {
    const weekday = new Date(expense.date).getDay();
    acc[weekday] = (acc[weekday] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const weekdayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const strongestWeekdays = Object.entries(weekdayTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([day]) => weekdayNames[Number(day)]);

  const repeatedSmallTopCategoryCount = topCategory
    ? monthExpenses.filter((expense) => expense.category === topCategory.name && Number(expense.amount || 0) <= 25).length
    : 0;

  const weeklyDelta = weekTotal - previousWeekTotal;
  const monthlyCashDelta = monthCashTotal - previousMonthCashTotal;
  const currentWeekDayIndex = current.getDay() === 0 ? 7 : current.getDay();
  const weekDaysRemaining = Math.max(7 - currentWeekDayIndex, 0);
  const weeklySpendRate = weekTotal / Math.max(currentWeekDayIndex, 1);
  const projectedWeekSpend = weekTotal + (weeklySpendRate * weekDaysRemaining);
  const extraCashCapacity = Math.max(cashAvailable - Math.max(recurringPayAmount * 0.15, 35), 0);
  const opportunityPayment = highestUtilizationCard ? Math.min(extraCashCapacity, highestUtilizationCard.targetTenPercent) : 0;
  const projectedRiskCardUtilization = highestUtilizationCard && highestUtilizationCard.limit > 0
    ? ((highestUtilizationCard.used + (highestUtilizationCard.weeklyCardSpend / Math.max(currentWeekDayIndex, 1)) * weekDaysRemaining) / highestUtilizationCard.limit) * 100
    : 0;

  const pulseMood = getUtilizationEntero(highestUtilizationCard?.utilization) >= 30 || cashAvailable < 0
    ? 'serious'
    : weeklyDelta < 0 || creditUtilizationEntero <= 29
      ? 'motivating'
      : 'balanced';

  let pulseTodayLine = 'Hoy sigue tu ritmo con control y revisa antes de usar crédito.';
  if (highestUtilizationCard && getUtilizationEntero(highestUtilizationCard.utilization) >= 30) {
    pulseTodayLine = `Hoy no deberías usar ${getCardDisplayName(highestUtilizationCard)}.`;
  } else if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 3 && nearestPaymentCard.used > 0) {
    pulseTodayLine = `Hoy prioriza ${getCardDisplayName(nearestPaymentCard)} antes del próximo pago.`;
  } else if (canUseSmartGoal && remainingGoal > 0) {
    pulseTodayLine = `Hoy sí puedes gastar hasta ${formatCurrency(Math.max(suggestedDailyBudget, 0))} sin pasar tu meta.`;
  } else if (cashAvailable <= 0) {
    pulseTodayLine = 'Hoy conviene frenar compras y proteger tu cash.';
  }

  const pulseCritical = getUtilizationEntero(highestUtilizationCard?.utilization) >= 30 || cashAvailable < 0 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 0 && nearestPaymentCard?.used > 0);
  const pulseAttention = !pulseCritical && (getUtilizationEntero(highestUtilizationCard?.utilization) >= 20 || cashHealthPercentage < 40 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 && nearestPaymentCard?.used > 0));
  const pulseStatusLabel = pulseCritical ? 'Actúa hoy' : pulseAttention ? 'Revisa esto' : 'Vas bien';
  const pulseStatusClass = pulseCritical ? 'critical' : pulseAttention ? 'attention' : 'stable';
  const pulseActionTitle = pulseCritical ? 'Lo primero que debes hacer' : pulseAttention ? 'Próximo paso' : 'Mantén este ritmo';
  const pulseActionText = pulseCritical
    ? (getUtilizationEntero(highestUtilizationCard?.utilization) >= 30
      ? `Baja ${getCardDisplayName(highestUtilizationCard)} por debajo de 30% antes de seguir usando crédito.`
      : 'Pausa compras variables y protege efectivo antes de asumir más pagos.')
    : pulseAttention
      ? (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 && nearestPaymentCard?.used > 0
        ? `Prepara el pago de ${getCardDisplayName(nearestPaymentCard)} en los próximos ${Math.max(nearestPaymentCard.daysLeft, 0)} días.`
        : 'Mantén el uso de tarjetas debajo de 30% y revisa tu dinero disponible antes de comprar.')
      : 'Puedes seguir operando, pero conserva margen antes de usar crédito.';
  const commandMetrics = [
    { label: 'Estado', value: pulseStatusLabel, tone: pulseStatusClass },
    { label: 'Uso de tarjetas', value: `${creditUtilizationEntero}%`, tone: creditUtilizationEntero <= 19 ? 'stable' : creditUtilizationEntero <= 29 ? 'attention' : 'critical' },
    { label: 'Dinero disponible', value: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cashAvailable), tone: cashAvailable > 0 ? 'stable' : 'critical' },
    { label: 'Pago próximo', value: nearestPaymentCard?.daysLeft !== null && nearestPaymentCard ? `${Math.max(nearestPaymentCard.daysLeft, 0)} día${Math.max(nearestPaymentCard.daysLeft, 0) === 1 ? '' : 's'}` : 'Sin alerta', tone: nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 ? 'attention' : 'neutral' }
  ];

  // ============================================================
  // Tareas diarias — motor más profundo.
  // La app genera varias tareas internas, prioriza por riesgo y solo
  // muestra 6 en la pantalla principal para no cargar el inicio.
  // ============================================================
  const dailyTasks = [];
  const taskIds = new Set();
  const addTask = (task) => {
    if (!task?.id || taskIds.has(task.id)) return;
    taskIds.add(task.id);
    dailyTasks.push({ priority: 50, ...task });
  };

  const cardsByUtilization = [...cardInsights].sort((a, b) => b.utilization - a.utilization);
  const cardsByPaymentUrgency = [...cardInsights]
    .filter((card) => card.daysLeft !== null && card.used > 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const pendingStatementCards = cardInsights.filter((card) => card.statementStatus?.needsConfirmation);
  const confirmedStatementCards = cardInsights.filter((card) => card.statementStatus?.isConfirmed);
  const healthyUseCards = cardInsights
    .filter((card) => card.limit > 0 && card.used < card.limit * 0.10 && card.daysLeft !== null && card.daysLeft > 3 && !card.statementStatus?.needsConfirmation)
    .sort((a, b) => (b.limit - b.used) - (a.limit - a.used));
  const bestUseCard = healthyUseCards[0] || null;

  // Base: revisión general. Solo se muestra como pendiente cuando falta información
  // o cuando el uso requiere atención. No la marcamos como completada automáticamente.
  const hasReviewedBalance = cards.length > 0 || cardInsights.length > 0;
  if (!hasReviewedBalance) {
    addTask({
      id: 'review-balance',
      title: 'Agrega una tarjeta para recibir guía',
      help: 'Cuando agregues tus tarjetas, la app podrá crear tareas específicas de pago, uso y estado de cuenta.',
      done: false,
      tone: 'neutral',
      priority: 95
    });
  } else if (creditUtilizationEntero >= 20) {
    addTask({
      id: 'review-balance',
      title: 'Revisa tu uso total de tarjetas',
      help: `Estás usando ${creditUtilizationEntero}% de tu límite total. Revisa qué tarjeta está subiendo más y evita nuevas compras innecesarias.`,
      done: false,
      tone: creditUtilizationEntero >= 30 ? 'urgent' : 'normal',
      priority: 32
    });
  }

  // 1) Estado de cuenta / corte: conectar la nueva lógica con tareas.
  pendingStatementCards.slice(0, 3).forEach((card, index) => {
    addTask({
      id: `statement-pending-${card.id || index}`,
      title: `Confirma si ya llegó el estado de cuenta de ${getCardDisplayName(card)}`,
      help: 'Ya llegó o pasó la fecha de pago. No uses esta tarjeta hasta confirmar que el banco envió el nuevo estado de cuenta.',
      done: false,
      tone: 'critical',
      priority: 5 + index,
      chips: [
        { label: 'No usar aún', tone: 'red' },
        { label: card.statementStatus?.daysSincePayment === 0 ? 'Pago hoy' : `${card.statementStatus?.daysSincePayment || 0}d desde pago`, tone: 'amber' }
      ]
    });
  });

  // Las tarjetas con estado de cuenta confirmado ya se muestran dentro de cada tarjeta.
  // No creamos una tarea completada aparte para evitar tareas "fantasma"
  // que el cliente no vio antes como acción pendiente.

  // 2) Pagos próximos o vencidos: una tarea por tarjeta urgente, no solo una global.
  cardsByPaymentUrgency.slice(0, 4).forEach((card, index) => {
    const dl = Math.max(card.daysLeft, 0);
    if (card.daysLeft <= 7) {
      addTask({
        id: `payment-${card.id || index}`,
        title: card.daysLeft <= 0
          ? `Paga hoy ${getCardDisplayName(card)}`
          : `Prepara tu pago de ${getCardDisplayName(card)}`,
        help: card.daysLeft <= 0
          ? 'Vence hoy o ya pasó. Atiéndela antes de asumir más gastos con tarjeta.'
          : `Vence en ${dl} día${dl === 1 ? '' : 's'}. Aparta ${formatCurrency(card.used)} antes de esa fecha.`,
        done: false,
        tone: card.daysLeft <= 2 ? 'critical' : 'urgent',
        priority: card.daysLeft <= 0 ? 1 : 10 + dl + index,
        chips: [
          { label: card.daysLeft <= 0 ? 'Hoy' : `${dl} día${dl === 1 ? '' : 's'}`, tone: card.daysLeft <= 2 ? 'red' : 'amber' },
          { label: formatCurrency(card.used), tone: 'neutral' }
        ]
      });
    }
  });

  // 3) Utilización: tareas específicas por tarjeta.
  cardsByUtilization.slice(0, 4).forEach((card, index) => {
    const utilization = getUtilizationEntero(card.utilization);
    if (utilization >= 30) {
      const paymentToHealthy = Math.ceil(card.targetThirtyPercent || card.targetTenPercent || 0);
      addTask({
        id: `high-utilization-${card.id || index}`,
        title: `Baja el uso de ${getCardDisplayName(card)}`,
        help: `Está en ${utilization}%. Si pagas ${formatCurrency(paymentToHealthy)}, la acercas a una zona más sana. Evita seguir usándola hoy.`,
        done: false,
        tone: 'urgent',
        priority: 20 + index,
        chips: [
          { label: `Ahora: ${utilization}%`, tone: 'red' },
          { label: `Pago sugerido: ${formatCurrency(paymentToHealthy)}`, tone: 'green' }
        ]
      });
    } else if (utilization >= 20) {
      addTask({
        id: `moderate-utilization-${card.id || index}`,
        title: `No subas más ${getCardDisplayName(card)} por ahora`,
        help: `Va en ${utilization}%. Todavía no está crítica, pero cualquier compra nueva la puede acercar al 30%.`,
        done: false,
        tone: 'urgent',
        priority: 35 + index,
        chips: [
          { label: `Ahora: ${utilization}%`, tone: 'amber' },
          { label: 'Meta: <30%', tone: 'green' }
        ]
      });
    }

    if (card.targetTenPercent > 0 && card.targetTenPercent <= Math.max(extraCashCapacity, 25)) {
      addTask({
        id: `ten-percent-opportunity-${card.id || index}`,
        title: `Puedes acercar ${getCardDisplayName(card)} al 10% ideal`,
        help: `Con un pago de ${formatCurrency(card.targetTenPercent)}, esa tarjeta queda cerca de la zona recomendada para proteger mejor tu perfil.`,
        done: false,
        tone: 'normal',
        priority: 45 + index,
        chips: [
          { label: `10%: ${formatCurrency(card.limit * 0.10)}`, tone: 'green' },
          { label: `Pagar: ${formatCurrency(card.targetTenPercent)}`, tone: 'neutral' }
        ]
      });
    }
  });

  // 4) Tarjeta recomendada / tarjeta a evitar.
  if (bestUseCard) {
    addTask({
      id: `best-card-${bestUseCard.id || 'today'}`,
      title: `Si necesitas comprar, usa primero ${getCardDisplayName(bestUseCard)}`,
      help: `Tiene buen margen y menor presión hoy. Mantén el gasto cerca de ${formatCurrency(bestUseCard.limit * 0.10)} o menos.`,
      done: false,
      tone: 'normal',
      priority: 60,
      chips: [
        { label: 'Mejor opción hoy', tone: 'green' },
        { label: `Disponible: ${formatCurrency(bestUseCard.limit - bestUseCard.used)}`, tone: 'neutral' }
      ]
    });
  }

  const avoidCard = cardsByUtilization.find((card) => getUtilizationEntero(card.utilization) >= 20 || card.statementStatus?.needsConfirmation || (card.daysLeft !== null && card.daysLeft <= 3 && card.used > 0));
  if (avoidCard) {
    addTask({
      id: `avoid-card-${avoidCard.id || 'today'}`,
      title: `Evita usar ${getCardDisplayName(avoidCard)} hoy`,
      help: avoidCard.statementStatus?.needsConfirmation
        ? 'Falta confirmar el estado de cuenta. Usarla ahora puede meter consumo nuevo en el ciclo equivocado.'
        : 'Tiene presión por uso o pago cercano. Usa otra tarjeta más saludable si necesitas comprar.',
      done: false,
      tone: 'urgent',
      priority: 30,
      chips: [
        { label: avoidCard.statementStatus?.needsConfirmation ? 'Falta estado' : `Uso: ${getUtilizationEntero(avoidCard.utilization)}%`, tone: 'amber' },
        { label: 'Evitar hoy', tone: 'red' }
      ]
    });
  }

  // 5) Cash y flujo de dinero.
  if (cashAvailable <= 0) {
    addTask({
      id: 'pause-spending',
      title: 'Frena las compras grandes hoy',
      help: 'Tu efectivo está en cero o negativo. Antes de usar crédito, espera ingreso o baja gastos no esenciales.',
      done: false,
      tone: 'critical',
      priority: 8,
      chips: [
        { label: 'Cash bajo', tone: 'red' },
        { label: 'Prioridad', tone: 'amber' }
      ]
    });
  }

  // Ahorro semanal: siempre debe existir como tarea visible/expandible antes de completarse.
  // Así la app no crea una tarea completada "de la nada" después de apartar dinero.
  const savingsTarget = Math.max(20, Math.round(Math.max(recurringPayAmount * 0.05, 20)));
  const savedEnoughThisWeek = savingsThisWeek >= savingsTarget;
  const shouldShowSavingsTask = totalMonthlyIncomeCapacity > 0 || cashAvailable > 0 || savingsThisWeek > 0 || savingsBalance > 0;

  if (shouldShowSavingsTask) {
    addTask({
      id: 'save-cash',
      title: savedEnoughThisWeek ? 'Ahorro semanal activado' : 'Guarda algo de efectivo esta semana',
      help: savedEnoughThisWeek
        ? `Ya apartaste ${formatCurrency(savingsThisWeek)} esta semana. Ese dinero queda fuera del cash disponible para que no lo gastes sin darte cuenta.`
        : cashAvailable <= 0
          ? `Cuando tengas efectivo disponible, intenta apartar ${formatCurrency(savingsTarget)} en Ahorro inteligente para crear un colchón.`
          : `Aparta aunque sean ${formatCurrency(savingsTarget)} para emergencias desde Ahorro inteligente. Te ayuda a no depender solo de la tarjeta.`,
      done: savedEnoughThisWeek,
      tone: 'normal',
      priority: savedEnoughThisWeek ? 89 : (cashAvailable <= 0 ? 78 : 65),
      chips: [
        { label: savedEnoughThisWeek ? `Ahorrado: ${formatCurrency(savingsThisWeek)}` : `Meta: ${formatCurrency(savingsTarget)}`, tone: savedEnoughThisWeek ? 'green' : 'green' },
        { label: 'Esta semana', tone: 'neutral' }
      ]
    });
  }

  if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 7 && cashAvailable < nearestPaymentCard.used) {
    const reservedForNearestPayment = getCardSavingsTotal(cash, nearestPaymentCard.id);
    const paymentReserveCovered = reservedForNearestPayment >= Math.min(nearestPaymentCard.used, Math.max(nearestPaymentCard.used - cashAvailable, 20));

    // Si la reserva ya cubre el pago, no agregamos una tarea completada nueva.
    // Ese avance ya se refleja en Ahorro inteligente y en la tarea semanal de ahorro.
    if (!paymentReserveCovered) {
      addTask({
        id: 'cash-cover-payment',
        title: `Tu cash no cubre bien el pago de ${getCardDisplayName(nearestPaymentCard)}`,
        help: `Tienes ${formatCurrency(cashAvailable)} disponible y el balance es ${formatCurrency(nearestPaymentCard.used)}. Reserva dinero en Ahorro inteligente antes de gastar más.`,
        done: false,
        tone: 'critical',
        priority: 12,
        chips: [
          { label: `Cash: ${formatCurrency(cashAvailable)}`, tone: 'red' },
          { label: `Pago: ${formatCurrency(nearestPaymentCard.used)}`, tone: 'neutral' }
        ]
      });
    }
  }

  // Nota: no agregamos una tarea completada aparte por tener ahorro activo.
  // El progreso de ahorro vive en la tarea 'save-cash', para que el cliente
  // vea la misma tarea antes y después de apartar dinero.

  // 6) Hábitos y educación diaria. Se mantienen abajo, para enseñar sin abrumar.
  if (weekTotal > 0 && previousWeekTotal > 0 && weeklyDelta > 0) {
    addTask({
      id: 'weekly-spend-control',
      title: 'Controla el ritmo de gastos esta semana',
      help: `Vas ${formatCurrency(weeklyDelta)} por encima de la semana pasada. Baja compras pequeñas para cerrar mejor.`,
      done: false,
      tone: 'normal',
      priority: 75,
      chips: [
        { label: `+${formatCurrency(weeklyDelta)}`, tone: 'amber' },
        { label: 'Esta semana', tone: 'neutral' }
      ]
    });
  }

  if (cards.length > 0 && creditUtilizationEntero >= 30) {
    addTask({
      id: 'utilization-rule',
      title: 'Baja tus tarjetas por debajo del 30%',
      help: cards[0].limit
        ? `Tu uso total está en ${creditUtilizationEntero}%. Intenta bajarlo por debajo de 30% para proteger mejor tu puntaje.`
        : 'Mantén el uso por debajo del 30% de tu límite total. Eso ayuda a cuidar tu puntaje de crédito.',
      done: false,
      tone: 'urgent',
      priority: 28,
      chips: [
        { label: `Vas en ${creditUtilizationEntero}%`, tone: 'red' },
        { label: 'Meta: <30%', tone: 'green' }
      ]
    });
  }

  if (pendingStatementCards.length > 0) {
    addTask({
      id: 'payment-vs-statement-lesson',
      title: 'Recuerda: pago no es lo mismo que estado de cuenta',
      help: 'Después de pagar, espera el estado de cuenta antes de volver a usar la tarjeta si quieres proteger lo que se reporta.',
      done: false,
      tone: 'normal',
      priority: 25,
      chips: [
        { label: 'Educación', tone: 'neutral' },
        { label: 'Ciclo mensual', tone: 'amber' }
      ]
    });
  }

  // Regla anti-tareas fantasma:
  // Una tarea marcada como completada solo debe aparecer si es la misma tarea
  // que el cliente pudo ver antes como acción pendiente. Los estados positivos
  // detectados por la app se muestran en sus bloques correspondientes, no como tareas.
  const allowedCompletedTaskIds = new Set(['save-cash']);
  for (let i = dailyTasks.length - 1; i >= 0; i -= 1) {
    if (dailyTasks[i]?.done && !allowedCompletedTaskIds.has(dailyTasks[i].id)) {
      dailyTasks.splice(i, 1);
    }
  }

  dailyTasks.sort((a, b) => (a.done === b.done ? a.priority - b.priority : a.done ? 1 : -1));
  const visibleTaskLimit = 6;
  const displayedDailyTasks = showAllTasks ? dailyTasks : dailyTasks.slice(0, visibleTaskLimit);
  const hiddenTasksCount = Math.max(dailyTasks.length - displayedDailyTasks.length, 0);

  const tasksDone = dailyTasks.filter((t) => t.done).length;
  const tasksTotal = dailyTasks.length;
  const tasksProgressPct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const tasksProgressLabel = tasksProgressPct === 100
    ? '¡Día completado!'
    : tasksProgressPct >= 75
      ? 'Vas bien — falta poco'
      : tasksProgressPct >= 50
        ? 'A buen ritmo'
        : tasksProgressPct >= 25
          ? 'Buen comienzo'
          : 'Empecemos por la primera';

  // Una "razón" educativa que aparece debajo de las tareas
  let whyTitle = 'Usar menos del 30% te ayuda a verte responsable';
  let whyText = 'Los bancos ven cuánto de tu límite usas. Mientras menos dependas de la tarjeta, más sano se ve tu perfil para futuras oportunidades.';
  if (highestUtilizationCard && getUtilizationEntero(highestUtilizationCard.utilization) >= 30) {
    whyTitle = 'Pasar de 30% puede afectar tu puntaje aunque pagues a tiempo';
    whyText = 'El banco mide cuánto debes vs cuánto te prestaron. Aunque pagues completo después, reportar saldo alto puede afectar tu puntaje de crédito.';
  } else if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 5 && nearestPaymentCard.used > 0) {
    whyTitle = 'Pagar antes de la fecha de corte cuenta más';
    whyText = 'No es lo mismo pagar antes del corte que antes del límite. El corte es cuando el banco "toma la foto" de tu deuda.';
  } else if (cashAvailable <= 0) {
    whyTitle = 'El efectivo es tu colchón antes de usar crédito';
    whyText = 'Si tienes ahorro, no necesitas la tarjeta para emergencias. Eso te mantiene fuera de intereses.';
  }

  let contextualTip = 'Mantén el uso por debajo del 30% de tu límite de crédito.';
  if (highestUtilizationCard && getUtilizationEntero(highestUtilizationCard.utilization) >= 30) {
    contextualTip = 'Superar 30% puede presionar tu puntaje de crédito, aunque pagues a tiempo.';
  } else if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 5 && nearestPaymentCard.used > 0) {
    contextualTip = 'Paga antes de la fecha de corte, no solo la fecha límite.';
  } else if (cardInsights.some((card) => card.used > 0)) {
    contextualTip = 'Pagar el mínimo prolonga la deuda y aumenta intereses.';
  } else if (cards.length > 0) {
    contextualTip = 'Cerrar tarjetas puede afectar tu puntaje de crédito y tu antigüedad promedio.';
  }

  // ============================================================
  // SEMÁFORO HUMANO — un solo número resumen para el cliente
  // ============================================================
  let semaforoLevel = 'green'; // green | amber | red
  let semaforoEmoji = '🟢';
  let semaforoTitle = 'Vas bien';
  let semaforoMessage = 'Tu dinero y tus tarjetas se ven bajo control. Mantén este ritmo.';

  if (getUtilizationEntero(highestUtilizationCard?.utilization) >= 30 || cashAvailable < 0 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 0 && nearestPaymentCard?.used > 0)) {
    semaforoLevel = 'red';
    semaforoEmoji = '🔴';
    semaforoTitle = 'Actúa hoy';
    semaforoMessage = getUtilizationEntero(highestUtilizationCard?.utilization) >= 30
      ? `Estás usando ${getUtilizationEntero(highestUtilizationCard.utilization)}% de ${getCardDisplayName(highestUtilizationCard)}. Hoy conviene bajar ese saldo.`
      : cashAvailable < 0
        ? 'Tus gastos superaron lo que tienes. Pausa compras grandes hasta tu próximo ingreso.'
        : `Hoy vence un pago. Atiéndelo antes de que te cobren intereses.`;
  } else if (getUtilizationEntero(highestUtilizationCard?.utilization) >= 20 || cashHealthPercentage < 40 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 && nearestPaymentCard?.used > 0)) {
    semaforoLevel = 'amber';
    semaforoEmoji = '🟡';
    semaforoTitle = 'Revisa esto';
    semaforoMessage = getUtilizationEntero(highestUtilizationCard?.utilization) >= 20
      ? `Tu uso de tarjeta va en ${getUtilizationEntero(highestUtilizationCard.utilization)}%. Intenta mantenerlo debajo de 30%.`
      : nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5
        ? `Tienes un pago en ${Math.max(nearestPaymentCard.daysLeft, 0)} día${Math.max(nearestPaymentCard.daysLeft, 0) === 1 ? '' : 's'}. Aparta el dinero esta semana.`
        : 'Tu efectivo está bajo. Cuida los gastos no esenciales esta semana.';
  } else if (cards.length === 0 && cashAvailable === 0) {
    semaforoLevel = 'amber';
    semaforoEmoji = '🟡';
    semaforoTitle = 'Configura tu guía';
    semaforoMessage = 'Agrega tus tarjetas e ingresos para que la app te diga qué hacer primero.';
  }

  // ============================================================
  // FRASE SEMANAL — un resumen humano en una línea
  // ============================================================
  let weeklySummary = '';
  let weeklySummaryTone = 'neutral'; // good | neutral | warn

  if (weekTotal === 0) {
    weeklySummary = 'No has registrado gastos esta semana todavía.';
    weeklySummaryTone = 'neutral';
  } else if (previousWeekTotal === 0) {
    weeklySummary = `Llevas ${formatCurrency(weekTotal)} esta semana en ${weekExpenses.length} gasto${weekExpenses.length === 1 ? '' : 's'}.`;
    weeklySummaryTone = 'neutral';
  } else if (weeklyDelta < 0) {
    weeklySummary = `Has gastado ${formatCurrency(weekTotal)}. Vas mejor que la semana pasada por ${formatCurrency(Math.abs(weeklyDelta))}.`;
    weeklySummaryTone = 'good';
  } else if (weeklyDelta > 0) {
    weeklySummary = `Has gastado ${formatCurrency(weekTotal)} — ${formatCurrency(weeklyDelta)} más que la semana pasada.`;
    weeklySummaryTone = 'warn';
  } else {
    weeklySummary = `Has gastado ${formatCurrency(weekTotal)} esta semana, igual que la anterior.`;
    weeklySummaryTone = 'neutral';
  }

  // ============================================================
  // BLOQUE "MI DINERO" — datos limpios para el cliente
  // ============================================================
  const myMoneyHelper = cashAvailable <= 0
    ? 'Este es el dinero que te queda disponible después de tus gastos y pagos. Ahora está en cero o negativo.'
    : monthRunwayDays > 0 && averageDailySpend > 0
      ? `Este es el dinero que te queda disponible después de tus gastos y pagos. Al ritmo actual, te alcanza para ${Math.round(monthRunwayDays)} día${Math.round(monthRunwayDays) === 1 ? '' : 's'}.`
      : 'Este es el dinero que te queda disponible después de tus gastos y pagos.';

  // ============================================================
  // BLOQUE "MIS TARJETAS" — datos limpios
  // ============================================================
  const myCardsHelper = cards.length === 0
    ? 'Aún no has agregado tarjetas. Agrégalas para ver cuánto estás usando.'
    : creditUtilization === 0
      ? 'Este es el total que estás usando de tus tarjetas. Ahora mismo no tienes uso registrado.'
      : creditUtilization < 30
        ? `Este es el total que estás usando de tus tarjetas: ${creditUtilizationEntero}%. Vas bien.`
        : creditUtilization < 50
          ? `Este es el total que estás usando de tus tarjetas: ${creditUtilizationEntero}%. Procura bajarlo de 30% para cuidar tu puntaje de crédito.`
          : `Este es el total que estás usando de tus tarjetas: ${creditUtilizationEntero}%. Es alto; paga lo más que puedas este mes.`;

  const tickerMessages = [];
  const addTickerMessage = (text, tone = 'neutral') => {
    if (!text || tickerMessages.some((item) => item.text === text)) return;
    tickerMessages.push({ text, tone });
  };

  if (highestUtilizationCard && getUtilizationEntero(highestUtilizationCard.utilization) >= 30) {
    addTickerMessage(
      `Actúa hoy · ${getCardDisplayName(highestUtilizationCard)} llegó a ${getUtilizationEntero(highestUtilizationCard.utilization)}% — paga ${formatCurrency(highestUtilizationCard.targetThirtyPercent || highestUtilizationCard.targetTenPercent)} para volver a una zona más sana.`,
      'danger'
    );
  } else if (highestUtilizationCard && getUtilizationEntero(highestUtilizationCard.utilization) >= 20) {
    addTickerMessage(
      `Revisa esto · ${getCardDisplayName(highestUtilizationCard)} va en ${getUtilizationEntero(highestUtilizationCard.utilization)}% — si pagas ${formatCurrency(highestUtilizationCard.targetThirtyPercent)}, vuelves debajo de 30%.`,
      'warning'
    );
  } else if (creditUtilization > 0) {
    addTickerMessage(`Positivo · Tu uso total va en ${creditUtilizationEntero}%. Bien. Mantenerlo bajo te da más margen.`, 'success');
  }

  if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null) {
    if (nearestPaymentCard.daysLeft <= 0 && nearestPaymentCard.used > 0) {
      addTickerMessage(`Actúa hoy · Hoy vence ${getCardDisplayName(nearestPaymentCard)} y aún tienes ${formatCurrency(nearestPaymentCard.used)} pendientes.`, 'danger');
    } else if (nearestPaymentCard.daysLeft <= 3 && nearestPaymentCard.used > 0) {
      addTickerMessage(`Revisa esto · Tu pago vence en ${nearestPaymentCard.daysLeft} día${nearestPaymentCard.daysLeft === 1 ? '' : 's'} — evita reportar saldo alto en ${getCardDisplayName(nearestPaymentCard)}.`, 'warning');
    } else if (nearestPaymentCard.daysLeft <= 7) {
      addTickerMessage(`Revisa esto · Tienes pago pronto en ${getCardDisplayName(nearestPaymentCard)}. Organízalo esta semana.`, 'info');
    }
  }

  if (previousWeekTotal > 0 && weeklyDelta > 0) {
    const compensationTarget = Math.max(Math.round(weeklyDelta * 0.5), 20);
    addTickerMessage(`Revisa esto · Gastaste ${formatCurrency(weeklyDelta)} más que la semana pasada — reduce ${formatCurrency(compensationTarget)} esta semana para compensar.`, 'warning');
  } else if (previousWeekTotal > 0 && weeklyDelta < 0) {
    addTickerMessage(`Positivo · Vas mejor que la semana pasada. Llevas ${formatCurrency(Math.abs(weeklyDelta))} menos en gastos.`, 'success');
  }

  const weeklySavings = Math.max(previousWeekCashTotal - weekCashTotal, 0);
  if (weeklySavings > 0) {
    addTickerMessage(`Positivo · Has ahorrado ${formatCurrency(weeklySavings)} esta semana en gastos cash.`, 'success');
  }

  if (projectedWeekSpend > weekTotal && weekTotal > 0) {
    addTickerMessage(`Predicción · Si sigues este ritmo, cerrarás la semana en ${formatCurrency(projectedWeekSpend)}.`, 'info');
  }

  if (getUtilizationEntero(projectedRiskCardUtilization) >= 30 && highestUtilizationCard) {
    addTickerMessage(`Predicción · Si no haces un pago, ${getCardDisplayName(highestUtilizationCard)} podría terminar cerca de ${projectedRiskCardUtilization.toFixed(0)}%.`, 'danger');
  }

  if (totalMonthlyIncomeCapacity > 0 && projectedMonthSpend + monthCardPaymentsTotal > totalMonthlyIncomeCapacity) {
    addTickerMessage('Predicción · A este paso, tu cash disponible no cubrirá todo antes del cierre del mes.', 'danger');
  }

  if (topCategory) {
    addTickerMessage(`Insight · Tu categoría más alta este mes es ${topCategory.name} con ${formatCurrency(topCategory.value)}.`, 'info');
  }

  if (strongestWeekdays.length === 2 && monthTotal > 0) {
    addTickerMessage(`Insight · Tus gastos fuertes suelen caer entre ${strongestWeekdays[0]} y ${strongestWeekdays[1]}.`, 'info');
  }

  if (repeatedSmallTopCategoryCount >= 4 && topCategory) {
    addTickerMessage(`Insight · Este mes ya repetiste ${repeatedSmallTopCategoryCount} compras pequeñas en ${topCategory.name}.`, 'warning');
  }

  if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 5 && nearestPaymentCard.weeklyCardSpend > 0) {
    addTickerMessage(`Insight · Cada vez que usas ${getCardDisplayName(nearestPaymentCard)} cerca del pago, sube tu utilización más rápido.`, 'warning');
  }

  if (previousMonthCashTotal > 0 && monthCashTotal < previousMonthCashTotal) {
    addTickerMessage(`Positivo · Estás usando menos efectivo que el mes pasado. Diferencia: ${formatCurrency(previousMonthCashTotal - monthCashTotal)}.`, 'success');
  }

  if (opportunityPayment >= 40 && highestUtilizationCard) {
    addTickerMessage(`Oportunidad · Esta semana podrías pagar ${formatCurrency(opportunityPayment)} extra sin afectar tu cash y bajar ${getCardDisplayName(highestUtilizationCard)}.`, 'success');
  }

  const onePaymentAwayCard = cardInsights.find((card) => card.targetTenPercent > 0 && card.targetTenPercent <= extraCashCapacity);
  if (onePaymentAwayCard) {
    addTickerMessage(`Oportunidad · Estás a 1 pago de dejar ${getCardDisplayName(onePaymentAwayCard)} cerca del 10% ideal.`, 'success');
  }

  if (cardInsights.some((card) => card.used > 0)) {
    addTickerMessage('Educación · Pagar el mínimo puede duplicar lo que debes por intereses acumulados.', 'tip');
  }
  addTickerMessage(`Educación · ${contextualTip}`, 'tip');
  addTickerMessage('Educación · El historial de pago pesa fuerte en tu crédito: protégelo todos los meses.', 'tip');

  const comparisonItems = [
    {
      label: 'vs semana pasada',
      value: previousWeekTotal > 0 ? `${weeklyDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(weeklyDelta))}` : formatCurrency(weekTotal),
      tone: weeklyDelta > 0 ? 'warning' : weeklyDelta < 0 ? 'success' : 'info'
    },
    {
      label: 'vs mes pasado',
      value: previousMonthCashTotal > 0 ? `${monthlyCashDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(monthlyCashDelta))} dinero` : formatCurrency(monthCashTotal),
      tone: monthlyCashDelta > 0 ? 'warning' : monthlyCashDelta < 0 ? 'success' : 'info'
    },
    {
      label: 'categoría dominante',
      value: topCategory ? topCategory.name : 'Sin historial',
      tone: 'info'
    },
    {
      label: 'categoría menor',
      value: lowestCategory ? lowestCategory.name : 'Sin historial',
      tone: 'neutral'
    },
    {
      label: 'tarjeta con más saldo',
      value: mostUsedCard ? getCardDisplayName(mostUsedCard) : 'Sin tarjetas',
      tone: 'info'
    },
    {
      label: 'tarjeta con mayor presión',
      value: mostDangerousCard ? getCardDisplayName(mostDangerousCard) : 'Riesgo bajo',
      tone: mostDangerousCard && getUtilizationEntero(mostDangerousCard.utilization) >= 30 ? 'danger' : 'warning'
    }
  ];

  const tickerFeed = tickerMessages.length > 0 ? [...tickerMessages, ...tickerMessages] : [];


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      data-testid="dashboard"
    >
      <motion.div variants={itemVariants} className={`smart-pulse-card premium-card smart-pulse-tinted-${semaforoLevel} overflow-hidden px-0 py-0`} data-testid="smart-credit-ticker">
        <div className="smart-pulse-hero smart-pulse-hero-tasks">
          <div className="smart-pulse-orb smart-pulse-orb-left" />
          <div className="smart-pulse-orb smart-pulse-orb-right" />
          <div className="smart-pulse-tasks-wrap">
            {/* Header: marca + estado del semáforo integrado */}
            <div className="smart-pulse-topline">
              <div className="smart-pulse-brand">
                <div className="smart-pulse-icon-wrap">
                  <Sparkle weight="fill" className="h-4 w-4" />
                </div>
                <span className="label-uppercase text-[#2A4D3B]">Tu guía de hoy</span>
              </div>
              <div className="smart-pulse-badges">
                <span className="smart-pulse-live">En vivo</span>
              </div>
            </div>

            {/* Estado del semáforo integrado al header */}
            <div className={`smart-pulse-status-strip smart-pulse-status-${semaforoLevel}`}>
              <span className="smart-pulse-status-emoji">{semaforoEmoji}</span>
              <div className="smart-pulse-status-text">
                <p className="smart-pulse-status-title">{semaforoTitle}</p>
                <p className="smart-pulse-status-message">{semaforoMessage}</p>
              </div>
            </div>

            <div className="smart-pulse-greeting">
              <h2 className="smart-pulse-greeting-title">
                Tu plan de hoy
              </h2>
              <p className="smart-pulse-greeting-copy">
                La app te dice qué revisar primero para cuidar tu dinero y tus tarjetas.
              </p>
            </div>

            {/* Progreso */}
            <div className="smart-tasks-progress">
              <div
                className="smart-tasks-ring"
                style={{
                  background: `conic-gradient(#2A4D3B ${tasksProgressPct}%, #E5EDE3 0)`
                }}
              >
                <span>{tasksDone}/{tasksTotal}</span>
              </div>
              <div className="smart-tasks-progress-text">
                <p className="smart-tasks-progress-label">Tu progreso de hoy</p>
                <p className="smart-tasks-progress-status">{tasksProgressLabel}</p>
              </div>
            </div>

            {/* Lista de tareas */}
            <div className="smart-tasks-section-header">
              <span className="label-uppercase">Tareas de hoy</span>
              <span className="smart-tasks-count">{tasksTotal - tasksDone} pendiente{(tasksTotal - tasksDone) === 1 ? '' : 's'}</span>
            </div>

            <div className="smart-tasks-list">
              {displayedDailyTasks.map((task) => (
                <div
                  key={task.id}
                  className={`smart-task ${task.done ? 'smart-task-done' : ''} ${task.tone === 'urgent' ? 'smart-task-urgent' : ''} ${task.tone === 'critical' ? 'smart-task-critical' : ''}`}
                >
                  <div className="smart-task-check">
                    {task.done && <Check weight="bold" className="h-3.5 w-3.5" />}
                  </div>
                  <div className="smart-task-body">
                    <p className="smart-task-title">{task.title}</p>
                    <p className="smart-task-help">{task.help}</p>
                    {task.chips && task.chips.length > 0 && (
                      <div className="smart-task-chips">
                        {task.chips.map((chip, i) => (
                          <span key={i} className={`smart-task-chip smart-task-chip-${chip.tone}`}>
                            {chip.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {dailyTasks.length > visibleTaskLimit && (
              <button
                type="button"
                onClick={() => setShowAllTasks((value) => !value)}
                className="w-full rounded-2xl border border-[#E6E1D6] bg-white/80 px-4 py-3 text-sm font-semibold text-[#2A4D3B] shadow-[0_8px_24px_rgba(42,77,59,0.06)] transition-all hover:-translate-y-0.5 hover:bg-[#FAF8F2]"
              >
                {showAllTasks ? 'Mostrar menos tareas' : `Ver ${hiddenTasksCount} tarea${hiddenTasksCount === 1 ? '' : 's'} más`}
              </button>
            )}

            {/* Tarjeta educativa "¿Por qué?" */}
            <div className="smart-tasks-why">
              <div className="smart-tasks-why-label">
                <Info weight="fill" className="h-3 w-3" />
                ¿POR QUÉ?
              </div>
              <p className="smart-tasks-why-title">{whyTitle}</p>
              <p className="smart-tasks-why-text">{whyText}</p>
            </div>
          </div>
        </div>
        <div className="smart-ticker-shell">
          <div className="smart-ticker-label">Consejos rápidos</div>
          <div className="smart-ticker-track">
            <div className="smart-ticker-fade smart-ticker-fade-left" />
            <div className="smart-ticker-fade smart-ticker-fade-right" />
            <div className="smart-ticker-marquee">
              {tickerFeed.map((item, index) => (
                <div
                  key={`${item.text}-${index}`}
                  className={`smart-ticker-chip smart-ticker-chip-${item.tone}`}
                >
                  <span className="smart-ticker-dot" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================
          ARQUITECTURA SIMPLIFICADA v3:
          - Semáforo integrado dentro del Pulso Smart (no card aparte)
          - Mi dinero | Mis tarjetas (incluye resumen semanal dentro)
          - Acordeón "Ver más detalles"
          ============================================================ */}

      {/* SPLIT: MI DINERO | MIS TARJETAS — la división mental clave */}
      <motion.div
        variants={itemVariants}
        className="my-money-split grid grid-cols-1 md:grid-cols-2 gap-4"
        data-testid="money-split"
      >
        {/* MI DINERO (cash) */}
        <div className="money-block money-block-cash" data-testid="block-cash">
          <div className="money-block-header">
            <div className="money-block-icon money-block-icon-cash">
              <Coins weight="fill" className="w-5 h-5" />
            </div>
            <div className="money-block-titles">
              <p className="label-uppercase money-block-kicker">Mi dinero</p>
              <h3 className="money-block-title">Lo que tengo</h3>
            </div>
          </div>

          <p className="money-block-amount money-block-amount-cash">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.max(cashAvailable, 0))}
          </p>
          <p className="money-block-helper">{myMoneyHelper}</p>

          {totalMonthlyIncomeCapacity > 0 && (
            <div className="money-block-bar-wrap">
              <div className="money-block-bar">
                <div
                  className="money-block-bar-fill money-block-bar-fill-cash"
                  style={{ width: `${Math.min(cashHealthPercentage, 100)}%` }}
                />
              </div>
              <div className="money-block-bar-labels">
                <span>De {formatCurrency(totalMonthlyIncomeCapacity)} este mes</span>
                <span>{cashHealthPercentage.toFixed(0)}%</span>
              </div>
            </div>
          )}

          {/* Resumen semanal integrado al bloque Mi dinero */}
          {weekTotal > 0 && (
            <div className={`money-block-week money-block-week-${weeklySummaryTone}`}>
              {weeklySummaryTone === 'good' ? (
                <TrendDown weight="fill" className="w-3.5 h-3.5" />
              ) : weeklySummaryTone === 'warn' ? (
                <TrendUp weight="fill" className="w-3.5 h-3.5" />
              ) : (
                <Calendar weight="fill" className="w-3.5 h-3.5" />
              )}
              <p className="money-block-week-text">{weeklySummary}</p>
            </div>
          )}
        </div>

        {/* MIS TARJETAS (crédito) */}
        <div className="money-block money-block-credit" data-testid="block-credit">
          <div className="money-block-header">
            <div className="money-block-icon money-block-icon-credit">
              <CreditCard weight="fill" className="w-5 h-5" />
            </div>
            <div className="money-block-titles">
              <p className="label-uppercase money-block-kicker">Mis tarjetas</p>
              <h3 className="money-block-title">Lo que debo</h3>
            </div>
          </div>

          <p className="money-block-amount money-block-amount-credit">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalCreditUsed)}
          </p>
          <p className="money-block-helper">{myCardsHelper}</p>

          {totalCreditLimit > 0 && (
            <div className="money-block-bar-wrap">
              <div className="money-block-bar">
                <div
                  className={`money-block-bar-fill ${creditUtilization < 30 ? 'money-block-bar-fill-credit-good' : creditUtilization < 50 ? 'money-block-bar-fill-credit-warn' : 'money-block-bar-fill-credit-bad'}`}
                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                />
                {/* Marca el "30%" como referencia visual */}
                <div className="money-block-bar-mark" style={{ left: '30%' }} />
              </div>
              <div className="money-block-bar-labels">
                <span>De {formatCurrency(totalCreditLimit)} de límite</span>
                <span>{creditUtilizationEntero}%</span>
              </div>
            </div>
          )}

          {cards.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('cards')}
              className="money-block-link"
            >
              Ver mis {cards.length} tarjeta{cards.length === 1 ? '' : 's'}
              <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ACORDEÓN: VER MÁS DETALLES — todo lo técnico va aquí */}
      <motion.div variants={itemVariants} className="details-accordion" data-testid="details-accordion">
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="details-accordion-trigger"
          aria-expanded={showDetails}
        >
          <div className="details-accordion-trigger-text">
            <span className="label-uppercase">Entender mis números</span>
            <span className="details-accordion-trigger-title">
              {showDetails ? 'Ocultar detalles' : 'Ver detalles de mis números'}
            </span>
          </div>
          <CaretDown
            weight="bold"
            className={`details-accordion-caret ${showDetails ? 'details-accordion-caret-open' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="details-accordion-body"
            >
              <div className="details-accordion-inner space-y-4">

                {/* Desglose de gastos: Hoy / Semana / Mes */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="details-stat">
                    <span className="label-uppercase">Hoy</span>
                    <p className="details-stat-value">{formatCurrency(todayTotal)}</p>
                    <p className="details-stat-sub">{todayExpenses.length} gasto{todayExpenses.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="details-stat">
                    <span className="label-uppercase">Semana</span>
                    <p className="details-stat-value">{formatCurrency(weekTotal)}</p>
                    <p className="details-stat-sub">{weekExpenses.length} gasto{weekExpenses.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="details-stat">
                    <span className="label-uppercase">Mes</span>
                    <p className="details-stat-value">{formatCurrency(monthTotal)}</p>
                    <p className="details-stat-sub">{monthExpenses.length} gasto{monthExpenses.length === 1 ? '' : 's'}</p>
                  </div>
                </div>

                {/* Proyección y runway en lenguaje humano */}
                <div className="details-projection">
                  <p className="label-uppercase">A este ritmo</p>
                  <p className="details-projection-text">
                    Vas a gastar <strong>{formatCurrency(projectedMonthSpend)}</strong> al cierre del mes
                    {' '}(promedio {formatCurrency(averageDailySpend)} al día).
                  </p>
                  {monthRunwayDays > 0 && cashAvailable > 0 && (
                    <p className="details-projection-text">
                      Tu efectivo te alcanza para <strong>{Math.round(monthRunwayDays)} día{Math.round(monthRunwayDays) === 1 ? '' : 's'}</strong> al ritmo actual.
                    </p>
                  )}
                </div>

                {/* Control inteligente (meta) — solo si hay datos */}
                {canUseSmartGoal && goalProgress < 100 && (
                  <div className="details-goal">
                    <div className="details-goal-header">
                      <span className="label-uppercase">Meta {isWeeklyGoal ? 'semanal' : 'mensual'} (solo cash)</span>
                      <span className={`details-goal-pct ${goalProgress < 70 ? 'tone-good' : goalProgress < 90 ? 'tone-warn' : 'tone-bad'}`}>
                        {goalProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar h-2">
                      <div
                        className={`progress-fill ${goalProgress < 70 ? 'bg-[#2A4D3B]' : goalProgress < 90 ? 'bg-[#D48B3F]' : 'bg-[#B65C47]'}`}
                        style={{ width: `${goalProgress}%` }}
                      />
                    </div>
                    <div className="details-goal-row">
                      <div>
                        <p className="details-goal-label">Gastado</p>
                        <p className="details-goal-amount">{formatCurrency(goalSpent)}</p>
                      </div>
                      <div className="text-right">
                        <p className="details-goal-label">Disponible</p>
                        <p className="details-goal-amount tone-good">{formatCurrency(remainingGoal)}</p>
                      </div>
                    </div>
                    {suggestedDailyBudget > 0 && (
                      <p className="details-goal-hint">
                        Puedes gastar <strong>{formatCurrency(suggestedDailyBudget)}</strong> al día sin pasarte de la meta.
                      </p>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>


    </motion.div>
  );
}

function WalletIcon() {
  return <Wallet weight="duotone" className="w-5 h-5" />;
}

function getCategoryIcon(category) {
  const icons = {
    Comida: '🍽️',
    Transporte: '🚗',
    Hogar: '🏠',
    Servicios: '📱',
    Salud: '💊',
    Trabajo: '💼',
    Ocio: '🎮',
    Compras: '🛍️',
    Otros: '📦'
  };
  return icons[category] || '📦';
}
