import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  BarChart3,
  CalendarDays,
  IndianRupee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DailyEnergyRecord } from '../types';
import { calculateRuleBasedBill } from '../utils/tariffCalculator';

interface SevenDayEnergyAnalysisProps {
  records: DailyEnergyRecord[];
}

export const SevenDayEnergyAnalysis: React.FC<SevenDayEnergyAnalysisProps> = ({ records }) => {
  // Sort records chronologically ascending for analytical time-series
  const chronologicalRecords = useMemo(() => {
    return [...records].sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  const count = chronologicalRecords.length;

  // Analysis when >= 2 days exist
  const analysis = useMemo(() => {
    if (count < 2) return null;

    const unitsList = chronologicalRecords.map((r) => r.meter_units);
    const totalUnits = unitsList.reduce((acc, val) => acc + val, 0);
    const avgDaily = totalUnits / count;

    // Highest and lowest
    let highestRec = chronologicalRecords[0];
    let lowestRec = chronologicalRecords[0];
    for (const r of chronologicalRecords) {
      if (r.meter_units > highestRec.meter_units) highestRec = r;
      if (r.meter_units < lowestRec.meter_units) lowestRec = r;
    }

    // Today (latest recorded) and Yesterday (previous recorded)
    const latestRec = chronologicalRecords[count - 1];
    const previousRec = chronologicalRecords[count - 2];

    const todayUnits = latestRec.meter_units;
    const yesterdayUnits = previousRec.meter_units;
    const diff = todayUnits - yesterdayUnits;
    const pctChange = yesterdayUnits > 0 ? (diff / yesterdayUnits) * 100 : diff > 0 ? 100 : 0;

    // Dynamic Trend: compare recent window vs earlier window or linear regression slope
    let trend: 'Increasing' | 'Stable' | 'Decreasing' = 'Stable';
    if (count >= 4) {
      const mid = Math.floor(count / 2);
      const firstHalf = unitsList.slice(0, mid);
      const secondHalf = unitsList.slice(mid);
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const diffPct = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

      if (diffPct > 5) trend = 'Increasing';
      else if (diffPct < -5) trend = 'Decreasing';
      else trend = 'Stable';
    } else {
      if (pctChange > 5) trend = 'Increasing';
      else if (pctChange < -5) trend = 'Decreasing';
      else trend = 'Stable';
    }

    // Smart Alert: Compare today's consumption against recent average
    // Use average of all prior days (or last 7 days)
    const priorRecords = chronologicalRecords.slice(0, count - 1);
    const priorAvg =
      priorRecords.length > 0
        ? priorRecords.reduce((a, b) => a + b.meter_units, 0) / priorRecords.length
        : avgDaily;

    const isHighAlert = todayUnits > priorAvg * 1.15 && todayUnits > 5.0;

    // 7-day metrics when count >= 7
    let sevenDayStats: {
      sevenDayTotal: number;
      sevenDayAvg: number;
      highestDay: DailyEnergyRecord;
      lowestDay: DailyEnergyRecord;
    } | null = null;

    if (count >= 7) {
      const last7 = chronologicalRecords.slice(count - 7);
      const total7 = last7.reduce((acc, r) => acc + r.meter_units, 0);
      const avg7 = total7 / 7;

      let high7 = last7[0];
      let low7 = last7[0];
      for (const r of last7) {
        if (r.meter_units > high7.meter_units) high7 = r;
        if (r.meter_units < low7.meter_units) low7 = r;
      }

      sevenDayStats = {
        sevenDayTotal: total7,
        sevenDayAvg: avg7,
        highestDay: high7,
        lowestDay: low7,
      };
    }

    // Monthly Projection
    const now = new Date();
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const effectiveAvgDaily = sevenDayStats ? sevenDayStats.sevenDayAvg : avgDaily;
    const projectedMonthlyUnits = Math.round(effectiveAvgDaily * daysInCurrentMonth * 100) / 100;

    const latestState = latestRec.state || 'AP';
    const latestSubsidy = latestRec.subsidy_available || 'Yes';
    const projectedBillBreakdown = calculateRuleBasedBill(
      projectedMonthlyUnits,
      latestState,
      latestSubsidy
    );

    // Chart Data with rolling 7-day average
    const chartData = chronologicalRecords.map((rec, idx) => {
      // compute rolling average of up to 7 days up to this point
      const windowStart = Math.max(0, idx - 6);
      const windowRecords = chronologicalRecords.slice(windowStart, idx + 1);
      const windowSum = windowRecords.reduce((sum, r) => sum + r.meter_units, 0);
      const rollingAvg = Math.round((windowSum / windowRecords.length) * 100) / 100;

      // format date label: e.g. "08-25"
      const dateParts = rec.date.split('-');
      const shortLabel = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : rec.date;

      return {
        date: rec.date,
        displayDate: shortLabel,
        units: Number(rec.meter_units.toFixed(2)),
        rollingAvg,
      };
    });

    return {
      totalUnits,
      avgDaily,
      highestRec,
      lowestRec,
      todayUnits,
      todayDate: latestRec.date,
      yesterdayUnits,
      yesterdayDate: previousRec.date,
      diff,
      pctChange,
      trend,
      isHighAlert,
      priorAvg,
      sevenDayStats,
      projectedMonthlyUnits,
      daysInCurrentMonth,
      projectedBillBreakdown,
      chartData,
    };
  }, [chronologicalRecords, count]);

  return (
    <div
      id="seven-day-energy-analysis-section"
      className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xs">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              7-Day Energy Analysis
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Smart Energy Patterns, Rolling Variance & Projected Monthly Load
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {count >= 7 ? (
            <span
              id="analysis-badge-7day"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-full"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Full 7-Day Window ({count} Days Logged)
            </span>
          ) : count >= 2 ? (
            <span
              id="analysis-badge-partial"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-full"
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              {count} Days Recorded
            </span>
          ) : (
            <span
              id="analysis-badge-insufficient"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-full"
            >
              <Info className="w-3.5 h-3.5" />
              {count} of 2 Days Minimum
            </span>
          )}
        </div>
      </div>

      {/* Conditional Content based on records count */}
      {count < 2 ? (
        <div
          id="insufficient-data-alert"
          className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3"
        >
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Add more daily readings to generate consumption analysis.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            At least 2 days of meter readings are required to calculate consumption variance, dynamic trends, and monthly projections.
          </p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Notice when fewer than 7 days */}
          {count < 7 && (
            <div
              id="partial-7day-notice"
              className="p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-2xl flex items-center gap-3 text-blue-900 text-xs font-medium"
            >
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                7-day analysis will become available after more daily readings are recorded ({count}/7 days currently logged).
              </span>
            </div>
          )}

          {/* Smart Alert Banner */}
          {analysis.isHighAlert ? (
            <div
              id="smart-high-energy-alert"
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  High Energy Consumption Alert
                </p>
                <p className="text-xs text-rose-700 mt-1 font-medium leading-relaxed">
                  Today's consumption ({analysis.todayUnits.toFixed(2)} kWh) is higher than your recent average ({analysis.priorAvg.toFixed(2)} kWh). Consider checking high-power appliances.
                </p>
              </div>
            </div>
          ) : (
            <div
              id="smart-normal-energy-alert"
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-medium"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p>
                Your energy consumption is within your recent usage pattern (Latest: {analysis.todayUnits.toFixed(2)} kWh vs Average: {analysis.avgDaily.toFixed(2)} kWh).
              </p>
            </div>
          )}

          {/* Primary Metrics Grid (2+ Days) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Units */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Units Consumed
              </span>
              <span className="text-xl font-extrabold text-slate-900 font-mono block">
                {analysis.totalUnits.toFixed(2)}{' '}
                <span className="text-xs font-medium text-slate-500">kWh</span>
              </span>
              <span className="text-[10px] text-slate-500 block">
                Across {count} recorded days
              </span>
            </div>

            {/* Average Daily Consumption */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Average Daily Usage
              </span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono block">
                {analysis.avgDaily.toFixed(2)}{' '}
                <span className="text-xs font-medium text-slate-500">kWh/day</span>
              </span>
              <span className="text-[10px] text-slate-500 block">
                Mean across logged history
              </span>
            </div>

            {/* Highest Consumption */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Highest Consumption
              </span>
              <span className="text-xl font-extrabold text-rose-600 font-mono block">
                {analysis.highestRec.meter_units.toFixed(2)}{' '}
                <span className="text-xs font-medium text-slate-500">kWh</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block truncate">
                on {analysis.highestRec.date}
              </span>
            </div>

            {/* Lowest Consumption */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Lowest Consumption
              </span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono block">
                {analysis.lowestRec.meter_units.toFixed(2)}{' '}
                <span className="text-xs font-medium text-slate-500">kWh</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block truncate">
                on {analysis.lowestRec.date}
              </span>
            </div>
          </div>

          {/* Today vs Yesterday Variance & Dynamic Trend */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Today vs Yesterday */}
            <div className="md:col-span-7 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  Today vs Yesterday Variance
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {analysis.yesterdayDate} vs {analysis.todayDate}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white border border-slate-200/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Yesterday's Consumption
                  </span>
                  <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                    {analysis.yesterdayUnits.toFixed(2)} kWh
                  </span>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Today's Consumption
                  </span>
                  <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                    {analysis.todayUnits.toFixed(2)} kWh
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Difference (Today - Yesterday):</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      analysis.diff > 0
                        ? 'text-rose-600'
                        : analysis.diff < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {analysis.diff > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : analysis.diff < 0 ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : null}
                    {analysis.diff > 0 ? '+' : ''}
                    {analysis.diff.toFixed(2)} kWh
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 border-t border-slate-100 pt-2">
                  <span>Percentage Change:</span>
                  <span
                    className={`font-mono font-bold ${
                      analysis.pctChange > 0
                        ? 'text-rose-600'
                        : analysis.pctChange < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {analysis.pctChange > 0 ? '+' : ''}
                    {analysis.pctChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Consumption Trend & Pattern */}
            <div className="md:col-span-5 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="pb-2 border-b border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Consumption Trend
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Dynamic Trajectory
                  </span>
                </div>

                <div className="mt-4 p-4 bg-white border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Current Pattern:
                    </span>
                    <span
                      id="consumption-trend-badge"
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        analysis.trend === 'Increasing'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : analysis.trend === 'Decreasing'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {analysis.trend === 'Increasing' && <TrendingUp className="w-3.5 h-3.5" />}
                      {analysis.trend === 'Decreasing' && <TrendingDown className="w-3.5 h-3.5" />}
                      {analysis.trend === 'Stable' && <Minus className="w-3.5 h-3.5" />}
                      <span>Consumption Trend: {analysis.trend}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    {analysis.trend === 'Increasing' &&
                      'Recent daily consumption shows an upward climb compared to previous baseline.'}
                    {analysis.trend === 'Decreasing' &&
                      'Recent consumption indicates disciplined energy conservation with declining daily load.'}
                    {analysis.trend === 'Stable' &&
                      'Daily consumption remains steady with low variance across recorded dates.'}
                  </p>
                </div>
              </div>

              {/* 7-Day Window Box if count >= 7 */}
              {analysis.sevenDayStats && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      7-Day Average
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {analysis.sevenDayStats.sevenDayAvg.toFixed(2)} kWh
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      7-Day Total
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {analysis.sevenDayStats.sevenDayTotal.toFixed(2)} kWh
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Graph: Daily Consumption & 7-Day Moving Average */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daily Consumption & 7-Day Moving Average
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                X-Axis: Date | Y-Axis: Units (kWh)
              </span>
            </div>

            <div className="w-full h-64 sm:h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analysis.chartData}
                  margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    unit=" u"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      borderColor: '#e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === 'Daily Consumption') return [`${Number(val).toFixed(2)} kWh`, name];
                      if (name === '7-Day Rolling Average') return [`${Number(val).toFixed(2)} kWh`, name];
                      return [val, name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return `Date: ${payload[0].payload.date}`;
                      }
                      return `Date: ${label}`;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Bar
                    dataKey="units"
                    name="Daily Consumption"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingAvg"
                    name="7-Day Rolling Average"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0284c7' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PROJECTED MONTHLY USAGE & ESTIMATED BILL */}
          <div className="bg-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight uppercase">
                    Projected Monthly Usage & Estimated Bill
                  </h3>
                  <p className="text-[11px] text-emerald-300">
                    Calculated from actual recorded daily rate × {analysis.daysInCurrentMonth} days using rule-based AP tariff
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-900 border border-emerald-700/80 px-3 py-1 rounded-full text-emerald-200">
                Formula: Avg Daily ({analysis.avgDaily.toFixed(2)} u) × {analysis.daysInCurrentMonth} Days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Projected Monthly Units
                </span>
                <span className="text-2xl font-extrabold font-mono text-white block">
                  {analysis.projectedMonthlyUnits.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-emerald-300">kWh</span>
                </span>
                <span className="text-[10px] text-emerald-400 block">
                  Estimated full month consumption
                </span>
              </div>

              <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Estimated Gross Bill
                </span>
                <span className="text-2xl font-extrabold font-mono text-emerald-200 block">
                  ₹{analysis.projectedBillBreakdown.grossBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-400 block">
                  Energy + Fixed + Duty + FPPCA
                </span>
              </div>

              <div className="bg-emerald-800/80 border border-emerald-600 rounded-xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                  Estimated Net Monthly Bill
                </span>
                <span className="text-2xl font-extrabold font-mono text-white block">
                  ₹{analysis.projectedBillBreakdown.netBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-200 block">
                  Payable amount after subsidy
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
