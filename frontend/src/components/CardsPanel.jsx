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

const CARD_TYPES = [
  { id: 'visa', name: 'Visa', gradient: 'credit-card-black' },
  { id: 'mastercard', name: 'Mastercard', gradient: 'credit-card-green' },
  { id: 'amex', name: 'American Express', gradient: 'credit-card-gold' },
  { id: 'discover', name: 'Discover', gradient: 'credit-card-sand' },
  { id: 'capital', name: 'Capital One', gradient: 'credit-card-black' },
  { id: 'other', name: 'Otro', gradient: 'credit-card-sand' }
];

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

// Función para formatear texto mientras se escribe
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
    type: 'visa',
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
      setError('Ya existe una tarjeta con ese mismo tipo y los mismos últimos 4 dígitos');
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
      error === 'Ya existe una tarjeta con ese mismo tipo y los mismos últimos 4 dígitos'
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
      setError('Ya existe una tarjeta con ese mismo tipo y los mismos últimos 4 dígitos');
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
    setFormData({ name: '', type: 'visa', number: '', limit: '', used: '', paymentDate: '', paymentGoal: '0' });
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
    if (pct >= 100) return { label: 'Sin crédito', color: '#9C382A', isFull: true };
    if (pctEntero <= 10) return { label: 'Saludable', color: '#2A4D3B', isFull: false };
    if (pctEntero <= 20) return { label: 'Moderado', color: '#D48B3F', isFull: false };
    if (pctEntero <= 30) return { label: 'Alto', color: '#9C382A', isFull: false };
    return { label: 'Crítico', color: '#9C382A', isFull: false };
  };


  const getUtilizationBarStyle = (utilization) => ({
    background: 'linear-gradient(to right, #2A4D3B 0%, #2A4D3B 10%, #D48B3F 10%, #D48B3F 20%, #9C382A 20%, #9C382A 100%)',
    clipPath: `inset(0 ${100 - Math.min(utilization, 100)}% 0 0 round 999px)`,
    WebkitClipPath: `inset(0 ${100 - Math.min(utilization, 100)}% 0 0 round 999px)`
  });

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
    const payment = new Date(paymentDate);
    payment.setHours(0, 0, 0, 0);
    const diffTime = payment - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    const originalDate = new Date(paymentDate);
    if (Number.isNaN(originalDate.getTime())) return null;

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
    } else if (daysLeft !== null && daysLeft <= 3) {
      score = -20 + Math.max(0, available / 1000);
      tone = 'danger';
      badge = 'Pago cerca';
      color = '#9C382A';
      action = 'Mejor esperar';
      summary = 'Su fecha de pago está demasiado cerca.';
      detail = 'Si la usas ahora, puedes complicar el manejo del pago o subir la utilización antes del corte.';
    } else if (daysLeft !== null && daysLeft <= 7) {
      score = 10 + Math.max(0, available / 1200) - utilization;
      tone = 'warning';
      badge = 'Con cuidado';
      color = '#D48B3F';
      action = 'Uso moderado';
      summary = 'Se puede usar, pero no es la ideal.';
      detail = 'Tiene pago relativamente próximo; conviene priorizar montos pequeños o dejarla en reserva.';
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
    } else if (Math.floor(utilization) <= 10 && available > 0 && (daysLeft === null || daysLeft > 7)) {
      score += 15;
    }

    return {
      ...card,
      available,
      utilization,
      daysLeft,
      nextPaymentDate,
      paymentPlan,
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
      return daysLeft !== null && daysLeft <= 2;
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
      <div className="hero-surface p-5 sm:p-6 text-white">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold mb-2">Control de crédito</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.04em]">Mis tarjetas</h1>
            <p className="mt-2 text-sm text-white/70 max-w-xl">Mira cuánto estás usando, cuánto te queda disponible y qué tarjeta conviene cuidar primero.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch sm:min-w-[468px]">
            <div className="rounded-[20px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm min-h-[72px] sm:min-w-[226px] flex flex-col justify-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">Tarjetas</p>
              <p className="metric-value mt-2 text-2xl">{cards.length}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex min-h-[72px] w-full sm:min-w-[226px] items-center justify-center gap-2 px-10 py-4 rounded-[20px] bg-white text-[#1E3A2B] font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all"
              data-testid="add-card-btn"
            >
              <Plus weight="bold" className="w-5 h-5" />
              <span>Agregar tarjeta</span>
            </button>
          </div>
        </div>
      </div>

      <div className="novice-guide-card">
        <div>
          <p className="novice-kicker">Lectura simple</p>
          <h2>La meta es mantener las tarjetas bajas</h2>
          <p>Para alguien nuevo en crédito: 10% o menos es saludable, 20% pide atención y 30% o más ya requiere actuar.</p>
        </div>
        <div className="novice-steps">
          <span>1. Revisa el % usado</span>
          <span>2. Mira la fecha de pago</span>
          <span>3. Baja primero la más alta</span>
        </div>
      </div>

      {/* Total Credit Overview */}
      <div className="premium-card p-6 bg-gradient-to-br from-white to-[#FAFAF9]" data-testid="credit-overview">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Wallet weight="fill" className="w-4 h-4 text-[#2A4D3B]" />
              <p className="label-uppercase">Uso total de tarjetas</p>
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <span className="metric-value text-4xl sm:text-5xl text-[#1A1C1A]">
                {totalUtilization.toFixed(1)}%
              </span>
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold mb-2`}
                style={{ backgroundColor: `${getUtilizationStatus(totalUsed, totalLimit).color}15`, color: getUtilizationStatus(totalUsed, totalLimit).color }}>
                {getUtilizationStatus(totalUsed, totalLimit).label}
              </span>
            </div>
            <p className="text-[#737573] mt-2">
              <span className="metric-value text-[#1A1C1A]">${totalUsed.toLocaleString('es-MX')}</span>
              {' '}de{' '}
              <span className="metric-value">${totalLimit.toLocaleString('es-MX')}</span>
              {' '}utilizados
            </p>
            
            {/* Alerta si no hay crédito disponible */}
            {totalUtilization >= 100 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-[#9C382A]/10 border border-[#9C382A]/20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#9C382A]/20 flex items-center justify-center flex-shrink-0">
                  <Warning weight="fill" className="w-5 h-5 text-[#9C382A]" />
                </div>
                <div>
                  <p className="font-semibold text-[#9C382A]">Sin crédito disponible</p>
                  <p className="text-sm text-[#9C382A]/80">Ya estás usando todo el crédito disponible. Evita seguir cargando compras hasta bajar saldos.</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="w-full lg:w-72">
            <div className="progress-bar h-4 rounded-full overflow-hidden relative">
              <div
                className="absolute inset-0 rounded-full transition-all duration-500"
                style={getUtilizationBarStyle(totalUtilization)}
              />
              {/* Marcadores de 10%, 20% y 30% */}
              <div className="absolute top-0 left-[10%] w-0.5 h-full bg-[#2A4D3B]/40" />
              <div className="absolute top-0 left-[20%] w-0.5 h-full bg-[#D48B3F]/40" />
              <div className="absolute top-0 left-[30%] w-0.5 h-full bg-[#9C382A]/40" />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#737573] font-medium">
              <span>0%</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2A4D3B]"></span>
                  10%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D48B3F]"></span>
                  20%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#9C382A]"></span>
                  30%
                </span>
              </div>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Card Recommendation */}
      <div className="premium-card p-5 bg-gradient-to-br from-white via-[#FCFBF8] to-[#F5F0E8]" data-testid="card-usage-recommendations">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Clock weight="fill" className="w-4 h-4 text-[#2A4D3B]" />
                <p className="label-uppercase">Qué tarjeta usar</p>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-semibold text-[#1A1C1A] tracking-tight">
                Recomendación de hoy
              </h2>
              <p className="text-sm text-[#737573] mt-1">
                La app te ayuda a escoger la tarjeta menos riesgosa según saldo, fecha de pago y crédito disponible.
              </p>
            </div>

            <button
              onClick={() => {
                setRecommendationIndex(0);
                setShowRecommendationDetails(true);
              }}
              className="btn-app-secondary shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-[#E6DED2] bg-white text-[#1A1C1A] font-semibold shadow-sm hover:bg-[#F8F4ED] transition-all"
              data-testid="toggle-card-recommendations"
            >
              <span>Ver detalles</span>
              <CaretRight className="w-4 h-4 transition-transform" />
            </button>
          </div>

          {bestCardToUse ? (
            <div className="rounded-[24px] border border-[#D7E6DC] bg-gradient-to-r from-[#F7FBF8] via-white to-[#FCFBF8] p-4 sm:p-5 shadow-[0_10px_24px_rgba(42,77,59,0.08)]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] flex items-center justify-center shadow-lg shadow-[#2A4D3B]/20 shrink-0">
                    <CheckCircle weight="fill" className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A4D3B]">Opción más saludable hoy</p>
                    <h3 className="font-semibold text-lg text-[#1A1C1A] mt-1 truncate">{bestCardToUse.name}</h3>
                    <p className="text-sm text-[#5E605D] mt-1">{bestCardToUse.summary}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[360px]">
                  <div className="rounded-2xl bg-white border border-[#E6E6E3] p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Disponible</p>
                    <p className="text-sm sm:text-base font-semibold text-[#1A1C1A] mt-1">${bestCardToUse.available.toLocaleString('es-MX')}</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-[#E6E6E3] p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Pago</p>
                    <p className="text-sm sm:text-base font-semibold text-[#1A1C1A] mt-1">
                      {bestCardToUse.nextPaymentDate
                        ? bestCardToUse.nextPaymentDate.toLocaleDateString('es', { day: 'numeric', month: 'short' })
                        : 'Sin fecha'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-[#E6E6E3] p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">Acción</p>
                    <p className="text-sm sm:text-base font-semibold mt-1" style={{ color: bestCardToUse.color }}>
                      {bestCardToUse.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#E6E6E3] bg-white p-4">
              <p className="text-sm font-semibold text-[#1A1C1A]">Aún no hay recomendación</p>
              <p className="text-sm text-[#737573] mt-1">Agrega una tarjeta con límite, saldo y fecha de pago para que la app pueda orientarte.</p>
            </div>
          )}

        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full items-start">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const utilization = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
            const cardType = CARD_TYPES.find(t => t.id === card.type) || CARD_TYPES[5];
            const status = getUtilizationStatus(card.used, card.limit);
            const available = getCardAvailable(card);
            const daysLeft = getDaysUntilPayment(card.paymentDate);
            const paymentAdvice = getPaymentAdvice(daysLeft, card.name, card.used);
            const paymentPlan = buildPaymentPlan(card);
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
                          <Clock weight="fill" className="w-5 h-5" style={{ color: paymentAdvice.color }} />
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
                  className={`${cardType.gradient} rounded-[28px] px-5 sm:px-6 py-4 sm:py-[18px] min-h-[210px] sm:min-h-[220px] relative overflow-hidden shadow-[0_22px_45px_rgba(17,24,39,0.10)] hover:shadow-[0_28px_60px_rgba(17,24,39,0.14)] transition-all duration-300 border border-white/10 ${status.isFull ? 'opacity-70' : ''}`}
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
                          className="h-full rounded-[24px] border p-4 sm:p-5 backdrop-blur-md flex flex-col justify-between"
                          style={{ backgroundColor: `${paymentAdvice.color}10`, borderColor: `${paymentAdvice.color}45` }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: `${paymentAdvice.color}22` }}
                            >
                              <Clock weight="fill" className="w-5 h-5" style={{ color: paymentAdvice.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm tracking-[-0.01em]" style={{ color: paymentAdvice.color }}>
                                {paymentAdvice.title}
                              </p>
                              <p className="text-xs sm:text-[13px] mt-2 leading-relaxed text-[#F8FAF8] max-w-[95%]">
                                {paymentAdvice.message}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-2 flex-wrap">
                            {daysLeft !== null && daysLeft > 0 && (
                              <span
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shadow-lg"
                                style={{ backgroundColor: paymentAdvice.color, color: 'white' }}
                              >
                                {daysLeft} día{daysLeft > 1 ? 's' : ''} restante{daysLeft > 1 ? 's' : ''}
                              </span>
                            )}
                            <span className="text-xs text-[#F8FAF8]">
                              {Number(card.used || 0) > 0 ? (
                                <>Deuda actual: <span className="font-semibold">${card.used.toLocaleString('es-MX')}</span></>
                              ) : (
                                <>Saldo actual: <span className="font-semibold">$0</span></>
                              )}
                            </span>
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
                            <p className={`text-xs font-semibold uppercase tracking-wider ${cardType.gradient.includes('sand') ? 'text-[#737573]' : 'text-white/70'}`}>
                              {cardType.name}
                            </p>
                            <p className={`font-semibold text-lg mt-1.5 ${cardType.gradient.includes('sand') ? 'text-[#1A1C1A]' : 'text-white'}`}>
                              {card.name}
                            </p>
                          </div>
                          <CreditCardIcon weight="fill" className={`w-7 h-7 ${cardType.gradient.includes('sand') ? 'text-[#737573]' : 'text-white/80'}`} />
                        </div>

                        <div className="flex items-end justify-between gap-3 mt-6">
                          <div>
                            <p className={`font-mono text-lg sm:text-[21px] tracking-[0.24em] ${cardType.gradient.includes('sand') ? 'text-[#1A1C1A]' : 'text-white'}`}>
                              •••• •••• •••• {card.number.slice(-4) || '0000'}
                            </p>
                          </div>
                          {!status.isFull && daysLeft !== null && daysLeft <= 5 && (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div
                                className="px-2 py-1 rounded-full shadow-lg border border-white/10 backdrop-blur-sm"
                                style={{ backgroundColor: daysLeft <= 2 ? '#9C382A' : '#D48B3F' }}
                              >
                                <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                                  {daysLeft <= 0 ? 'Vencida' : `${daysLeft}d pago`}
                                </span>
                              </div>
                              <div
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white border border-white/10 shadow-lg backdrop-blur-sm opacity-80"
                                style={{ backgroundColor: paymentAdvice?.color || '#9C382A', pointerEvents: 'none' }}
                                aria-hidden="true"
                              >
                                alerta
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Card Details */}
                <div className="premium-card fintech-details-card -mt-3 sm:-mt-4 p-3.5 sm:p-4 w-[96.5%] sm:w-[97%] mx-auto relative z-10 border border-white/70 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
                  {/* Alerta individual si no hay crédito */}
                  {status.isFull && (
                    <div className="mb-2 p-3 rounded-2xl bg-[#9C382A]/10 border border-[#9C382A]/15 flex items-center gap-2">
                      <Warning weight="fill" className="w-4 h-4 text-[#9C382A]" />
                      <span className="text-xs text-[#9C382A] font-semibold">No tienes crédito disponible</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-[#737573] font-medium">Uso actual</p>
                      <p className="metric-value text-[22px] leading-none tracking-[-0.02em]" style={{ color: status.color }}>
                        {utilization.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#737573] font-medium">Límite</p>
                      <p className="metric-value text-[22px] leading-none tracking-[-0.02em] text-[#1A1C1A]">
                        ${card.limit.toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>

                  <div className="relative mb-2.5">
                    <div className="progress-bar h-2 rounded-full overflow-hidden relative">
                      <div
                        className="absolute inset-0 rounded-full transition-all duration-500 z-[1]"
                        style={getUtilizationBarStyle(utilization)}
                      />
                      <div className="absolute top-0 left-[10%] w-0.5 h-full bg-[#2A4D3B]/45 z-[2]" />
                      <div className="absolute top-0 left-[20%] w-0.5 h-full bg-[#D48B3F]/45 z-[2]" />
                      <div className="absolute top-0 left-[30%] w-0.5 h-full bg-[#9C382A]/45 z-[2]" />
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2 text-[10px] sm:text-[11px] font-semibold text-[#737573]">
                      
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#2A4D3B]"></span>
                          10%
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#D48B3F]"></span>
                          20%
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#9C382A]"></span>
                          30%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[13px] sm:text-sm">
                    <span className="text-[#737573]">
                      Usado: <span className="metric-value text-[#1A1C1A]">${card.used.toLocaleString('es-MX')}</span>
                    </span>
                    <span className="text-[#737573]">
                      Disponible: <span className={`metric-value ${available > 0 ? 'text-[#2A4D3B]' : 'text-[#9C382A]'}`}>${available.toLocaleString('es-MX')}</span>
                    </span>
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#F8F4ED] border border-[#E6DED2] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#737573] font-semibold">Uso recomendado</p>
                      <p className="text-xs sm:text-[13px] text-[#5E605D] mt-1 leading-relaxed">
                        El 10% de esta línea de crédito es lo recomendado para gastar.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#737573]">10% de ${card.limit.toLocaleString('es-MX')}</p>
                      <p className="metric-value text-[20px] leading-none text-[#2A4D3B] mt-1">
                        ${recommendedSpend.toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>



                  
                  <div className="mt-3 pt-3 border-t border-[#E6E6E3] space-y-3">
                    {card.paymentDate && (
                    <div className="flex items-center gap-2 mt-1.5 pt-2.5 border-t border-[#E6E6E3] text-[13px] text-[#737573]">
                      <CalendarBlank weight="fill" className="w-4 h-4 text-[#D48B3F]" />
                      <span>Próximo pago: <span className="font-semibold">{new Date(card.paymentDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span></span>
                    </div>
                  )}

<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => startEdit(card)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-semibold text-[#5F615F] bg-[#F7F5F0] hover:bg-[#F2F0EB] transition-all duration-200"
                        data-testid={`edit-card-${card.id}`}
                      >
                        <PencilSimple weight="fill" className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(card.id)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-semibold text-[#B65C47] bg-[#FFF7F4] hover:bg-[#FDEEE8] transition-all duration-200"
                        data-testid={`delete-card-${card.id}`}
                      >
                        <Trash weight="fill" className="w-4 h-4" />
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalModalCard(card)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-semibold text-[#6A4B16] bg-[#FFF8EA] hover:bg-[#F9EED2] transition-all duration-200"
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
                        className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[13px] font-semibold text-white bg-gradient-to-r from-[#2A4D3B] to-[#1E3A2B] hover:shadow-lg hover:shadow-[#2A4D3B]/15 transition-all duration-200"
                        data-testid={`open-payment-modal-${card.id}`}
                      >
                        <CurrencyDollar weight="fill" className="w-4 h-4" />
                        Pagar
                      </button>
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
            <h3 className="font-heading font-semibold text-xl text-[#1A1C1A] mb-2">Agrega tu primera tarjeta</h3>
            <p className="text-[#737573] mb-6">Con una tarjeta registrada podrás ver tu uso, tu crédito disponible y qué pago conviene priorizar.</p>
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
                    className="relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
                  >
              <div className="sticky top-0 z-10 w-full border-b border-[#E6E6E3] bg-gradient-to-r from-[#FCFBF8] to-[#F7FBF8] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex-shrink-0">
                <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2A4D3B] to-[#1E3A2B] text-white shadow-md">
                      <Clock weight="fill" className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2A4D3B]">Qué tarjeta usar</p>
                      <h3 className="font-heading text-2xl font-semibold text-[#1A1C1A] mt-1">Recomendación de hoy</h3>
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
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-[#F2F0EB] flex items-center justify-center text-xs font-bold text-[#5E605D]">
                                  {recommendationIndex + 1}
                                </span>
                                <h3 className="font-semibold text-[#1A1C1A]">{activeRecommendation.name}</h3>
                              </div>
                              <p className="text-xs text-[#737573] mt-2">
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
                    <p className="text-[#1A1C1A] font-semibold mt-4">Agrega tarjetas para recibir una guía</p>
                    <p className="text-sm text-[#737573] mt-1">Aquí verás cuál tarjeta conviene usar o pagar primero, explicado de forma simple.</p>
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
                      className="relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
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
                      <p className="text-2xl font-semibold text-[#1A1C1A] mt-2">{goalModalCard.paymentDate ? new Date(goalModalCard.paymentDate).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : 'Sin fecha'}</p>
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
                        <p className="text-sm font-semibold text-[#1A1C1A] mt-1">Elige cómo quieres dejar esta tarjeta antes de pagar</p>
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
                      <p className="text-sm text-[#5E605D] mt-1">Agrega saldo usado y fecha de pago para calcular una meta clara.</p>
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
                    className="relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
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
                    className="relative h-[100dvh] min-h-screen w-screen max-w-none bg-white rounded-none shadow-none overflow-hidden flex flex-col min-h-0"
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
                              {editingCard ? 'Actualiza los datos de esta tarjeta' : 'Agrega los datos básicos de tu tarjeta'}
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
                          <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Nombre fácil de reconocer</label>
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
                          <p className="text-xs text-[#737573] mt-1.5">Solo letras. Primera letra mayúscula.</p>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Marca de la tarjeta</label>
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
                            <label className="text-sm font-semibold text-[#1A1C1A] block mb-2">Límite de la tarjeta</label>
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
