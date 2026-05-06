import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard as CreditCardIcon,
  Plus,
  Trash,
  PencilSimple,
  WarningCircle,
  CheckCircle,
  CaretRight,
  CaretLeft,
  CalendarBlank,
  Warning,
  Sparkle,
  Clock,
  CurrencyDollar,
  Wallet,
  X
} from '@phosphor-icons/react';
import { parseDateOnly, formatDayMonthShort, toDateOnlyString } from '../lib/dateUtils';

const CARD_TYPES = [
  { id: 'chase', name: 'Chase', mark: 'CH', gradient: 'linear-gradient(135deg, #0B2E69 0%, #0A5DB8 46%, #071D3F 100%)', accent: '#2B76D2', textTone: 'light' },
  { id: 'capital_one', name: 'Capital One', mark: 'CO', gradient: 'linear-gradient(135deg, #14233B 0%, #C8202F 52%, #0A1B33 100%)', accent: '#C8202F', textTone: 'light' },
  { id: 'bank_of_america', name: 'Bank of America', mark: 'BA', gradient: 'linear-gradient(135deg, #123C7C 0%, #D71920 58%, #071E44 100%)', accent: '#D71920', textTone: 'light' },
  { id: 'wells_fargo', name: 'Wells Fargo', mark: 'WF', gradient: 'linear-gradient(135deg, #7A1E18 0%, #B31B1B 58%, #D6A13B 100%)', accent: '#B31B1B', textTone: 'light' },
  { id: 'citi', name: 'Citi', mark: 'CI', gradient: 'linear-gradient(135deg, #003B70 0%, #0A6FB5 48%, #C81E2B 100%)', accent: '#C81E2B', textTone: 'light' },
  { id: 'american_express', name: 'American Express', mark: 'AX', gradient: 'linear-gradient(135deg, #123D63 0%, #2E77A6 50%, #0D2B45 100%)', accent: '#2E77A6', textTone: 'light' },
  { id: 'discover', name: 'Discover', mark: 'DS', gradient: 'linear-gradient(135deg, #F5EFE4 0%, #E8942E 52%, #B85B1A 100%)', accent: '#E87722', textTone: 'dark' },
  { id: 'us_bank', name: 'U.S. Bank', mark: 'US', gradient: 'linear-gradient(135deg, #0E2F5A 0%, #1E5AA8 46%, #B4202A 100%)', accent: '#B4202A', textTone: 'light' },
  { id: 'td_bank', name: 'TD Bank', mark: 'TD', gradient: 'linear-gradient(135deg, #083B2A 0%, #148442 56%, #06251C 100%)', accent: '#148442', textTone: 'light' },
  { id: 'pnc', name: 'PNC Bank', mark: 'PN', gradient: 'linear-gradient(135deg, #102A43 0%, #F28C28 58%, #182C3A 100%)', accent: '#F28C28', textTone: 'light' },
  { id: 'navy_federal', name: 'Navy Federal', mark: 'NF', gradient: 'linear-gradient(135deg, #0B2F4F 0%, #1C4F74 50%, #D3B067 100%)', accent: '#D3B067', textTone: 'light' },
  { id: 'synchrony', name: 'Synchrony', mark: 'SY', gradient: 'linear-gradient(135deg, #4B2E83 0%, #7154B8 52%, #20153B 100%)', accent: '#7154B8', textTone: 'light' },
  { id: 'barclays', name: 'Barclays', mark: 'BC', gradient: 'linear-gradient(135deg, #003D7C 0%, #00AEEF 54%, #052647 100%)', accent: '#00AEEF', textTone: 'light' },
  { id: 'apple_card', name: 'Apple Card / Goldman Sachs', mark: 'AC', gradient: 'linear-gradient(135deg, #F8F7F3 0%, #E6E2DA 52%, #CFC9BF 100%)', accent: '#8F8A82', textTone: 'dark' },
  { id: 'credit_one', name: 'Credit One Bank', mark: 'C1', gradient: 'linear-gradient(135deg, #132A45 0%, #1D6AA5 50%, #0A1E32 100%)', accent: '#1D6AA5', textTone: 'light' },
  { id: 'comenity', name: 'Comenity / Bread Financial', mark: 'BR', gradient: 'linear-gradient(135deg, #321B4A 0%, #6E3AA7 50%, #F2B84B 100%)', accent: '#6E3AA7', textTone: 'light' },
  { id: 'visa', name: 'Visa', mark: 'VI', gradient: 'linear-gradient(135deg, #172033 0%, #263B69 52%, #0B1220 100%)', accent: '#263B69', textTone: 'light' },
  { id: 'mastercard', name: 'Mastercard', mark: 'MC', gradient: 'linear-gradient(135deg, #251515 0%, #C84E30 50%, #D9902F 100%)', accent: '#C84E30', textTone: 'light' },
  { id: 'other', name: 'Otro banco / emisor', mark: 'OT', gradient: 'linear-gradient(135deg, #171917 0%, #2A4D3B 54%, #111411 100%)', accent: '#2A4D3B', textTone: 'light' }
];

const LEGACY_CARD_TYPE_ALIASES = {
  amex: 'american_express',
  capital: 'capital_one'
};

const normalizeCardTypeId = (type) => LEGACY_CARD_TYPE_ALIASES[type] || type;

const getCardType = (type) => CARD_TYPES.find(t => t.id === normalizeCardTypeId(type)) || CARD_TYPES[CARD_TYPES.length - 1];

const PAYMENT_GOAL_OPTIONS = [
  { value: 0, label: '$0' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
  { value: 30, label: '30%' }
];

// Función para capitalizar primera letra
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Función para formatear nombre: cada palabra inicia en mayúscula y el resto en minúscula
const formatTextInput = (value) => {
  if (!value) return '';
  return value
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part.length === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
};

const getDuplicateCard = (cards, formData, editingCard) => (
  cards.find((card) => (
    card.type === formData.type &&
    String(card.number) === String(formData.number) &&
    (!editingCard || card.id !== editingCard.id)
  ))
);

export default function CardsPanel({ cards, cashAvailable = 0, onAdd, onEdit, onDelete, onSimulatePayment }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'chase',
    number: '',
    limit: '',
    used: '',
    paymentDate: '',
    paymentGoal: '0'
  });
  const [error, setError] = useState('');
  const [showRecommendationDetails, setShowRecommendationDetails] = useState(false);
  const [recommendationIndex, setRecommendationIndex] = useState(0);
  const [pulseOn, setPulseOn] = useState(false);
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentModalCard, setPaymentModalCard] = useState(null);
  const [goalModalCard, setGoalModalCard] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setPulseOn(p => !p), 3000);
    return () => clearInterval(id);
  }, []);

  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const totalUsed = cards.reduce((sum, c) => sum + c.used, 0);
  const totalUtilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  const selectedIssuer = getCardType(formData.type);


  // Validación reactiva: mantiene el error sincronizado con lo que el usuario corrige.
  useEffect(() => {
    if (!showForm) return;

    const limitNum = parseFloat(formData.limit) || 0;
    const usedNum = parseFloat(formData.used) || 0;
    const duplicateCard = /^\d{4}$/.test(formData.number)
      ? getDuplicateCard(cards, formData, editingCard)
      : null;

    if (usedNum > limitNum && limitNum > 0) {
      setError('El uso no puede exceder el límite de la tarjeta');
      return;
    }

    if (duplicateCard) {
      setError('Ya existe una tarjeta con ese mismo banco/emisor y los mismos últimos 4 dígitos');
      return;
    }

    if (error === 'Debes ingresar exactamente 4 dígitos en la tarjeta' && /^\d{4}$/.test(formData.number)) {
      setError('');
      return;
    }

    if (error === 'La fecha de pago es obligatoria' && formData.paymentDate) {
      setError('');
      return;
    }

    if (
      error === 'El uso no puede exceder el límite de la tarjeta' ||
      error === 'Ya existe una tarjeta con ese mismo banco/emisor y los mismos últimos 4 dígitos'
    ) {
      setError('');
    }
  }, [cards, editingCard, error, formData.limit, formData.number, formData.paymentDate, formData.type, formData.used, showForm]);

  // Handler para campo de nombre (solo texto)
  const handleNameChange = (value) => {
    const filtered = value.replace(/[0-9]/g, '');
    setFormData(prev => ({ ...prev, name: formatTextInput(filtered) }));
  };

  // Handler para campos numéricos (solo números)
  const handleNumberChange = (field, value) => {
    const filtered = value.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) {
      setFormData(prev => ({ ...prev, [field]: parts[0] + '.' + parts.slice(1).join('') }));
    } else {
      setFormData(prev => ({ ...prev, [field]: filtered }));
    }
  };

  // Handler para últimos 4 dígitos (solo números)
  const handleCardNumberChange = (value) => {
    const filtered = value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, number: filtered }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const limitNum = parseFloat(formData.limit) || 0;
    const usedNum = parseFloat(formData.used) || 0;
    
    // Validación: uso no puede exceder límite
    if (usedNum > limitNum) {
      setError('El uso no puede exceder el límite de la tarjeta');
      return;
    }

    if (!/^\d{4}$/.test(formData.number)) {
      setError('Debes ingresar exactamente 4 dígitos en la tarjeta');
      return;
    }

    // Validación: fecha de pago es obligatoria
    if (!formData.paymentDate) {
      setError('La fecha de pago es obligatoria');
      return;
    }

    const duplicatedCard = getDuplicateCard(cards, formData, editingCard);

    if (duplicatedCard) {
      setError('Ya existe una tarjeta con ese mismo banco/emisor y los mismos últimos 4 dígitos');
      return;
    }
    
    const cardData = {
      ...formData,
      limit: limitNum,
      used: usedNum,
      paymentGoal: Number(formData.paymentGoal || 0)
    };

    if (editingCard) {
      onEdit({ ...editingCard, ...cardData });
    } else {
      onAdd(cardData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'chase', number: '', limit: '', used: '', paymentDate: '', paymentGoal: '0' });
    setEditingCard(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (card) => {
    setFormData({
      name: card.name,
      type: card.type,
      number: card.number,
      limit: card.limit.toString(),
      used: card.used.toString(),
      paymentDate: card.paymentDate || '',
      paymentGoal: String(card.paymentGoal ?? 0)
    });
    setEditingCard(card);
    setShowForm(true);
    setError('');
  };

  const updateCardPaymentGoal = (card, goal) => {
    onEdit({
      ...card,
      paymentGoal: Number(goal || 0)
    });
  };


  const getSuggestedPaymentAmount = (card) => Math.max(0, Math.min(Number(card?.used || 0), Number(cashAvailable || 0)));

  const handlePaymentDraftChange = (cardId, value) => {
    const filtered = value.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const normalizedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;

    setPaymentDrafts((prev) => ({ ...prev, [cardId]: normalizedValue }));
    setPaymentErrors((prev) => ({ ...prev, [cardId]: '' }));
  };

  const handleSimulatePayment = (card) => {
    const rawAmount = String(paymentDrafts[card.id] ?? '').trim();
    const amount = Number(rawAmount);
    const currentUsed = Number(card.used || 0);
    const availableCash = Number(cashAvailable || 0);

    if (!rawAmount) {
      setPaymentErrors((prev) => ({ ...prev, [card.id]: 'Selecciona el uso sugerido o escribe un monto antes de simular el pago.' }));
      return;
    }

    if (amount <= 0) {
      setPaymentErrors((prev) => ({ ...prev, [card.id]: 'Ingresa un monto válido para simular el pago.' }));
      return;
    }

    if (availableCash <= 0) {
      setPaymentErrors((prev) => ({ ...prev, [card.id]: 'No tienes cash disponible para simular este pago.' }));
      return;
    }

    if (amount > availableCash) {
      setPaymentErrors((prev) => ({ ...prev, [card.id]: `Tu cash disponible es de $${availableCash.toLocaleString('es-MX')}.` }));
      return;
    }

    if (amount > currentUsed) {
      setPaymentErrors((prev) => ({ ...prev, [card.id]: `No puedes pagar más de lo usado en esta tarjeta ($${currentUsed.toLocaleString('es-MX')}).` }));
      return;
    }

    onSimulatePayment?.({ cardId: card.id, amount });
    setPaymentDrafts((prev) => ({ ...prev, [card.id]: '' }));
    setPaymentErrors((prev) => ({ ...prev, [card.id]: '' }));
  };

  const getUtilizationStatus = (used, limit) => {
    const pct = limit > 0 ? (used / limit) * 100 : 0;
    const pctEntero = Math.floor(pct);
    if (pctEntero <= 19) return { label: 'Saludable', color: '#2A4D3B', isFull: false };
    if (pctEntero <= 29) return { label: 'Moderado', color: '#D48B3F', isFull: false };
    return { label: 'Alto', color: '#9C382A', isFull: pct >= 100 };
  };


  const getUtilizationBarStyle = (utilization) => {
    const fillWidth = Math.min(Math.max(Number(utilization) || 0, 0), 100);
    const pctEntero = Math.floor(fillWidth);
    const fillColor = pctEntero <= 19 ? '#2A4D3B' : pctEntero <= 29 ? '#D48B3F' : '#9C382A';

    return {
      width: `${fillWidth}%`,
      right: 'auto',
      backgroundColor: fillColor
    };
  };

  // Calcular disponible y si está llena
  const getCardAvailable = (card) => {
    const available = card.limit - card.used;
    return available > 0 ? available : 0;
  };

  // Calcular días restantes para el pago
  const getDaysUntilPayment = (paymentDate) => {
    if (!paymentDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payment = parseDateOnly(paymentDate);
    if (!payment) return null;
    payment.setHours(0, 0, 0, 0);
    const diffTime = payment - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };


  const getMostRecentPaymentDate = (paymentDate) => {
    const nextPaymentDate = getNextPaymentDate(paymentDate);
    if (!nextPaymentDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentPaymentDate = new Date(nextPaymentDate);
    if (recentPaymentDate > today) {
      recentPaymentDate.setMonth(recentPaymentDate.getMonth() - 1);
    }
    recentPaymentDate.setHours(0, 0, 0, 0);
    return recentPaymentDate;
  };

  const getStatementCycleStatus = (card) => {
    const lastPaymentDate = getMostRecentPaymentDate(card?.paymentDate);
    const nextPaymentDate = getNextPaymentDate(card?.paymentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastPaymentDate || !nextPaymentDate) {
      return {
        isConfirmed: false,
        needsConfirmation: false,
        isWatchWindow: false,
        daysSincePayment: null,
        title: 'Estado de cuenta no configurado',
        detail: 'Agrega la fecha de pago para que la app controle el ciclo mensual de esta tarjeta.',
        badge: 'Sin dato',
        color: '#737573'
      };
    }

    const daysSincePayment = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
    const daysUntilNextPayment = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
    const daysUntilPayment = getDaysUntilPayment(card?.paymentDate);
    const paymentArrived = daysUntilPayment !== null && daysUntilPayment <= 0;
    const currentBalance = Number(card?.used || 0);
    const hasBalanceDue = currentBalance > 0.009;
    const statementClosedAt = card?.statementClosedAt ? new Date(card.statementClosedAt) : null;
    const isConfirmed = Boolean(
      statementClosedAt &&
      !Number.isNaN(statementClosedAt.getTime()) &&
      statementClosedAt >= lastPaymentDate
    );
    const confirmationDate = isConfirmed
      ? statementClosedAt.toLocaleDateString('es', { day: 'numeric', month: 'short' })
      : null;
    const confirmationDateLong = isConfirmed
      ? statementClosedAt.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    const needsConfirmation = !isConfirmed && paymentArrived;
    const isWatchWindow = needsConfirmation;

    if (isConfirmed) {
      return {
        isConfirmed: true,
        needsConfirmation: false,
        isWatchWindow: false,
        daysSincePayment,
        daysUntilNextPayment,
        title: 'Estado de cuenta confirmado',
        detail: 'Ya puedes volver a usar esta tarjeta con más seguridad hasta el próximo ciclo. La app volverá a pedir confirmación cuando llegue la próxima fecha de pago.',
        confirmationDate,
        confirmationDateLong,
        badge: 'Confirmado',
        color: '#2A4D3B'
      };
    }

    if (needsConfirmation) {
      return {
        isConfirmed: false,
        needsConfirmation: true,
        isWatchWindow: true,
        daysSincePayment,
        daysUntilNextPayment,
        title: 'Esperando estado de cuenta',
        detail: 'Aunque ya pagaste, espera el estado de cuenta antes de usarla. Presiona el botón cuando el banco te envíe el nuevo estado de cuenta.',
        badge: 'No usar aún',
        color: '#D48B3F'
      };
    }

    return {
      isConfirmed: false,
      needsConfirmation: false,
      isWatchWindow: false,
      daysSincePayment,
      daysUntilNextPayment,
      title: hasBalanceDue ? 'Ciclo en preparación' : 'Ciclo limpio',
      detail: daysUntilPayment !== null && daysUntilPayment > 0
        ? hasBalanceDue
          ? `Todavía faltan ${daysUntilPayment} día${daysUntilPayment === 1 ? '' : 's'} para el pago. Evita aumentar el balance antes del pago para proteger tu utilización.`
          : `No tienes balance pendiente. Faltan ${daysUntilPayment} día${daysUntilPayment === 1 ? '' : 's'} para la próxima fecha de pago; mantén el uso controlado para conservar la tarjeta saludable.`
        : 'Cuando llegue la fecha de pago, la app te pedirá confirmar si ya llegó el estado de cuenta antes de recomendar usarla.',
      badge: daysUntilPayment !== null && daysUntilPayment > 0 ? (hasBalanceDue ? 'Pago pendiente' : 'Sin balance') : 'En ciclo',
      color: hasBalanceDue ? '#737573' : '#2A4D3B'
    };
  };

  const toggleStatementClosed = (card) => {
    const statementStatus = getStatementCycleStatus(card);
    onEdit({
      ...card,
      statementClosedAt: statementStatus.isConfirmed ? null : new Date().toISOString()
    });
  };

  // Mensaje de asesor financiero según días restantes
  const getPaymentAdvice = (daysLeft, cardName, used) => {
    const currentDebt = Number(used || 0);

    if (daysLeft === null || daysLeft > 5) return null;

    if (currentDebt <= 0) {
      if (daysLeft < 0) {
        return {
          type: 'clear',
          title: '✅ Pago al día',
          message: `La fecha de pago de ${cardName} ya pasó, pero no tienes saldo pendiente. Tu tarjeta está al día y sin deuda.`,
          color: '#2A4D3B'
        };
      }

      if (daysLeft === 0) {
        return {
          type: 'clear',
          title: '✅ Sin pago pendiente hoy',
          message: `Hoy es la fecha de pago de ${cardName}, pero tu saldo está en $0. No tienes pago pendiente ahora mismo.`,
          color: '#2A4D3B'
        };
      }

      return {
        type: 'clear',
        title: '✅ Sin saldo pendiente',
        message: `Tu tarjeta ${cardName} está en $0. Aunque el pago se acerca, no tienes deuda pendiente por cubrir en este momento.`,
        color: '#2A4D3B'
      };
    }

    if (daysLeft <= 0) {
      return {
        type: 'urgent',
        title: '⚠️ Fecha de pago vencida',
        message: `Tu tarjeta ${cardName} sí tiene saldo pendiente. Te recomiendo liquidarla hoy para evitar intereses y cargos moratorios que pueden afectar tu historial crediticio.`,
        color: '#9C382A'
      };
    } else if (daysLeft <= 2) {
      return {
        type: 'critical',
        title: '🚨 Pago muy próximo',
        message: `Solo quedan ${daysLeft} día${daysLeft > 1 ? 's' : ''} para el pago de ${cardName} y todavía tienes $${currentDebt.toLocaleString('es-MX')} pendientes. Mi consejo: realiza el pago cuanto antes para no llegar con saldo.`,
        color: '#9C382A'
      };
    } else if (daysLeft <= 5) {
      return {
        type: 'warning',
        title: '📅 Fecha de pago cerca',
        message: `Faltan ${daysLeft} días para el pago de ${cardName}. Aún tienes $${currentDebt.toLocaleString('es-MX')} pendientes, así que conviene preparar ese pago desde ahora.`,
        color: '#D48B3F'
      };
    }
    return null;
  };

  const getNextPaymentDate = (paymentDate) => {
    if (!paymentDate) return null;
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

  const getWeekDaysRemaining = (baseDate = new Date()) => {
    const day = (baseDate.getDay() + 6) % 7;
    return Math.max(1, 7 - day);
  };

  const buildPaymentPlan = (card) => {
    const used = Number(card?.used || 0);
    const limit = Number(card?.limit || 0);
    const goalPercent = Number(card?.paymentGoal ?? 0);
    const targetBalance = Math.round((limit * goalPercent) / 100);
    const amountToPay = Math.max(0, used - targetBalance);

    if (used <= 0) return null;

    const nextPaymentDate = getNextPaymentDate(card.paymentDate);
    if (!nextPaymentDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
    const weekDaysRemaining = getWeekDaysRemaining(today);
    const goalLabel = goalPercent === 0 ? '$0' : `${goalPercent}%`;
    const alreadyOnTarget = used <= targetBalance || amountToPay <= 0;

    if (alreadyOnTarget) {
      return {
        daysLeft,
        weekDaysRemaining,
        goalPercent,
        goalLabel,
        targetBalance,
        amountThisWeek: 0,
        totalToPay: 0,
        headline: `Meta actual cumplida: ${goalLabel}`,
        subline: goalPercent === 0
          ? 'Ya llegaste a la meta de tener la tarjeta en cero para el próximo pago.'
          : `Ya estás dentro de la meta de terminar en ${goalLabel} de uso para el próximo pago.`,
        caution: 'Evita volver a usarla antes del pago o corte si quieres conservar este nivel.',
        stages: [{ label: 'Meta actual', percent: 0, amount: 0 }]
      };
    }

    let stages = [];
    let headline = '';
    let subline = '';

    if (daysLeft <= 0) {
      stages = [{ label: 'Hoy', percent: 100 }];
      headline = goalPercent === 0 ? 'Meta inmediata: dejarla en $0' : `Meta inmediata: bajarla a ${goalLabel}`;
      subline = goalPercent === 0
        ? 'La fecha de pago ya venció. Lo ideal es cubrir de inmediato lo necesario para que no siga reportando deuda.'
        : `La fecha de pago ya venció. Lo ideal es bajar el saldo hoy hasta tu meta de ${goalLabel}.`;
    } else if (daysLeft <= 3) {
      stages = [
        { label: 'Hoy', percent: 70 },
        { label: 'Antes del pago', percent: 30 }
      ];
      headline = goalPercent === 0 ? 'Plan de emergencia hacia $0' : `Plan de emergencia hacia ${goalLabel}`;
      subline = goalPercent === 0
        ? `Quedan ${daysLeft} día${daysLeft > 1 ? 's' : ''}. La meta es llegar al pago con saldo en cero.`
        : `Quedan ${daysLeft} día${daysLeft > 1 ? 's' : ''}. La meta es bajar el saldo hasta ${goalLabel} antes del pago.`;
    } else if (daysLeft <= 7) {
      stages = [
        { label: 'Esta semana', percent: 60 },
        { label: 'Antes del pago', percent: 40 }
      ];
      headline = goalPercent === 0 ? 'Plan corto con meta en $0' : `Plan corto con meta en ${goalLabel}`;
      subline = goalPercent === 0
        ? `Todavía estás a tiempo de repartir el pago en ${daysLeft} días para que la tarjeta llegue en cero al próximo pago.`
        : `Todavía estás a tiempo de repartir el pago en ${daysLeft} días para que la tarjeta llegue en ${goalLabel} al próximo pago.`;
    } else if (daysLeft <= weekDaysRemaining + 7) {
      stages = [
        { label: 'Esta semana', percent: 45 },
        { label: 'Semana de pago', percent: 55 }
      ];
      headline = goalPercent === 0 ? 'Ruta por semanas hacia $0' : `Ruta por semanas hacia ${goalLabel}`;
      subline = goalPercent === 0
        ? `Aprovecha los ${weekDaysRemaining} día${weekDaysRemaining > 1 ? 's' : ''} que quedan esta semana y deja el resto para la semana del pago para llegar sin deuda.`
        : `Aprovecha los ${weekDaysRemaining} día${weekDaysRemaining > 1 ? 's' : ''} que quedan esta semana y deja el resto para la semana del pago para llegar dentro de ${goalLabel}.`;
    } else {
      stages = [
        { label: 'Esta semana', percent: 30 },
        { label: 'Próxima semana', percent: 30 },
        { label: 'Semana de pago', percent: 40 }
      ];
      headline = goalPercent === 0 ? 'Plan escalonado hacia saldo cero' : `Plan escalonado hacia ${goalLabel}`;
      subline = goalPercent === 0
        ? 'Tienes margen. Lo mejor es ir bajando el saldo por porcentajes para llegar al próximo pago con la tarjeta en cero.'
        : `Tienes margen. Lo mejor es ir bajando el saldo por porcentajes para llegar al próximo pago dentro de ${goalLabel}.`;
    }

    const stagesWithAmounts = stages.map((stage, index) => {
      const rawAmount = index === stages.length - 1
        ? amountToPay - stages.slice(0, index).reduce((sum, item) => sum + Math.round((amountToPay * item.percent) / 100), 0)
        : Math.round((amountToPay * stage.percent) / 100);

      return {
        ...stage,
        amount: Math.max(0, rawAmount)
      };
    });

    const amountThisWeek = stagesWithAmounts
      .filter((stage) => stage.label === 'Hoy' || stage.label === 'Mitad de semana' || stage.label === 'Esta semana')
      .reduce((sum, stage) => sum + stage.amount, 0);

    const caution = daysLeft <= 7
      ? 'Evita seguir usándola antes del pago o corte, porque el nuevo consumo puede volver a reportarse y alejarte de tu objetivo.'
      : `La idea es bajar el saldo por etapas y acercarte al próximo pago dentro de tu meta de ${goalLabel}.`;

    return {
      daysLeft,
      weekDaysRemaining,
      goalPercent,
      goalLabel,
      targetBalance,
      amountThisWeek,
      totalToPay: amountToPay,
      headline,
      subline,
      caution,
      stages: stagesWithAmounts
    };
  };


  const getCardRecommendation = (card) => {
    const available = getCardAvailable(card);
    const utilization = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
    const nextPaymentDate = getNextPaymentDate(card.paymentDate);
    const paymentPlan = buildPaymentPlan(card);
    const statementStatus = getStatementCycleStatus(card);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = nextPaymentDate
      ? Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24))
      : null;

    let score = 0;
    let tone = 'neutral';
    let badge = 'Evaluar';
    let color = '#737573';
    let action = 'Úsala con control';
    let summary = 'Tarjeta utilizable con seguimiento normal.';
    let detail = 'Mantén el gasto medido y revisa tu próximo pago.';

    if (available <= 0) {
      score = -100;
      tone = 'blocked';
      badge = 'No usar';
      color = '#9C382A';
      action = 'Evita usarla';
      summary = 'No tiene crédito disponible.';
      detail = 'Ya alcanzó su límite, así que no conviene cargar más consumo.';
    } else if (statementStatus.needsConfirmation) {
      score = -45 + Math.max(0, available / 1600) - utilization;
      tone = 'statementPending';
      badge = 'Estado pendiente';
      color = '#D48B3F';
      action = 'Espera el estado';
      summary = 'Falta confirmar que ya llegó el estado de cuenta.';
      detail = 'No recomendada todavía: falta confirmar estado de cuenta. Si el estado no llegó, el consumo nuevo puede reportarse en este ciclo.';
    } else if (
      daysLeft !== null && daysLeft <= 3 &&
      !statementStatus.isConfirmed
    ) {
      score = -20 + Math.max(0, available / 1000);
      tone = 'danger';
      badge = 'Pago cerca';
      color = '#9C382A';
      action = 'Mejor esperar';
      summary = Number(card.used || 0) > 0.009
        ? 'Su fecha de pago está demasiado cerca.'
        : 'Tu ciclo está limpio y el corte está cerca, mejor no romperlo.';
      detail = Number(card.used || 0) > 0.009
        ? 'Si la usas ahora, puedes complicar el manejo del pago o subir la utilización antes del corte.'
        : 'Aunque no debes nada, un consumo ahora puede caer en el ciclo que está por cortarse y romper tu ciclo limpio.';
    } else if (
      daysLeft !== null && daysLeft <= 7 &&
      !statementStatus.isConfirmed
    ) {
      score = 10 + Math.max(0, available / 1200) - utilization;
      tone = 'warning';
      badge = 'Con cuidado';
      color = '#D48B3F';
      action = 'Uso moderado';
      summary = 'Se puede usar, pero no es la ideal.';
      detail = Number(card.used || 0) > 0.009
        ? 'Tiene pago relativamente próximo; conviene priorizar montos pequeños o dejarla en reserva.'
        : 'Tu ciclo está limpio. Si usas la tarjeta ahora, el consumo podría reportarse antes del corte.';
    } else {
      score = 100 + Math.max(0, available / 150) - utilization * 1.6 + Math.min(daysLeft ?? 12, 20) * 2;
      tone = 'good';
      badge = 'Recomendada';
      color = '#2A4D3B';
      action = 'Es buena opción hoy';
      summary = 'Tiene mejor distancia al pago y margen disponible.';
      detail = 'Te ayuda a distribuir mejor el uso sin presionarte con un pago demasiado cercano.';
    }

    if (utilization >= 85 && available > 0) {
      score -= 35;
      if (tone === 'good') {
        tone = 'warning';
        badge = 'Alta utilización';
        color = '#D48B3F';
        action = 'Úsala poco';
        summary = 'Tiene poco aire disponible frente a su límite.';
        detail = 'Aunque todavía tenga cupo, conviene no cargarla mucho para proteger tu perfil.';
      }
    } else if (Math.floor(utilization) <= 19 && available > 0 && (daysLeft === null || daysLeft > 7)) {
      score += 15;
    }

    if (statementStatus.isConfirmed && available > 0 && tone === 'good') {
      score += 18;
      summary = 'Estado de cuenta confirmado y buen margen disponible.';
      detail = 'El cliente ya confirmó el estado de cuenta, así que puede usarse con más seguridad y control.';
    }

    return {
      ...card,
      available,
      utilization,
      daysLeft,
      nextPaymentDate,
      paymentPlan,
      statementStatus,
      score,
      tone,
      badge,
      color,
      action,
      summary,
      detail
    };
  };

  const autoAlertCardIds = cards
    .filter((card) => {
      const daysLeft = getDaysUntilPayment(card.paymentDate);
      const hasBalanceDue = Number(card?.used || 0) > 0.009;
      return hasBalanceDue && daysLeft !== null && daysLeft <= 2;
    })
    .map((card) => card.id);

  const recommendedCards = [...cards]
    .map(getCardRecommendation)
    .sort((a, b) => {
      const dateA = a.nextPaymentDate ? a.nextPaymentDate.getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.nextPaymentDate ? b.nextPaymentDate.getTime() : Number.MAX_SAFE_INTEGER;
      if (dateA !== dateB) return dateA - dateB;
      return b.score - a.score;
    });

  const bestCardToUse = [...recommendedCards]
    .filter((card) => card.available > 0)
    .sort((a, b) => b.score - a.score)[0] || null;

  useEffect(() => {
    if (recommendedCards.length === 0) {
      setRecommendationIndex(0);
      return;
    }

    if (recommendationIndex > recommendedCards.length - 1) {
      setRecommendationIndex(0);
    }
  }, [recommendedCards.length, recommendationIndex]);

  const activeRecommendation = recommendedCards[recommendationIndex] || null;

  const goToPreviousRecommendation = () => {
    if (recommendedCards.length <= 1) return;
    setRecommendationIndex((prev) => (prev === 0 ? recommendedCards.length - 1 : prev - 1));
  };

  const goToNextRecommendation = () => {
    if (recommendedCards.length <= 1) return;
    setRecommendationIndex((prev) => (prev === recommendedCards.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="cards-panel"
    >
      {/* Header */}
      <div className="hero-surface hero-surface-static p-5 sm:p-6 text-white">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold mb-2">Portafolio</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.04em]">Mis Tarjetas</h1>
            <p className="mt-2 text-sm text-white/70 max-w-xl">Controla utilización, límites, pagos y presión de crédito desde un solo lugar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch sm:min-w-[468px]">
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm min-h-[72px] sm:min-w-[226px] flex flex-col justify-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Tarjetas</p>
              <p className="metric-value mt-2 text-2xl">{cards.length}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="group relative flex min-h-[76px] w-full sm:min-w-[226px] items-center justify-start gap-3 overflow-hidden rounded-[24px] border border-[#D9B06F]/40 bg-gradient-to-br from-[#1F422F] via-[#173123] to-[#0E1E16] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(23,49,35,0.22),inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-20px_36px_rgba(0,0,0,0.18)] ring-1 ring-white/45 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F0D69A]/70 hover:shadow-[0_22px_44px_rgba(23,49,35,0.28),inset_0_1px_0_rgba(255,255,255,0.32),inset_0_0_0_999px_rgba(255,255,255,0.035)] active:translate-y-0 active:shadow-[inset_0_2px_12px_rgba(0,0,0,0.28)]"
              data-testid="add-card-btn"
              style={{ color: '#FFFFFF' }}
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.26),transparent_32%),radial-gradient(circle_at_82%_120%,rgba(217,176,111,0.24),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_44%)]" />
              <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#F4E3BD]/85 to-transparent" />
              <span className="relative flex h-12 w-[58px] shrink-0 items-center justify-center rounded-[18px] border border-[#F4E3BD]/35 bg-white/95 text-[#1F422F] shadow-[0_14px_28px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.95)]">
                <CreditCardIcon weight="duotone" className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#D9B06F] text-[#173123] shadow-[0_8px_18px_rgba(0,0,0,0.22)]">
                  <Plus weight="bold" className="h-3 w-3" />
                </span>
              </span>
              <span className="relative flex min-w-0 flex-col items-start leading-none">
                <span style={{ color: '#FFFFFF' }} className="text-[15px] font-semibold tracking-[-0.01em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">Nueva Tarjeta</span>
                <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F4E3BD]/80">Registrar crédito</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Total Credit Overview */}
      <div
        className="relative overflow-hidden rounded-[32px] border border-[#DDE2DA] bg-gradient-to-br from-white via-[#FAFAF7] to-[#F2EFE7] p-4 sm:p-5 shadow-[0_26px_80px_rgba(32,39,34,0.10)]"
        data-testid="credit-overview"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#2A4D3B]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-[#D48B3F]/14 blur-3xl" />

        <div className="relative z-10 grid gap-4 xl:grid-cols-[0.95fr_1.35fr] xl:items-stretch">
          <div className="rounded-[28px] border border-white/80 bg-white/78 p-5 sm:p-6 shadow-[0_18px_45px_rgba(17,24,39,0.06)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#2A4D3B]/10 bg-[#2A4D3B]/8 text-[#2A4D3B] shadow-[0_10px_24px_rgba(42,77,59,0.10)]">
                    <Wallet weight="fill" className="h-4 w-4" />
                  </span>
                  <p className="label-uppercase">Utilización Total del Crédito</p>
                </div>

                <div className="flex items-end gap-3 flex-wrap">
                  <span className="font-heading text-[54px] font-semibold leading-none tracking-[-0.07em] text-[#151714] sm:text-[68px]">
                    {totalUtilization.toFixed(1)}%
                  </span>
                  <span
                    className="mb-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-[0_10px_22px_rgba(17,24,39,0.05)]"
                    style={{
                      backgroundColor: `${getUtilizationStatus(totalUsed, totalLimit).color}12`,
                      borderColor: `${getUtilizationStatus(totalUsed, totalLimit).color}24`,
                      color: getUtilizationStatus(totalUsed, totalLimit).color
                    }}
                  >
                    {getUtilizationStatus(totalUsed, totalLimit).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-[18px] border border-[#E5E2DA] bg-[#FAFAF7] px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8A8D88]">Usado</p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-[-0.03em] text-[#171A17]">
                  ${totalUsed.toLocaleString('es-MX')}
                </p>
              </div>
              <div className="rounded-[18px] border border-[#E5E2DA] bg-[#FAFAF7] px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8A8D88]">Límite</p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-[-0.03em] text-[#171A17]">
                  ${totalLimit.toLocaleString('es-MX')}
                </p>
              </div>
              <div className="rounded-[18px] border border-[#DDE8DF] bg-[#F4FAF5] px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#6F8173]">Libre</p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-[-0.03em] text-[#2A4D3B]">
                  ${Math.max(totalLimit - totalUsed, 0).toLocaleString('es-MX')}
                </p>
              </div>
            </div>

            {/* Alerta si no hay crédito disponible */}
            {totalUtilization >= 100 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-[22px] border border-[#9C382A]/20 bg-[#9C382A]/10 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#9C382A]/20 flex items-center justify-center flex-shrink-0">
                  <Warning weight="fill" className="w-5 h-5 text-[#9C382A]" />
                </div>
                <div>
                  <p className="font-semibold text-[#9C382A]">Sin crédito disponible</p>
                  <p className="text-sm text-[#9C382A]/80">Has alcanzado el límite total de tus tarjetas.</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/70 p-5 sm:p-6 shadow-[0_18px_45px_rgba(17,24,39,0.055)] backdrop-blur-xl">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A8D88] font-semibold">Mapa de utilización</p>
                <p className="mt-1 text-sm text-[#737573]">
                  ${totalUsed.toLocaleString('es-MX')} de ${totalLimit.toLocaleString('es-MX')} utilizados
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#E5E2DA] bg-[#FAFAF7] px-3 py-2 text-xs font-semibold text-[#5F625F]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getUtilizationStatus(totalUsed, totalLimit).color }} />
                {getUtilizationStatus(totalUsed, totalLimit).label}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#E5E2DA] bg-gradient-to-br from-[#FFFFFF] to-[#F8F7F3] p-4 sm:p-5">
              <div className="relative pt-5 pb-9">
                <div className="relative h-6 overflow-hidden rounded-full border border-black/5 bg-[#E8E7E1] shadow-inner">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 shadow-[0_8px_20px_rgba(42,77,59,0.18)]" style={getUtilizationBarStyle(totalUtilization)} />
                  <div className="absolute inset-y-0 left-[10%] z-[2] w-px bg-[#2A4D3B]/55" />
                  <div className="absolute inset-y-0 left-[20%] z-[2] w-px bg-[#D48B3F]/60" />
                  <div className="absolute inset-y-0 left-[30%] z-[2] w-px bg-[#9C382A]/60" />
                </div>

                <div
                  className="absolute top-0 z-[3] -translate-x-1/2 rounded-full border border-white bg-[#151714] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_10px_22px_rgba(17,24,39,0.18)]"
                  style={{ left: `${Math.min(Math.max(totalUtilization, 3), 97)}%` }}
                >
                  {totalUtilization.toFixed(1)}%
                </div>

                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs font-medium text-[#7A7D78]">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-[#2A4D3B]/12 bg-[#2A4D3B]/6 px-3 py-2 text-center">
                  <div className="mx-auto mb-1 h-2 w-2 rounded-full bg-[#2A4D3B]" />
                  <p className="text-[11px] font-semibold text-[#2A4D3B]">10%</p>
                </div>
                <div className="rounded-2xl border border-[#D48B3F]/18 bg-[#D48B3F]/8 px-3 py-2 text-center">
                  <div className="mx-auto mb-1 h-2 w-2 rounded-full bg-[#D48B3F]" />
                  <p className="text-[11px] font-semibold text-[#8B5A24]">20%</p>
                </div>
                <div className="rounded-2xl border border-[#9C382A]/18 bg-[#9C382A]/8 px-3 py-2 text-center">
                  <div className="mx-auto mb-1 h-2 w-2 rounded-full bg-[#9C382A]" />
                  <p className="text-[11px] font-semibold text-[#9C382A]">30%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Card Recommendation */}
      <div className="relative overflow-hidden rounded-[32px] border border-[#D8DDD5] bg-[#FAFAF7] p-4 sm:p-5 shadow-[0_24px_70px_rgba(32,39,34,0.10)]" data-testid="card-usage-recommendations">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(42,77,59,0.13),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(212,139,63,0.18),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(246,242,234,0.62))]" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/70 bg-white/35 blur-2xl" />
        <div className="pointer-events-none absolute left-8 top-0 h-px w-[55%] bg-gradient-to-r from-transparent via-white to-transparent" />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DDE7DE] bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
                <Clock weight="fill" className="h-4 w-4 text-[#2A4D3B]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6E756D]">Guía inteligente de uso</p>
              </div>
              <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-[#151714] sm:text-[28px]">
                Decisión inteligente de uso
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#737573]">
                Identifica qué tarjeta conviene usar hoy según fecha de pago, utilización y cupo disponible.
              </p>
            </div>

            <button
              onClick={() => {
                setRecommendationIndex(0);
                setShowRecommendationDetails(true);
              }}
              className="group relative shrink-0 inline-flex min-h-[58px] items-center justify-center gap-3 overflow-hidden rounded-[24px] border border-[#D9B06F]/38 bg-gradient-to-br from-[#22392C] via-[#173123] to-[#101813] px-4 py-3 font-semibold text-white shadow-[0_16px_34px_rgba(23,49,35,0.18),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-18px_32px_rgba(0,0,0,0.18)] ring-1 ring-white/45 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F0D69A]/70 hover:shadow-[0_20px_38px_rgba(23,49,35,0.24),inset_0_1px_0_rgba(255,255,255,0.30),inset_0_0_0_999px_rgba(255,255,255,0.035)] active:translate-y-0 active:shadow-[inset_0_2px_12px_rgba(0,0,0,0.28)]"
              data-testid="toggle-card-recommendations"
              style={{ color: '#FFFFFF' }}
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_92%_120%,rgba(217,176,111,0.22),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_44%)]" />
              <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#F4E3BD]/80 to-transparent" />
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-[#F4E3BD]/35 bg-white/95 text-[#1F422F] shadow-[0_12px_24px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.95)]">
                <Sparkle weight="fill" className="h-4 w-4" />
              </span>
              <span className="relative flex min-w-0 flex-col items-start leading-none">
                <span style={{ color: '#FFFFFF' }} className="text-[15px] font-semibold tracking-[-0.01em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">Ver detalles</span>
                <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F4E3BD]/78">Abrir análisis</span>
              </span>
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-transform duration-200 group-hover:translate-x-0.5">
                <CaretRight className="h-4 w-4" />
              </span>
            </button>
          </div>

          {bestCardToUse ? (
            <div className="relative overflow-hidden rounded-[28px] border border-[#D8E8DE] bg-white/88 shadow-[0_18px_44px_rgba(42,77,59,0.12)] backdrop-blur">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#2A4D3B] via-[#5F8A70] to-[#D9B06F]" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#F7F2E8] via-white/60 to-transparent" />

              <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)] lg:items-center">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-[24px] bg-[#2A4D3B]/25 blur-xl" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#2A4D3B] to-[#173324] text-white shadow-[0_18px_30px_rgba(42,77,59,0.24)]">
                      {bestCardToUse.statementStatus?.needsConfirmation ? (
                        <WarningCircle weight="fill" className="h-7 w-7" />
                      ) : (
                        <CheckCircle weight="fill" className="h-7 w-7" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 pt-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2A4D3B]">{bestCardToUse.statementStatus?.needsConfirmation ? 'Tarjeta en pausa por estado' : 'Opción más saludable hoy'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-2xl font-semibold leading-tight text-[#171A17] truncate">{bestCardToUse.name}</h3>
                      <span
                        className="rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{ backgroundColor: `${bestCardToUse.color}12`, borderColor: `${bestCardToUse.color}24`, color: bestCardToUse.color }}
                      >
                        {bestCardToUse.badge}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#DDE7DE] bg-white/78 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2A4D3B] shadow-[0_8px_18px_rgba(42,77,59,0.07)]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F3F7F3] text-[9px] font-extrabold text-[#2A4D3B]">
                          {getCardType(bestCardToUse.type).mark}
                        </span>
                        {getCardType(bestCardToUse.type).name}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#E6DED2] bg-[#FCFBF8]/88 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6E6254] shadow-[0_8px_18px_rgba(28,31,27,0.05)]">
                        <CreditCardIcon weight="fill" className="h-3.5 w-3.5 text-[#2A4D3B]" />
                        •••• {String(bestCardToUse.number || '').slice(-4) || '0000'}
                      </span>
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] shadow-[0_8px_18px_rgba(28,31,27,0.05)]"
                        style={{ backgroundColor: `${bestCardToUse.statementStatus?.color || '#737573'}10`, borderColor: `${bestCardToUse.statementStatus?.color || '#737573'}24`, color: bestCardToUse.statementStatus?.color || '#737573' }}
                      >
                        {bestCardToUse.statementStatus?.isConfirmed ? <CheckCircle weight="fill" className="h-3.5 w-3.5" /> : <Clock weight="fill" className="h-3.5 w-3.5" />}
                        {bestCardToUse.statementStatus?.badge || 'Monitoreo'}
                      </span>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5E605D]">{bestCardToUse.summary}</p>
                    {bestCardToUse.statementStatus?.needsConfirmation ? (
                      <div className="mt-3 inline-flex max-w-2xl items-center gap-2 rounded-2xl border border-[#E8D4B8] bg-[#FFF7EA] px-3 py-2 text-[12px] font-semibold leading-relaxed text-[#8A5D26] shadow-[0_8px_18px_rgba(212,139,63,0.08)]">
                        <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
                        No recomendada todavía: falta confirmar estado de cuenta.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                  <div className="group rounded-[22px] border border-[#E5E3DE] bg-white/92 p-4 shadow-[0_10px_22px_rgba(28,31,27,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#D5DDD3] hover:shadow-[0_14px_30px_rgba(28,31,27,0.10)]">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F3F7F3] text-[#2A4D3B]">
                      <Wallet weight="fill" className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8D88]">Disponible</p>
                    <p className="mt-1 text-xl font-semibold text-[#171A17]">${bestCardToUse.available.toLocaleString('es-MX')}</p>
                  </div>

                  <div className="group rounded-[22px] border border-[#E5E3DE] bg-white/92 p-4 shadow-[0_10px_22px_rgba(28,31,27,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#D5DDD3] hover:shadow-[0_14px_30px_rgba(28,31,27,0.10)]">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F7F1E8] text-[#B97835]">
                      <CalendarBlank weight="fill" className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8D88]">Pago</p>
                    <p className="mt-1 text-xl font-semibold text-[#171A17]">
                      {bestCardToUse.nextPaymentDate
                        ? bestCardToUse.nextPaymentDate.toLocaleDateString('es', { day: 'numeric', month: 'short' })
                        : 'Sin fecha'}
                    </p>
                  </div>

                  <div className="group rounded-[22px] border border-[#E5E3DE] bg-white/92 p-4 shadow-[0_10px_22px_rgba(28,31,27,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#D5DDD3] hover:shadow-[0_14px_30px_rgba(28,31,27,0.10)]">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F4F1FA] text-[#6D5B95]">
                      <Sparkle weight="fill" className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8D88]">Acción</p>
                    <p className="mt-1 text-base font-semibold leading-tight" style={{ color: bestCardToUse.color }}>
                      {bestCardToUse.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[28px] border border-[#E6E6E3] bg-white/90 p-5 shadow-[0_14px_34px_rgba(28,31,27,0.08)]">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#C9B9A3] to-[#EEE6D9]" />
              <div className="flex items-center gap-4 pl-2">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-[#E6DED2] bg-[#FAF7F1] text-[#8A7C68]">
                  <CreditCardIcon weight="fill" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1C1A]">Aún no hay una tarjeta recomendada</p>
                  <p className="mt-1 text-sm text-[#737573]">Registra tarjetas con cupo disponible y fecha de pago para activar esta guía.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full items-start">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const utilization = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
            const cardType = getCardType(card.type);
            const status = getUtilizationStatus(card.used, card.limit);
            const available = getCardAvailable(card);
            const daysLeft = getDaysUntilPayment(card.paymentDate);
            const paymentAdvice = getPaymentAdvice(daysLeft, card.name, card.used);
            const paymentPlan = buildPaymentPlan(card);
            const statementStatus = getStatementCycleStatus(card);
            const hasBalanceDue = Number(card.used || 0) > 0.009;
            const showPaymentBadge = !status.isFull && hasBalanceDue && daysLeft !== null && daysLeft <= 5;
            const showStatementBadge = !status.isFull && !showPaymentBadge && statementStatus.needsConfirmation;
            const isAlertPreview = pulseOn && autoAlertCardIds.includes(card.id) && !!paymentAdvice;
            const recommendedSpend = card.limit * 0.10;
            const paymentGoalValue = Number(card.paymentGoal ?? 0);

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.1 } }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group w-full"
                data-testid={`card-item-${card.id}`}
                
              >
                {/* Alerta de fecha de pago próxima - reserva espacio en desktop para mantener todas las tarjetas niveladas */}
                <div className="mb-0 w-full">
                  {false ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-[22px] border shadow-[0_16px_34px_rgba(17,24,39,0.055)] h-full backdrop-blur-md"
                      style={{ 
                        backgroundColor: `${paymentAdvice.color}08`,
                        borderColor: `${paymentAdvice.color}30`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: `${paymentAdvice.color}20` }}
                        >
                          <Clock weight="fill" className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: paymentAdvice.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[13px] tracking-[-0.01em]" style={{ color: paymentAdvice.color }}>
                            {paymentAdvice.title}
                          </p>
                          <p className="text-[11px] text-[#737573] mt-1 leading-relaxed">
                            {paymentAdvice.message}
                          </p>
                          {daysLeft !== null && daysLeft > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span 
                                className="px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                                style={{ backgroundColor: paymentAdvice.color, color: 'white' }}
                              >
                                {daysLeft} día{daysLeft > 1 ? 's' : ''} restante{daysLeft > 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-[#737573]">
                                Deuda actual: <span className="font-semibold">${card.used.toLocaleString('es-MX')}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="hidden md:block h-full rounded-2xl border border-transparent" aria-hidden="true"></div>
                  )}
                </div>

                {/* Card Visual */}
                <motion.div
                  animate={{ scale: isAlertPreview ? 1.01 : 1, y: isAlertPreview ? -2 : 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`rounded-[28px] px-5 sm:px-6 py-4 sm:py-[18px] h-[250px] sm:h-auto min-h-[250px] sm:min-h-[260px] pb-7 sm:pb-8 relative overflow-hidden transition-all duration-300 border border-white/10 ${isAlertPreview ? 'shadow-none hover:shadow-none sm:shadow-[0_22px_45px_rgba(17,24,39,0.10)] sm:hover:shadow-[0_28px_60px_rgba(17,24,39,0.14)]' : 'shadow-[0_22px_45px_rgba(17,24,39,0.10)] hover:shadow-[0_28px_60px_rgba(17,24,39,0.14)]'} ${status.isFull ? 'opacity-70' : ''}`}
                  style={{ background: cardType.gradient }}
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/30" />
                    <div className="absolute -right-5 -top-5 w-32 h-32 rounded-full border border-white/20" />
                  </div>

                  {status.isFull && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#9C382A] rounded-full shadow-lg z-20">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Sin crédito</span>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {isAlertPreview && paymentAdvice ? (
                      <motion.div
                        key="alert-preview"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 h-full"
                      >
                        <div
                          className="relative h-full overflow-hidden rounded-[26px] border p-3 sm:p-5 backdrop-blur-xl flex flex-col justify-between shadow-none sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(0,0,0,0.16)]"
                          style={{
                            background: `linear-gradient(135deg, ${paymentAdvice.color}18 0%, rgba(20,22,20,0.74) 42%, rgba(20,22,20,0.56) 100%)`,
                            borderColor: `${paymentAdvice.color}55`,
                          }}
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-[3px]"
                            style={{ background: `linear-gradient(90deg, ${paymentAdvice.color} 0%, ${paymentAdvice.color}70 42%, transparent 100%)` }}
                          />
                          <div
                            className="hidden sm:block absolute -right-12 -top-14 h-36 w-36 rounded-full blur-3xl opacity-35 pointer-events-none"
                            style={{ backgroundColor: paymentAdvice.color }}
                          />
                          <div className="relative z-10 flex items-start gap-2.5 sm:gap-4">
                            <div
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-[0_14px_28px_rgba(0,0,0,0.18)] border border-white/10"
                              style={{ backgroundColor: `${paymentAdvice.color}24` }}
                            >
                              <Clock weight="fill" className="w-5 h-5" style={{ color: paymentAdvice.color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-extrabold text-[14px] sm:text-base tracking-[-0.015em] leading-tight" style={{ color: paymentAdvice.color }}>
                                  {paymentAdvice.title}
                                </p>
                                {daysLeft !== null && daysLeft > 0 && (
                                  <span
                                    className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-sm border border-white/10 whitespace-nowrap"
                                    style={{ backgroundColor: `${paymentAdvice.color}26`, color: paymentAdvice.color }}
                                  >
                                    {daysLeft} día{daysLeft > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] sm:text-sm mt-2 sm:mt-2.5 leading-[1.45] sm:leading-relaxed text-white/90 max-w-[98%]">
                                {paymentAdvice.message}
                              </p>
                            </div>
                          </div>

                          <div className="relative z-10 mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-2.5 sm:items-end">
                            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-black/25 px-3 py-2 sm:px-3.5 sm:py-2.5 text-[11px] sm:text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: paymentAdvice.color }} />
                              {Number(card.used || 0) > 0 ? (
                                <> <span className="font-semibold text-white/75">Deuda actual</span> <span className="font-extrabold text-white">${card.used.toLocaleString('es-MX')}</span></>
                              ) : (
                                <> <span className="font-semibold text-white/75">Saldo actual</span> <span className="font-extrabold text-white">$0</span></>
                              )}
                            </div>
                            {daysLeft !== null && daysLeft > 0 && (
                              <span
                                className="sm:hidden inline-flex w-fit px-2.5 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-[0.10em] shadow-sm border border-white/10"
                                style={{ backgroundColor: `${paymentAdvice.color}26`, color: paymentAdvice.color }}
                              >
                                {daysLeft} día{daysLeft > 1 ? 's' : ''} restante{daysLeft > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="card-default"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="relative h-full flex flex-col justify-between z-10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${cardType.textTone === 'dark' ? 'text-[#737573]' : 'text-white/70'}`}>
                              {cardType.name}
                            </p>
                            <p className={`font-semibold text-lg mt-1.5 ${cardType.textTone === 'dark' ? 'text-[#1A1C1A]' : 'text-white'}`}>
                              {card.name}
                            </p>
                          </div>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-[11px] font-extrabold tracking-[0.08em] shadow-[0_10px_22px_rgba(0,0,0,0.12)] ${cardType.textTone === 'dark' ? 'border-black/10 bg-white/55 text-[#1A1C1A]' : 'border-white/15 bg-white/12 text-white'}`}>
                            {cardType.mark}
                          </div>
                        </div>

                        <div className="flex items-end justify-between gap-3 mt-6">
                          <div>
                            <p className={`font-mono text-lg sm:text-[21px] tracking-[0.24em] ${cardType.textTone === 'dark' ? 'text-[#1A1C1A]' : 'text-white'}`}>
                              •••• •••• •••• {card.number.slice(-4) || '0000'}
                            </p>
                          </div>
                          {(showPaymentBadge || showStatementBadge) && (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div
                                className="px-2 py-1 rounded-full shadow-lg border border-white/10 backdrop-blur-sm"
                                style={{ backgroundColor: showStatementBadge ? '#D48B3F' : (daysLeft <= 2 ? '#9C382A' : '#D48B3F') }}
                              >
                                <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                                  {showStatementBadge ? 'No usar aún' : (daysLeft <= 0 ? 'Vencida' : `${daysLeft}d pago`)}
                                </span>
                              </div>
                              <div
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white border border-white/10 shadow-lg backdrop-blur-sm opacity-80"
                                style={{ backgroundColor: showStatementBadge ? statementStatus.color : (paymentAdvice?.color || '#9C382A'), pointerEvents: 'none' }}
                                aria-hidden="true"
                              >
                                {showStatementBadge ? 'estado' : 'alerta'}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Card Details */}
                <div className={`premium-card fintech-details-card -mt-3 sm:-mt-4 p-0 w-[96.5%] sm:w-[97%] mx-auto relative z-10 overflow-hidden border border-white/80 shadow-[0_24px_60px_rgba(17,24,39,0.10)] bg-white/92 backdrop-blur-xl`}>
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-[#F8F4ED]/60 to-transparent pointer-events-none" />
                  <div className="absolute -right-12 -top-16 w-44 h-44 rounded-full bg-[#2A4D3B]/[0.05] blur-2xl pointer-events-none" />
                  <div className="relative p-4 sm:p-5">
                    {/* Alerta individual si no hay crédito */}
                    {status.isFull && (
                      <div className="mb-3 p-3 rounded-2xl bg-[#9C382A]/10 border border-[#9C382A]/20 flex items-center gap-2 shadow-[0_10px_24px_rgba(156,56,42,0.08)]">
                        <Warning weight="fill" className="w-4 h-4 text-[#9C382A]" />
                        <span className="text-xs text-[#9C382A] font-semibold">No tienes crédito disponible</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_0.95fr] gap-3 mb-3">
                      <div className="rounded-[24px] border border-[#E6E0D7] bg-gradient-to-br from-white to-[#F8F4ED]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8D8F8A] font-semibold">Uso actual</p>
                            <div className="mt-1 flex items-end gap-2">
                              <p className="metric-value text-[34px] sm:text-[40px] leading-none tracking-[-0.04em]" style={{ color: status.color }}>
                                {utilization.toFixed(1)}%
                              </p>
                              <span
                                className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                                style={{ color: status.color, borderColor: `${status.color}26`, backgroundColor: `${status.color}0F` }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 relative">
                          <div className="progress-bar h-3 rounded-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(17,24,39,0.14)] bg-[#EEEAE4]">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 z-[1] shadow-[0_8px_18px_rgba(42,77,59,0.20)]"
                              style={getUtilizationBarStyle(utilization)}
                            />
                            <div className="absolute top-0 left-[10%] w-px h-full bg-[#2A4D3B]/45 z-[2]" />
                            <div className="absolute top-0 left-[20%] w-px h-full bg-[#D48B3F]/50 z-[2]" />
                            <div className="absolute top-0 left-[30%] w-px h-full bg-[#9C382A]/50 z-[2]" />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[#8D8F8A]">
                            <span>0%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-[22px] border border-[#E6E0D7] bg-white/86 p-3.5 shadow-[0_10px_24px_rgba(17,24,39,0.045)]">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8F8A] font-semibold">Límite</p>
                          <p className="metric-value text-[23px] leading-none tracking-[-0.03em] text-[#1A1C1A] mt-2">
                            ${card.limit.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-[#DDEBE2] bg-[#F5FBF7] p-3.5 shadow-[0_10px_24px_rgba(42,77,59,0.06)]">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8F8A] font-semibold">Disponible</p>
                          <p className={`metric-value text-[23px] leading-none tracking-[-0.03em] mt-2 ${available > 0 ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>
                            ${available.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div className="col-span-2 rounded-[22px] border border-[#E6E0D7] bg-white/72 p-3.5 shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8F8A] font-semibold">Usado</p>
                              <p className="metric-value text-[24px] leading-none tracking-[-0.03em] text-[#1A1C1A] mt-2">
                                ${card.used.toLocaleString('es-MX')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-semibold text-[#737573]">
                              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2A4D3B]"></span>10%</span>
                              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D48B3F]"></span>20%</span>
                              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#9C382A]"></span>30%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] bg-gradient-to-br from-[#FFFCF6] to-[#F7F1E7] border border-[#E6DED2] p-3.5 sm:p-4 shadow-[0_12px_28px_rgba(125,92,40,0.055)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-[#7E7363] font-bold">Uso recomendado</p>
                          <p className="text-xs sm:text-[13px] text-[#686966] mt-1 leading-relaxed">
                            El 10% de esta línea de crédito es lo recomendado para gastar.
                          </p>
                        </div>
                        <div className="text-right shrink-0 rounded-2xl bg-white/70 border border-white/80 px-3 py-2 shadow-sm">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8D8F8A]">10% de ${card.limit.toLocaleString('es-MX')}</p>
                          <p className="metric-value text-[24px] leading-none text-[#2A4D3B] mt-1">
                            ${recommendedSpend.toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E6E0D7] space-y-3">
                      {card.paymentDate && (
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E6DED2] bg-white/80 px-3 py-2 text-[13px] text-[#737573] shadow-sm">
                          <CalendarBlank weight="fill" className="w-4 h-4 text-[#D48B3F]" />
                          <span>Próximo pago: <span className="font-semibold text-[#3F423F]">{formatDayMonthShort(card.paymentDate)}</span></span>
                        </div>
                      )}

                      <div
                        className="min-h-[220px] sm:min-h-[220px] rounded-[24px] border bg-gradient-to-br from-white to-[#FAF7F1] p-3.5 sm:p-4 shadow-[0_12px_28px_rgba(28,31,27,0.045)] overflow-visible"
                        style={{ borderColor: `${statementStatus.color}24` }}
                      >
                        <div className="flex min-h-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border shadow-sm"
                              style={{ backgroundColor: `${statementStatus.color}12`, borderColor: `${statementStatus.color}22`, color: statementStatus.color }}
                            >
                              {statementStatus.isConfirmed ? (
                                <CheckCircle weight="fill" className="h-5 w-5" />
                              ) : statementStatus.needsConfirmation ? (
                                <WarningCircle weight="fill" className="h-5 w-5" />
                              ) : (
                                <Clock weight="fill" className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8F8A]">Estado de cuenta</p>
                                <span
                                  className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em]"
                                  style={{ backgroundColor: `${statementStatus.color}10`, borderColor: `${statementStatus.color}26`, color: statementStatus.color }}
                                >
                                  {statementStatus.badge}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-semibold text-[#1A1C1A]">{statementStatus.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-[#737573]">{statementStatus.detail}</p>
                              {statementStatus.confirmationDateLong ? (
                                <p className="mt-2 inline-flex rounded-full border border-[#DDE7DE] bg-white/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.10em] text-[#2A4D3B]">
                                  Confirmado el {statementStatus.confirmationDateLong}
                                </p>
                              ) : null}
                              {statementStatus.needsConfirmation ? (
                                <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#9A6B2D]">
                                  Esto evita usarla antes de tiempo y proteger mejor la utilización reportada.
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {statementStatus.needsConfirmation || statementStatus.isConfirmed ? (
                            <button
                              type="button"
                              onClick={() => toggleStatementClosed(card)}
                              className={`shrink-0 w-full sm:w-[260px] min-h-[54px] rounded-[18px] px-4 py-3 text-[11px] sm:text-[12px] leading-tight font-extrabold uppercase tracking-[0.08em] sm:tracking-[0.10em] whitespace-normal sm:whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 ${
                                statementStatus.isConfirmed
                                  ? 'border border-[#DDE7DE] bg-white text-[#2A4D3B] hover:bg-[#F4FAF6] hover:shadow-[0_10px_22px_rgba(42,77,59,0.08)]'
                                  : 'border border-[#2A4D3B]/20 bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B] text-white hover:shadow-[0_14px_28px_rgba(42,77,59,0.18)]'
                              }`}
                              data-testid={`toggle-statement-${card.id}`}
                            >
                              {statementStatus.isConfirmed ? 'Deshacer' : 'Ya llegó mi estado de cuenta'}
                            </button>
                          ) : (
                            <div className="shrink-0 hidden sm:flex w-[260px] rounded-[18px] border border-[#E6DED2] bg-white/50 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.10em] text-[#8D8F8A] items-center justify-center">
                              Acción disponible al llegar el pago
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          onClick={() => startEdit(card)}
                          className="flex items-center justify-center gap-2 py-3 rounded-[18px] border border-[#DADAD5] text-[13px] font-semibold text-[#5F615F] bg-white/85 hover:bg-[#F7F5F0] hover:border-[#CFCFC9] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(17,24,39,0.07)] transition-all duration-200"
                          data-testid={`edit-card-${card.id}`}
                        >
                          <PencilSimple weight="fill" className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(card.id)}
                          className="flex items-center justify-center gap-2 py-3 rounded-[18px] border border-[#F1CFC5] text-[13px] font-semibold text-[#B65C47] bg-[#FFF9F7] hover:bg-[#FFF1EC] hover:border-[#E8B3A5] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(182,92,71,0.10)] transition-all duration-200"
                          data-testid={`delete-card-${card.id}`}
                        >
                          <Trash weight="fill" className="w-4 h-4" />
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setGoalModalCard(card)}
                          className="flex items-center justify-center gap-2 py-3 rounded-[18px] border border-[#F1DFB8] text-[13px] font-semibold text-[#6A4B16] bg-[#FFF9ED] hover:bg-[#FFF3D9] hover:border-[#E5C681] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(212,139,63,0.10)] transition-all duration-200"
                          data-testid={`open-goal-modal-${card.id}`}
                        >
                          <Sparkle weight="fill" className="w-4 h-4" />
                          Objetivo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentModalCard(card);
                            setPaymentErrors((prev) => ({ ...prev, [card.id]: '' }));
                          }}
                          className="flex items-center justify-center gap-2 py-3 rounded-[18px] border border-[#2A4D3B]/20 text-[13px] font-bold text-white bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(42,77,59,0.20)] transition-all duration-200"
                          data-testid={`open-payment-modal-${card.id}`}
                        >
                          <CurrencyDollar weight="fill" className="w-4 h-4" />
                          Pagar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {cards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="md:col-span-2 lg:col-span-3 premium-card empty-state-premium p-8 sm:p-12 text-center"
          >
            <div className="empty-state-icon w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#F2F0EB] to-[#E6E6E3] flex items-center justify-center">
              <CreditCardIcon weight="duotone" className="w-10 h-10 text-[#737573]" />
            </div>
            <h3 className="font-heading font-semibold text-xl text-[#1A1C1A] mb-2">Activa tu portafolio de crédito</h3>
            <p className="text-[#737573] mb-6">Agrega tu primera tarjeta para calcular utilización, fechas de pago y recomendaciones inteligentes.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-app-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B] text-white font-semibold shadow-lg"
            >
              <Plus weight="bold" className="w-5 h-5" />
              <span>Agregar Tarjeta</span>
            </button>
          </motion.div>
        )}
      </div>


      {/* Recommendation Modal */}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {showRecommendationDetails && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-stretch justify-stretch modal-overlay overflow-hidden"
                  onClick={(e) => e.target === e.currentTarget && setShowRecommendationDetails(false)}
                  data-testid="card-recommendation-modal"
                >
                  <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                    className="app-system-modal-shell relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
                  >
              <div className="sticky top-0 z-10 w-full border-b border-[#E6E6E3] bg-gradient-to-r from-[#FCFBF8] to-[#F7FBF8] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0">
                <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] text-white shadow-md">
                      <Clock weight="fill" className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2A4D3B]">Guía inteligente de uso</p>
                      <h3 className="font-heading text-2xl font-semibold text-[#1A1C1A] mt-1">Decisión inteligente de uso</h3>
                      <p className="text-sm text-[#737573] mt-1">Mira el detalle completo en un popup sin recargar la vista principal.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRecommendationDetails(false)}
                    className="modal-close-btn"
                    aria-label="Cerrar"
                  >
                    <X weight="bold" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto bg-[#FAFAF9] overscroll-contain px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                <div className="mx-auto w-full max-w-[1600px]">
                {activeRecommendation ? (
                  <div className="rounded-[26px] border border-[#EAE4DA] bg-white p-4 sm:p-5 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#737573]">Detalle guiado</p>
                        <p className="text-sm text-[#5E605D] mt-1">
                          Tarjeta {recommendationIndex + 1} de {recommendedCards.length}. Desliza o usa las flechas para cambiar.
                        </p>
                      </div>
                      {recommendedCards.length > 1 && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={goToPreviousRecommendation}
                            className="w-10 h-10 rounded-full border border-[#E6DED2] bg-[#FCFBF8] text-[#1A1C1A] flex items-center justify-center hover:bg-[#F7F3EC] transition-all"
                            aria-label="Ver tarjeta anterior"
                          >
                            <CaretLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={goToNextRecommendation}
                            className="w-10 h-10 rounded-full border border-[#E6DED2] bg-[#FCFBF8] text-[#1A1C1A] flex items-center justify-center hover:bg-[#F7F3EC] transition-all"
                            aria-label="Ver tarjeta siguiente"
                          >
                            <CaretRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`recommendation-${activeRecommendation.id}`}
                        initial={{ opacity: 0, x: 36 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -36 }}
                        transition={{ duration: 0.22 }}
                        drag={recommendedCards.length > 1 ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.12}
                        onDragEnd={(_, info) => {
                          if (info.offset.x <= -60) {
                            goToNextRecommendation();
                          } else if (info.offset.x >= 60) {
                            goToPreviousRecommendation();
                          }
                        }}
                        className="rounded-[24px] border border-[#EAE4DA] bg-white shadow-sm cursor-grab active:cursor-grabbing"
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className="w-7 h-7 rounded-full bg-[#F2F0EB] flex items-center justify-center text-xs font-bold text-[#5E605D] shrink-0">
                                  {recommendationIndex + 1}
                                </span>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-[#1A1C1A] leading-tight truncate">{activeRecommendation.name}</h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDE7DE] bg-[#F4FAF6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2A4D3B] shadow-[0_7px_14px_rgba(42,77,59,0.06)]">
                                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[8px] font-extrabold text-[#2A4D3B]">
                                        {getCardType(activeRecommendation.type).mark}
                                      </span>
                                      {getCardType(activeRecommendation.type).name}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DED2] bg-[#FCFBF8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6E6254] shadow-[0_7px_14px_rgba(28,31,27,0.04)]">
                                      <CreditCardIcon weight="fill" className="h-3 w-3 text-[#2A4D3B]" />
                                      •••• {String(activeRecommendation.number || '').slice(-4) || '0000'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-[#737573] mt-2 pl-9">
                                Ordenada por pago:
                                <span className="font-semibold text-[#1A1C1A] ml-1">
                                  {activeRecommendation.nextPaymentDate
                                    ? activeRecommendation.nextPaymentDate.toLocaleDateString('es', { day: 'numeric', month: 'short' })
                                    : 'Sin fecha'}
                                </span>
                              </p>
                            </div>
                            <span
                              className="px-3 py-1.5 rounded-full text-xs font-bold"
                              style={{ backgroundColor: `${activeRecommendation.color}15`, color: activeRecommendation.color }}
                            >
                              {activeRecommendation.badge}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                            <div className="rounded-2xl bg-[#FAFAF9] p-3">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Disp.</p>
                              <p className="text-sm font-semibold text-[#1A1C1A] mt-1">${activeRecommendation.available.toLocaleString('es-MX')}</p>
                            </div>
                            <div className="rounded-2xl bg-[#FAFAF9] p-3">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Uso</p>
                              <p className="text-sm font-semibold text-[#1A1C1A] mt-1">{activeRecommendation.utilization.toFixed(1)}%</p>
                            </div>
                            <div className="rounded-2xl bg-[#FAFAF9] p-3">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Pago</p>
                              <p className="text-sm font-semibold text-[#1A1C1A] mt-1">
                                {activeRecommendation.daysLeft === null ? '—' : `${activeRecommendation.daysLeft}d`}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-[#F8F4ED] p-3 border border-[#E6DED2]">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">10%</p>
                              <p className="text-sm font-semibold text-[#2A4D3B] mt-1">
                                $ {(activeRecommendation.limit * 0.10).toLocaleString('es-MX')}
                              </p>
                            </div>
                          </div>


                          <div
                            className="mt-4 rounded-2xl border bg-[#FCFBF8] p-3.5"
                            style={{ borderColor: `${activeRecommendation.statementStatus?.color || '#737573'}24` }}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-3">
                                <div
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                                  style={{ backgroundColor: `${activeRecommendation.statementStatus?.color || '#737573'}10`, borderColor: `${activeRecommendation.statementStatus?.color || '#737573'}24`, color: activeRecommendation.statementStatus?.color || '#737573' }}
                                >
                                  {activeRecommendation.statementStatus?.isConfirmed ? <CheckCircle weight="fill" className="h-5 w-5" /> : <Clock weight="fill" className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737573]">Estado de cuenta</p>
                                  <p className="mt-1 text-sm font-semibold text-[#1A1C1A]">{activeRecommendation.statementStatus?.title}</p>
                                  <p className="mt-1 text-xs leading-relaxed text-[#737573]">{activeRecommendation.statementStatus?.detail}</p>
                                  {activeRecommendation.statementStatus?.confirmationDateLong ? (
                                    <p className="mt-2 inline-flex rounded-full border border-[#DDE7DE] bg-white/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.10em] text-[#2A4D3B]">
                                      Confirmado el {activeRecommendation.statementStatus.confirmationDateLong}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              {activeRecommendation.statementStatus?.needsConfirmation || activeRecommendation.statementStatus?.isConfirmed ? (
                                <button
                                  type="button"
                                  onClick={() => toggleStatementClosed(activeRecommendation)}
                                  className={`shrink-0 w-full sm:w-auto min-h-[52px] rounded-2xl px-4 py-3 text-[11px] leading-tight font-extrabold uppercase tracking-[0.08em] sm:tracking-[0.10em] whitespace-normal sm:whitespace-nowrap transition-all ${
                                    activeRecommendation.statementStatus?.isConfirmed
                                      ? 'border border-[#DDE7DE] bg-white text-[#2A4D3B] hover:bg-[#F4FAF6]'
                                      : 'border border-[#2A4D3B]/20 bg-[#1E3A2B] text-white hover:bg-[#2A4D3B]'
                                  }`}
                                >
                                  {activeRecommendation.statementStatus?.isConfirmed ? 'Deshacer' : 'Ya llegó mi estado de cuenta'}
                                </button>
                              ) : null}
                            </div>
                          </div>

                          {activeRecommendation.paymentPlan && (
                            <div className="mt-4 rounded-2xl border border-[#E6DED2] bg-[#FCFBF8] p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Meta de cierre</p>
                                  <p className="text-sm font-semibold text-[#1A1C1A] mt-1">Escoge la meta que más se adapta al cliente</p>
                                </div>
                                <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
                                  {PAYMENT_GOAL_OPTIONS.map((option) => {
                                    const isActive = Number(activeRecommendation.paymentGoal ?? 0) === option.value;
                                    return (
                                      <button
                                        key={`${activeRecommendation.id}-detail-goal-${option.value}`}
                                        type="button"
                                        onClick={() => updateCardPaymentGoal(activeRecommendation, option.value)}
                                        className={`h-10 px-3 rounded-2xl text-xs font-bold transition-all border ${
                                          isActive
                                            ? 'bg-[#1E3A2B] text-white border-[#1E3A2B] shadow-lg shadow-[#1E3A2B]/15'
                                            : 'bg-white text-[#5F615F] border-[#E6DED2] hover:bg-[#F8F4ED]'
                                        }`}
                                      >
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mt-4">
                                <div className="max-w-xl">
                                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Ruta según objetivo</p>
                                  <p className="text-sm font-semibold text-[#1A1C1A] mt-1">{activeRecommendation.paymentPlan.headline}</p>
                                  <p className="text-xs text-[#5E605D] mt-1 leading-relaxed">{activeRecommendation.paymentPlan.subline}</p>
                                  <p className="text-xs text-[#9C382A] mt-2 leading-relaxed font-medium">{activeRecommendation.paymentPlan.caution}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[280px]">
                                  <div className="rounded-2xl bg-white border border-[#EAE4DA] p-3 text-right">
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Prioridad</p>
                                    <p className="text-sm font-bold text-[#2A4D3B] mt-1">
                                      ${activeRecommendation.paymentPlan.amountThisWeek.toLocaleString('es-MX')}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-white border border-[#EAE4DA] p-3 text-right">
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Meta al pago</p>
                                    <p className="text-sm font-bold text-[#1A1C1A] mt-1">
                                      {activeRecommendation.paymentPlan.goalPercent === 0 ? '$0' : `${activeRecommendation.paymentPlan.goalLabel} · $${activeRecommendation.paymentPlan.targetBalance.toLocaleString('es-MX')}`}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                                {activeRecommendation.paymentPlan.stages.map((stage, stageIndex) => (
                                  <div key={`${activeRecommendation.id}-detail-plan-${stageIndex}`} className="rounded-2xl bg-white border border-[#EAE4DA] p-3">
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">{stage.label}</p>
                                    <p className="text-sm font-semibold text-[#1A1C1A] mt-1">{stage.percent}%</p>
                                    <p className="text-sm font-bold text-[#2A4D3B] mt-1">${stage.amount.toLocaleString('es-MX')}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 p-4 rounded-2xl border" style={{ borderColor: `${activeRecommendation.color}22`, backgroundColor: `${activeRecommendation.color}08` }}>
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${activeRecommendation.color}18` }}>
                                {activeRecommendation.tone === 'good' ? (
                                  <CheckCircle weight="fill" className="w-5 h-5" style={{ color: activeRecommendation.color }} />
                                ) : activeRecommendation.tone === 'blocked' || activeRecommendation.tone === 'danger' ? (
                                  <WarningCircle weight="fill" className="w-5 h-5" style={{ color: activeRecommendation.color }} />
                                ) : (
                                  <Clock weight="fill" className="w-5 h-5" style={{ color: activeRecommendation.color }} />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: activeRecommendation.color }}>{activeRecommendation.action}</p>
                                <p className="text-xs text-[#5E605D] mt-1 leading-relaxed">{activeRecommendation.detail}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {recommendedCards.length > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        {recommendedCards.map((card, dotIndex) => (
                          <button
                            key={`dot-${card.id}`}
                            type="button"
                            onClick={() => setRecommendationIndex(dotIndex)}
                            className={`h-2.5 rounded-full transition-all ${dotIndex === recommendationIndex ? 'w-8 bg-[#1A1C1A]' : 'w-2.5 bg-[#D8D3CA]'}`}
                            aria-label={`Ir a la tarjeta ${dotIndex + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state-premium w-full rounded-[24px] border border-dashed border-[#D8D3CA] bg-[#FCFBF8] p-6 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F2F0EB] flex items-center justify-center">
                      <CreditCardIcon weight="duotone" className="w-7 h-7 text-[#737573]" />
                    </div>
                    <p className="text-[#1A1C1A] font-semibold mt-4">Agrega tarjetas para ver recomendaciones</p>
                    <p className="text-sm text-[#737573] mt-1">Esta sección te ayudará a usar mejor cada tarjeta según su fecha de pago y cupo disponible.</p>
                  </div>
                )}
                </div>
              </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}

      {/* Goal Modal */}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {goalModalCard && (() => {
                const paymentPlan = buildPaymentPlan(goalModalCard);
                const paymentGoalValue = Number(goalModalCard.paymentGoal ?? 0);

                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-stretch justify-stretch modal-overlay overflow-hidden"
                    onClick={(e) => e.target === e.currentTarget && setGoalModalCard(null)}
                    data-testid="card-goal-modal"
                  >
                    <motion.div
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '100%', opacity: 0 }}
                      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                      className="app-system-modal-shell relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
                    >
                <div className="sticky top-0 z-10 w-full border-b border-[#E6E6E3] bg-gradient-to-r from-[#FFF8EA] to-[#FCFBF8] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0">
                  <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D48B3F] to-[#B67A2E] text-white shadow-md">
                        <Sparkle weight="fill" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6A4B16]">Objetivo de pago</p>
                        <h3 className="font-heading text-2xl font-semibold text-[#1A1C1A] mt-1">{goalModalCard.name}</h3>
                        <p className="text-sm text-[#737573] mt-1">Define cómo quieres llegar al próximo pago y mira la ruta sugerida.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGoalModalCard(null)}
                      className="modal-close-btn"
                      aria-label="Cerrar"
                    >
                      <X weight="bold" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto bg-[#FAFAF9] overscroll-contain px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                  <div className="mx-auto w-full max-w-[1600px] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-[#EAE4DA] bg-white p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Saldo actual</p>
                      <p className="text-2xl font-semibold text-[#1A1C1A] mt-2">${Number(goalModalCard.used || 0).toLocaleString('es-MX')}</p>
                    </div>
                    <div className="rounded-2xl border border-[#EAE4DA] bg-white p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Próximo pago</p>
                      <p className="text-2xl font-semibold text-[#1A1C1A] mt-2">{goalModalCard.paymentDate ? formatDayMonthShort(goalModalCard.paymentDate) : 'Sin fecha'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#EAE4DA] bg-white p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Meta actual</p>
                      <p className="text-2xl font-semibold text-[#2A4D3B] mt-2">{paymentGoalValue === 0 ? '$0' : `${paymentGoalValue}%`}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E6DED2] bg-[#FCFBF8] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Selecciona la meta</p>
                        <p className="text-sm font-semibold text-[#1A1C1A] mt-1">Elige cómo quieres que cierre esta tarjeta antes del pago</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
                        {PAYMENT_GOAL_OPTIONS.map((option) => {
                          const isActive = paymentGoalValue === option.value;
                          return (
                            <button
                              key={`${goalModalCard.id}-goal-modal-${option.value}`}
                              type="button"
                              onClick={() => setGoalModalCard((prev) => ({ ...prev, paymentGoal: option.value }))}
                              className={`h-10 px-3 rounded-2xl text-xs font-bold transition-all border ${
                                isActive
                                  ? 'bg-[#1E3A2B] text-white border-[#1E3A2B] shadow-lg shadow-[#1E3A2B]/15'
                                  : 'bg-white text-[#5F615F] border-[#E6DED2] hover:bg-[#F8F4ED]'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {paymentPlan ? (
                    <div className="rounded-2xl border border-[#E6DED2] bg-[#FCFBF8] p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="max-w-xl">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[#737573]">Ruta según objetivo</p>
                          <p className="text-lg font-semibold text-[#1A1C1A] mt-1">{paymentPlan.headline}</p>
                          <p className="text-sm text-[#5E605D] mt-2 leading-relaxed">{paymentPlan.subline}</p>
                          <p className="text-sm text-[#9C382A] mt-2 leading-relaxed font-medium">{paymentPlan.caution}</p>
                        </div>
                        <div className="flex gap-6 items-start shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Prioridad</p>
                            <p className="text-2xl font-semibold text-[#2A4D3B] mt-1">${paymentPlan.amountThisWeek.toLocaleString('es-MX')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Meta al pago</p>
                            <p className="text-sm font-bold text-[#1A1C1A] mt-1">{paymentPlan.goalPercent === 0 ? '$0' : `${paymentPlan.goalLabel} · $${paymentPlan.targetBalance.toLocaleString('es-MX')}`}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                        {paymentPlan.stages.map((stage, stageIndex) => (
                          <div key={`${goalModalCard.id}-goal-stage-${stageIndex}`} className="rounded-2xl bg-white border border-[#EAE4DA] p-3">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">{stage.label}</p>
                            <p className="text-sm font-semibold text-[#1A1C1A] mt-1">{stage.percent}%</p>
                            <p className="text-sm font-bold text-[#2A4D3B] mt-1">${stage.amount.toLocaleString('es-MX')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#E6DED2] bg-[#FCFBF8] p-4">
                      <p className="text-sm font-semibold text-[#1A1C1A]">Aún no hay una ruta disponible.</p>
                      <p className="text-sm text-[#5E605D] mt-1">Esta tarjeta necesita saldo usado y fecha de pago para calcular el objetivo.</p>
                    </div>
                  )}
                  </div>
                </div>

                <div className="sticky bottom-0 z-10 w-full border-t border-[#E6E6E3] bg-[#F5F4F1] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <div className="mx-auto flex w-full max-w-[1600px] flex-col-reverse gap-3 sm:flex-row justify-end">
                  <button
                    type="button"
                    onClick={() => setGoalModalCard(null)}
                    className="btn-modal-secondary"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateCardPaymentGoal(goalModalCard, paymentGoalValue);
                      setGoalModalCard(null);
                    }}
                    className="btn-modal-primary"
                  >
                    Guardar objetivo
                  </button>
                  </div>
                </div>
                    </motion.div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>,
            document.body
          )
        : null}

      {/* Payment Modal */}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {paymentModalCard && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-stretch justify-stretch modal-overlay overflow-hidden"
                  onClick={(e) => e.target === e.currentTarget && setPaymentModalCard(null)}
                  data-testid="card-payment-modal"
                >
                  <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                    className="app-system-modal-shell relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
                  >
              <div className="sticky top-0 z-10 w-full border-b border-[#E6E6E3] bg-gradient-to-r from-[#F7FBF8] to-[#F4F8F5] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0">
                <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] text-white shadow-md">
                      <CurrencyDollar weight="fill" className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-[#1A1C1A]">Pagar tarjeta</h2>
                      <p className="text-sm text-[#737573] mt-1">Simula el pago de {paymentModalCard.name} usando el cash disponible.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentModalCard(null)}
                    className="modal-close-btn"
                    aria-label="Cerrar"
                  >
                    <X weight="bold" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto bg-[#FAFAF9] overscroll-contain px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                <div className="mx-auto w-full max-w-[1600px]">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-[13px] text-[#5E605D] leading-relaxed">
                      Esto no paga al banco desde la app. Solo simula el pago para que veas cómo cambia tu tarjeta y tu cash.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-white border border-[#E6DED2] px-3 py-2 min-w-[160px]">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Cash disponible</p>
                    <p className={`metric-value text-lg mt-1 ${cashAvailable > 0 ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>
                      ${Number(cashAvailable || 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 mt-4">
                  <div className="relative">
                    <Wallet weight="fill" className="w-4 h-4 text-[#737573] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={paymentDrafts[paymentModalCard.id] ?? ''}
                      onChange={(e) => handlePaymentDraftChange(paymentModalCard.id, e.target.value)}
                      placeholder={`${getSuggestedPaymentAmount(paymentModalCard).toLocaleString('es-MX')}`}
                      className="w-full h-11 rounded-2xl border border-[#E6DED2] bg-white pl-10 pr-4 text-sm font-medium text-[#1A1C1A] placeholder:text-[#A0A29F] focus:outline-none focus:ring-2 focus:ring-[#2A4D3B]/20 focus:border-[#2A4D3B]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulatePayment(paymentModalCard)}
                    disabled={
                      Number(cashAvailable || 0) <= 0 ||
                      Number(paymentModalCard.used || 0) <= 0 ||
                      !String(paymentDrafts[paymentModalCard.id] ?? '').trim()
                    }
                    className="btn-modal-primary inline-flex items-center justify-center gap-2 px-4 text-sm disabled:hover:translate-y-0"
                    data-testid={`simulate-card-payment-${paymentModalCard.id}`}
                  >
                    <CurrencyDollar weight="bold" className="w-4 h-4" />
                    Pagar tarjeta
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDrafts((prev) => ({ ...prev, [paymentModalCard.id]: String(getSuggestedPaymentAmount(paymentModalCard)) }));
                      setPaymentErrors((prev) => ({ ...prev, [paymentModalCard.id]: '' }));
                    }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white border border-[#E6DED2] text-[#5F615F] hover:bg-[#F8F4ED] transition-all"
                  >
                    Usar sugerido: ${getSuggestedPaymentAmount(paymentModalCard).toLocaleString('es-MX')}
                  </button>
                  <span className="text-[11px] text-[#737573]">Máximo a pagar ahora: ${Math.min(Number(paymentModalCard.used || 0), Number(cashAvailable || 0)).toLocaleString('es-MX')}</span>
                </div>

                {paymentErrors[paymentModalCard.id] ? (
                  <div className="mt-3 rounded-2xl bg-[#FFF7F4] border border-[#F2D4CB] px-3 py-2 text-xs font-medium text-[#9C382A]">
                    {paymentErrors[paymentModalCard.id]}
                  </div>
                ) : null}
                </div>
              </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}

      {/* Add/Edit Card Modal */}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {showForm ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-stretch justify-stretch modal-overlay overflow-hidden"
                  onClick={(e) => e.target === e.currentTarget && resetForm()}
                  data-testid="card-modal"
                >
                  <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                    className="app-system-modal-shell relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
                  >
                    <form onSubmit={handleSubmit} className="flex h-full min-h-0 w-full flex-col bg-white">
                    <div className="sticky top-0 z-10 w-full border-b border-[#E6E6E3] bg-gradient-to-r from-[#FAFAF9] to-[#F5F4F1] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0">
                      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] flex items-center justify-center shadow-lg shadow-[#2A4D3B]/20 flex-shrink-0">
                            <CreditCardIcon weight="fill" className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-heading font-semibold text-lg text-[#1A1C1A] leading-tight">
                              {editingCard ? 'Editar tarjeta' : 'Nueva Tarjeta'}
                            </h2>
                            <p className="text-xs text-[#737573] font-medium leading-relaxed">
                              {editingCard ? 'Actualiza los datos de tu tarjeta de crédito' : 'Registra los datos de tu tarjeta de crédito'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={resetForm}
                          className="modal-close-btn flex-shrink-0"
                          data-testid="close-card-modal"
                        >
                          <X weight="bold" />
                        </button>
                      </div>
                    </div>

                    <div className="sticky top-[85px] sm:top-[93px] z-[9] w-full bg-white px-4 sm:px-6 lg:px-8 py-3 flex-shrink-0">
                      <div className="mx-auto flex w-full max-w-[1600px] gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B]" />
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto bg-[#FAFAF9] overscroll-contain px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                      <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-5 mobile-form-stack">
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-[#9C382A]/10 border border-[#9C382A]/20 flex items-center gap-3"
                          >
                            <Warning weight="fill" className="w-5 h-5 text-[#9C382A] flex-shrink-0" />
                            <p className="text-sm text-[#9C382A] font-semibold">{error}</p>
                          </motion.div>
                        )}

                        <div>
                          <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Nombre de la tarjeta</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Mi tarjeta principal"
                            className="premium-input"
                            required
                            autoComplete="off"
                            autoFocus
                            data-testid="card-name-input"
                          />
                          <p className="text-xs text-[#737573] mt-1.5">Solo letras. Cada palabra inicia en mayúscula.</p>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Banco / emisor</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="premium-input"
                            data-testid="card-type-select"
                          >
                            {CARD_TYPES.map((type) => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                          </select>
                          <div
                            className="mt-3 overflow-hidden rounded-[24px] border border-white/70 p-4 shadow-[0_14px_32px_rgba(17,24,39,0.08)]"
                            style={{ background: selectedIssuer.gradient }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${selectedIssuer.textTone === 'dark' ? 'text-[#5F615F]' : 'text-white/70'}`}>Vista previa</p>
                                <p className={`mt-1 text-lg font-bold ${selectedIssuer.textTone === 'dark' ? 'text-[#1A1C1A]' : 'text-white'}`}>{selectedIssuer.name}</p>
                              </div>
                              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xs font-extrabold tracking-[0.08em] ${selectedIssuer.textTone === 'dark' ? 'border-black/10 bg-white/60 text-[#1A1C1A]' : 'border-white/15 bg-white/15 text-white'}`}>
                                {selectedIssuer.mark}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Últimos 4 dígitos</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formData.number}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            placeholder="1234"
                            className="premium-input font-mono text-lg tracking-widest"
                            maxLength={4}
                            minLength={4}
                            pattern="[0-9]{4}"
                            required
                            autoComplete="off"
                            data-testid="card-number-input"
                          />
                          <p className="text-xs text-[#737573] mt-1.5">Campo obligatorio. Solo números (4 dígitos).</p>
                        </div>

                        <div className="grid w-full min-w-0 grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Límite de crédito</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.limit}
                              onChange={(e) => handleNumberChange('limit', e.target.value)}
                              placeholder="50000"
                              className="premium-input font-mono"
                              required
                              autoComplete="off"
                              data-testid="card-limit-input"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Uso actual</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.used}
                              onChange={(e) => handleNumberChange('used', e.target.value)}
                              placeholder="0"
                              className={`premium-input font-mono ${error ? 'border-[#9C382A] focus:border-[#9C382A]' : ''}`}
                              autoComplete="off"
                              data-testid="card-used-input"
                            />
                          </div>
                        </div>

                        {formData.limit && (
                          <div className="w-full max-w-full min-w-0 overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-[#F2F0EB] to-[#EAE8E3]">
                            <div className="flex min-w-0 flex-wrap items-center justify-between text-sm mb-2 gap-3">
                              <span className="text-[#737573] font-medium">Vista previa de utilización</span>
                              <span className="metric-value text-sm" style={{ color: getUtilizationStatus(parseFloat(formData.used) || 0, parseFloat(formData.limit) || 1).color }}>
                                {((parseFloat(formData.used) || 0) / (parseFloat(formData.limit) || 1) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="progress-bar h-2.5 rounded-full overflow-hidden">
                              <div
                                className="progress-fill h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(((parseFloat(formData.used) || 0) / (parseFloat(formData.limit) || 1) * 100), 100)}%`,
                                  backgroundColor: getUtilizationStatus(parseFloat(formData.used) || 0, parseFloat(formData.limit) || 1).color
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-[#737573] gap-3 flex-wrap">
                              <span>Usado: <span className="font-semibold">${(parseFloat(formData.used) || 0).toLocaleString('es-MX')}</span></span>
                              <span>Disponible: <span className="font-semibold">${((parseFloat(formData.limit) || 0) - (parseFloat(formData.used) || 0)).toLocaleString('es-MX')}</span></span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">
                            Fecha de corte/pago <span className="text-[#B65C47]">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.paymentDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                            className={`premium-input mobile-date-input ${!formData.paymentDate && error?.includes('fecha') ? 'border-[#9C382A]' : ''}`}
                            required
                            data-testid="card-payment-date"
                          />
                          <p className="text-xs text-[#737573] mt-1.5">Campo obligatorio.</p>
                        </div>
                      </div>
                    </div>

                    <div className="sticky bottom-0 z-10 w-full border-t border-[#E6E6E3] bg-[#F5F4F1] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                      <div className="mx-auto flex w-full max-w-[1600px] flex-col-reverse gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="flex-1 btn-modal-secondary"
                          data-testid="cancel-card-btn"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 btn-modal-primary"
                          data-testid="save-card-btn"
                        >
                          {editingCard ? 'Guardar cambios' : 'Agregar tarjeta'}
                        </button>
                      </div>
                    </div>
                    </form>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </motion.div>
  );
}
