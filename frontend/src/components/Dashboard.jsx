import { motion } from 'framer-motion';
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
  DoorOpen
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
      <motion.div variants={itemVariants} className="smart-pulse-card premium-card overflow-hidden px-0 py-0" data-testid="smart-credit-ticker">
        <div className="smart-pulse-hero">
          <div className="smart-pulse-orb smart-pulse-orb-left" />
          <div className="smart-pulse-orb smart-pulse-orb-right" />
          <div className="smart-pulse-grid">
            <div className="smart-pulse-main min-w-0">
              <div className="smart-pulse-topline">
                <div className="smart-pulse-brand">
                  <div className="smart-pulse-icon-wrap">
                    <Sparkle weight="fill" className="h-4 w-4" />
                  </div>
                  <span className="label-uppercase text-[#2A4D3B]">Pulso smart</span>
                </div>
                <div className="smart-pulse-badges">
                  <span className={`smart-pulse-mood ${pulseMood === 'serious' ? 'smart-pulse-mood-serious' : pulseMood === 'motivating' ? 'smart-pulse-mood-motivating' : 'smart-pulse-mood-watch'}`}>
                    {pulseMood === 'serious' ? 'Directo' : pulseMood === 'motivating' ? 'Motivador' : 'En vigilancia'}
                  </span>
                  <span className="smart-pulse-live">En vivo</span>
                </div>
              </div>
              <div className="smart-pulse-copy">
                <p className="smart-pulse-kicker">Centro de decisión financiera</p>
                <h2 className="smart-pulse-title">{pulseTodayLine}</h2>
                <div className={`smart-pulse-action smart-pulse-action-${pulseStatusClass}`}>
                  <span className="smart-pulse-action-dot" />
                  <div>
                    <p className="smart-pulse-action-label">{pulseActionTitle}</p>
                    <p className="smart-pulse-action-text">{pulseActionText}</p>
                  </div>
                </div>
                <p className="smart-pulse-tip">Consejo contextual: {contextualTip}</p>
              </div>
            </div>
            <div className="smart-pulse-stats smart-pulse-command-metrics lg:min-w-[430px]">
              {commandMetrics.map((item) => (
                <div key={item.label} className={`smart-pulse-command-metric smart-pulse-command-metric-${item.tone}`}>
                  <p className="smart-pulse-stat-label">{item.label}</p>
                  <p className="smart-pulse-command-value">{item.value}</p>
                </div>
              ))}
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

      <motion.div variants={itemVariants} className="dashboard-section-header">
        <div>
          <p className="label-uppercase">Vista ejecutiva</p>
          <h2 className="font-heading text-2xl font-semibold text-[#161816]">Tu mapa financiero de hoy</h2>
        </div>
        <p className="dashboard-section-note">Crédito, cash y presión de pagos organizados por prioridad.</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="dashboard-hierarchy-grid grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* NUEVO: Estado del Cliente */}
        <div className="premium-card dashboard-priority-card p-5 col-span-2 lg:col-span-1" data-testid="stat-client-status">
          <div className="flex items-center justify-between mb-3">
            <span className="label-uppercase">Estado</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${clientStatus.bgColor}15` }}>
              <ShieldCheck weight="duotone" className="w-4 h-4" style={{ color: clientStatus.color }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{clientStatus.icon}</span>
            <p className="metric-value text-xl sm:text-2xl" style={{ color: clientStatus.color }}>
              {clientStatus.estado}
            </p>
          </div>
          <p className="text-xs text-[#737573] mt-1 leading-relaxed">{clientStatus.mensaje}</p>
          {gastoCredito > 0 && (
            <div className="mt-3 pt-3 border-t border-[#E6E6E3]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737573]">Cobertura</span>
                <span className="font-semibold" style={{ color: clientStatus.color }}>
                  {(cobertura * 100).toFixed(0)}%
                </span>
              </div>
              <div className="progress-bar h-1.5 mt-2">
                <div
                  className="progress-fill rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(cobertura * 100, 100)}%`,
                    backgroundColor: clientStatus.color
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="premium-card dashboard-stat-card p-5" data-testid="stat-today">
          <div className="flex items-center justify-between mb-3">
            <span className="label-uppercase">Hoy</span>
            <div className="w-8 h-8 rounded-full bg-[#2A4D3B]/10 flex items-center justify-center">
              <Lightning weight="duotone" className="w-4 h-4 text-[#2A4D3B]" />
            </div>
          </div>
          <p className="metric-value text-2xl sm:text-3xl text-[#1A1C1A]">${todayTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-[#737573] mt-1">{todayExpenses.length} gastos</p>
        </div>

        <div className="premium-card dashboard-stat-card p-5" data-testid="stat-week">
          <div className="flex items-center justify-between mb-3">
            <span className="label-uppercase">Semana</span>
            <div className="w-8 h-8 rounded-full bg-[#B65C47]/10 flex items-center justify-center">
              <TrendUp weight="duotone" className="w-4 h-4 text-[#B65C47]" />
            </div>
          </div>
          <p className="metric-value text-2xl sm:text-3xl text-[#1A1C1A]">${weekTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-[#737573] mt-1">{weekExpenses.length} gastos</p>
        </div>

        <div className="premium-card dashboard-stat-card p-5" data-testid="stat-month">
          <div className="flex items-center justify-between mb-3">
            <span className="label-uppercase">Mes</span>
            <div className="w-8 h-8 rounded-full bg-[#D48B3F]/10 flex items-center justify-center">
              <Calendar weight="duotone" className="w-4 h-4 text-[#D48B3F]" />
            </div>
          </div>
          <p className="metric-value text-2xl sm:text-3xl text-[#1A1C1A]">${monthTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-[#737573] mt-1">{monthExpenses.length} gastos</p>
        </div>

        <div className="premium-card dashboard-stat-card dashboard-cash-card p-5" data-testid="stat-balance">
          <div className="flex items-center justify-between mb-3">
            <span className="label-uppercase">Cash Disponible</span>
            <div className="w-8 h-8 rounded-full bg-[#2A4D3B]/10 flex items-center justify-center">
              <CurrencyDollar weight="duotone" className="w-4 h-4 text-[#2A4D3B]" />
            </div>
          </div>
          <p className={`metric-value text-2xl sm:text-3xl ${cashAvailable >= 0 ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>
            ${cashAvailable.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#737573] mt-1">
            {primaryIncomeEntry ? `${recurringIncomeLabel} · ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(recurringPayAmount)} por cobro` : `de ${cash.income.toLocaleString('es-MX')} (solo cash)`}
            {monthCardPaymentsTotal > 0 ? ` · pagos a tarjetas: $${monthCardPaymentsTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : ''}
          </p>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="dashboard-main-grid grid grid-cols-1 gap-6 items-stretch">
        <div className="dashboard-insights-stack flex h-full flex-col gap-6">
        {/* Goal Progress */}
        <motion.div variants={itemVariants} className="premium-card p-6" data-testid="goal-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A4D3B] flex items-center justify-center">
                <Target weight="duotone" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-medium text-lg text-[#1A1C1A]">Control inteligente {isWeeklyGoal ? 'Semanal' : 'Mensual'}</h3>
                <p className="text-sm text-[#737573]">Solo gastos en cash (no incluye tarjetas)</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              !canUseSmartGoal ? 'bg-[#B65C47]/10 text-[#B65C47]' :
              goalProgress < 70 ? 'bg-[#2A4D3B]/10 text-[#2A4D3B]' :
              goalProgress < 90 ? 'bg-[#D48B3F]/10 text-[#D48B3F]' :
              'bg-[#B65C47]/10 text-[#B65C47]'
            }`}>
              {!canUseSmartGoal ? 'Pausada' : `${goalProgress.toFixed(0)}%`}
            </span>
          </div>

          <div className="space-y-4">
            <div className="progress-bar h-3">
              <div
                className={`progress-fill ${
                  !canUseSmartGoal ? 'bg-[#B65C47]' :
                  goalProgress < 70 ? 'bg-[#2A4D3B]' :
                  goalProgress < 90 ? 'bg-[#D48B3F]' :
                  'bg-[#B65C47]'
                }`}
                style={{ width: `${!canUseSmartGoal ? 100 : goalProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-[#737573]">Gastado (cash)</p>
                <p className="metric-value text-lg text-[#1A1C1A]">${goalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[#737573]">Disponible</p>
                <p className={`metric-value text-lg ${canUseSmartGoal ? 'text-[#2A4D3B]' : 'text-[#B65C47]'}`}>${remainingGoal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {!canUseSmartGoal ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFF7F4] border border-[#F1D7CF]">
                <Sparkle weight="duotone" className="w-5 h-5 text-[#B65C47]" />
                <p className="text-sm text-[#9C382A]">
                  El Control inteligente está pausado porque no tienes cash disponible en este momento.
                </p>
              </div>
            ) : goalProgress < 100 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F2F0EB]">
                <Sparkle weight="duotone" className="w-5 h-5 text-[#2A4D3B]" />
                <p className="text-sm text-[#737573]">
                  {isWeeklyGoal ? (
                    <>Puedes gastar <span className="font-medium text-[#1A1C1A]">${suggestedDailyBudget.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span> por día restante de esta semana</>
                  ) : (
                    <>Puedes gastar <span className="font-medium text-[#1A1C1A]">${suggestedDailyBudget.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span> por día o <span className="font-medium text-[#1A1C1A]">${suggestedWeeklyBudget.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span> por semana restante del mes</>
                  )}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card p-6 relative overflow-hidden min-h-[520px] lg:min-h-0 flex h-full flex-1 flex-col" data-testid="financial-pulse-widget">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full blur-3xl opacity-60" style={{ background: 'radial-gradient(circle, rgba(42,77,59,0.18) 0%, transparent 68%)' }} />
          <div className="flex items-start justify-between gap-4 mb-6 relative flex-shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] flex items-center justify-center shadow-[0_16px_34px_rgba(42,77,59,0.18)] flex-shrink-0">
                <Lightning weight="duotone" className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="label-uppercase mb-2">Pulso financiero</p>
                <h3 className="font-heading text-xl font-semibold text-[#161816]">Ritmo de este mes</h3>
                <p className="text-sm text-[#737573] mt-1">Una lectura rápida de ingresos, gasto y proyección.</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#E7E1D7] bg-[#FCFBF8] px-3 py-2 text-xs font-semibold text-[#2A4D3B]">
              <Heart weight="duotone" className="w-4 h-4" />
              {savingsRate.toFixed(0)}% libre
            </div>
          </div>

          <div className="relative flex-1 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch content-stretch">
            <div className="space-y-4 flex flex-col justify-between">
              {financialPulseData.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-[#ECE9E2] bg-[#FCFBF8] p-4 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-medium text-[#1A1C1A]">{item.label}</p>
                      <p className="text-xs text-[#8A8D88]">{item.helper}</p>
                    </div>
                    <p className="metric-value text-base text-[#161816]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(item.value)}</p>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#ECE9E2] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.width}%`, background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 h-full auto-rows-fr">
              <div className="rounded-[28px] border border-[#ECE9E2] bg-[#FCFBF8] p-5 flex flex-col justify-center min-h-[220px] min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8A8D88] mb-2">Proyección del mes</p>
                <p className="metric-value min-w-0 max-w-full break-words leading-[1.05] text-[clamp(2rem,5vw,2.6rem)] text-[#161816]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(projectedMonthSpend)}</p>
                <p className="text-sm text-[#737573] mt-2">Basado en un promedio diario de {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(averageDailySpend)}.</p>
              </div>

              <div className="rounded-[24px] border border-[#ECE9E2] bg-white p-4 flex flex-1 flex-col justify-center min-h-[160px] min-w-0 overflow-hidden">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8A8D88] mb-2">Balance neto</p>
                <p className={`metric-value min-w-0 max-w-full break-words leading-[1.05] text-[clamp(1.55rem,3.8vw,2rem)] ${cashAvailable >= 0 ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(cashAvailable)}</p>
                <p className="text-sm text-[#737573] mt-1">después de gastos y pagos</p>
              </div>

              <div className="rounded-[24px] border border-[#ECE9E2] bg-white p-4 flex flex-1 flex-col justify-center min-h-[160px] min-w-0 overflow-hidden">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8A8D88] mb-2">Runway cash</p>
                <p className="metric-value min-w-0 max-w-full break-words leading-[1.05] text-[clamp(1.65rem,4vw,2.05rem)] text-[#2A4D3B]">{monthRunwayDays.toFixed(1)}</p>
                <p className="text-sm text-[#737573] mt-1">días al ritmo actual</p>
              </div>
            </div>
          </div>
        </motion.div>
        </div>

        <div className="dashboard-radial-pair grid h-full gap-6 auto-rows-fr">
          <PremiumRadialCard
            title="Crédito"
            subtitle={`${cards.length} tarjeta${cards.length !== 1 ? 's' : ''}`}
            icon={<CurrencyDollar weight="duotone" className="w-5 h-5" />}
            percentage={creditUtilization}
            valueLabel={`${creditUtilization.toFixed(0)}%`}
            hint={`${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalCreditUsed)} usado`}
            accent={creditTone.stroke}
            tone={creditTone}
            testId="credit-card"
            footer={(
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white px-3 py-2 border border-[#ECE9E2]">
                  <p className="text-[#8A8D88] text-xs uppercase tracking-[0.16em] mb-1">Límite total</p>
                  <p className="font-semibold text-[#1A1C1A]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalCreditLimit)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 border border-[#ECE9E2]">
                  <p className="text-[#8A8D88] text-xs uppercase tracking-[0.16em] mb-1">Espacio libre</p>
                  <p className="font-semibold text-[#1A1C1A]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.max(totalCreditLimit - totalCreditUsed, 0))}</p>
                </div>
              </div>
            )}
            onClick={() => onNavigate('cards')}
            buttonLabel="Ver tarjetas"
          />

          <PremiumRadialCard
            title="Cash Disponible"
            subtitle={primaryIncomeEntry ? `${recurringIncomeLabel} · flujo activo` : 'Sin flujo registrado'}
            icon={<WalletIcon />}
            percentage={cashHealthPercentage}
            valueLabel={`${cashHealthPercentage.toFixed(0)}%`}
            hint={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(cashAvailable)}
            accent={cashTone.stroke}
            tone={cashTone}
            testId="cash-radial-card"
            footer={(
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#737573]">Ingreso mensual</span>
                  <span className="font-semibold text-[#1A1C1A]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(totalMonthlyIncomeCapacity)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#737573]">Gastos cash del mes</span>
                  <span className="font-semibold text-[#1A1C1A]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(monthCashTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#737573]">Pagos a tarjetas</span>
                  <span className="font-semibold text-[#1A1C1A]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(monthCardPaymentsTotal)}</span>
                </div>
              </div>
            )}
          />
        </div>
      </div>


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
