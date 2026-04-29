import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CaretLeft,
  CaretRight,
  Circle
} from '@phosphor-icons/react';

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

export default function CalendarView({ expenses, currentDate }) {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const { weeks, monthExpenses, monthTotal } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get Monday of the first week
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);

    const weeks = [];
    let currentWeek = [];
    let date = new Date(startDate);

    while (date <= lastDay || currentWeek.length > 0) {
      currentWeek.push(new Date(date));
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        if (date > lastDay) break;
      }
      
      date.setDate(date.getDate() + 1);
    }

    const monthExpenses = expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.getMonth() === month && expDate.getFullYear() === year;
    });

    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { weeks, monthExpenses, monthTotal };
  }, [viewDate, expenses]);

  const getExpensesForDate = (date) => {
    return expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => date.toDateString() === new Date(currentDate).toDateString();
  const isCurrentMonth = (date) => date.getMonth() === viewDate.getMonth();

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mobile-responsive-root space-y-6 w-full max-w-full min-w-0 overflow-hidden"
      data-testid="calendar-view"
    >
      {/* Header */}
      <div className="hero-surface p-5 sm:p-6 text-white">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold mb-2">Planeación</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.04em]">Calendario</h1>
            <p className="mt-2 text-sm text-white/70 max-w-xl">Revisa tus movimientos por fecha, detecta picos de gasto y organiza mejor tu flujo mensual.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Mes activo</p>
              <p className="metric-value mt-2 text-2xl">{viewDate.toLocaleDateString('es', { month: 'short' }).replace('.', '')}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Gastos</p>
              <p className="metric-value mt-2 text-2xl">{monthExpenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="label-uppercase mb-1">Mes visible</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-light text-[#1A1C1A] tracking-tight">
            {viewDate.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#737573]">{monthExpenses.length} gastos</span>
          <span className="text-sm text-[#737573]">·</span>
          <span className="metric-value text-[#1A1C1A]">${monthTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F2F0EB] transition-colors"
            data-testid="prev-month"
          >
            <CaretLeft weight="bold" className="w-5 h-5 text-[#1A1C1A]" />
          </button>
          
          <button
            onClick={() => setViewDate(new Date(currentDate))}
            className="px-4 py-2 rounded-full text-sm font-medium text-[#2A4D3B] hover:bg-[#2A4D3B]/10 transition-colors"
            data-testid="today-btn"
          >
            Hoy
          </button>
          
          <button
            onClick={() => navigateMonth(1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F2F0EB] transition-colors"
            data-testid="next-month"
          >
            <CaretRight weight="bold" className="w-5 h-5 text-[#1A1C1A]" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="premium-card calendar-mobile-safe w-full max-w-full min-w-0 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[#E6E6E3] min-w-0">
          {dayNames.map((day) => (
            <div
              key={day}
              className="min-w-0 p-2 sm:p-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#737573]"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="divide-y divide-[#E6E6E3]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x divide-[#E6E6E3] min-w-0">
              {week.map((date, dayIndex) => {
                const dayExpenses = getExpensesForDate(date);
                const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                const hasExpenses = dayExpenses.length > 0;
                const today = isToday(date);
                const inMonth = isCurrentMonth(date);

                return (
                  <div
                    key={dayIndex}
                    className={`min-w-0 overflow-hidden min-h-[72px] sm:min-h-[100px] p-1.5 sm:p-3 transition-colors ${
                      today ? 'bg-[#2A4D3B]/5' : hasExpenses ? 'bg-[#F2F0EB]/50' : 'hover:bg-[#F2F0EB]/30'
                    } ${!inMonth ? 'opacity-40' : ''}`}
                    data-testid={`calendar-day-${date.toISOString().split('T')[0]}`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-1 mb-1">
                      <span className={`text-sm font-medium ${
                        today
                          ? 'w-7 h-7 rounded-full bg-[#2A4D3B] text-white flex items-center justify-center'
                          : 'text-[#1A1C1A]'
                      }`}>
                        {date.getDate()}
                      </span>
                      {hasExpenses && (
                        <span className="hidden sm:inline metric-value text-xs text-[#2A4D3B]">
                          ${dayTotal.toLocaleString('es-MX')}
                        </span>
                      )}
                    </div>

                    {/* Mobile: Just dots */}
                    <div className="sm:hidden flex min-w-0 flex-wrap gap-0.5 overflow-hidden">
                      {dayExpenses.slice(0, 4).map((expense, i) => (
                        <Circle
                          key={i}
                          weight="fill"
                          className="w-2 h-2"
                          style={{ color: CATEGORY_COLORS[expense.category] }}
                        />
                      ))}
                      {dayExpenses.length > 4 && (
                        <span className="text-[8px] text-[#737573]">+{dayExpenses.length - 4}</span>
                      )}
                    </div>

                    {/* Desktop: Expense list */}
                    <div className="hidden sm:block min-w-0 space-y-1 overflow-hidden">
                      {dayExpenses.slice(0, 2).map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[expense.category] }}
                          />
                          <span className="truncate text-[#737573]">{expense.name}</span>
                        </div>
                      ))}
                      {dayExpenses.length > 2 && (
                        <span className="text-[10px] text-[#737573]">
                          +{dayExpenses.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Week Summary */}
      <div className="premium-card p-6">
        <h3 className="font-heading font-medium text-lg text-[#1A1C1A] mb-4">Resumen Semanal</h3>
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day, i) => {
            const weekStart = new Date(currentDate);
            const dayOfWeek = weekStart.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            weekStart.setDate(weekStart.getDate() + diff + i);
            
            const dayExpenses = getExpensesForDate(weekStart);
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const isCurrentDay = weekStart.toDateString() === new Date(currentDate).toDateString();

            return (
              <div
                key={day}
                className={`text-center p-3 rounded-xl transition-colors ${
                  isCurrentDay ? 'bg-[#2A4D3B] text-white' : 'bg-[#F2F0EB]'
                }`}
              >
                <p className={`text-xs font-medium ${isCurrentDay ? 'text-white/70' : 'text-[#737573]'}`}>
                  {day}
                </p>
                <p className={`text-xs mt-1 ${isCurrentDay ? 'text-white/70' : 'text-[#737573]'}`}>
                  {weekStart.getDate()}
                </p>
                <p className={`metric-value text-sm mt-2 ${isCurrentDay ? '' : 'text-[#1A1C1A]'}`}>
                  ${dayTotal.toLocaleString('es-MX')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
