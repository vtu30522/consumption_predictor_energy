import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Zap,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  BarChart2,
  LineChart as LineChartIcon,
  CheckCircle2,
  Info,
  Flame,
  Activity,
  IndianRupee
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { PredictionResult } from '../types';

interface EnergyConsumptionForecastProps {
  result: PredictionResult;
}

export const EnergyConsumptionForecast: React.FC<EnergyConsumptionForecastProps> = ({ result }) => {
  const [chartView, setChartView] = useState<'cumulative' | 'daily'>('cumulative');

  // Parse start date, end date, and month properties
  const {
    fromDate,
    toDate,
    unitsConsumed,
    billingDays,
    averageDailyUnits,
    projectedMonthlyUnits,
    predictedMonthlyBill,
    predictedMonthlyNetBill,
    daysInMonth,
    fromMonthName,
    fromYear,
    consumptionStatus,
    isHighWarning
  } = result;

  // Extract start and end day of the month from fromDate and toDate
  const parsedFrom = new Date(fromDate);
  const parsedTo = new Date(toDate);
  
  const fromDay = !isNaN(parsedFrom.getDate()) ? parsedFrom.getDate() : 1;
  const toDay = !isNaN(parsedTo.getDate()) ? parsedTo.getDate() : Math.min(billingDays, daysInMonth);

  // Generate 1..daysInMonth dynamic chart points
  const forecastData = useMemo(() => {
    const data = [];
    const totalDays = daysInMonth || 31;
    const avgDaily = averageDailyUnits;

    let cumulativeTotal = 0;

    for (let day = 1; day <= totalDays; day++) {
      cumulativeTotal += avgDaily;
      const formattedDate = `${fromMonthName.slice(0, 3)} ${day}`;

      // Actual period is between fromDay and toDay
      const isActual = day <= toDay;

      if (isActual) {
        data.push({
          dayNumber: day,
          dateLabel: formattedDate,
          actualDaily: Number(avgDaily.toFixed(2)),
          projectedDaily: null,
          actualCumulative: Number((day * avgDaily).toFixed(2)),
          projectedCumulative: null,
          isActual: true,
        });
      } else {
        data.push({
          dayNumber: day,
          dateLabel: formattedDate,
          actualDaily: null,
          projectedDaily: Number(avgDaily.toFixed(2)),
          actualCumulative: null,
          projectedCumulative: Number((day * avgDaily).toFixed(2)),
          isActual: false,
        });
      }
    }
    return data;
  }, [daysInMonth, averageDailyUnits, fromMonthName, toDay]);

  // Consumption Status styling
  const getStatusBadge = () => {
    switch (consumptionStatus) {
      case 'Low':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          desc: 'Efficient Domestic Consumption (≤100 units/mo)'
        };
      case 'Normal':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          desc: 'Standard Household Range (101–200 units/mo)'
        };
      case 'High':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          desc: 'Elevated Consumption (201–400 units/mo)'
        };
      case 'Very High':
      default:
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-300',
          dot: 'bg-rose-500',
          desc: 'Severe High-Volume Load (>400 units/mo)'
        };
    }
  };

  const statusStyle = getStatusBadge();

  return (
    <div
      id="energy-consumption-forecast-section"
      className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              ENERGY CONSUMPTION FORECAST
            </h3>
            <p className="text-xs text-slate-500">
              Dynamic multi-day projection for {fromMonthName} {fromYear} based on current daily consumption velocity
            </p>
          </div>
        </div>

        {/* Consumption Status Tag */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${statusStyle.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot} animate-pulse`}></span>
            <span>Status: {consumptionStatus}</span>
          </div>
        </div>
      </div>

      {/* High Consumption Alert Banner if Unusually High */}
      {(isHighWarning || consumptionStatus === 'High' || consumptionStatus === 'Very High') && (
        <div
          id="high-consumption-alert"
          className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 sm:p-5 text-rose-950 flex items-start gap-3.5 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-rose-900">
                Unusually High Energy Consumption Alert
              </p>
              <span className="bg-rose-200 text-rose-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                Tier Escalation Warning
              </span>
            </div>
            <p className="text-rose-800 leading-relaxed">
              Your average consumption rate is <strong>{averageDailyUnits.toFixed(2)} units/day</strong>. If maintained, your monthly consumption will reach <strong>{projectedMonthlyUnits.toFixed(2)} units</strong> for {fromMonthName}. Under AP Domestic LT-1 rules, consumption above 400 units moves into the highest telescopic slab (₹9.75/unit) and incurs heightened fixed charges.
            </p>
          </div>
        </div>
      )}

      {/* Grid of Two Core Cards: CURRENT USAGE & MONTHLY FORECAST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: CURRENT USAGE */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                CURRENT USAGE
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
              Logged Run
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                From Date
              </span>
              <span className="font-mono font-semibold text-slate-900">{fromDate}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                To Date
              </span>
              <span className="font-mono font-semibold text-slate-900">{toDate}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                Units Consumed
              </span>
              <span className="font-mono font-bold text-emerald-950 text-sm">{unitsConsumed} kWh</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Billing Days
              </span>
              <span className="font-mono font-semibold text-slate-900">{billingDays} Days</span>
            </div>

            <div className="flex justify-between items-center py-1 pt-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-2.5">
              <span className="font-semibold text-emerald-900">Average Daily Consumption</span>
              <span className="font-mono font-extrabold text-emerald-950 text-sm">
                {averageDailyUnits.toFixed(2)} units/day
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: MONTHLY FORECAST */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 space-y-3.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-700/60 relative z-10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                MONTHLY FORECAST
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
              Full Month ({daysInMonth} Days)
            </span>
          </div>

          <div className="space-y-3 text-xs relative z-10">
            {/* Projected Monthly Units */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-[11px] font-medium uppercase tracking-wider">Projected Monthly Units</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {averageDailyUnits.toFixed(2)} u/d × {daysInMonth}d
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white font-mono mt-1">
                {projectedMonthlyUnits.toFixed(2)} <span className="text-sm font-normal text-emerald-300">kWh</span>
              </p>
            </div>

            {/* Projected Monthly Bill */}
            <div className="bg-emerald-500/20 backdrop-blur-xs border border-emerald-400/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-emerald-200">
                <span className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  Projected Monthly Bill
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-400/20 px-2 py-0.5 rounded">
                  Estimated
                </span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-300 font-mono mt-1 flex items-center">
                ₹{predictedMonthlyBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-300 mt-1">
                Net Payable: <strong>₹{predictedMonthlyNetBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> (after subsidy)
              </p>
            </div>
          </div>

          {/* Ambient Glow */}
          <div className="absolute right-0 bottom-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* Interactive Forecast Chart */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>Actual vs. Projected Consumption Progression</span>
            </h4>
            <p className="text-xs text-slate-500">
              Days 1–{toDay} (Actual Logged) vs. Days {toDay + 1}–{daysInMonth} (Projected Daily Horizon)
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartView('cumulative')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartView === 'cumulative'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cumulative (kWh)
            </button>
            <button
              type="button"
              onClick={() => setChartView('daily')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartView === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Run Rate (kWh/d)
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecastData}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="dateLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval={Math.floor(daysInMonth / 8)}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                unit={chartView === 'cumulative' ? ' u' : ' u/d'}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1.5 font-sans">
                        <p className="font-bold text-emerald-400 border-b border-slate-700 pb-1">
                          {label} ({dataPoint.isActual ? 'Actual Period' : 'Projected Forecast'})
                        </p>
                        {chartView === 'cumulative' ? (
                          <>
                            {dataPoint.actualCumulative !== null && (
                              <p className="flex justify-between gap-3 text-slate-200">
                                <span>Actual Cumulative:</span>
                                <strong className="font-mono text-emerald-300">{dataPoint.actualCumulative} kWh</strong>
                              </p>
                            )}
                            {dataPoint.projectedCumulative !== null && (
                              <p className="flex justify-between gap-3 text-slate-300">
                                <span>Projected Cumulative:</span>
                                <strong className="font-mono text-indigo-300">{dataPoint.projectedCumulative} kWh</strong>
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                              Monthly Target: {projectedMonthlyUnits.toFixed(2)} kWh
                            </p>
                          </>
                        ) : (
                          <>
                            {dataPoint.actualDaily !== null && (
                              <p className="flex justify-between gap-3 text-slate-200">
                                <span>Actual Daily Rate:</span>
                                <strong className="font-mono text-emerald-300">{dataPoint.actualDaily} kWh/d</strong>
                              </p>
                            )}
                            {dataPoint.projectedDaily !== null && (
                              <p className="flex justify-between gap-3 text-slate-300">
                                <span>Projected Daily Rate:</span>
                                <strong className="font-mono text-indigo-300">{dataPoint.projectedDaily} kWh/d</strong>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {/* Horizontal Reference Line Showing Projected Monthly Consumption */}
              {chartView === 'cumulative' ? (
                <>
                  <ReferenceLine
                    y={projectedMonthlyUnits}
                    label={{
                      value: `Projected Monthly: ${projectedMonthlyUnits.toFixed(1)} kWh`,
                      fill: '#059669',
                      fontSize: 11,
                      position: 'insideTopRight'
                    }}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                  <Bar
                    dataKey="actualCumulative"
                    name="Actual Consumption (kWh)"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedCumulative"
                    name="Projected Consumption (kWh)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: '#6366f1' }}
                  />
                </>
              ) : (
                <>
                  <ReferenceLine
                    y={averageDailyUnits}
                    label={{
                      value: `Avg Daily Run Rate: ${averageDailyUnits.toFixed(2)} u/d`,
                      fill: '#059669',
                      fontSize: 11,
                      position: 'insideTopRight'
                    }}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                  <Bar
                    dataKey="actualDaily"
                    name="Actual Daily (kWh/d)"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                  <Bar
                    dataKey="projectedDaily"
                    name="Projected Daily (kWh/d)"
                    fill="#93c5fd"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Methodology Explanatory Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block"></span>
              Actual Logged ({fromDate} to {toDate})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block"></span>
              Projected Horizon (Remaining Days)
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-600 font-medium">
            Daily Run Rate: {averageDailyUnits.toFixed(2)} units/day
          </span>
        </div>
      </div>
    </div>
  );
};
