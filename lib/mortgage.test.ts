import { describe, it, expect } from "vitest";
import { monthlyPayment, paymentSplit, totalsToDate } from "./mortgage";

const params = {
  principal: 3_419_100,
  annualRate: 0.0464,
  termYears: 30,
  startDate: "2026-05-01",
};

describe("monthlyPayment", () => {
  it("returns correct annuity payment", () => {
    const m = monthlyPayment(params);
    expect(m).toBeCloseTo(17610, -1);
  });

  it("handles zero rate (flat repayment)", () => {
    const m = monthlyPayment({ ...params, annualRate: 0 });
    expect(m).toBeCloseTo(params.principal / (params.termYears * 12), 2);
  });
});

describe("paymentSplit", () => {
  it("month 1: interest = principal * monthly_rate", () => {
    const split = paymentSplit(params, 1);
    const expectedInterest = params.principal * (params.annualRate / 12);
    expect(split.interest).toBeCloseTo(expectedInterest, 0);
  });

  it("month 1: principal + interest = monthly payment", () => {
    const split = paymentSplit(params, 1);
    const m = monthlyPayment(params);
    expect(split.principal + split.interest).toBeCloseTo(m, 0);
  });

  it("remaining balance decreases each month", () => {
    const m1 = paymentSplit(params, 1);
    const m2 = paymentSplit(params, 2);
    expect(m2.remainingBalance).toBeLessThan(m1.remainingBalance);
  });

  it("final month balance is ~0", () => {
    const final = paymentSplit(params, params.termYears * 12);
    expect(final.remainingBalance).toBeCloseTo(0, 0);
  });
});

describe("totalsToDate", () => {
  it("returns zero totals if mortgage hasn't started yet", () => {
    const future = { ...params, startDate: "2099-01-01" };
    const t = totalsToDate(future);
    expect(t.principalPaid).toBe(0);
    expect(t.interestPaid).toBe(0);
    expect(t.monthsElapsed).toBe(0);
  });

  it("totalProjectedInterest = total payments - principal", () => {
    const t = totalsToDate(params);
    const totalPaid = monthlyPayment(params) * params.termYears * 12;
    expect(t.totalProjectedInterest).toBeCloseTo(totalPaid - params.principal, -3);
  });
});
