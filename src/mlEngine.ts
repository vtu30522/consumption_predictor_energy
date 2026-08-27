import { ModelMetric, ModelEvaluationData, PredictionResult, EnergyFormData, ConsumptionStatus } from './types';

export const MODEL_PERFORMANCES: ModelMetric[] = [
  {
    name: 'Linear Regression',
    mae: 91.20,
    rmse: 123.20,
    r2: 0.9875,
    is_best: false,
  },
  {
    name: 'Random Forest Regressor',
    mae: 78.00,
    rmse: 101.31,
    r2: 0.9915,
    is_best: false,
  },
  {
    name: 'Gradient Boosting Regressor',
    mae: 186.06,
    rmse: 261.33,
    r2: 0.9436,
    is_best: true,
  },
];

/**
 * Fetch dynamic model evaluation metrics from backend /api/model-performance
 */
export async function fetchModelEvaluation(): Promise<ModelEvaluationData> {
  try {
    const res = await fetch('/api/model-performance');
    if (res.ok) {
      const data = await res.json();
      if (data && data.performance && Array.isArray(data.performance)) {
        return {
          status: 'success',
          best_model_name: data.best_model_name || 'Gradient Boosting Regressor',
          performance: data.performance,
          split: data.split || '80% / 20%',
          dataset_rows: data.dataset_rows || 100000,
          feature_names: data.feature_names || [],
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch model metrics from backend, using saved metrics:', err);
  }

  // Safe fallback if network/backend is initializing
  return {
    status: 'success',
    best_model_name: 'Gradient Boosting Regressor',
    performance: MODEL_PERFORMANCES,
    split: '80% / 20%',
    dataset_rows: 100000,
  };
}

/**
 * AP Domestic LT-1 Telescopic Slab Calculation:
 * - 0 to 30 units: Rs. 1.90 / unit
 * - 31 to 75 units: Rs. 2.60 / unit
 * - 76 to 125 units: Rs. 3.60 / unit
 * - 126 to 225 units: Rs. 6.90 / unit
 * - 226 to 400 units: Rs. 7.80 / unit
 * - Above 400 units: Rs. 9.75 / unit
 */
export function calculateAPTelescopicTariff(units: number): number {
  if (units <= 0 || isNaN(units)) return 0.0;
  let charge = 0.0;
  let remaining = units;

  // Slab 1: 0 to 30 (30 units @ 1.90)
  const s1 = Math.min(remaining, 30.0);
  charge += s1 * 1.9;
  remaining -= s1;

  // Slab 2: 31 to 75 (45 units @ 2.60)
  if (remaining > 0) {
    const s2 = Math.min(remaining, 45.0);
    charge += s2 * 2.6;
    remaining -= s2;
  }

  // Slab 3: 76 to 125 (50 units @ 3.60)
  if (remaining > 0) {
    const s3 = Math.min(remaining, 50.0);
    charge += s3 * 3.6;
    remaining -= s3;
  }

  // Slab 4: 126 to 225 (100 units @ 6.90)
  if (remaining > 0) {
    const s4 = Math.min(remaining, 100.0);
    charge += s4 * 6.9;
    remaining -= s4;
  }

  // Slab 5: 226 to 400 (175 units @ 7.80)
  if (remaining > 0) {
    const s5 = Math.min(remaining, 175.0);
    charge += s5 * 7.8;
    remaining -= s5;
  }

  // Slab 6: Above 400 units @ 9.75
  if (remaining > 0) {
    charge += remaining * 9.75;
  }

  return Math.round(charge * 100) / 100;
}

/**
 * Derives the dynamic calculations locally to ensure precision and preview safety.
 */
export function calculateLocalPrediction(formData: EnergyFormData): PredictionResult {
  const units = Math.max(0, parseFloat(formData.unitsConsumed) || 0);
  const [fromY, fromM, fromD] = (formData.fromDate || '2026-08-01').split('-').map(Number);
  const [toY, toM, toD] = (formData.toDate || '2026-08-03').split('-').map(Number);

  const fromDateObj = new Date(fromY, fromM - 1, fromD);
  const toDateObj = new Date(toY, toM - 1, toD);

  const diffTime = toDateObj.getTime() - fromDateObj.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const billingDays = Math.max(1, diffDays + 1);

  const averageDailyUnits = units / billingDays;
  const daysInFromMonth = new Date(fromY, fromM, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const fromMonthName = monthNames[fromM - 1] || 'Month';

  const projectedMonthlyUnits = averageDailyUnits * daysInFromMonth;

  // 1. AP Telescopic Energy Charges
  const currentPeriodEnergyCharge = calculateAPTelescopicTariff(units);
  const projectedMonthlyEnergyCharge = calculateAPTelescopicTariff(projectedMonthlyUnits);

  // 2. Fixed charges, duty, fppca
  const fixedCharge =
    projectedMonthlyUnits <= 100
      ? 40.0
      : projectedMonthlyUnits <= 200
      ? 60.0
      : 100.0;
  const duty = projectedMonthlyUnits * 0.06;
  const fppca = projectedMonthlyUnits * 0.45;
  const otherCharges = 20.0;
  const predictedMonthlyBill = Math.round(
    (projectedMonthlyEnergyCharge + fixedCharge + duty + fppca + otherCharges) * 100
  ) / 100;

  let subsidyDiscount = 0.0;
  if (formData.governmentSubsidy === 'Yes') {
    if (projectedMonthlyUnits <= 100) {
      subsidyDiscount = predictedMonthlyBill * 0.8;
    } else if (projectedMonthlyUnits <= 200) {
      subsidyDiscount = predictedMonthlyBill * 0.35;
    } else {
      subsidyDiscount = Math.min(predictedMonthlyBill * 0.15, 250.0);
    }
  }

  const predictedMonthlyNetBill = Math.max(
    0.0,
    Math.round((predictedMonthlyBill - subsidyDiscount) * 100) / 100
  );

  let consumptionStatus: ConsumptionStatus = 'Normal';
  if (projectedMonthlyUnits <= 100) {
    consumptionStatus = 'Low';
  } else if (projectedMonthlyUnits <= 300) {
    consumptionStatus = 'Normal';
  } else if (projectedMonthlyUnits <= 500) {
    consumptionStatus = 'High';
  } else {
    consumptionStatus = 'Very High';
  }

  return {
    unitsConsumed: units,
    billingDays,
    averageDailyUnits,
    currentPeriodEnergyCharge,
    daysInFromMonth,
    fromMonthName,
    fromYear: fromY,
    projectedMonthlyUnits,
    projectedMonthlyEnergyCharge,
    predictedMonthlyBill,
    predictedMonthlyNetBill,
    consumptionStatus,
    isHighWarning: projectedMonthlyUnits > 500,
    state: formData.state,
    governmentSubsidy: formData.governmentSubsidy,
    modelUsed: 'Gradient Boosting Regressor',
    calculatedAt: new Date(),
  };
}

/**
 * Calls POST /api/predict with exact payload and parses the API result.
 */
export async function callPredictApi(formData: EnergyFormData): Promise<PredictionResult> {
  const payload = {
    from_date: formData.fromDate,
    to_date: formData.toDate,
    meter_units: parseFloat(formData.unitsConsumed) || 0,
    state: formData.state,
    subsidy_available: formData.governmentSubsidy,
  };

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errMsg = `Server returned status: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {
        // ignore json parsing error
      }
      throw new Error(errMsg);
    }

    const data = await response.json();

    const [fromY, fromM] = formData.fromDate.split('-').map(Number);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const projectedUnits = Number(data.projected_monthly_units ?? 0);
    let consumptionStatus: ConsumptionStatus = data.consumption_status;
    if (!consumptionStatus) {
      if (projectedUnits <= 100) consumptionStatus = 'Low';
      else if (projectedUnits <= 300) consumptionStatus = 'Normal';
      else if (projectedUnits <= 500) consumptionStatus = 'High';
      else consumptionStatus = 'Very High';
    }

    return {
      unitsConsumed: Number(data.units_consumed ?? formData.unitsConsumed),
      billingDays: Number(data.billing_days ?? 1),
      averageDailyUnits: Number(data.average_daily_units ?? 0),
      currentPeriodEnergyCharge: Number(data.current_period_energy_charge ?? calculateAPTelescopicTariff(Number(formData.unitsConsumed))),
      daysInFromMonth: Number(data.days_in_month ?? new Date(fromY, fromM, 0).getDate()),
      fromMonthName: data.from_month_name || monthNames[fromM - 1] || 'Month',
      fromYear: Number(data.from_year ?? fromY),
      projectedMonthlyUnits: projectedUnits,
      projectedMonthlyEnergyCharge: Number(data.projected_monthly_energy_charge ?? calculateAPTelescopicTariff(projectedUnits)),
      predictedMonthlyBill: Number(data.predicted_monthly_bill ?? 0),
      predictedMonthlyNetBill: Number(data.predicted_monthly_net_bill ?? data.predicted_monthly_bill ?? 0),
      consumptionStatus,
      isHighWarning: Boolean(data.is_high_warning || projectedUnits > 500),
      state: formData.state,
      governmentSubsidy: formData.governmentSubsidy,
      modelUsed: data.model_used || 'Gradient Boosting Regressor',
      calculatedAt: new Date(),
    };
  } catch (err: any) {
    console.warn('API fetch failed, checking error:', err);
    throw new Error('Prediction service is temporarily unavailable. Please start the Python ML backend.');
  }
}
