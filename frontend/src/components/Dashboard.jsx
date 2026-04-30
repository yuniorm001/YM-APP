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


const getProgressStrokeOffset = (percentage, radius = 56) => {
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(percentage, 100));
  return circumference - (safePercentage / 100) * circumference;
};

const getCreditTone = (value) => {
  if (value <= 10) {
    return {
      stroke: '#2A4D3B',
      glow: 'shadow-[0_18px_40px_rgba(42,77,59,0.18)]',
      pill: 'bg-[#E9F5EE] text-[#2A4D3B] border-[#CFE3D8]',
      label: 'Óptimo'
    };
  }
  if (value <= 15) {
    return {
      stroke: '#D48B3F',
      glow: 'shadow-[0_18px_40px_rgba(212,139,63,0.18)]',
      pill: 'bg-[#FFF4E7] text-[#A5661F] border-[#F0D2A8]',
      label: 'Atención'
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
      label: 'Estable'
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

  // Cash disponible = ingreso - gastos en cash - pagos simulados de tarjetas
  const cashAvailable = cash.income - monthCashTotal - monthCardPaymentsTotal;
  const canUseSmartGoal = cashAvailable > 0;

  const totalCreditUsed = cards.reduce((sum, c) => sum + c.used, 0);
  const totalCreditLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;
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
        estado: 'Crítico',
        color: '#9C382A',
        bgColor: '#9C382A',
        icon: '🔴',
        mensaje: 'Tu crédito excede significativamente tu efectivo'
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

  const cardInsights = cards.map((card) => {
    const limit = Number(card.limit || 0);
    const used = Number(card.used || 0);
    const utilization = limit > 0 ? (used / limit) * 100 : 0;
    const nextPaymentDate = getNextPaymentDate(card.paymentDate, currentDate);
    const daysLeft = getDaysUntilDate(nextPaymentDate, currentDate);
    const targetTenPercent = Math.max(0, used - limit * 0.10);
    const targetTwentyEightPercent = Math.max(0, used - limit * 0.28);
    const weeklyCardSpend = weekExpenses
      .filter((expense) => expense.cardId === card.id)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const monthlyCardSpend = monthExpenses
      .filter((expense) => expense.cardId === card.id)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      ...card,
      limit,
      used,
      utilization,
      nextPaymentDate,
      daysLeft,
      targetTenPercent,
      targetTwentyEightPercent,
      weeklyCardSpend,
      monthlyCardSpend
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

  const pulseMood = highestUtilizationCard?.utilization >= 35 || cashAvailable < 0
    ? 'serious'
    : weeklyDelta < 0 || creditUtilization <= 15
      ? 'motivating'
      : 'balanced';

  let pulseTodayLine = 'Hoy sigue tu ritmo con control y revisa antes de usar crédito.';
  if (highestUtilizationCard && highestUtilizationCard.utilization >= 35) {
    pulseTodayLine = `Hoy no deberías usar ${getCardDisplayName(highestUtilizationCard)}.`;
  } else if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 3 && nearestPaymentCard.used > 0) {
    pulseTodayLine = `Hoy prioriza ${getCardDisplayName(nearestPaymentCard)} antes del próximo pago.`;
  } else if (canUseSmartGoal && remainingGoal > 0) {
    pulseTodayLine = `Hoy sí puedes gastar hasta ${formatCurrency(Math.max(suggestedDailyBudget, 0))} sin pasar tu meta.`;
  } else if (cashAvailable <= 0) {
    pulseTodayLine = 'Hoy conviene frenar compras y proteger tu cash.';
  }

  const pulseCritical = highestUtilizationCard?.utilization >= 35 || cashAvailable < 0 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 0 && nearestPaymentCard?.used > 0);
  const pulseAttention = !pulseCritical && (highestUtilizationCard?.utilization >= 20 || cashHealthPercentage < 40 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 && nearestPaymentCard?.used > 0));
  const pulseStatusLabel = pulseCritical ? 'Crítico' : pulseAttention ? 'Atención' : 'Estable';
  const pulseStatusClass = pulseCritical ? 'critical' : pulseAttention ? 'attention' : 'stable';
  const pulseActionTitle = pulseCritical ? 'Acción prioritaria' : pulseAttention ? 'Próximo movimiento' : 'Mantén el control';
  const pulseActionText = pulseCritical
    ? (highestUtilizationCard?.utilization >= 35
      ? `Baja ${getCardDisplayName(highestUtilizationCard)} por debajo de 30% antes de seguir usando crédito.`
      : 'Pausa compras variables y protege efectivo antes de asumir más pagos.')
    : pulseAttention
      ? (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 && nearestPaymentCard?.used > 0
        ? `Prepara el pago de ${getCardDisplayName(nearestPaymentCard)} en los próximos ${Math.max(nearestPaymentCard.daysLeft, 0)} días.`
        : 'Mantén la utilización debajo de 15% y revisa el cash antes de comprar.')
      : 'Puedes seguir operando, pero conserva margen antes de usar crédito.';
  const commandMetrics = [
    { label: 'Estado', value: pulseStatusLabel, tone: pulseStatusClass },
    { label: 'Utilización', value: `${creditUtilization.toFixed(0)}%`, tone: creditUtilization <= 10 ? 'stable' : creditUtilization <= 15 ? 'attention' : 'critical' },
    { label: 'Cash', value: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cashAvailable), tone: cashAvailable > 0 ? 'stable' : 'critical' },
    { label: 'Pago próximo', value: nearestPaymentCard?.daysLeft !== null && nearestPaymentCard ? `${Math.max(nearestPaymentCard.daysLeft, 0)} día${Math.max(nearestPaymentCard.daysLeft, 0) === 1 ? '' : 's'}` : 'Sin alerta', tone: nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 ? 'attention' : 'neutral' }
  ];

  // ============================================================
  // Tareas diarias — versión simplificada para usuarios sin
  // conocimientos de crédito. Convierte los datos financieros
  // en pasos accionables que la persona pueda tachar de su lista.
  // ============================================================
  const dailyTasks = [];
  const addTask = (task) => dailyTasks.push(task);

  // Tarea 1: revisar saldo (siempre presente, se marca hecha si ya hay datos cargados)
  const hasReviewedBalance = cards.length > 0 || cardInsights.length > 0;
  addTask({
    id: 'review-balance',
    title: 'Revisa tu saldo de la tarjeta',
    help: hasReviewedBalance
      ? `Listo. Estás usando ${creditUtilization.toFixed(0)}% de tu límite${creditUtilization <= 10 ? ' — perfecto.' : creditUtilization <= 30 ? ' — vas bien.' : ' — atento.'}`
      : 'Conecta o agrega una tarjeta para empezar.',
    done: hasReviewedBalance,
    tone: 'neutral'
  });

  // Tarea 2: pago próximo
  if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.used > 0 && nearestPaymentCard.daysLeft <= 7) {
    const dl = Math.max(nearestPaymentCard.daysLeft, 0);
    addTask({
      id: 'upcoming-payment',
      title: dl <= 0
        ? `Paga hoy ${getCardDisplayName(nearestPaymentCard)}`
        : `Prepara tu pago de ${getCardDisplayName(nearestPaymentCard)}`,
      help: dl <= 0
        ? `Vence hoy. Si no pagas, te cobran intereses y baja tu puntaje.`
        : `Vence en ${dl} día${dl === 1 ? '' : 's'}. Aparta ${formatCurrency(nearestPaymentCard.used)} antes de esa fecha.`,
      done: false,
      tone: dl <= 2 ? 'critical' : 'urgent',
      chips: [
        { label: dl <= 0 ? 'Hoy' : `${dl} día${dl === 1 ? '' : 's'}`, tone: dl <= 2 ? 'red' : 'amber' },
        { label: formatCurrency(nearestPaymentCard.used), tone: 'neutral' }
      ]
    });
  }

  // Tarea 3: si la utilización está alta, frenar compras grandes
  if (highestUtilizationCard && highestUtilizationCard.utilization >= 30) {
    addTask({
      id: 'high-utilization',
      title: `Baja el uso de ${getCardDisplayName(highestUtilizationCard)}`,
      help: `Estás usando ${highestUtilizationCard.utilization.toFixed(0)}% de tu límite. Si pagas ${formatCurrency(highestUtilizationCard.targetTwentyEightPercent || highestUtilizationCard.targetTenPercent)}, vuelves a una zona sana.`,
      done: false,
      tone: 'urgent',
      chips: [
        { label: `Ahora: ${highestUtilizationCard.utilization.toFixed(0)}%`, tone: 'red' },
        { label: `Meta: <30%`, tone: 'green' }
      ]
    });
  } else if (cashAvailable <= 0) {
    addTask({
      id: 'pause-spending',
      title: 'Frena las compras grandes hoy',
      help: 'No tienes efectivo guardado. Antes de comprar algo de más de $50, espera a tu próximo ingreso.',
      done: false,
      tone: 'urgent',
      chips: [
        { label: 'Importante', tone: 'amber' },
        { label: '2 min', tone: 'neutral' }
      ]
    });
  }

  // Tarea 4: guardar efectivo
  if (cashAvailable < Math.max(recurringPayAmount * 0.15, 35)) {
    const savingsTarget = Math.max(20, Math.round(Math.max(recurringPayAmount * 0.05, 20)));
    addTask({
      id: 'save-cash',
      title: 'Guarda algo de efectivo esta semana',
      help: `Aparta aunque sean ${formatCurrency(savingsTarget)} para emergencias. Te ayudará a no depender solo de la tarjeta.`,
      done: false,
      tone: 'normal',
      chips: [
        { label: `Meta: ${formatCurrency(savingsTarget)}`, tone: 'green' },
        { label: 'Esta semana', tone: 'neutral' }
      ]
    });
  }

  // Tarea 5: mantener uso debajo del 30% (educativa, siempre presente)
  addTask({
    id: 'utilization-rule',
    title: 'Mantén tu uso debajo del 30%',
    help: cards.length > 0 && cards[0].limit
      ? `Si tu límite es ${formatCurrency(cards[0].limit)}, intenta no pasar de ${formatCurrency(cards[0].limit * 0.3)} al mes. Eso sube tu puntaje.`
      : 'No uses más del 30% de tu límite total. Eso sube tu puntaje de crédito.',
    done: creditUtilization <= 30 && cards.length > 0,
    tone: 'normal',
    chips: [
      { label: `Vas en ${creditUtilization.toFixed(0)}%`, tone: creditUtilization <= 30 ? 'green' : 'red' },
      { label: 'Todo el mes', tone: 'neutral' }
    ]
  });

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
  let whyTitle = 'Usar menos del 30% te hace ver responsable';
  let whyText = 'Los bancos ven cuánto de tu límite usas. Mientras menos uses, mejor te ven — y eso te abre mejores créditos en el futuro.';
  if (highestUtilizationCard && highestUtilizationCard.utilization >= 30) {
    whyTitle = 'Pasar de 30% baja tu puntaje, aunque pagues a tiempo';
    whyText = 'El banco mide cuánto debes vs cuánto te prestaron. Aunque pagues completo, si reportas saldo alto, tu score baja.';
  } else if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 5 && nearestPaymentCard.used > 0) {
    whyTitle = 'Pagar antes de la fecha de corte cuenta más';
    whyText = 'No es lo mismo pagar antes del corte que antes del límite. El corte es cuando el banco "toma la foto" de tu deuda.';
  } else if (cashAvailable <= 0) {
    whyTitle = 'El efectivo es tu colchón antes de usar crédito';
    whyText = 'Si tienes ahorro, no necesitas la tarjeta para emergencias. Eso te mantiene fuera de intereses.';
  }

  let contextualTip = 'No uses más del 30% de tu límite de crédito.';
  if (highestUtilizationCard && highestUtilizationCard.utilization >= 30) {
    contextualTip = 'Superar 30% puede presionar tu score, aunque pagues a tiempo.';
  } else if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null && nearestPaymentCard.daysLeft <= 5 && nearestPaymentCard.used > 0) {
    contextualTip = 'Paga antes de la fecha de corte, no solo la fecha límite.';
  } else if (cardInsights.some((card) => card.used > 0)) {
    contextualTip = 'Pagar el mínimo prolonga la deuda y aumenta intereses.';
  } else if (cards.length > 0) {
    contextualTip = 'Cerrar tarjetas puede afectar tu score y tu antigüedad promedio.';
  }

  // ============================================================
  // SEMÁFORO HUMANO — un solo número resumen para el cliente
  // ============================================================
  let semaforoLevel = 'green'; // green | amber | red
  let semaforoEmoji = '🟢';
  let semaforoTitle = 'Estás bien';
  let semaforoMessage = 'Tienes margen y tus tarjetas están sanas. Sigue así.';

  if (highestUtilizationCard?.utilization >= 35 || cashAvailable < 0 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 0 && nearestPaymentCard?.used > 0)) {
    semaforoLevel = 'red';
    semaforoEmoji = '🔴';
    semaforoTitle = 'Atención inmediata';
    semaforoMessage = highestUtilizationCard?.utilization >= 35
      ? `Estás usando ${highestUtilizationCard.utilization.toFixed(0)}% de ${getCardDisplayName(highestUtilizationCard)}. Es momento de bajar ese saldo.`
      : cashAvailable < 0
        ? 'Tus gastos superaron lo que tienes. Pausa compras grandes hasta tu próximo ingreso.'
        : `Hoy vence un pago. Atiéndelo antes de que te cobren intereses.`;
  } else if (highestUtilizationCard?.utilization >= 20 || cashHealthPercentage < 40 || (nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 && nearestPaymentCard?.used > 0)) {
    semaforoLevel = 'amber';
    semaforoEmoji = '🟡';
    semaforoTitle = 'Algo que cuidar';
    semaforoMessage = highestUtilizationCard?.utilization >= 20
      ? `Tu uso de tarjeta va en ${highestUtilizationCard.utilization.toFixed(0)}%. Procura no pasar de 30%.`
      : nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5
        ? `Tienes un pago en ${Math.max(nearestPaymentCard.daysLeft, 0)} día${Math.max(nearestPaymentCard.daysLeft, 0) === 1 ? '' : 's'}. Aparta el dinero esta semana.`
        : 'Tu efectivo está bajo. Cuida los gastos no esenciales esta semana.';
  } else if (cards.length === 0 && cashAvailable === 0) {
    semaforoLevel = 'amber';
    semaforoEmoji = '🟡';
    semaforoTitle = 'Empecemos a configurar';
    semaforoMessage = 'Agrega tus tarjetas e ingresos para que la app te guíe.';
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
    ? 'Tu efectivo está agotado por ahora. Espera tu próximo ingreso antes de gastos grandes.'
    : monthRunwayDays > 0 && averageDailySpend > 0
      ? `Te alcanza para ${Math.round(monthRunwayDays)} día${Math.round(monthRunwayDays) === 1 ? '' : 's'} al ritmo actual.`
      : 'Sin gastos registrados aún este mes.';

  // ============================================================
  // BLOQUE "MIS TARJETAS" — datos limpios
  // ============================================================
  const myCardsHelper = cards.length === 0
    ? 'Aún no has agregado tarjetas. Agrégalas para que te guiemos.'
    : creditUtilization === 0
      ? 'No has usado tus tarjetas este mes. Mientras menos uses, mejor.'
      : creditUtilization < 30
        ? `Estás usando ${creditUtilization.toFixed(0)}%. Vas bien — los bancos te ven responsable.`
        : creditUtilization < 50
          ? `Estás usando ${creditUtilization.toFixed(0)}%. Procura bajar de 30% para que tu score suba.`
          : `Estás usando ${creditUtilization.toFixed(0)}%. Es alto — paga lo más que puedas este mes.`;

  const tickerMessages = [];
  const addTickerMessage = (text, tone = 'neutral') => {
    if (!text || tickerMessages.some((item) => item.text === text)) return;
    tickerMessages.push({ text, tone });
  };

  if (highestUtilizationCard && highestUtilizationCard.utilization >= 35) {
    addTickerMessage(
      `Crítico · ${getCardDisplayName(highestUtilizationCard)} llegó a ${highestUtilizationCard.utilization.toFixed(0)}% — paga ${formatCurrency(highestUtilizationCard.targetTwentyEightPercent || highestUtilizationCard.targetTenPercent)} para volver a una zona más sana.`,
      'danger'
    );
  } else if (highestUtilizationCard && highestUtilizationCard.utilization >= 20) {
    addTickerMessage(
      `Atención · ${getCardDisplayName(highestUtilizationCard)} va en ${highestUtilizationCard.utilization.toFixed(0)}% — si pagas ${formatCurrency(highestUtilizationCard.targetTwentyEightPercent)}, vuelves debajo de 30%.`,
      'warning'
    );
  } else if (creditUtilization > 0) {
    addTickerMessage(`Positivo · Tu uso total va en ${creditUtilization.toFixed(0)}%. Bien. Mantenerlo bajo te da más margen.`, 'success');
  }

  if (nearestPaymentCard && nearestPaymentCard.daysLeft !== null) {
    if (nearestPaymentCard.daysLeft <= 0 && nearestPaymentCard.used > 0) {
      addTickerMessage(`Crítico · Hoy vence ${getCardDisplayName(nearestPaymentCard)} y aún tienes ${formatCurrency(nearestPaymentCard.used)} pendientes.`, 'danger');
    } else if (nearestPaymentCard.daysLeft <= 3 && nearestPaymentCard.used > 0) {
      addTickerMessage(`Atención · Tu pago vence en ${nearestPaymentCard.daysLeft} día${nearestPaymentCard.daysLeft === 1 ? '' : 's'} — evita reportar saldo alto en ${getCardDisplayName(nearestPaymentCard)}.`, 'warning');
    } else if (nearestPaymentCard.daysLeft <= 7) {
      addTickerMessage(`Atención · Tienes pago pronto en ${getCardDisplayName(nearestPaymentCard)}. Organízalo esta semana.`, 'info');
    }
  }

  if (previousWeekTotal > 0 && weeklyDelta > 0) {
    const compensationTarget = Math.max(Math.round(weeklyDelta * 0.5), 20);
    addTickerMessage(`Atención · Gastaste ${formatCurrency(weeklyDelta)} más que la semana pasada — reduce ${formatCurrency(compensationTarget)} esta semana para compensar.`, 'warning');
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

  if (projectedRiskCardUtilization >= 35 && highestUtilizationCard) {
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
      value: previousMonthCashTotal > 0 ? `${monthlyCashDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(monthlyCashDelta))} cash` : formatCurrency(monthCashTotal),
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
      tone: mostDangerousCard && mostDangerousCard.utilization >= 30 ? 'danger' : 'warning'
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
                <span className="label-uppercase text-[#2A4D3B]">Pulso smart</span>
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
              {dailyTasks.map((task) => (
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
          <div className="smart-ticker-label">Ticker inteligente</div>
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
                <span>{creditUtilization.toFixed(0)}%</span>
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
            <span className="label-uppercase">Modo experto</span>
            <span className="details-accordion-trigger-title">
              {showDetails ? 'Ocultar detalles' : 'Ver más detalles'}
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
