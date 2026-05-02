import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FadersHorizontal,
  Trash,
  PencilSimple,
  CaretDown,
  Wallet,
  CreditCard,
  ClockCounterClockwise,
  ArrowRight
} from '@phosphor-icons/react';

const CATEGORIES = ['Comida', 'Transporte', 'Hogar', 'Servicios', 'Salud', 'Trabajo', 'Ocio', 'Compras', 'Otros'];

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

const formatCurrency = (value) => Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

export default function ExpensesList({ expenses, onEdit, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredExpenses = expenses
    .filter((expense) => {
      if (filter !== 'all' && expense.category !== filter) return false;
      if (methodFilter !== 'all' && expense.method !== methodFilter) return false;
      if (searchQuery && !expense.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.date) - new Date(a.date);
        case 'oldest': return new Date(a.date) - new Date(b.date);
        case 'highest': return b.amount - a.amount;
        case 'lowest': return a.amount - b.amount;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const totalFiltered = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const cardExpenses = filteredExpenses.filter((expense) => expense.method !== 'Cash').length;
  const cashExpenses = filteredExpenses.filter((expense) => expense.method === 'Cash').length;
  const methodLabel = (method) => method === 'Cash' ? 'Pagado en efectivo' : 'Pagado con tarjeta';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="expenses-list"
    >
      <div className="hero-surface p-5 sm:p-6 text-white">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold mb-2">Resumen de efectivo</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.04em]">Tus gastos registrados</h1>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Mira qué salió de tu efectivo o de tus tarjetas, cuánto gastaste y qué cambió cuando editaste un movimiento.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Movimientos</p>
              <p className="metric-value mt-2 text-2xl">{filteredExpenses.length}</p>
              <p className="mt-1 text-[11px] text-white/50">gastos visibles</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Total gastado</p>
              <p className="metric-value mt-2 text-2xl">${formatCurrency(totalFiltered)}</p>
              <p className="mt-1 text-[11px] text-white/50">según búsqueda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre del gasto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input px-5"
              data-testid="search-expenses"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || filter !== 'all' || methodFilter !== 'all'
                ? 'bg-[#2A4D3B] text-white border-[#2A4D3B]'
                : 'bg-white border-[#E6E6E3] text-[#737573] hover:border-[#2A4D3B]'
            }`}
            data-testid="toggle-filters"
          >
            <FadersHorizontal weight="duotone" className="w-5 h-5" />
            <span className="font-medium">Filtros</span>
            <CaretDown weight="bold" className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-4 border-t border-[#E6E6E3] mt-4 space-y-4">
                <div className="rounded-2xl border border-[#E6E6E3] bg-[#FAF9F6] p-3 text-sm text-[#5F625F]">
                  Usa estos filtros para entender si tus gastos salieron de una tarjeta o de tu efectivo disponible.
                </div>
                <div>
                  <p className="text-sm font-medium text-[#737573] mb-2">Forma de pago</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setMethodFilter('all')} className={`category-pill ${methodFilter === 'all' ? 'bg-[#1A1C1A] text-white' : 'bg-[#F2F0EB] text-[#737573] hover:bg-[#E6E6E3]'}`}>Ver todos</button>
                    <button onClick={() => setMethodFilter('Tarjeta')} className={`category-pill ${methodFilter === 'Tarjeta' ? 'bg-[#2A4D3B] text-white' : 'bg-[#F2F0EB] text-[#737573] hover:bg-[#E6E6E3]'}`}>Pagados con tarjeta</button>
                    <button onClick={() => setMethodFilter('Cash')} className={`category-pill ${methodFilter === 'Cash' ? 'bg-[#B65C47] text-white' : 'bg-[#F2F0EB] text-[#737573] hover:bg-[#E6E6E3]'}`}>Pagados en efectivo</button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#737573] mb-2">Categoría del gasto</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilter('all')} className={`category-pill ${filter === 'all' ? 'bg-[#2A4D3B] text-white' : 'bg-[#F2F0EB] text-[#737573] hover:bg-[#E6E6E3]'}`} data-testid="filter-all">Todas las categorías</button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`category-pill ${filter === cat ? 'text-white' : 'bg-[#F2F0EB] text-[#737573] hover:bg-[#E6E6E3]'}`}
                        style={filter === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                        data-testid={`filter-${cat.toLowerCase()}`}
                      >
                        {CATEGORY_ICONS[cat]} {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#737573] mb-2">Ordenar por</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'recent', label: 'Más recientes' },
                      { id: 'oldest', label: 'Más antiguos' },
                      { id: 'highest', label: 'Mayor monto' },
                      { id: 'lowest', label: 'Menor monto' },
                      { id: 'name', label: 'Nombre A-Z' }
                    ].map((option) => (
                      <button key={option.id} onClick={() => setSortBy(option.id)} className={`category-pill ${sortBy === option.id ? 'bg-[#1A1C1A] text-white' : 'bg-[#F2F0EB] text-[#737573] hover:bg-[#E6E6E3]'}`} data-testid={`sort-${option.id}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="premium-card p-4 border border-[#D7E6DC] bg-[#F7FBF8]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#2A4D3B] font-bold">Siguiente paso recomendado</p>
          <p className="mt-2 text-sm text-[#405246] leading-relaxed">Registra cada gasto el mismo día para saber cuánto puedes pagar a tus tarjetas sin quedarte corto de efectivo.</p>
        </div>
        <div className="premium-card p-4 bg-white">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#9CA39C] font-bold">Cómo leer esta pantalla</p>
          <p className="mt-2 text-sm text-[#5F625F] leading-relaxed"><span className="font-semibold text-[#B65C47]">Gasto</span> = dinero que salió. <span className="font-semibold text-[#2A4D3B]">Tarjeta</span> = puede afectar tu utilización.</p>
        </div>
        <div className="premium-card p-4 bg-white">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#9CA39C] font-bold">Lectura rápida</p>
          <p className="mt-2 text-sm text-[#5F625F] leading-relaxed">{cardExpenses} con tarjeta · {cashExpenses} en efectivo · ${formatCurrency(totalFiltered)} gastados.</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, index) => {
              const historyCount = expense.editHistory?.length || 0;
              const lastEdit = historyCount > 0 ? expense.editHistory[historyCount - 1] : null;
              const categoryColor = CATEGORY_COLORS[expense.category];

              return (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative overflow-hidden rounded-[28px] border border-[#E6E6E3] bg-white p-0 shadow-[0_18px_50px_rgba(26,28,26,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#DAD7CF] hover:shadow-[0_24px_70px_rgba(26,28,26,0.10)]"
                  data-testid={`expense-item-${expense.id}`}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ backgroundColor: expense.method === 'Cash' ? '#B65C47' : categoryColor }}
                  />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-[52px_1fr] lg:grid-cols-[58px_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 lg:gap-5 items-center">
                      <div
                        className="relative w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[20px] flex items-center justify-center flex-shrink-0 border shadow-[0_12px_28px_rgba(26,28,26,0.08)] transition-transform duration-300 group-hover:scale-[1.03]"
                        style={{ backgroundColor: `${categoryColor}12`, borderColor: `${categoryColor}24` }}
                      >
                        <span className="text-2xl sm:text-[26px]">{CATEGORY_ICONS[expense.category]}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-heading text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#1A1C1A] truncate">{expense.name}</h3>
                          {expense.isEdited && (
                            <span className="hidden sm:inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#1A1C1A]/5 text-[#1A1C1A] border border-[#1A1C1A]/10 flex-shrink-0">
                              <ClockCounterClockwise weight="duotone" className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                            style={{ backgroundColor: `${categoryColor}10`, color: categoryColor, borderColor: `${categoryColor}26` }}
                          >
                            {expense.category}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F6F3] text-[#5F625F] border border-[#E6E6E3]">
                            {expense.method === 'Cash' ? <Wallet weight="duotone" className="w-3.5 h-3.5" /> : <CreditCard weight="duotone" className="w-3.5 h-3.5" />}
                            {expense.method === 'Cash' ? 'Efectivo' : 'Tarjeta'}
                          </span>
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium text-[#737573] bg-white border border-[#ECE9E2]">
                            {new Date(expense.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 lg:col-span-1 rounded-[22px] border border-[#E6E6E3] bg-[#FAF9F6] px-4 py-3 text-right lg:min-w-[170px] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                        <p className="metric-value text-2xl sm:text-[28px] leading-none text-[#9C382A]">-${formatCurrency(expense.amount)}</p>
                      </div>

                      <div className="col-span-2 lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-2 lg:min-w-[118px]">
                        <button
                          onClick={() => onEdit(expense)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#5F625F] bg-white border border-[#DAD7CF] hover:border-[#2A4D3B]/50 hover:bg-[#F7F6F3] hover:text-[#2A4D3B] transition-all shadow-[0_8px_18px_rgba(26,28,26,0.04)]"
                          data-testid={`edit-expense-${expense.id}`}
                        >
                          <PencilSimple weight="duotone" className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#B65C47] bg-[#FBF4F2] border border-[#B65C47]/30 hover:border-[#B65C47]/65 hover:bg-[#B65C47]/10 hover:text-[#9E4435] transition-all shadow-[0_8px_18px_rgba(182,92,71,0.07)]"
                          data-testid={`delete-expense-${expense.id}`}
                        >
                          <Trash weight="duotone" className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {lastEdit && (
                      <div className="mt-4 ml-0 lg:ml-[76px] rounded-[20px] border border-[#ECE9E2] bg-[#FAF9F6] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-8 h-8 rounded-full bg-white border border-[#E6E6E3] flex items-center justify-center text-[#737573] flex-shrink-0">
                              <ClockCounterClockwise weight="duotone" className="w-3.5 h-3.5" />
                            </span>
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#5F625F] min-w-0">
                              <span>${formatCurrency(lastEdit.previousAmount)}</span>
                              <ArrowRight weight="bold" className="w-3.5 h-3.5 text-[#9CA39C] flex-shrink-0" />
                              <span className="text-[#2A4D3B]">${formatCurrency(lastEdit.newAmount)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#9CA39C] sm:text-right">
                            {new Date(lastEdit.editedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-card empty-state-premium p-8 sm:p-12 text-center">
              <div className="empty-state-icon w-16 h-16 rounded-2xl bg-[#F2F0EB] flex items-center justify-center mx-auto mb-4">
                <Wallet weight="duotone" className="w-8 h-8 text-[#737573]" />
              </div>
              <h3 className="font-heading text-xl font-medium text-[#1A1C1A] mb-2">Aún no tienes gastos registrados</h3>
              <p className="text-[#737573] max-w-md mx-auto">Cuando agregues un gasto, aparecerá aquí con su categoría, forma de pago e historial de cambios. Esto te ayudará a decidir cuánto puedes pagar a tus tarjetas sin afectar tu efectivo.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
