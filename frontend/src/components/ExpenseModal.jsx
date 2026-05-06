import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wallet,
  CreditCard,
  Receipt,
  Check,
  Warning,
  WarningCircle,
  Bank
} from '@phosphor-icons/react';
import { toDateOnlyString, parseDateOnly, formatDayMonthShort } from '../lib/dateUtils';

const CATEGORIES = [
  { id: 'Comida', icon: '🍽️', color: '#2A4D3B' },
  { id: 'Transporte', icon: '🚗', color: '#B65C47' },
  { id: 'Hogar', icon: '🏠', color: '#D48B3F' },
  { id: 'Servicios', icon: '📱', color: '#737573' },
  { id: 'Salud', icon: '💊', color: '#4A7C6F' },
  { id: 'Trabajo', icon: '💼', color: '#8B6B5C' },
  { id: 'Ocio', icon: '🎮', color: '#6B8E7D' },
  { id: 'Compras', icon: '🛍️', color: '#A67C52' },
  { id: 'Otros', icon: '📦', color: '#9CA39C' }
];


const CARD_ISSUER_NAMES = {
  chase: 'Chase',
  capital_one: 'Capital One',
  capital: 'Capital One',
  bank_of_america: 'Bank of America',
  wells_fargo: 'Wells Fargo',
  citi: 'Citi',
  american_express: 'American Express',
  amex: 'American Express',
  discover: 'Discover',
  us_bank: 'U.S. Bank',
  td_bank: 'TD Bank',
  pnc: 'PNC Bank',
  navy_federal: 'Navy Federal',
  synchrony: 'Synchrony',
  barclays: 'Barclays',
  apple_card: 'Apple Card / Goldman Sachs',
  credit_one: 'Credit One Bank',
  comenity: 'Comenity / Bread Financial',
  visa: 'Visa',
  mastercard: 'Mastercard',
  other: 'Otro banco / emisor'
};

const getCardIssuerName = (card) => {
  if (!card) return 'Banco no especificado';
  const rawType = card.type || card.issuer || card.bank || card.cardType || '';
  return CARD_ISSUER_NAMES[rawType] || card.issuerName || card.bankName || card.typeName || 'Banco no especificado';
};

const formatTextInput = (value) => {
  if (!value) return '';
  const words = value.split(' ');
  return words.map((word, index) => {
    if (index === 0 && word.length > 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }).join(' ');
};

const getNextPaymentDate = (paymentDate) => {
  if (!paymentDate) return null;
  // Usamos parseDateOnly para interpretar el día calendario sin sufrir
  // del bug de zona horaria. originalDate cae siempre a 00:00 hora local.
  const originalDate = parseDateOnly(paymentDate);
  if (!originalDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDate = new Date(today.getFullYear(), originalDate.getMonth(), originalDate.getDate());
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < today) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
};

const getDaysUntilCardPayment = (paymentDate) => {
  const nextPaymentDate = getNextPaymentDate(paymentDate);
  if (!nextPaymentDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
};

const getMostRecentPaymentDate = (paymentDate) => {
  const original = parseDateOnly(paymentDate);
  if (!original) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentPaymentDate = new Date(today.getFullYear(), original.getMonth(), original.getDate());
  recentPaymentDate.setHours(0, 0, 0, 0);

  if (recentPaymentDate > today) {
    recentPaymentDate.setMonth(recentPaymentDate.getMonth() - 1);
  }

  return recentPaymentDate;
};

const getDaysSinceLastPayment = (paymentDate) => {
  const lastPaymentDate = getMostRecentPaymentDate(paymentDate);
  if (!lastPaymentDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
};


// Devuelve true si el cliente ya confirmó haber recibido el estado de cuenta
// del ciclo actual (botón "Ya llegó mi estado de cuenta" en CardsPanel).
// Cuando esto es true, las alertas y tareas del modal/Dashboard relacionadas
// con la fecha de pago de la tarjeta deben silenciarse, porque la tarjeta
// ya está liberada para el siguiente ciclo.
const isStatementConfirmedForCurrentCycle = (card) => {
  if (!card?.statementClosedAt || !card?.paymentDate) return false;

  // statementClosedAt sí es un instante exacto (timestamp de cuando el
  // usuario presionó "Ya llegó mi estado de cuenta"), así que se parsea
  // con new Date normal.
  const statementClosedAt = new Date(card.statementClosedAt);
  if (Number.isNaN(statementClosedAt.getTime())) return false;

  // Última fecha de pago: el "ancla" del ciclo. Si paymentDate es 5 de cada
  // mes, y hoy es 5 de mayo, lastPaymentDate = 5 de mayo (mismo). Si hoy
  // es 3 de mayo, lastPaymentDate = 5 de abril.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const original = parseDateOnly(card.paymentDate);
  if (!original) return false;

  const lastPaymentDate = new Date(today.getFullYear(), original.getMonth(), original.getDate());
  lastPaymentDate.setHours(0, 0, 0, 0);
  if (lastPaymentDate > today) {
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() - 1);
  }

  return statementClosedAt >= lastPaymentDate;
};

export default function ExpenseModal({ isOpen, onClose, onSave, cards, editingExpense, cashData }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida');
  const [method, setMethod] = useState('Cash');
  const [selectedCard, setSelectedCard] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [showCoverageAlert, setShowCoverageAlert] = useState(false);

  const editCashRestore = editingExpense?.method === 'Cash' ? Number(editingExpense.amount || 0) : 0;
  const editCardRestore = editingExpense?.method === 'Tarjeta' ? Number(editingExpense.amount || 0) : 0;

  const cashAvailable = useMemo(() => {
    if (!cashData) return 0;
    return Number(cashData.income || 0) - Number(cashData.spent || 0) - Number(cashData.cardPayments || 0) - Number(cashData.reservedSavings || 0) + editCashRestore;
  }, [cashData, editCashRestore]);

  useEffect(() => {
    if (isOpen) {
      setName(editingExpense?.name || '');
      setAmount(editingExpense?.amount?.toString() || '');
      setCategory(editingExpense?.category || 'Comida');
      setMethod(editingExpense?.method || 'Cash');
      setSelectedCard(editingExpense?.cardId || '');
      setStep(1);
      setError('');
      setShowCoverageAlert(false);
    }
  }, [isOpen, editingExpense]);

  const cardsWithCredit = useMemo(() => {
    return cards.map((card) => {
      const restoredAmount = editingExpense?.method === 'Tarjeta' && editingExpense?.cardId === card.id
        ? editCardRestore
        : 0;
      const available = Number(card.limit || 0) - Number(card.used || 0) + restoredAmount;
      return {
        ...card,
        available,
        hasCredit: available > 0
      };
    });
  }, [cards, editingExpense, editCardRestore]);

  const anyCardHasCredit = useMemo(() => cardsWithCredit.some((card) => card.hasCredit), [cardsWithCredit]);

  const selectedCardData = useMemo(
    () => cardsWithCredit.find((card) => card.id === selectedCard),
    [cardsWithCredit, selectedCard]
  );

  const selectedCardPaymentAlert = useMemo(() => {
    if (method !== 'Tarjeta' || !selectedCardData?.paymentDate) return null;

    // Si el cliente ya confirmó que recibió el estado de cuenta del ciclo
    // actual, la tarjeta ya está liberada.
    if (isStatementConfirmedForCurrentCycle(selectedCardData)) return null;

    const daysUntilPayment = getDaysUntilCardPayment(selectedCardData.paymentDate);
    const daysSinceLastPayment = getDaysSinceLastPayment(selectedCardData.paymentDate);

    if (daysUntilPayment === 0) {
      return {
        type: 'same-day',
        color: '#9C382A',
        title: '⚠️ Hoy es la fecha de pago de esta tarjeta',
        message: `Si registras este gasto hoy en ${selectedCardData.name}, ese consumo puede seguir afectando tu utilización o llegar al próximo corte aunque creas que la tarjeta está paga.`,
        summary: 'Hoy es fecha de pago. Evita nuevos consumos hasta pagar o confirmar que el banco ya generó el nuevo estado de cuenta.'
      };
    }

    if (daysUntilPayment !== null && daysUntilPayment > 0 && daysUntilPayment <= 5) {
      return {
        type: 'near-payment',
        color: daysUntilPayment <= 2 ? '#9C382A' : '#D48B3F',
        title: '📅 Fecha de pago cercana',
        message: `A ${selectedCardData.name} le faltan ${daysUntilPayment} día${daysUntilPayment > 1 ? 's' : ''} para su pago. Si generas este gasto ahora, puedes llegar más cargado al corte o al pago.`,
        summary: `Faltan ${daysUntilPayment} día${daysUntilPayment > 1 ? 's' : ''} para el pago. Úsala solo si aceptas llegar más cargado al pago o al próximo corte.`
      };
    }

    if (daysSinceLastPayment !== null && daysSinceLastPayment >= 0 && daysSinceLastPayment < 32) {
      const daysSinceText = daysSinceLastPayment === 0
        ? 'La fecha de pago es hoy.'
        : `La fecha de pago pasó hace ${daysSinceLastPayment} día${daysSinceLastPayment > 1 ? 's' : ''}.`;
      return {
        type: 'statement-pending',
        color: '#D48B3F',
        title: '⚠️ Falta confirmar el estado de cuenta',
        message: `Antes de usar ${selectedCardData.name}, confirma que ya llegó el nuevo estado de cuenta. Hasta entonces, la app no debe tratar esta tarjeta como opción segura para nuevos gastos.`,
        summary: `${daysSinceText} Confirma si llegó el nuevo estado de cuenta antes de volver a usar esta tarjeta.`
      };
    }

    return null;
  }, [method, selectedCardData]);

  const cardAvailable = selectedCardData?.available || 0;

  const hasInsufficientCredit = useMemo(() => {
    if (method !== 'Tarjeta' || !selectedCard || !amount) return false;
    const amountNum = parseFloat(amount) || 0;
    return amountNum > cardAvailable;
  }, [method, selectedCard, amount, cardAvailable]);

  const hasInsufficientCash = useMemo(() => {
    if (method !== 'Cash' || !amount) return false;
    const amountNum = parseFloat(amount) || 0;
    return amountNum > cashAvailable;
  }, [method, amount, cashAvailable]);

  const totalCreditUsed = useMemo(() => {
    return cards.reduce((sum, card) => {
      const restoredAmount = editingExpense?.method === 'Tarjeta' && editingExpense?.cardId === card.id
        ? editCardRestore
        : 0;
      return sum + Math.max(0, Number(card.used || 0) - restoredAmount);
    }, 0);
  }, [cards, editingExpense, editCardRestore]);

  const projectedCreditUsed = useMemo(() => {
    if (method !== 'Tarjeta') return totalCreditUsed;
    const amountNum = parseFloat(amount) || 0;
    return totalCreditUsed + amountNum;
  }, [method, amount, totalCreditUsed]);

  const shouldWarnCoverage = useMemo(() => {
    if (method !== 'Tarjeta' || !amount || !selectedCard) return false;
    return projectedCreditUsed > cashAvailable;
  }, [method, amount, selectedCard, projectedCreditUsed, cashAvailable]);

  const hasAnySaldo = useMemo(() => cashAvailable > 0 || anyCardHasCredit, [cashAvailable, anyCardHasCredit]);

  const handleNameChange = (e) => {
    const filtered = e.target.value.replace(/[0-9]/g, '');
    setName(formatTextInput(filtered));
  };

  const handleAmountChange = (e) => {
    const filtered = e.target.value.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) {
      setAmount(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setAmount(filtered);
    }
  };

  const saveExpense = () => {
    const amountNum = parseFloat(amount);
    onSave({
      id: editingExpense?.id,
      name: name.trim(),
      amount: amountNum,
      category,
      method,
      cardId: method === 'Tarjeta' ? selectedCard : null,
      // Día calendario en hora local del usuario, formato "YYYY-MM-DD".
      // Antes se usaba new Date().toISOString() que serializa en UTC y
      // movía gastos al día siguiente cuando se registraban de noche en
      // zonas horarias negativas (Caribe, América continental).
      date: editingExpense?.date || toDateOnlyString(new Date())
    });
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || !amount) return;

    const amountNum = parseFloat(amount);

    if (method === 'Tarjeta' && selectedCard) {
      if (amountNum > cardAvailable) {
        setError(`Crédito insuficiente. Disponible: $${cardAvailable.toLocaleString('es-MX')}`);
        return;
      }
      if (shouldWarnCoverage) {
        setShowCoverageAlert(true);
        return;
      }
    }

    if (method === 'Cash' && amountNum > cashAvailable) {
      setError(`Saldo insuficiente. Disponible: $${cashAvailable.toLocaleString('es-MX')}`);
      return;
    }

    saveExpense();
  };

  const handleContinueAnyway = () => {
    setShowCoverageAlert(false);
    saveExpense();
  };

  const handleCancelExpense = () => {
    setShowCoverageAlert(false);
    setError('');
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setCategory('Comida');
    setMethod('Cash');
    setSelectedCard('');
    setStep(1);
    setError('');
    setShowCoverageAlert(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (method === 'Tarjeta' && selectedCard && amount) {
      const amountNum = parseFloat(amount) || 0;
      if (amountNum > cardAvailable) {
        setError(`Crédito insuficiente. Disponible: $${cardAvailable.toLocaleString('es-MX')}`);
      } else {
        setError('');
      }
    } else if (method === 'Cash' && amount) {
      const amountNum = parseFloat(amount) || 0;
      if (amountNum > cashAvailable) {
        setError(`Saldo insuficiente. Disponible: $${cashAvailable.toLocaleString('es-MX')}`);
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [method, selectedCard, amount, cardAvailable, cashAvailable]);

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-[#F7F5F0] overflow-hidden"
          data-testid="expense-modal"
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full h-[100dvh] min-h-0 max-w-full bg-white overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-[#E6E6E3] flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#FAFAF9] to-[#F5F4F1]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] flex items-center justify-center shadow-lg shadow-[#2A4D3B]/20">
                  <Receipt weight="fill" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-lg text-[#1A1C1A]">
                    {editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
                  </h2>
                  <p className="text-xs text-[#737573] font-medium">Paso {step} de 3</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="modal-close-btn"
                data-testid="close-expense-modal"
              >
                <X weight="bold" />
              </button>
            </div>

            {!hasAnySaldo && (
              <div className="mx-5 mt-4 p-4 rounded-xl bg-[#9C382A]/10 border border-[#9C382A]/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#9C382A]/20 flex items-center justify-center flex-shrink-0">
                    <WarningCircle weight="fill" className="w-5 h-5 text-[#9C382A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#9C382A]">Sin saldo disponible</p>
                    <p className="text-sm text-[#9C382A]/80 mt-1">
                      No tienes dinero en cash ni crédito disponible en tus tarjetas. Agrega fondos desde Nuevo ingreso.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 py-3 flex gap-2 flex-shrink-0">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B]' : 'bg-[#E6E6E3]'
                  }`}
                />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">¿Qué compraste?</label>
                      <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        placeholder="Ej: Almuerzo, Uber, Netflix..."
                        className="premium-input text-base sm:text-lg"
                        autoFocus
                        autoComplete="off"
                        data-testid="expense-name-input"
                      />
                      <p className="text-xs text-[#737573] mt-1.5">Solo letras. La primera letra será mayúscula.</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">¿Cuánto costó?</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={amount}
                          onChange={handleAmountChange}
                          placeholder="0.00"
                          className="premium-input px-4 text-xl sm:text-2xl font-mono"
                          autoComplete="off"
                          data-testid="expense-amount-input"
                        />
                      </div>
                      <p className="text-xs text-[#737573] mt-1.5">Solo números y decimales.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#F2F0EB] to-[#EAE8E3]">
                      <p className="text-xs font-semibold text-[#737573] uppercase tracking-wider mb-2">Saldo disponible</p>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Bank weight="fill" className="w-4 h-4 text-[#2A4D3B]" />
                          <span className="text-sm text-[#737573]">Cash:</span>
                          <span className={`metric-value text-sm ${cashAvailable > 0 ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>
                            ${cashAvailable.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard weight="fill" className="w-4 h-4 text-[#1A1C1A]" />
                          <span className="text-sm text-[#737573]">Tarjetas:</span>
                          <span className={`metric-value text-sm ${anyCardHasCredit ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>
                            {cards.length > 0 ? `${cardsWithCredit.filter((card) => card.hasCredit).length} disponible${cardsWithCredit.filter((card) => card.hasCredit).length !== 1 ? 's' : ''}` : 'Ninguna'}
                          </span>
                        </div>
                      </div>
                      {editingExpense && (
                        <p className="text-xs text-[#737573] mt-3">
                          Al editar, la app libera primero el monto anterior para recalcular tu cash y tu tarjeta correctamente.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <label className="text-sm font-semibold text-[#1A1C1A] block mb-4">Selecciona una categoría</label>
                    <div className="grid w-full min-w-0 grid-cols-1 min-[390px]:grid-cols-3 gap-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                            category === cat.id
                              ? 'border-[#2A4D3B] bg-[#2A4D3B]/5 shadow-lg'
                              : 'border-[#E6E6E3] hover:border-[#2A4D3B]/30 hover:shadow-md'
                          }`}
                          data-testid={`category-${cat.id.toLowerCase()}`}
                        >
                          <span className="text-2xl">{cat.icon}</span>
                          <span className={`text-xs font-semibold ${category === cat.id ? 'text-[#2A4D3B]' : 'text-[#737573]'}`}>{cat.id}</span>
                          {category === cat.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2A4D3B] flex items-center justify-center">
                              <Check weight="bold" className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[#9C382A]/10 border border-[#9C382A]/20 flex items-center gap-3">
                        <Warning weight="fill" className="w-5 h-5 text-[#9C382A] flex-shrink-0" />
                        <p className="text-sm text-[#9C382A] font-semibold">{error}</p>
                      </motion.div>
                    )}

                    <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">¿Cómo pagaste?</label>

                    <div className="grid w-full min-w-0 grid-cols-1 min-[390px]:grid-cols-2 gap-3">
                      <button
                        onClick={() => { setMethod('Cash'); setSelectedCard(''); }}
                        disabled={cashAvailable <= 0}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          cashAvailable <= 0
                            ? 'border-[#E6E6E3] bg-[#F2F0EB]/50 opacity-60 cursor-not-allowed'
                            : method === 'Cash'
                              ? 'border-[#2A4D3B] bg-[#2A4D3B]/5 shadow-lg'
                              : 'border-[#E6E6E3] hover:border-[#2A4D3B]/30 hover:shadow-md'
                        }`}
                        data-testid="method-cash"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${method === 'Cash' && cashAvailable > 0 ? 'bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] shadow-md' : 'bg-[#F2F0EB]'}`}>
                          <Wallet weight="fill" className={`w-5 h-5 ${method === 'Cash' && cashAvailable > 0 ? 'text-white' : 'text-[#737573]'}`} />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold block ${method === 'Cash' && cashAvailable > 0 ? 'text-[#2A4D3B]' : 'text-[#737573]'}`}>Cash</span>
                          <span className={`text-xs ${cashAvailable > 0 ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>${cashAvailable.toLocaleString('es-MX')}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setMethod('Tarjeta')}
                        disabled={cards.length === 0 || !anyCardHasCredit}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          (cards.length === 0 || !anyCardHasCredit)
                            ? 'border-[#E6E6E3] bg-[#F2F0EB]/50 opacity-60 cursor-not-allowed'
                            : method === 'Tarjeta'
                              ? 'border-[#2A4D3B] bg-[#2A4D3B]/5 shadow-lg'
                              : 'border-[#E6E6E3] hover:border-[#2A4D3B]/30 hover:shadow-md'
                        }`}
                        data-testid="method-card"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${method === 'Tarjeta' ? 'bg-gradient-to-br from-[#1A1C1A] to-[#2D302D] shadow-md' : 'bg-[#F2F0EB]'}`}>
                          <CreditCard weight="fill" className={`w-5 h-5 ${method === 'Tarjeta' ? 'text-white' : 'text-[#737573]'}`} />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold block ${method === 'Tarjeta' ? 'text-[#2A4D3B]' : 'text-[#737573]'}`}>Tarjeta</span>
                          <span className="text-xs text-[#737573]">{cards.length > 0 ? `${cards.length} tarjeta${cards.length !== 1 ? 's' : ''}` : 'Ninguna'}</span>
                        </div>
                      </button>
                    </div>

                    {method === 'Tarjeta' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                        <label className="text-sm font-semibold text-[#1A1C1A] block">Selecciona tarjeta</label>
                        {cards.length > 0 ? (
                          <div className="space-y-2">
                            {!anyCardHasCredit && (
                              <div className="p-3 rounded-xl bg-[#9C382A]/10 border border-[#9C382A]/20 flex items-center gap-3">
                                <WarningCircle weight="fill" className="w-5 h-5 text-[#9C382A] flex-shrink-0" />
                                <p className="text-sm text-[#9C382A] font-semibold">No tienes crédito disponible en ninguna tarjeta</p>
                              </div>
                            )}
                            {cardsWithCredit.map((card) => {
                              const isDisabled = !card.hasCredit;
                              const amountNum = parseFloat(amount) || 0;
                              const exceedsCredit = amountNum > card.available;
                              return (
                                <button
                                  key={card.id}
                                  onClick={() => !isDisabled && setSelectedCard(card.id)}
                                  disabled={isDisabled}
                                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                                    isDisabled
                                      ? 'border-[#E6E6E3] bg-[#F2F0EB]/50 opacity-60 cursor-not-allowed'
                                      : selectedCard === card.id
                                        ? 'border-[#2A4D3B] bg-[#2A4D3B]/5 shadow-lg'
                                        : 'border-[#E6E6E3] hover:border-[#2A4D3B]/30 hover:shadow-md'
                                  }`}
                                  data-testid={`select-card-${card.id}`}
                                >
                                  <div className={`w-12 h-8 rounded-lg ${isDisabled ? 'bg-gray-300' : 'bg-gradient-to-br from-[#1A1C1A] to-[#2D302D]'} shadow-md`} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-sm text-[#1A1C1A]">{card.name}</p>
                                      {editingExpense?.cardId === card.id && (
                                        <span className="text-[10px] px-2 py-0.5 bg-[#2A4D3B]/10 text-[#2A4D3B] rounded-full font-bold uppercase">Restaurada</span>
                                      )}
                                      {isDisabled && <span className="text-[10px] px-2 py-0.5 bg-[#9C382A]/10 text-[#9C382A] rounded-full font-bold uppercase">Sin crédito</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <p className="text-xs text-[#737573] font-mono">****{card.number.slice(-4)}</p>
                                      <span className="text-xs text-[#737573]">•</span>
                                      <span className="inline-flex items-center rounded-full border border-[#E6E6E3] bg-[#FAFAF9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5F615F]">
                                        {getCardIssuerName(card)}
                                      </span>
                                      <span className="text-xs text-[#737573]">•</span>
                                      <p className={`text-xs font-semibold ${isDisabled ? 'text-[#9C382A]' : exceedsCredit ? 'text-[#D48B3F]' : 'text-[#2A4D3B]'}`}>
                                        Disponible: ${card.available.toLocaleString('es-MX')}
                                      </p>
                                      {!isStatementConfirmedForCurrentCycle(card) && getDaysUntilCardPayment(card.paymentDate) !== null && getDaysUntilCardPayment(card.paymentDate) <= 5 && (
                                        <>
                                          <span className="text-xs text-[#737573]">•</span>
                                          <p className={`text-xs font-bold ${getDaysUntilCardPayment(card.paymentDate) === 0 ? 'text-[#9C382A]' : 'text-[#D48B3F]'}`}>
                                            {getDaysUntilCardPayment(card.paymentDate) === 0
                                              ? 'Pago hoy'
                                              : `${getDaysUntilCardPayment(card.paymentDate)}d para pago`}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {selectedCard === card.id && !isDisabled && (
                                    <div className="w-6 h-6 rounded-full bg-[#2A4D3B] flex items-center justify-center">
                                      <Check weight="bold" className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-[#F2F0EB] text-center">
                            <CreditCard weight="duotone" className="w-8 h-8 text-[#737573] mx-auto mb-2" />
                            <p className="text-sm text-[#737573] font-medium">No tienes tarjetas registradas.</p>
                            <p className="text-xs text-[#737573] mt-1">Agrega una desde el panel de tarjetas.</p>
                          </div>
                        )}

                        {selectedCardPaymentAlert && (
                          <div
                            className="p-4 rounded-xl border flex items-start gap-3"
                            style={{
                              backgroundColor: `${selectedCardPaymentAlert.color}10`,
                              borderColor: `${selectedCardPaymentAlert.color}25`
                            }}
                          >
                            <WarningCircle weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: selectedCardPaymentAlert.color }} />
                            <div>
                              <p className="text-sm font-semibold" style={{ color: selectedCardPaymentAlert.color }}>
                                {selectedCardPaymentAlert.title}
                              </p>
                              <p className="text-xs text-[#5F615F] mt-1 leading-relaxed">
                                {selectedCardPaymentAlert.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#F2F0EB] to-[#EAE8E3] border border-[#E6E6E3]">
                      <p className="text-xs font-bold text-[#737573] uppercase tracking-wider mb-3">Resumen del gasto</p>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <span className="text-lg">{CATEGORIES.find((c) => c.id === category)?.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#1A1C1A] block truncate">{name || 'Sin nombre'}</span>
                            <span className="text-xs text-[#737573]">{category}</span>
                          </div>
                        </div>
                        <span className={`metric-value text-xl ${(hasInsufficientCredit || hasInsufficientCash) ? 'text-[#9C382A]' : 'text-[#2A4D3B]'}`}>
                          ${parseFloat(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {method === 'Tarjeta' && selectedCardData && (
                        <div className="mt-3 pt-3 border-t border-[#E6E6E3] space-y-1">
                          <div className="flex items-center justify-between text-xs gap-3">
                            <span className="text-[#737573]">
                              Tarjeta: <span className="font-semibold">{selectedCardData.name}</span>
                              <span className="mx-1">•</span>
                              <span className="font-semibold">{getCardIssuerName(selectedCardData)}</span>
                              <span className="mx-1">•</span>
                              <span className="font-mono">****{selectedCardData.number?.slice(-4)}</span>
                            </span>
                            <span className={`font-semibold ${hasInsufficientCredit ? 'text-[#9C382A]' : 'text-[#737573]'}`}>
                              Crédito después: ${(cardAvailable - (parseFloat(amount) || 0)).toLocaleString('es-MX')}
                            </span>
                          </div>
                          {editingExpense?.method === 'Tarjeta' && editingExpense?.cardId === selectedCardData.id && (
                            <p className="text-[11px] text-[#737573]">La app devuelve primero ${Number(editingExpense.amount || 0).toLocaleString('es-MX')} a esta tarjeta y luego aplica el nuevo monto.</p>
                          )}
                          {selectedCardPaymentAlert && (
                            <p className="text-[11px] font-medium mt-1" style={{ color: selectedCardPaymentAlert.color }}>
                              {selectedCardPaymentAlert.summary}
                            </p>
                          )}
                        </div>
                      )}
                      {method === 'Cash' && (
                        <div className="mt-3 pt-3 border-t border-[#E6E6E3] space-y-1">
                          <div className="flex items-center justify-between text-xs gap-3">
                            <span className="text-[#737573]">Método: <span className="font-semibold">Cash</span></span>
                            <span className={`font-semibold ${hasInsufficientCash ? 'text-[#9C382A]' : 'text-[#737573]'}`}>
                              Saldo después: ${(cashAvailable - (parseFloat(amount) || 0)).toLocaleString('es-MX')}
                            </span>
                          </div>
                          {editingExpense?.method === 'Cash' && (
                            <p className="text-[11px] text-[#737573]">La app recupera primero ${Number(editingExpense.amount || 0).toLocaleString('es-MX')} de tu gasto anterior antes de guardar el nuevo monto.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-[#E6E6E3] flex flex-col-reverse sm:flex-row gap-3 flex-shrink-0 safe-area-bottom bg-gradient-to-r from-[#FAFAF9] to-[#F5F4F1]">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="flex-1 w-full btn-modal-secondary" data-testid="prev-step">
                  Atrás
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!name.trim() || !amount || !hasAnySaldo)}
                  className={`flex-1 w-full btn-modal-primary ${step === 1 && (!name.trim() || !amount || !hasAnySaldo) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  data-testid="next-step"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={
                    (method === 'Tarjeta' && (!selectedCard || hasInsufficientCredit)) ||
                    (method === 'Tarjeta' && cards.length > 0 && !anyCardHasCredit) ||
                    (method === 'Cash' && hasInsufficientCash)
                  }
                  className={`flex-1 w-full btn-primary ${(
                    (method === 'Tarjeta' && (!selectedCard || hasInsufficientCredit)) ||
                    (method === 'Tarjeta' && cards.length > 0 && !anyCardHasCredit) ||
                    (method === 'Cash' && hasInsufficientCash)
                  ) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  data-testid="save-expense"
                >
                  {editingExpense ? 'Guardar cambios' : 'Registrar gasto'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showCoverageAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-stretch justify-stretch modal-overlay overflow-hidden"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
              data-testid="coverage-alert-modal"
            >
              <div className="border-b border-[#9C382A]/15 bg-gradient-to-r from-[#FCF7F5] via-[#FBF7F4] to-[#F6F3EE] px-5 py-5 flex-shrink-0">
                <div className="mx-auto flex w-full max-w-[760px] items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9C382A]/15 shadow-sm">
                      <WarningCircle weight="fill" className="w-6 h-6 text-[#9C382A]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9C382A]">Validación de efectivo</p>
                      <h3 className="font-heading text-2xl font-semibold text-[#9C382A] mt-1">Alerta de Cobertura</h3>
                      <p className="text-sm text-[#737573] mt-1">Este gasto dejaría tu crédito usado sin respaldo suficiente en efectivo.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelExpense}
                    className="modal-close-btn"
                    aria-label="Cerrar alerta de cobertura"
                  >
                    <X weight="bold" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto bg-[#FAFAF9] overscroll-contain px-5 py-6">
                <div className="mx-auto w-full max-w-[760px] space-y-5">
                  <div className="rounded-[28px] border border-[#9C382A]/15 bg-white p-5 shadow-sm">
                    <div className="rounded-2xl bg-[#FEF7F5] border border-[#9C382A]/15 p-5">
                      <p className="text-lg leading-relaxed text-[#1A1C1A]">
                        <span className="font-semibold text-[#9C382A]">Después de este gasto, tu crédito usado no estaría respaldado por tu efectivo actual.</span>{' '}
                        Podrías generar o aumentar deuda.
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#E8E1D6] bg-[#F7F3EC] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#737573]">Crédito usado proyectado</p>
                        <p className="metric-value mt-2 text-3xl font-semibold text-[#1A1C1A]">${projectedCreditUsed.toLocaleString('es-MX')}</p>
                      </div>
                      <div className="rounded-2xl border border-[#DCE7DF] bg-[#F4F8F5] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#737573]">Cash disponible</p>
                        <p className="metric-value mt-2 text-3xl font-semibold text-[#2A4D3B]">${cashAvailable.toLocaleString('es-MX')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#E8E1D6] bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3 rounded-2xl bg-[#2A4D3B]/5 p-4">
                      <Warning weight="fill" className="w-5 h-5 text-[#D48B3F] flex-shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed text-[#737573]">Mientras el cash disponible no respalde tu crédito usado, esta alerta debe tomarse en serio para crear conciencia y evitar que la deuda siga creciendo.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E6E6E3] bg-gradient-to-r from-[#FAFAF9] to-[#F5F4F1] px-5 py-5 safe-area-bottom flex-shrink-0">
                <div className="mx-auto flex w-full max-w-[760px] flex-col-reverse gap-3 sm:flex-row">
                  <button onClick={handleCancelExpense} className="flex-1 w-full btn-modal-secondary" data-testid="cancel-expense-btn">
                    Cancelar gasto
                  </button>
                  <button onClick={handleContinueAnyway} className="flex-1 w-full btn-modal-primary" data-testid="continue-anyway-btn">
                    Continuar de todas formas
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
