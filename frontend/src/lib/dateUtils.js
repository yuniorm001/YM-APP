// frontend/src/lib/dateUtils.js
//
// Helpers de fechas con dos reglas de oro:
//
//   1. NUNCA hagas `new Date("2026-05-05")` directo.
//      Eso lo interpreta como medianoche UTC y se ve como el día anterior
//      en zonas horarias negativas (Caribe, América continental).
//
//   2. Distingue dos cosas que son MUY diferentes:
//      - "Día calendario" (corte de tarjeta, fecha de un gasto):
//          se guarda como string puro "YYYY-MM-DD" y se compara como string
//          o se convierte a Date local con parseDateOnly().
//      - "Instante exacto" (estado de cuenta confirmado, lastEdit, createdAt):
//          se guarda como ISO completo con timezone (...T..Z) y se usa con
//          new Date() normal. Eso sí está bien.

// ──────────────────────────────────────────────────────────────────────────
// Parsing
// ──────────────────────────────────────────────────────────────────────────

/**
 * Convierte un string "YYYY-MM-DD" (o un legacy ISO completo) a un Date
 * en hora local del navegador, con la hora puesta en 00:00 local.
 *
 * Esta es la función a usar para fechas de pago, fechas de corte y cualquier
 * "día calendario" donde la hora no importa.
 */
export function parseDateOnly(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value !== 'string') return null;

  // Caso ideal: "2026-05-05" (ya es día calendario sin ambigüedad)
  const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // Caso legacy con timezone. Aquí hay dos sub-casos que debemos distinguir:
  //
  //  (A) "YYYY-MM-DDT00:00:00.000Z" — medianoche UTC exacta.
  //      Es lo que produce `new Date("2026-05-05")` cuando el código viejo
  //      pasaba el string del <input type="date"> directo a new Date().
  //      Aquí la INTENCIÓN era guardar el día calendario YYYY-MM-DD, así
  //      que extraemos esos dígitos como fecha local. Sin esto, el día
  //      seguiría desfasándose y la migración no resolvería nada.
  //
  //  (B) "YYYY-MM-DDTHH:MM:SS.sssZ" — instante exacto cualquiera.
  //      Es lo que produce `new Date().toISOString()` al registrar un
  //      gasto. Aquí la INTENCIÓN es marcar un momento real; el día
  //      calendario relevante es el de la zona horaria local del usuario,
  //      que es lo que toLocaleDateString mostraba en el código viejo.
  //      Mantenemos ese día para no mover gastos al migrar.
  const midnightUtcMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T00:00:00(?:\.000)?Z$/);
  if (midnightUtcMatch) {
    const [, y, m, d] = midnightUtcMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const fallback = new Date(value);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

/**
 * Devuelve el string "YYYY-MM-DD" (formato del <input type="date">)
 * a partir de cualquier valor parseable.
 */
export function toDateOnlyString(value) {
  const d = parseDateOnly(value);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Versión segura para "instantes exactos" (timestamp completo).
 * Acepta ISO con timezone y devuelve un Date normal. NO es para fechas
 * calendario que vienen del input type="date".
 */
export function parseInstant(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ──────────────────────────────────────────────────────────────────────────
// Comparaciones
// ──────────────────────────────────────────────────────────────────────────

/** "Hoy" a las 00:00 hora local. */
export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Misma fecha calendario en hora local (ignora hora/minutos). */
export function isSameLocalDay(a, b) {
  const da = parseDateOnly(a);
  const db = parseDateOnly(b);
  if (!da || !db) return false;
  return da.getTime() === db.getTime();
}

/** Diferencia en días enteros entre dos fechas locales. b - a. */
export function diffInDays(a, b) {
  const da = parseDateOnly(a);
  const db = parseDateOnly(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

// ──────────────────────────────────────────────────────────────────────────
// Formateo
// ──────────────────────────────────────────────────────────────────────────

/** "5 may" */
export function formatDayMonthShort(value, locale = 'es') {
  const d = parseDateOnly(value);
  if (!d) return '';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/** "5 de mayo de 2026" */
export function formatDayMonthYearLong(value, locale = 'es') {
  const d = parseDateOnly(value);
  if (!d) return '';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "05/05/2026" */
export function formatShortDate(value, locale = 'es-MX') {
  const d = parseDateOnly(value);
  if (!d) return '';
  return d.toLocaleDateString(locale);
}

// ──────────────────────────────────────────────────────────────────────────
// Migración de datos legacy
// ──────────────────────────────────────────────────────────────────────────

/**
 * Recorre los datos guardados en storage/cloud y normaliza fechas que
 * fueron guardadas como ISO UTC (legacy) a "YYYY-MM-DD" puro cuando
 * representan un día calendario.
 *
 * Reglas:
 *   - card.paymentDate          → "YYYY-MM-DD" (día calendario)
 *   - expense.date              → "YYYY-MM-DD" (día calendario)
 *   - card.statementClosedAt    → ISO completo (instante exacto, no se toca)
 *   - expense.editHistory[].editedAt → ISO completo (instante exacto, no se toca)
 *   - cash.entries[].date       → "YYYY-MM-DD" (día calendario)
 *   - cash.entries[].createdAt  → ISO completo (instante exacto, no se toca)
 *   - currentDate               → ISO completo (es un instante "ahora", no se toca)
 *
 * Idempotente: si ya está en formato "YYYY-MM-DD", queda igual.
 */
export function migrateLegacyDates(rawData) {
  if (!rawData || typeof rawData !== 'object') return rawData;

  const next = { ...rawData };

  if (Array.isArray(rawData.cards)) {
    next.cards = rawData.cards.map((card) => {
      if (!card || typeof card !== 'object') return card;
      const updated = { ...card };
      if (card.paymentDate) {
        const normalized = toDateOnlyString(card.paymentDate);
        if (normalized) updated.paymentDate = normalized;
      }
      return updated;
    });
  }

  if (Array.isArray(rawData.expenses)) {
    next.expenses = rawData.expenses.map((expense) => {
      if (!expense || typeof expense !== 'object') return expense;
      const updated = { ...expense };
      if (expense.date) {
        const normalized = toDateOnlyString(expense.date);
        if (normalized) updated.date = normalized;
      }
      return updated;
    });
  }

  if (rawData.cash && typeof rawData.cash === 'object' && Array.isArray(rawData.cash.entries)) {
    next.cash = {
      ...rawData.cash,
      entries: rawData.cash.entries.map((entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        const updated = { ...entry };
        if (entry.date) {
          const normalized = toDateOnlyString(entry.date);
          if (normalized) updated.date = normalized;
        }
        return updated;
      })
    };
  }

  return next;
}
