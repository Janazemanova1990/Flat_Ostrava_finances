export type MortgageParams = {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  mortgageRateFixedUntil?: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function monthlyPayment({ principal, annualRate, termYears }: MortgageParams): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function paymentSplit(
  params: MortgageParams,
  monthNumber: number
): { principal: number; interest: number; remainingBalance: number } {
  const { principal, annualRate, termYears } = params;
  const r = annualRate / 12;
  const n = termYears * 12;
  const M = monthlyPayment(params);

  const k = monthNumber - 1;
  const factor = Math.pow(1 + r, n);
  const factorK = Math.pow(1 + r, k);
  const balanceBefore = r === 0
    ? principal - k * M
    : principal * (factor - factorK) / (factor - 1);

  const interest = round2(balanceBefore * r);
  const principalPaid = round2(M - interest);
  const remainingBalance = Math.max(0, round2(balanceBefore - principalPaid));

  return { principal: principalPaid, interest, remainingBalance };
}

export function totalsToDate(params: MortgageParams): {
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  monthsElapsed: number;
  totalProjectedInterest: number;
  payoffDate: string;
} {
  const { principal, annualRate, termYears, startDate } = params;
  const n = termYears * 12;
  const M = monthlyPayment(params);
  const totalProjectedInterest = Math.round(M * n - principal);

  const start = new Date(startDate);
  const now = new Date();
  const paymentDay = start.getDate();
  const rawMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  const monthsElapsed = Math.max(
    0,
    now.getDate() >= paymentDay ? rawMonths + 1 : rawMonths
  );

  const r = annualRate / 12;
  const k = Math.min(monthsElapsed, n);
  const factor = Math.pow(1 + r, n);
  const factorK = Math.pow(1 + r, k);
  const principalPaid = r === 0
    ? k * M
    : principal * (factorK - 1) / (factor - 1);
  const interestPaid = k * M - principalPaid;
  const remainingBalance = Math.max(0, principal - principalPaid);

  const payoffDate = new Date(start);
  payoffDate.setMonth(payoffDate.getMonth() + n);

  return {
    principalPaid: Math.round(principalPaid),
    interestPaid: Math.round(interestPaid),
    remainingBalance: Math.round(remainingBalance),
    monthsElapsed,
    totalProjectedInterest,
    payoffDate: payoffDate.toISOString().slice(0, 10),
  };
}
