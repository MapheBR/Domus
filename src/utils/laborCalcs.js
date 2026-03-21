// Cálculos trabalhistas baseados na LC 150/2015

export const LABOR_CONSTANTS = {
  MONTHLY_HOURS: 220, // 44h semanais
  DAILY_HOURS: 8,
  WEEKLY_HOURS: 44,
  OVERTIME_50: 1.5, // 50% extra
  OVERTIME_100: 2.0, // 100% (domingos/feriados)
  NIGHT_PREMIUM: 0.2, // 20% adicional noturno
  NIGHT_START: 22, // 22h
  NIGHT_END: 5, // 5h
  INSS_RATES: [
    { min: 0, max: 1412.0, rate: 0.075 },
    { min: 1412.01, max: 2666.68, rate: 0.09 },
    { min: 2666.69, max: 4000.03, rate: 0.12 },
    { min: 4000.04, max: 7786.02, rate: 0.14 },
  ],
  FGTS_RATE: 0.08, // 8% FGTS
  FGTS_MULTA: 0.4, // 40% multa rescisória
  VACATION_BONUS: 1 / 3, // 1/3 de férias
};

// Calcular horas trabalhadas entre dois timestamps
export function calculateWorkedHours(checkIn, checkOut) {
  const diffMs = checkOut - checkIn;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
}

// Calcular horas extras
export function calculateOvertime(workedHours, dailyLimit = 8) {
  const overtime = Math.max(0, workedHours - dailyLimit);
  return Math.round(overtime * 100) / 100;
}

// Calcular valor hora extra (50%)
export function calculateOvertimeValue(baseSalary, overtimeHours) {
  const hourlyRate = baseSalary / LABOR_CONSTANTS.MONTHLY_HOURS;
  return overtimeHours * hourlyRate * LABOR_CONSTANTS.OVERTIME_50;
}

// Calcular adicional noturno
export function calculateNightPremium(baseSalary, nightHours) {
  const hourlyRate = baseSalary / LABOR_CONSTANTS.MONTHLY_HOURS;
  return nightHours * hourlyRate * LABOR_CONSTANTS.NIGHT_PREMIUM;
}

// Calcular INSS (progressivo)
export function calculateINSS(salary) {
  let inss = 0;
  let remaining = salary;

  for (const bracket of LABOR_CONSTANTS.INSS_RATES) {
    if (remaining <= 0) break;
    const range = bracket.max - bracket.min + (bracket.min === 0 ? 0 : 0.01);
    const taxable = Math.min(remaining, range);
    inss += taxable * bracket.rate;
    remaining -= taxable;
  }

  return Math.round(inss * 100) / 100;
}

// Calcular FGTS
export function calculateFGTS(salary) {
  return Math.round(salary * LABOR_CONSTANTS.FGTS_RATE * 100) / 100;
}

// Calcular férias + 1/3
export function calculateVacation(salary) {
  const bonus = salary * LABOR_CONSTANTS.VACATION_BONUS;
  return Math.round((salary + bonus) * 100) / 100;
}

// Calcular 13º (proporcional)
export function calculate13th(salary, months = 12) {
  return Math.round((salary / 12) * months * 100) / 100;
}

// Calcular folha completa
export function calculatePayroll(
  baseSalary,
  overtimeHours = 0,
  nightHours = 0,
) {
  const overtimeValue = calculateOvertimeValue(baseSalary, overtimeHours);
  const nightValue = calculateNightPremium(baseSalary, nightHours);
  const grossSalary = baseSalary + overtimeValue + nightValue;
  const inss = calculateINSS(grossSalary);
  const fgts = calculateFGTS(grossSalary);
  const netSalary = grossSalary - inss;

  return {
    baseSalary,
    overtimeHours,
    overtimeValue: Math.round(overtimeValue * 100) / 100,
    nightHours,
    nightValue: Math.round(nightValue * 100) / 100,
    grossSalary: Math.round(grossSalary * 100) / 100,
    inss,
    fgts,
    netSalary: Math.round(netSalary * 100) / 100,
  };
}

// Calcular rescisão
export function calculateTermination(salary, months, type = "without_cause") {
  const vacation = (calculateVacation(salary) * (months % 12)) / 12;
  const thirteenth = calculate13th(salary, months % 12);
  const fgtsTotal = calculateFGTS(salary) * months;

  let result = {
    proportionalVacation: Math.round(vacation * 100) / 100,
    proportional13th: Math.round(thirteenth * 100) / 100,
    fgtsBalance: Math.round(fgtsTotal * 100) / 100,
    noticePay: 0,
    fgtsPenalty: 0,
    total: 0,
  };

  if (type === "without_cause") {
    result.noticePay = salary; // aviso prévio
    result.fgtsPenalty =
      Math.round(fgtsTotal * LABOR_CONSTANTS.FGTS_MULTA * 100) / 100;
  }

  result.total =
    Math.round(
      (result.proportionalVacation +
        result.proportional13th +
        result.noticePay +
        result.fgtsPenalty) *
        100,
    ) / 100;

  return result;
}
