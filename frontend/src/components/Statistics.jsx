import { motion } from 'framer-motion';
import {
  ChartBar,
  TrendUp,
  TrendDown,
  ArrowRight,
  Lightning,
  Target
} from '@phosphor-icons/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';

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

const CATEGORY_ICONS = {
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

const getMonthlyCardPaymentsTotal = (payments = [], currentDate = new Date().toISOString()) => (
  (payments || [])
    .filter((payment) => {
      const paymentDate = new Date(payment.date || payment.createdAt || currentDate);
      const current = new Date(currentDate);
      return paymentDate.getMonth() === current.getMonth() && paymentDate.getFullYear() === current.getFullYear();
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
);

export default function Statistics({ data }) {
  const { expenses, cash, goals, currentDate } = data;

  // Current month expenses
  const currentMonth = new Date(currentDate);
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Gastos del mes SOLO en Cash (para vs Ingreso)
  const monthCashExpenses = monthExpenses.filter(e => e.method === 'Cash');
  const monthCashTotal = monthCashExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthCardPaymentsTotal = getMonthlyCardPaymentsTotal(cash.payments, currentDate);
  const realCashOutflow = monthCashTotal + monthCardPaymentsTotal;

  // Category breakdown
  const categoryData = Object.entries(
    monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name],
    icon: CATEGORY_ICONS[name],
    percentage: monthTotal > 0 ? ((value / monthTotal) * 100).toFixed(1) : 0
  })).sort((a, b) => b.value - a.value);

  
  // Daily trend (last 7 days)
  const dailyTrend7 = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (6 - i));
    const dayExpenses = expenses.filter(e => new Date(e.date).toDateString() === date.toDateString());
    return {
      date: date.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0)
    };
  });

  // Daily trend (last 30 days)
  const dailyTrend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (29 - i));
    const dayExpenses = expenses.filter(e => new Date(e.date).toDateString() === date.toDateString());
    return {
      date: date.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0)
    };
  });

  // Weekly comparison (last 4 weeks)
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    
    const weekExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });
    
    return {
      name: i === 0 ? 'Esta semana' : i === 1 ? 'Semana pasada' : `Hace ${i} sem`,
      total: weekExpenses.reduce((sum, e) => sum + e.amount, 0)
    };
  }).reverse();

  // Average daily spending
  const daysWithExpenses = new Set(monthExpenses.map(e => new Date(e.date).toDateString())).size;
  const avgDaily = daysWithExpenses > 0 ? monthTotal / daysWithExpenses : 0;

  // Projection
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const currentDay = new Date(currentDate).getDate();
  const daysRemaining = daysInMonth - currentDay;
  const projectedTotal = avgDaily * daysInMonth;

  // Payment method breakdown
  const methodData = Object.entries(
    monthExpenses.reduce((acc, e) => {
      acc[e.method] = (acc[e.method] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="statistics-view"
    >
      {/* Header */}
      <div className="hero-surface p-5 sm:p-6 text-white">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold mb-2">Resumen claro</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.04em]">Entender mis números</h1>
            <p className="mt-2 text-sm text-white/70 max-w-xl">Esta pantalla traduce tus movimientos en señales simples: cuánto gastas, hacia dónde vas y qué debes vigilar.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Este mes</p>
              <p className="metric-value mt-2 text-2xl">${monthTotal.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Movimientos</p>
              <p className="metric-value mt-2 text-2xl">{monthExpenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="novice-guide-card">
        <div>
          <p className="novice-kicker">Qué significa</p>
          <h2>No es matemática complicada</h2>
          <p>Estas estadísticas responden tres preguntas: cuánto se fue, si vas gastando rápido y qué parte de tu ingreso ya comprometiste.</p>
        </div>
        <div className="novice-steps">
          <span>1. Mira el gasto del mes</span>
          <span>2. Compara el promedio diario</span>
          <span>3. Revisa la proyección</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid w-full min-w-0 grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <ChartBar weight="duotone" className="w-5 h-5 text-[#2A4D3B]" />
            <span className="label-uppercase text-[10px]">Gastado este mes</span>
          </div>
          <p className="metric-value text-2xl text-[#1A1C1A]">
            ${monthTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#737573] mt-1">{monthExpenses.length} gastos</p>
        </div>

        <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightning weight="duotone" className="w-5 h-5 text-[#D48B3F]" />
            <span className="label-uppercase text-[10px]">Promedio diario</span>
          </div>
          <p className="metric-value text-2xl text-[#1A1C1A]">
            ${avgDaily.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#737573] mt-1">{daysWithExpenses} días activos</p>
        </div>

        <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendUp weight="duotone" className="w-5 h-5 text-[#B65C47]" />
            <span className="label-uppercase text-[10px]">Si sigues así</span>
          </div>
          <p className="metric-value text-2xl text-[#1A1C1A]">
            ${projectedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#737573] mt-1">{daysRemaining} días restantes</p>
        </div>

        <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target weight="duotone" className="w-5 h-5 text-[#2A4D3B]" />
            <span className="label-uppercase text-[10px]">Usado de mi ingreso</span>
          </div>
          <p className={`metric-value text-2xl ${
            realCashOutflow <= cash.income * 0.7 ? 'text-[#2A4D3B]' :
            realCashOutflow <= cash.income ? 'text-[#D48B3F]' : 'text-[#B65C47]'
          }`}>
            {cash.income > 0 ? ((realCashOutflow / cash.income) * 100).toFixed(1) : '0.0'}%
          </p>
          <p className="text-xs text-[#737573] mt-1">
            {`$${(cash.income - realCashOutflow).toLocaleString('es-MX')} disponible ${monthCardPaymentsTotal > 0 ? 'incluyendo pagos a tarjetas' : '(solo cash)'}`}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Category Breakdown */}
        <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-6">
          <h3 className="font-heading font-medium text-lg text-[#1A1C1A] mb-4">¿En qué gasté más?</h3>
          {categoryData.length > 0 ? (
            <div className="flex min-w-0 flex-col sm:flex-row items-center gap-5 sm:gap-6">
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="min-w-0 flex-1 w-full space-y-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex min-w-0 items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="min-w-0 break-words text-sm text-[#1A1C1A]">{cat.name}</span>
                        <span className="metric-value shrink-0 text-sm">${cat.value.toLocaleString('es-MX')}</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-fill"
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[#737573] w-10 text-right">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state-premium h-40 flex flex-col items-center justify-center text-center text-[#737573]">
              <p className="font-semibold text-[#1A1C1A]">Aún no hay lectura estadística</p>
              <p className="mt-1 text-sm">Agrega ingresos, gastos o tarjetas para que la app pueda explicarte tus patrones.</p>
            </div>
          )}
        </div>

        {/* Weekly Comparison */}
        <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-6">
          <h3 className="font-heading font-medium text-lg text-[#1A1C1A] mb-4">Semana contra semana</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737573' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`$${value.toLocaleString('es-MX')}`, 'Total']}
                />
                <Bar dataKey="total" fill="#2A4D3B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* Daily Trend 7 Days */}
      <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-6">
        <h3 className="font-heading font-medium text-lg text-[#1A1C1A] mb-4">Últimos 7 días</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrend7}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#737573' }} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`$${value.toLocaleString('es-MX')}`, 'Gasto']}
              />
              <Line type="monotone" dataKey="amount" stroke="#4A7C6F" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Daily Trend */}
      <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-6">
        <h3 className="font-heading font-medium text-lg text-[#1A1C1A] mb-4">Movimiento de 30 días</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrend}>
              <defs>
                <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2A4D3B" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2A4D3B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#737573' }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => [`$${value.toLocaleString('es-MX')}`, 'Gasto']}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2A4D3B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#2A4D3B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods */}
      {methodData.length > 0 && (
        <div className="premium-card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-6">
          <h3 className="font-heading font-medium text-lg text-[#1A1C1A] mb-4">Cómo pagaste</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {methodData.map((method) => (
              <div key={method.name} className="flex items-center gap-4 p-4 rounded-xl bg-[#F2F0EB]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  method.name === 'Cash' ? 'bg-[#2A4D3B]' : 'bg-[#1A1C1A]'
                }`}>
                  <span className="text-white text-lg">{method.name === 'Cash' ? '💵' : '💳'}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1C1A]">{method.name}</p>
                  <p className="metric-value text-lg text-[#2A4D3B]">
                    ${method.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-sm text-[#737573]">
                  {((method.value / monthTotal) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
