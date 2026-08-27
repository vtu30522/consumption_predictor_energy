import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { PredictionResult } from '../types';

interface PredictionValidationProps {
  result: PredictionResult;
}

export const PredictionValidation: React.FC<PredictionValidationProps> = ({ result }) => {
  // 1. User Input details
  const userInputSummary = `${result.unitsConsumed} kWh (${result.fromDate} → ${result.toDate}, Subsidy: ${result.governmentSubsidy})`;

  // 2. Billing Days
  const billingDays = result.billingDays;

  // 3. Average Daily Consumption
  const avgUnits = result.averageDailyUnits;

  // 4. Projected Monthly Units
  const projectedUnits = result.projectedMonthlyUnits;

  // 5. Rule-Based Projected Energy Charge (AP Telescopic Tariff)
  const ruleBasedEstimate = result.projectedMonthlyEnergyCharge;

  // 6. ML Predicted Monthly Bill (Actual model inference output)
  const mlPredictedBill = result.predictedMonthlyNetBill;

  // 7. Difference calculation: difference = ML predicted monthly bill - rule based projected bill
  const difference = mlPredictedBill - ruleBasedEstimate;
  const diffPercent = ruleBasedEstimate > 0
    ? (difference / ruleBasedEstimate) * 100
    : 0.0;

  const isMlHigher = difference > 0;
  const isClose = Math.abs(diffPercent) <= 15;

  return (
    <div
      id="prediction-validation-section"
      className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              PREDICTION VALIDATION
            </h3>
            <p className="text-xs text-slate-500">
              Prediction Validation and Model Reliability Benchmark
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Cross-Checked Model Output
        </span>
      </div>

      {/* Mandatory Transparency Notice */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-semibold text-blue-950">
            ML prediction and tariff-based estimate are being compared for transparency.
          </p>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            Note: All figures shown are <strong>Estimated</strong> values. Rule-based calculations utilize AP Domestic LT-1 slab logic, while the ML model captures historical multi-factor billing behavior including government subsidy adjustments.
          </p>
        </div>
      </div>

      {/* 4 Core Summary Stat Cards: Rule-Based, ML Prediction, Difference, Difference % */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Rule-Based Estimate */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Rule-Based Estimate
          </p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            ₹{ruleBasedEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            AP Telescopic Slabs (Estimated)
          </p>
        </div>

        {/* ML Prediction */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            ML Prediction
          </p>
          <p className="text-xl font-extrabold text-emerald-950 font-mono mt-1">
            ₹{mlPredictedBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-700 mt-1">
            Trained Gradient Boosting Regressor (Estimated)
          </p>
        </div>

        {/* Difference */}
        <div className={`rounded-2xl p-4 border ${isClose ? 'bg-slate-50 border-slate-200' : isMlHigher ? 'bg-amber-50/70 border-amber-200' : 'bg-blue-50/70 border-blue-200'}`}>
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" />
            Difference
          </p>
          <p className={`text-xl font-extrabold font-mono mt-1 ${difference >= 0 ? 'text-slate-900' : 'text-slate-900'}`}>
            {difference >= 0 ? '+' : ''}₹{difference.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            ML - Rule-Based (Estimated)
          </p>
        </div>

        {/* Difference % */}
        <div className={`rounded-2xl p-4 border ${isClose ? 'bg-slate-50 border-slate-200' : isMlHigher ? 'bg-amber-50/70 border-amber-200' : 'bg-blue-50/70 border-blue-200'}`}>
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            {diffPercent >= 0 ? (
              <TrendingUp className="w-3 h-3 text-amber-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-blue-600" />
            )}
            Difference %
          </p>
          <p className="text-xl font-extrabold font-mono mt-1 text-slate-900">
            {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(2)}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Variance Ratio (Estimated)
          </p>
        </div>
      </div>

      {/* 7 Required Detailed Comparison Elements */}
      <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Prediction Validation Breakdown (All Values Estimated)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Item 1 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600">1. User Input:</span>
            <span className="font-semibold text-slate-900 font-mono text-right">{userInputSummary}</span>
          </div>

          {/* Item 2 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600">2. Calculated Billing Days:</span>
            <span className="font-semibold text-slate-900 font-mono">{billingDays} Days (Estimated)</span>
          </div>

          {/* Item 3 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600">3. Average Daily Consumption:</span>
            <span className="font-semibold text-slate-900 font-mono">{avgUnits.toFixed(2)} Units/Day (Estimated)</span>
          </div>

          {/* Item 4 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600">4. Projected Monthly Units:</span>
            <span className="font-semibold text-slate-900 font-mono">{projectedUnits.toFixed(2)} Units (Estimated)</span>
          </div>

          {/* Item 5 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600">5. Rule-Based Projected Energy Charge:</span>
            <span className="font-semibold text-slate-900 font-mono">₹{ruleBasedEstimate.toFixed(2)} (Estimated)</span>
          </div>

          {/* Item 6 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600">6. ML Predicted Monthly Bill:</span>
            <span className="font-semibold text-emerald-700 font-mono">₹{mlPredictedBill.toFixed(2)} (Estimated)</span>
          </div>
        </div>

        {/* Item 7 Full-Width Highlight */}
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium text-indigo-950">
            7. Difference between Rule-Based Estimate & ML Prediction:
          </span>
          <span className="font-bold text-indigo-900 font-mono text-sm">
            {difference >= 0 ? '+' : ''}₹{difference.toFixed(2)} ({diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(2)}%) (Estimated)
          </span>
        </div>
      </div>
    </div>
  );
};
