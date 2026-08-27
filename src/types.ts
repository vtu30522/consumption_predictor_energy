export interface EnergyFormData {
  fromDate: string;
  toDate: string;
  unitsConsumed: string;
  state: 'AP' | 'TN';
  governmentSubsidy: 'Yes' | 'No';
}

export interface ModelMetric {
  name: string;
  mae: number;
  rmse: number;
  r2: number;
  is_best: boolean;
}

export interface ModelEvaluationData {
  status: string;
  best_model_name: string;
  performance: ModelMetric[];
  split: string;
  dataset_rows: number;
  feature_names?: string[];
}

export type ConsumptionStatus = 'Low' | 'Normal' | 'High' | 'Very High';

export interface PredictionResult {
  // Current Period
  unitsConsumed: number;
  billingDays: number;
  averageDailyUnits: number;
  currentPeriodEnergyCharge: number;

  // Monthly Projection
  daysInFromMonth: number;
  fromMonthName: string;
  fromYear: number;
  projectedMonthlyUnits: number;
  projectedMonthlyEnergyCharge: number;

  // AI Prediction
  predictedMonthlyBill: number; // Gross monthly bill
  predictedMonthlyNetBill: number; // Net bill after subsidy

  // Consumption Status & Flags
  consumptionStatus: ConsumptionStatus;
  isHighWarning: boolean;

  // Context
  state: 'AP' | 'TN';
  governmentSubsidy: 'Yes' | 'No';
  modelUsed: string;
  calculatedAt: Date;
}

export interface DailyEnergyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  meter_units: number;
  state: 'AP' | 'TN';
  subsidy_available: 'Yes' | 'No';
  updatedAt?: string;
}
