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
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold mb-2">Control simple</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.04em]">Mis gastos</h1>
            <p className="mt-2 text-sm text-white/70">Aquí ves en qué se fue tu dinero. Busca, filtra y corrige cualquier gasto sin complicarte.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Gastos guardados</p>
              <p className="metric-value mt-2 text-2xl">{filteredExpenses.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Total usado</p>
              <p className="metric-value mt-2 text-2xl">${formatCurrency(totalFiltered)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="novice-guide-card">
        <div>
          <p className="novice-kicker">Cómo usar esta pantalla</p>
          <h2>Primero mira los gastos grandes</h2>
          <p>Un cliente nuevo solo necesita revisar tres cosas: cuánto gastó, en qué categoría se fue y si fue cash o tarjeta.</p>
        </div>
        <div className="novice-steps">
          <span>1. Busca un gasto</span>
          <span>2. Filtra por tipo</span>
          <span>3. Corrige o elimina si está mal</span>
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Busca por nombre: comida, gasolina, renta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input px-5"
              data-testid="search-expenses"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || filter !== 'all'
                ? 'bg-[#2A4D3B] text-white border-[#2A4D3B]'
                : 'bg-white border-[#E6E6E3] text-[#737573] hover:border-[#2A4D3B]'
            }`}
            data-testid="toggle-filters"
          >
            <FadersHorizontal weight="duotone" className="w-5 h-5" />
            <span className="font-medium">Organizar</span>
            <CaretDown weight="bold" className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-4 border-t border-[#E6E6E3] mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#737573] mb-2">Tipo de gasto</p>
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
                  <p className="text-sm font-medium text-[#737573] mb-2">Ver primero</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'recent', label: 'Lo último' },
                      { id: 'oldest', label: 'Lo primero' },
                      { id: 'highest', label: 'Gastos grandes' },
                      { id: 'lowest', label: 'Gastos pequeños' },
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

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, index) => {
              const historyCount = expense.editHistory?.length || 0;
              const lastEdit = historyCount > 0 ? expense.editHistory[historyCount - 1] : null;

              return (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="premium-card p-4 sm:p-5"
                  data-testid={`expense-item-${expense.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}15` }}>
                      <span className="text-2xl">{CATEGORY_ICONS[expense.category]}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-[#1A1C1A] truncate">{expense.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}15`, color: CATEGORY_COLORS[expense.category] }}>
                              {expense.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-[#737573]">
                              {expense.method === 'Cash' ? <Wallet weight="duotone" className="w-3 h-3" /> : <CreditCard weight="duotone" className="w-3 h-3" />}
                              {expense.method}
                            </span>
                            {expense.isEdited && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1A1C1A]/5 text-[#1A1C1A]">
                                <ClockCounterClockwise weight="duotone" className="w-3 h-3" />
                                Editado{historyCount > 1 ? ` ${historyCount}x` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="metric-value text-lg text-[#1A1C1A]">-${formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-[#737573] mt-1">{new Date(expense.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>

                      {lastEdit && (
                        <div className="mt-3 rounded-xl bg-[#F7F6F3] border border-[#E6E6E3] px-3 py-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#737573] uppercase tracking-wider">
                            <ClockCounterClockwise weight="duotone" className="w-3.5 h-3.5" />
                            Historial de edición
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#1A1C1A]">
                            <span>Gasto:</span>
                            <span className="font-semibold">${formatCurrency(lastEdit.previousAmount)}</span>
                            <ArrowRight weight="bold" className="w-3.5 h-3.5 text-[#737573]" />
                            <span className="font-semibold text-[#2A4D3B]">${formatCurrency(lastEdit.newAmount)}</span>
                          </div>
                          <p className="mt-1 text-xs text-[#737573]">
                            Última edición: {new Date(lastEdit.editedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {lastEdit.previousMethod !== lastEdit.newMethod && ` · ${lastEdit.previousMethod} → ${lastEdit.newMethod}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-[#E6E6E3]">
                    <button onClick={() => onEdit(expense)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#737573] hover:bg-[#F2F0EB] transition-colors" data-testid={`edit-expense-${expense.id}`}>
                      <PencilSimple weight="duotone" className="w-4 h-4" />
                      Editar
                    </button>
                    <button onClick={() => onDelete(expense.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#B65C47] hover:bg-[#B65C47]/10 transition-colors" data-testid={`delete-expense-${expense.id}`}>
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
              <h3 className="font-heading text-xl font-medium text-[#1A1C1A] mb-2">Empieza registrando tu primer gasto</h3>
              <p className="text-[#737573] max-w-md mx-auto">Cuando agregues gastos, aquí verás una lista fácil de revisar: qué compraste, cuánto fue y si salió de dinero disponible o de tarjeta.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
