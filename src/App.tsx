/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  FileText,
  RotateCcw,
  AlertCircle,
  Clock,
  Gauge,
  TrendingUp,
  Award,
  IndianRupee,
  Layers,
  Cpu,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { EnergyFormData, PredictionResult, ConsumptionStatus } from './types';
import {
  MODEL_PERFORMANCES,
  callPredictApi,
  calculateLocalPrediction,
} from './mlEngine';
import { ModelAnalysis } from './components/ModelAnalysis';
import { PredictionValidation } from './components/PredictionValidation';
import { EnergyConsumptionForecast } from './components/EnergyConsumptionForecast';
import { DailyEnergyTracking } from './components/DailyEnergyTracking';

export default function App() {
  const [activeTab, setActiveTab] = useState<'prediction' | 'daily-tracking' | 'model-analysis'>('prediction');

  // Default values matching the required test scenario: 2026-08-01 to 2026-08-03 with 128 units
  const [formData, setFormData] = useState<EnergyFormData>({
    fromDate: '2026-08-01',
    toDate: '2026-08-03',
    unitsConsumed: '128',
    state: 'AP',
    governmentSubsidy: 'Yes',
  });

  const [result, setResult] = useState<PredictionResult | null>(() => {
    return calculateLocalPrediction({
      fromDate: '2026-08-01',
      toDate: '2026-08-03',
      unitsConsumed: '128',
      state: 'AP',
      governmentSubsidy: 'Yes',
    });
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Perform initial prediction on mount if backend is ready
  useEffect(() => {
    async function init() {
      try {
        const res = await callPredictApi(formData);
        setResult(res);
      } catch {
        // Safe initial fallback is already set by calculateLocalPrediction
      }
    }
    init();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationError) setValidationError(null);
    if (apiError) setApiError(null);
  };

  const handlePredictSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setValidationError(null);
    setApiError(null);

    // 1. Validations
    if (!formData.fromDate) {
      setValidationError('Please select a valid "From Date".');
      return;
    }
    if (!formData.toDate) {
      setValidationError('Please select a valid "To Date".');
      return;
    }
    if (
      formData.unitsConsumed.trim() === '' ||
      isNaN(Number(formData.unitsConsumed))
    ) {
      setValidationError('Please enter a valid numeric value for Units Consumed.');
      return;
    }

    const units = parseFloat(formData.unitsConsumed);
    if (units < 0) {
      setValidationError('Units consumed cannot be negative.');
      return;
    }

    const [fromY, fromM, fromD] = formData.fromDate.split('-').map(Number);
    const [toY, toM, toD] = formData.toDate.split('-').map(Number);

    const fromDateObj = new Date(fromY, fromM - 1, fromD);
    const toDateObj = new Date(toY, toM - 1, toD);

    if (toDateObj.getTime() < fromDateObj.getTime()) {
      setValidationError('"To Date" must be on or after "From Date".');
      return;
    }

    setIsLoading(true);

    try {
      // Complete workflow: send user input to ML API /api/predict which loads model.pkl
      const apiResult = await callPredictApi(formData);
      setResult(apiResult);
      setApiError(null);
    } catch (err: any) {
      console.error('API call failed:', err);
      setApiError(
        err?.message || 'Prediction failed: Trained model.pkl could not be loaded or executed.'
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fromDate: '',
      toDate: '',
      unitsConsumed: '',
      state: 'AP',
      governmentSubsidy: 'No',
    });
    setResult(null);
    setValidationError(null);
    setApiError(null);
  };

  const loadScenarioExample = (exampleType: 'august_test' | 'moderate' | 'low') => {
    let sample: EnergyFormData;
    if (exampleType === 'august_test') {
      sample = {
        fromDate: '2026-08-01',
        toDate: '2026-08-03',
        unitsConsumed: '128',
        state: 'AP',
        governmentSubsidy: 'Yes',
      };
    } else if (exampleType === 'moderate') {
      sample = {
        fromDate: '2026-08-01',
        toDate: '2026-08-15',
        unitsConsumed: '105',
        state: 'AP',
        governmentSubsidy: 'No',
      };
    } else {
      sample = {
        fromDate: '2026-08-01',
        toDate: '2026-08-30',
        unitsConsumed: '70',
        state: 'AP',
        governmentSubsidy: 'Yes',
      };
    }

    setFormData(sample);
    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    callPredictApi(sample)
      .then((res) => {
        setResult(res);
      })
      .catch((err: any) => {
        setApiError(err?.message || 'Prediction failed: model.pkl could not be loaded');
        setResult(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getStatusBadgeConfig = (status: ConsumptionStatus = 'Normal') => {
    switch (status) {
      case 'Low':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          desc: 'Energy efficient usage (≤ 100 units/month)',
        };
      case 'Normal':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          desc: 'Standard residential usage (101 - 300 units/month)',
        };
      case 'High':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          desc: 'Elevated consumption (301 - 500 units/month)',
        };
      case 'Very High':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          desc: 'Heavy consumption pattern (> 500 units/month)',
        };
    }
  };

  const statusConfig = getStatusBadgeConfig(result?.consumptionStatus);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header
        id="app-header"
        className="w-full px-6 sm:px-8 py-5 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center shrink-0 gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Smart Energy Consumption & Bill Predictor
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              ML Regression & AP Telescopic Tariff Calculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              id="tab-prediction-btn"
              type="button"
              onClick={() => setActiveTab('prediction')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'prediction'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bill Predictor</span>
            </button>
            <button
              id="tab-daily-tracking-btn"
              type="button"
              onClick={() => setActiveTab('daily-tracking')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'daily-tracking'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Daily Tracking</span>
            </button>
            <button
              id="tab-model-analysis-btn"
              type="button"
              onClick={() => setActiveTab('model-analysis')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'model-analysis'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ML Model Analysis</span>
            </button>
          </div>

          <button
            id="sample-august-btn"
            type="button"
            onClick={() => {
              setActiveTab('prediction');
              loadScenarioExample('august_test');
            }}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Load 01-08-2026 to 03-08-2026 (128 Units) Test Scenario"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aug 1-3 Test (128 u)</span>
          </button>

          <span
            id="system-status-badge"
            className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ML Model Online (100k)
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8"
      >
        {activeTab === 'model-analysis' ? (
          <ModelAnalysis />
        ) : activeTab === 'daily-tracking' ? (
          <DailyEnergyTracking />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Input Form Card */}
        <section
          id="input-section"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col shadow-sm"
        >
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span>Input Parameters</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Step 1 to 7
            </span>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div
              id="form-error-alert"
              className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide">
                  Invalid Input
                </p>
                <p className="text-xs text-rose-700 mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* API Notification/Warning Banner */}
          {apiError && (
            <div
              id="api-error-alert"
              className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider">Service Notice</p>
                <p className="mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          <form
            id="energy-form"
            onSubmit={handlePredictSubmit}
            className="space-y-4 flex-grow flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* From Date */}
              <div>
                <label
                  htmlFor="fromDate"
                  className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                >
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* To Date */}
              <div>
                <label
                  htmlFor="toDate"
                  className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                >
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Units Consumed */}
              <div>
                <label
                  htmlFor="units"
                  className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                >
                  Units Consumed (kWh)
                </label>
                <input
                  type="number"
                  id="units"
                  name="unitsConsumed"
                  placeholder="e.g. 128"
                  min="0"
                  step="any"
                  value={formData.unitsConsumed}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm text-slate-900 bg-white font-mono"
                />
              </div>

              {/* State & Government Subsidy */}
              <div className="grid grid-cols-2 gap-4">
                {/* State Dropdown */}
                <div>
                  <label
                    htmlFor="state"
                    className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                  >
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm bg-white text-slate-900 cursor-pointer"
                  >
                    <option value="AP">AP (Andhra Pradesh)</option>
                    <option value="TN">TN (Tamil Nadu)</option>
                  </select>
                </div>

                {/* Government Subsidy Dropdown */}
                <div>
                  <label
                    htmlFor="subsidy"
                    className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
                  >
                    Government Subsidy
                  </label>
                  <select
                    id="subsidy"
                    name="governmentSubsidy"
                    value={formData.governmentSubsidy}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm bg-white text-slate-900 cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit & Reset Controls */}
            <div className="space-y-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="submit"
                id="predict-bill-button"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    <span>Predict Bill</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="clear-form-button"
                onClick={handleReset}
                className="w-full text-xs font-semibold text-slate-400 hover:text-slate-600 py-1.5 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Form
              </button>
            </div>
          </form>
        </section>

        {/* Right Column: Professional Result Dashboard */}
        <section
          id="prediction-display-section"
          className="lg:col-span-7 flex flex-col gap-6"
        >
          {/* Loading Indicator Overlay/Banner */}
          {isLoading && (
            <div
              id="ai-loading-banner"
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 animate-pulse shadow-xs"
            >
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
              <p className="text-sm font-semibold">
                AI is analyzing your energy consumption...
              </p>
            </div>
          )}

          {/* High Consumption Warning Alert */}
          {result?.isHighWarning && !isLoading && (
            <div
              id="high-consumption-warning"
              className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex items-start gap-3.5 text-amber-950 shadow-sm"
            >
              <div className="p-2 bg-amber-200/80 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-900" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                  High Consumption Warning
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Projected monthly consumption of{' '}
                  <span className="font-bold font-mono">
                    {result.projectedMonthlyUnits.toFixed(2)} units
                  </span>{' '}
                  is unusually high. Heavy appliance usage (air conditioners,
                  heaters, water pumps) significantly increases the highest AP
                  telescopic tariff slab (₹9.75/unit).
                </p>
              </div>
            </div>
          )}

          {/* Consumption Status Card */}
          <div
            id="consumption-status-card"
            className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-700">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Consumption Status
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {statusConfig.desc}
                </p>
              </div>
            </div>

            <div
              id="status-indicator-badge"
              className={`px-4 py-2 rounded-2xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs ${statusConfig.bg}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} animate-pulse`}></span>
              <span>{result ? result.consumptionStatus : 'Normal'} Consumption</span>
            </div>
          </div>

          {/* 3 Result Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: CURRENT PERIOD */}
            <div
              id="card-current-period"
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  CURRENT PERIOD
                </h3>
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {result ? result.billingDays : 0} Days
                </span>
              </div>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">
                    Units Consumed:
                  </span>
                  <span
                    id="current-units-consumed"
                    className="text-sm font-bold text-slate-900 font-mono"
                  >
                    {result ? result.unitsConsumed.toFixed(1) : '0.0'} kWh
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">
                    Billing Days:
                  </span>
                  <span
                    id="current-billing-days"
                    className="text-sm font-bold text-slate-900 font-mono"
                  >
                    {result ? result.billingDays : 0} days
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">
                    Average Daily Consumption:
                  </span>
                  <span
                    id="current-avg-daily"
                    className="text-sm font-bold text-emerald-700 font-mono"
                  >
                    {result ? result.averageDailyUnits.toFixed(2) : '0.00'} u/day
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Current Energy Charge:
                  </span>
                  <span
                    id="current-energy-charge-val"
                    className="text-base font-bold text-slate-900 font-mono"
                  >
                    ₹
                    {result
                      ? result.currentPeriodEnergyCharge.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: MONTHLY PROJECTION */}
            <div
              id="card-monthly-projection"
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  MONTHLY PROJECTION
                </h3>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  {result?.fromMonthName} ({result?.daysInFromMonth} Days)
                </span>
              </div>

              <div className="space-y-4 mt-4">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Projected Monthly Units
                  </span>
                  <p
                    id="projection-monthly-units"
                    className="text-2xl font-extrabold text-slate-900 font-mono"
                  >
                    {result
                      ? result.projectedMonthlyUnits.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '0.00'}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      units
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Calculated as {result?.averageDailyUnits.toFixed(2)} u/day ×{' '}
                    {result?.daysInFromMonth} days
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                    Projected Monthly Energy Charge
                  </span>
                  <p
                    id="projection-monthly-charge"
                    className="text-2xl font-extrabold text-emerald-900 font-mono"
                  >
                    ₹
                    {result
                      ? result.projectedMonthlyEnergyCharge.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )
                      : '0.00'}
                  </p>
                  <p className="text-[10px] text-emerald-700/80 mt-1">
                    Based on AP telescopic slab rates
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: AI PREDICTION Hero Card */}
          <div
            id="card-ai-prediction"
            className="bg-emerald-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-xl"
          >
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-emerald-800">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-emerald-800/90 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 border border-emerald-700">
                    <Cpu className="w-3.5 h-3.5 text-emerald-300" />
                    AI PREDICTION
                  </div>
                  <span className="text-xs text-emerald-200 font-medium">
                    {result?.modelUsed || 'Gradient Boosting Regressor'}
                  </span>
                </div>

                <span className="text-xs font-semibold text-emerald-200 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                  Subsidy: {result?.governmentSubsidy === 'Yes' ? 'Active' : 'None'}
                </span>
              </div>

              {/* 2 Main AI Prediction Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {/* Predicted Monthly Bill (Gross) */}
                <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-2xl p-5">
                  <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    Predicted Monthly Bill
                  </p>
                  <h3
                    id="ai-predicted-monthly-bill"
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2 flex items-center font-mono"
                  >
                    <IndianRupee className="w-7 h-7 inline mr-0.5 text-emerald-400" />
                    {result
                      ? result.predictedMonthlyBill.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '0.00'}
                  </h3>
                  <p className="text-[11px] text-emerald-200/70 mt-1.5">
                    Gross bill before government subsidy
                  </p>
                </div>

                {/* Predicted Monthly Net Bill */}
                <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-2xl p-5">
                  <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Predicted Monthly Net Bill
                  </p>
                  <h3
                    id="ai-predicted-monthly-net-bill"
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-300 mt-2 flex items-center font-mono"
                  >
                    <IndianRupee className="w-7 h-7 inline mr-0.5 text-emerald-400" />
                    {result
                      ? result.predictedMonthlyNetBill.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '0.00'}
                  </h3>
                  <p className="text-[11px] text-emerald-200/70 mt-1.5">
                    Net payable amount after applicable subsidy
                  </p>
                </div>
              </div>
            </div>

            {/* Background Watermark */}
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-white select-none">
              <Zap className="w-72 h-72" />
            </div>
          </div>

          {/* ENERGY CONSUMPTION FORECAST Section */}
          {result && <EnergyConsumptionForecast result={result} />}

          {/* Prediction Validation and Model Reliability Section */}
          {result && <PredictionValidation result={result} />}

          {/* Model Performance Comparison Section */}
          <div
            id="model-performance-card"
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  ML Model Performance Comparison
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                80/20 Train/Test Split (100k Dataset)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">MAE (₹)</th>
                    <th className="py-2.5 px-3">RMSE (₹)</th>
                    <th className="py-2.5 px-3">R² Score</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODEL_PERFORMANCES.map((m) => (
                    <tr
                      key={m.name}
                      className={
                        m.is_best
                          ? 'bg-emerald-50/70 font-semibold text-emerald-950'
                          : 'hover:bg-slate-50/50'
                      }
                    >
                      <td className="py-3 px-3 flex items-center gap-2">
                        {m.is_best && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        )}
                        <span>{m.name}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">₹{m.mae.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono">₹{m.rmse.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono">
                        {(m.r2 * 100).toFixed(2)}% ({m.r2.toFixed(4)})
                      </td>
                      <td className="py-3 px-3 text-right">
                        {m.is_best ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            <Award className="w-3 h-3" />
                            Best Model
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Evaluated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                AP Domestic LT-1 Telescopic Slab Reference:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-slate-500 font-mono text-[10px]">
                <span>0–30 u: ₹1.90/u</span>
                <span>31–75 u: ₹2.60/u</span>
                <span>76–125 u: ₹3.60/u</span>
                <span>126–225 u: ₹6.90/u</span>
                <span>226–400 u: ₹7.80/u</span>
                <span>&gt;400 u: ₹9.75/u</span>
              </div>
            </div>
          </div>
        </section>
        </div>
        )}
      </main>
    </div>
  );
}
