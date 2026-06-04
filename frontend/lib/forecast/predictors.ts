// Business forecasts built on the deterministic methods. Pure functions over
// arrays so they are trivially testable and identical to a future Python service.

import { forecastAhead } from "./methods";
import type { PointForecast, StockoutForecast } from "./types";

/**
 * Days until stock hits zero, from the recent inventory burn rate (units/day)
 * and units on hand. Burn rate captures real sell-through — including a launch
 * surge — where a monthly-demand trend cannot (new SKUs have no history).
 */
export function forecastStockout(input: {
  currentUnits: number;
  dailyOutflow: number;
  leadDays: number;
  bufferDays: number;
}): StockoutForecast {
  const { currentUnits, dailyOutflow, leadDays, bufferDays } = input;
  if (dailyOutflow <= 0) {
    return {
      days_to_stockout: Infinity,
      daily_demand: 0,
      current_units: currentUnits,
      reorder_urgent: false,
      stockout_within_lead: false,
      method: "burn-rate",
    };
  }
  const days = currentUnits <= 0 ? 0 : currentUnits / dailyOutflow;
  const cover = leadDays + bufferDays;
  return {
    days_to_stockout: days,
    daily_demand: dailyOutflow,
    current_units: currentUnits,
    reorder_urgent: currentUnits > 0 && days <= cover,
    stockout_within_lead: currentUnits > 0 && days <= leadDays,
    method: "burn-rate",
  };
}

/** Forecast a monthly RATE series (numerator/denominator), e.g. refund rate or ROAS. */
export function forecastRate(numerators: number[], denominators: number[], horizon = 1): PointForecast {
  const rates = numerators.map((n, i) => {
    const d = denominators[i] ?? 0;
    return d > 0 ? n / d : 0;
  });
  return forecastAhead(rates, horizon, {});
}

/** Forecast a raw monthly series (revenue, units, …) with seasonality. */
export function forecastValue(values: number[], horizon = 1): PointForecast {
  return forecastAhead(values, horizon, { period: 12, seasonal: true });
}
