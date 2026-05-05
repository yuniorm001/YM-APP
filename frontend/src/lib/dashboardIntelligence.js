const toNumber = (value = 0) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasValidDate = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const getLastFour = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 4 ? digits.slice(-4) : digits;
};

export const getSafeCardLabel = (card) => {
  if (!card) return 'Tu tarjeta';
  const lastFour = getLastFour(card.last4 || card.lastFour || card.number || '');
  return `${card.name || 'Tarjeta'}${lastFour ? ` • ${lastFour}` : ''}`;
};

export const getPredictionConfidence = ({ monthExpenses = [], weekExpenses = [], currentDate }) => {
  const current = new Date(currentDate || new Date().toISOString());
  const dayOfMonth = Number.isNaN(current.getTime()) ? 1 : Math.max(current.getDate(), 1);
  const sampleSize = Math.max(monthExpenses.length, weekExpenses.length);

  if (sampleSize >= 8 || (sampleSize >= 5 && dayOfMonth >= 10)) {
    return {
      level: 'high',
      label: 'Alta confianza',
      weekPrefix: 'Al ritmo actual',
      monthPrefix: 'Al ritmo actual',
      canShowStrongPrediction: true,
    };
  }

  if (sampleSize >= 3) {
    return {
      level: 'medium',
      label: 'Confianza media',
      weekPrefix: 'Con los datos actuales',
      monthPrefix: 'Con los datos actuales',
      canShowStrongPrediction: true,
    };
  }

  return {
    level: 'low',
    label: 'Pocos datos',
    weekPrefix: 'Con pocos datos todavía',
    monthPrefix: 'Con pocos datos todavía',
    canShowStrongPrediction: false,
  };
};

export const getOnboardingSteps = ({ cash = {}, cards = [], expenses = [], goals = {} }) => {
  const hasIncome = toNumber(cash?.income) > 0 || (cash?.entries || []).some((entry) => toNumber(entry?.amount) > 0);
  const hasCards = (cards || []).length > 0;
  const hasValidCardLimit = (cards || []).some((card) => toNumber(card?.limit) > 0);
  const hasPaymentDates = !hasCards || (cards || []).some((card) => Boolean(card?.paymentDate));
  const hasExpenses = (expenses || []).length > 0;
  const hasGoal = toNumber(goals?.amount) > 0;

  const steps = [];
  if (!hasIncome) {
    steps.push({
      id: 'setup-income',
      title: 'Agrega tu ingreso mensual',
      help: 'Sin ingreso configurado, la app no puede medir bien tu cash disponible ni tu margen real.',
      priority: 2,
      chips: [{ label: 'Dato base', tone: 'amber' }],
    });
  }
  if (!hasCards) {
    steps.push({
      id: 'setup-card',
      title: 'Agrega tu primera tarjeta',
      help: 'Con una tarjeta registrada, la app podrá crear alertas de uso, pagos y balance.',
      priority: 3,
      chips: [{ label: 'Crédito', tone: 'neutral' }],
    });
  } else if (!hasValidCardLimit) {
    steps.push({
      id: 'setup-card-limit',
      title: 'Completa el límite de tus tarjetas',
      help: 'El límite es necesario para calcular utilización real y evitar recomendaciones incompletas.',
      priority: 4,
      chips: [{ label: 'Falta límite', tone: 'amber' }],
    });
  }
  if (hasCards && !hasPaymentDates) {
    steps.push({
      id: 'setup-payment-date',
      title: 'Agrega la fecha de pago de tus tarjetas',
      help: 'Así la app puede priorizar pagos próximos y evitar alertas genéricas.',
      priority: 5,
      chips: [{ label: 'Fecha de pago', tone: 'amber' }],
    });
  }
  if (!hasExpenses) {
    steps.push({
      id: 'setup-first-expense',
      title: 'Registra tu primer gasto',
      help: 'Con movimientos reales, las predicciones serán más útiles y menos genéricas.',
      priority: 85,
      chips: [{ label: 'Primer movimiento', tone: 'neutral' }],
    });
  }
  if (!hasGoal) {
    steps.push({
      id: 'setup-goal',
      title: 'Define una meta de gasto',
      help: 'La meta permite decirte cuánto puedes gastar sin pasarte de tu plan.',
      priority: 90,
      chips: [{ label: 'Meta', tone: 'green' }],
    });
  }

  return steps;
};

export const buildDashboardIntelligence = ({
  cash = {},
  cards = [],
  expenses = [],
  monthExpenses = [],
  weekExpenses = [],
  goals = {},
  cashAvailable = 0,
  cashHealthPercentage = 0,
  creditUtilization = 0,
  currentDate,
}) => {
  const actionableCards = (cards || []).filter((card) => toNumber(card?.used) > 0 && toNumber(card?.limit) > 0);
  const cardsWithBalance = (cards || []).filter((card) => toNumber(card?.used) > 0);

  const highestUtilizationCard = [...actionableCards]
    .sort((a, b) => toNumber(b?.utilization) - toNumber(a?.utilization))[0] || null;

  const nearestPaymentCard = [...cardsWithBalance]
    .filter((card) => card?.daysLeft !== null && card?.daysLeft !== undefined && !card?.statementStatus?.isConfirmed)
    .sort((a, b) => {
      const dayDiff = toNumber(a?.daysLeft) - toNumber(b?.daysLeft);
      if (dayDiff !== 0) return dayDiff;
      return toNumber(b?.utilization) - toNumber(a?.utilization);
    })[0] || null;

  const mostDangerousCard = [...actionableCards]
    .sort((a, b) => {
      const score = (card) => (
        toNumber(card?.utilization)
        + (card?.daysLeft !== null && card?.daysLeft <= 5 ? 10 : 0)
        + (card?.statementStatus?.needsConfirmation ? 12 : 0)
      );
      return score(b) - score(a);
    })[0] || null;

  const predictionConfidence = getPredictionConfidence({ monthExpenses, weekExpenses, currentDate });
  const onboardingSteps = getOnboardingSteps({ cash, cards, expenses, goals });

  const hasCriticalPayment = nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 0 && toNumber(nearestPaymentCard?.used) > 0;
  const hasHighUtilization = toNumber(highestUtilizationCard?.utilization) >= 30;
  const hasModerateUtilization = toNumber(highestUtilizationCard?.utilization) >= 20;
  const hasLowCash = toNumber(cashAvailable) < 0;
  const hasWeakCash = toNumber(cashHealthPercentage) < 40;
  const hasSoonPayment = nearestPaymentCard?.daysLeft !== null && nearestPaymentCard?.daysLeft <= 5 && toNumber(nearestPaymentCard?.used) > 0;

  let priority = {
    level: 'green',
    label: 'Vas bien',
    actionTitle: 'Mantén este ritmo',
    actionText: 'Puedes seguir operando, pero conserva margen antes de usar crédito.',
  };

  if (hasCriticalPayment) {
    priority = {
      level: 'red',
      label: 'Actúa hoy',
      actionTitle: 'Lo primero que debes hacer',
      actionText: `Atiéndelo antes de usar más crédito. ${getSafeCardLabel(nearestPaymentCard)} tiene balance pendiente.`,
    };
  } else if (hasLowCash) {
    priority = {
      level: 'red',
      label: 'Actúa hoy',
      actionTitle: 'Lo primero que debes hacer',
      actionText: 'Pausa compras variables y protege efectivo antes de asumir más pagos.',
    };
  } else if (hasHighUtilization) {
    priority = {
      level: 'red',
      label: 'Actúa hoy',
      actionTitle: 'Lo primero que debes hacer',
      actionText: `Baja ${getSafeCardLabel(highestUtilizationCard)} por debajo de 30% antes de seguir usando crédito.`,
    };
  } else if (hasSoonPayment) {
    priority = {
      level: 'amber',
      label: 'Revisa esto',
      actionTitle: 'Próximo paso',
      actionText: `Prepara el pago de ${getSafeCardLabel(nearestPaymentCard)} en los próximos ${Math.max(nearestPaymentCard.daysLeft, 0)} días.`,
    };
  } else if (hasModerateUtilization || hasWeakCash) {
    priority = {
      level: 'amber',
      label: 'Revisa esto',
      actionTitle: 'Próximo paso',
      actionText: 'Mantén el uso de tarjetas debajo de 30% y revisa tu dinero disponible antes de comprar.',
    };
  } else if (onboardingSteps.length > 0) {
    priority = {
      level: 'amber',
      label: 'Configura tu guía',
      actionTitle: 'Completa tu panel',
      actionText: onboardingSteps[0]?.help || 'Completa tus datos para recibir recomendaciones precisas.',
    };
  }

  return {
    actionableCards,
    highestUtilizationCard,
    nearestPaymentCard,
    mostDangerousCard,
    predictionConfidence,
    onboardingSteps,
    isOnboardingMode: onboardingSteps.length > 0,
    priority,
  };
};
