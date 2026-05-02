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
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredExpenses = expenses
    .filter((expense) => {
      if (filter !== 'all' && expense.category !== filter) return false;
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold mb-2">Control de efectivo</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.04em]">Mi Dinero</h1>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Revisa tus gastos registrados, entiende de dónde salió el dinero y decide cuánto puedes pagar a tus tarjetas sin afectar tu efectivo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Gastos</p>
              <p className="metric-value mt-2 text-2xl">{filteredExpenses.length}</p>
              <p className="mt-1 text-[11px] text-white/50">registros visibles</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Gastado</p>
              <p className="metric-value mt-2 text-2xl">${formatCurrency(totalFiltered)}</p>
              <p className="mt-1 text-[11px] text-white/50">según filtros</p>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar gastos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input px-5"
              data-testid="search-expenses"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || filter !== 'all'
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
                <div>
                  <p className="text-sm font-medium text-[#737573] mb-2">Categoría</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilter('all')} className={`category-pill ${filter === 'all' ? 'bg-[#2A4D3B] text-white' : 'bg-[#F2F0EB] text-[#737573] hover:bg-[#E6E6E3]'}`} data-testid="filter-all">Todas</button>
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
                  className="premium-card p-4 sm:p-5 overflow-hidden"
                  data-testid={`expense-item-${expense.id}`}
                >
                  <div className="grid grid-cols-[52px_1fr] lg:grid-cols-[56px_1fr_auto] gap-4 lg:gap-5 items-start">
                    <div
                      className="w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-[0_10px_24px_rgba(26,28,26,0.06)]"
                      style={{ backgroundColor: `${categoryColor}12`, borderColor: `${categoryColor}22` }}
                    >
                      <span className="text-2xl">{CATEGORY_ICONS[expense.category]}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 lg:block">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[#9CA39C] font-semibold mb-1">Movimiento registrado</p>
                          <h3 className="font-heading text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#1A1C1A] truncate">{expense.name}</h3>
                        </div>

                        <div className="lg:hidden rounded-2xl border border-[#E6E6E3] bg-[#FAF9F6] px-4 py-3 sm:text-right">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA39C] font-semibold">Monto</p>
                          <p className="metric-value text-xl text-[#1A1C1A] mt-1">-${formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-[#737573] mt-1">{new Date(expense.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{ backgroundColor: `${categoryColor}12`, color: categoryColor, borderColor: `${categoryColor}24` }}
                        >
                          {expense.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F7F6F3] text-[#737573] border border-[#E6E6E3]">
                          {expense.method === 'Cash' ? <Wallet weight="duotone" className="w-3.5 h-3.5" /> : <CreditCard weight="duotone" className="w-3.5 h-3.5" />}
                          {expense.method}
                        </span>
                        {expense.isEdited && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1A1C1A]/5 text-[#1A1C1A] border border-[#1A1C1A]/10">
                            <ClockCounterClockwise weight="duotone" className="w-3.5 h-3.5" />
                            Editado{historyCount > 1 ? ` ${historyCount}x` : ''}
                          </span>
                        )}
                      </div>

                      {lastEdit && (
                        <div className="mt-4 rounded-2xl bg-[#FAF9F6] border border-[#E6E6E3] p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#737573] uppercase tracking-wider">
                              <ClockCounterClockwise weight="duotone" className="w-3.5 h-3.5" />
                              Última edición del gasto
                            </div>
                            <p className="text-xs text-[#9CA39C]">
                              {new Date(lastEdit.editedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center">
                            <div className="rounded-xl border border-[#E6E6E3] bg-white px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.13em] text-[#9CA39C] font-semibold">Antes</p>
                              <p className="mt-1 font-semibold text-[#1A1C1A]">${formatCurrency(lastEdit.previousAmount)}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#F2F0EB] border border-[#E6E6E3] flex items-center justify-center text-[#737573]">
                              <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                            </div>
                            <div className="rounded-xl border border-[#2A4D3B]/18 bg-[#EEF4F0] px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.13em] text-[#2A4D3B]/75 font-semibold">Ahora</p>
                              <p className="mt-1 font-semibold text-[#2A4D3B]">${formatCurrency(lastEdit.newAmount)}</p>
                            </div>
                          </div>

                          {lastEdit.previousMethod !== lastEdit.newMethod && (
                            <p className="mt-2 text-xs text-[#737573]">
                              Método actualizado: {lastEdit.previousMethod} → {lastEdit.newMethod}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:block text-right rounded-2xl border border-[#E6E6E3] bg-[#FAF9F6] px-4 py-3 min-w-[150px]">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA39C] font-semibold">Monto</p>
                      <p className="metric-value text-2xl text-[#1A1C1A] mt-1">-${formatCurrency(expense.amount)}</p>
                      <p className="text-xs text-[#737573] mt-1">{new Date(expense.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mt-5 pt-4 border-t border-[#E6E6E3]">
                    <button
                      onClick={() => onEdit(expense)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#5F625F] bg-white border border-[#DAD7CF] hover:border-[#2A4D3B]/45 hover:bg-[#F7F6F3] hover:text-[#2A4D3B] transition-all shadow-[0_8px_18px_rgba(26,28,26,0.04)]"
                      data-testid={`edit-expense-${expense.id}`}
                    >
                      <PencilSimple weight="duotone" className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#B65C47] bg-[#FBF4F2] border border-[#B65C47]/25 hover:border-[#B65C47]/55 hover:bg-[#B65C47]/10 hover:text-[#9E4435] transition-all shadow-[0_8px_18px_rgba(182,92,71,0.06)]"
                      data-testid={`delete-expense-${expense.id}`}
                    >
                      <Trash weight="duotone" className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-card empty-state-premium p-8 sm:p-12 text-center">
              <div className="empty-state-icon w-16 h-16 rounded-2xl bg-[#F2F0EB] flex items-center justify-center mx-auto mb-4">
                <Wallet weight="duotone" className="w-8 h-8 text-[#737573]" />
              </div>
              <h3 className="font-heading text-xl font-medium text-[#1A1C1A] mb-2">Activa tu historial de gastos</h3>
              <p className="text-[#737573] max-w-md mx-auto">Cuando registres tus movimientos aparecerán aquí con su historial de edición para que tu control financiero sea más transparente.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
