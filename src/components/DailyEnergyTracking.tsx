import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Zap,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import { DailyEnergyRecord } from '../types';

const STORAGE_KEY = 'daily_energy_records';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  dateObj.setDate(dateObj.getDate() - 1);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DailyEnergyTracking() {
  const todayStr = useMemo(() => getTodayDateString(), []);

  const [trackDate, setTrackDate] = useState<string>(todayStr);
  const [meterUnits, setMeterUnits] = useState<string>('');
  const [state, setState] = useState<'AP' | 'TN'>('AP');
  const [subsidyAvailable, setSubsidyAvailable] = useState<'Yes' | 'No'>('Yes');

  const [records, setRecords] = useState<DailyEnergyRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as DailyEnergyRecord[];
    } catch {}
    return [];
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const saveRecordsToStorage = (updated: DailyEnergyRecord[]) => {
    setRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  useEffect(() => {
    const existing = records.find((r) => r.date === trackDate);
    if (existing) {
      setMeterUnits(String(existing.meter_units));
      setState(existing.state);
      setSubsidyAvailable(existing.subsidy_available);
    } else {
      setMeterUnits('');
    }
  }, [trackDate, records]);

  const isTodayRecorded = useMemo(() => {
    return records.some((r) => r.date === todayStr);
  }, [records, todayStr]);

  const handleSaveUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackDate) {
      setNotification({ type: 'error', message: 'Please select a valid date.' });
      return;
    }
    const unitsNum = parseFloat(meterUnits);
    if (isNaN(unitsNum) || unitsNum < 0) {
      setNotification({ type: 'error', message: 'Please enter valid non-negative units.' });
      return;
    }

    const existingIndex = records.findIndex((r) => r.date === trackDate);
    let updatedList: DailyEnergyRecord[];

    if (existingIndex >= 0) {
      updatedList = [...records];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        meter_units: unitsNum,
        state,
        subsidy_available: subsidyAvailable,
        updatedAt: new Date().toISOString(),
      };
    } else {
      const newRec: DailyEnergyRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        date: trackDate,
        meter_units: unitsNum,
        state,
        subsidy_available: subsidyAvailable,
        updatedAt: new Date().toISOString(),
      };
      updatedList = [...records, newRec];
    }

    saveRecordsToStorage(updatedList);
    setNotification({
      type: 'success',
      message: "Today's energy usage has been recorded successfully.",
    });
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    saveRecordsToStorage(updated);
    setNotification({ type: 'info', message: 'Record deleted.' });
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const activeRecord = useMemo(() => {
    return records.find((r) => r.date === trackDate) || null;
  }, [records, trackDate]);

  const yesterdayDateStr = useMemo(() => {
    return getYesterdayDateString(trackDate);
  }, [trackDate]);

  const yesterdayRecord = useMemo(() => {
    return records.find((r) => r.date === yesterdayDateStr) || null;
  }, [records, yesterdayDateStr]);

  const comparisonData = useMemo(() => {
    const currentUnits = activeRecord ? activeRecord.meter_units : parseFloat(meterUnits);

    if (yesterdayRecord && !isNaN(currentUnits)) {
      const yesterdayUnits = yesterdayRecord.meter_units;
      const difference = currentUnits - yesterdayUnits;
      const percentageChange =
        yesterdayUnits > 0
          ? (difference / yesterdayUnits) * 100
          : difference > 0
          ? 100
          : 0;

      const isSignificantlyHigher =
        difference > 0 &&
        (percentageChange >= 20 || (yesterdayUnits > 0 && currentUnits > yesterdayUnits * 1.2));

      return {
        available: true,
        yesterdayUnits,
        todayUnits: currentUnits,
        difference,
        percentageChange,
        isSignificantlyHigher,
      };
    }

    return {
      available: false,
      yesterdayUnits: null,
      todayUnits: isNaN(currentUnits) ? null : currentUnits,
      difference: null,
      percentageChange: null,
      isSignificantlyHigher: false,
    };
  }, [activeRecord, yesterdayRecord, meterUnits]);

  return (
    <div id="daily-energy-tracking-section" className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                DAILY ENERGY TRACKING
              </h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Daily Meter Logging & Day-Over-Day Variance Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTodayRecorded ? (
              <span
                id="daily-status-recorded"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-full"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Today's Usage Logged
              </span>
            ) : (
              <span
                id="daily-status-pending"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Pending Today's Entry
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          {!isTodayRecorded ? (
            <div
              id="daily-reminder-alert"
              className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-sm"
            >
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="font-medium">
                Please enter today's electricity consumption.
              </p>
            </div>
          ) : (
            <div
              id="daily-success-reminder"
              className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-medium">
                Today's energy usage has been recorded successfully.
              </p>
            </div>
          )}
        </div>

        {notification && (
          <div
            id="tracking-notification"
            className={`mt-4 p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-slate-600" />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pt-2">
          <form
            id="daily-tracking-form"
            onSubmit={handleSaveUsage}
            className="lg:col-span-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Record Daily Meter Reading</span>
            </h3>

            <div className="space-y-1.5">
              <label
                htmlFor="track-date-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Today's Date
              </label>
              <input
                id="track-date-input"
                type="date"
                value={trackDate}
                onChange={(e) => setTrackDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs"
                required
              />
              <p className="text-[11px] text-slate-500">
                Defaults to today ({todayStr}).
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="track-meter-units-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Today's Meter Units (kWh)
              </label>
              <div className="relative">
                <input
                  id="track-meter-units-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 14.5"
                  value={meterUnits}
                  onChange={(e) => setMeterUnits(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                  kWh
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="track-state-select"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  State
                </label>
                <select
                  id="track-state-select"
                  value={state}
                  onChange={(e) => setState(e.target.value as 'AP' | 'TN')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs cursor-pointer"
                >
                  <option value="AP">Andhra Pradesh (AP)</option>
                  <option value="TN">Tamil Nadu (TN)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="track-subsidy-select"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Government Subsidy
                </label>
                <select
                  id="track-subsidy-select"
                  value={subsidyAvailable}
                  onChange={(e) => setSubsidyAvailable(e.target.value as 'Yes' | 'No')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs cursor-pointer"
                >
                  <option value="Yes">Yes (Available)</option>
                  <option value="No">No (Standard)</option>
                </select>
              </div>
            </div>

            <button
              id="save-today-usage-btn"
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Save className="w-4 h-4" />
              <span>SAVE TODAY'S USAGE</span>
            </button>
          </form>

          <div
            id="yesterday-comparison-card"
            className="lg:col-span-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>YESTERDAY COMPARISON</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {yesterdayDateStr} vs {trackDate}
                </span>
              </div>

              {comparisonData.isSignificantlyHigher && (
                <div
                  id="high-energy-alert"
                  className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wide">
                      High Energy Consumption Alert
                    </p>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Today's consumption ({comparisonData.todayUnits} units) is higher than yesterday's ({comparisonData.yesterdayUnits} units), showing a +{comparisonData.percentageChange?.toFixed(1)}% surge.
                    </p>
                  </div>
                </div>
              )}

              {comparisonData.available ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Yesterday's Units
                      </span>
                      <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                        {comparisonData.yesterdayUnits?.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-500">kWh</span>
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Today's Units
                      </span>
                      <span className="text-lg font-bold text-emerald-700 font-mono mt-0.5 block">
                        {comparisonData.todayUnits?.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-500">kWh</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        Difference (today - yesterday):
                      </span>
                      <span
                        className={`text-sm font-bold font-mono flex items-center gap-1 ${
                          (comparisonData.difference ?? 0) > 0
                            ? 'text-rose-600'
                            : (comparisonData.difference ?? 0) < 0
                            ? 'text-emerald-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {(comparisonData.difference ?? 0) > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (comparisonData.difference ?? 0) < 0 ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : null}
                        {(comparisonData.difference ?? 0) > 0 ? '+' : ''}
                        {comparisonData.difference?.toFixed(2)} kWh
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-xs font-semibold text-slate-600">
                        Percentage Change:
                      </span>
                      <span
                        className={`text-sm font-bold font-mono ${
                          (comparisonData.percentageChange ?? 0) > 0
                            ? 'text-rose-600'
                            : (comparisonData.percentageChange ?? 0) < 0
                            ? 'text-emerald-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {(comparisonData.percentageChange ?? 0) > 0 ? '+' : ''}
                        {comparisonData.percentageChange?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  id="no-previous-data-banner"
                  className="p-6 bg-white border border-slate-200 rounded-xl text-center space-y-2 my-auto"
                >
                  <Info className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    No previous-day data available.
                  </p>
                  <p className="text-xs text-slate-500">
                    Record energy usage for consecutive days to unlock day-over-day variance, percentage trends, and high load alerts.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Formula: difference = today's units - yesterday's units</span>
              <span>Local Storage Engine</span>
            </div>
          </div>
        </div>
      </div>

      <div
        id="daily-history-section"
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              DAILY HISTORY
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {records.length} {records.length === 1 ? 'Record' : 'Records'} Stored
          </span>
        </div>

        {sortedRecords.length === 0 ? (
          <div
            id="empty-history-placeholder"
            className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2"
          >
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              No daily records recorded yet.
            </p>
            <p className="text-xs text-slate-500">
              Save your meter readings daily above to track your historical variance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              id="daily-history-table"
              className="w-full text-left text-xs text-slate-700"
            >
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Units</th>
                  <th className="py-3 px-3.5">State</th>
                  <th className="py-3 px-3.5">Subsidy</th>
                  <th className="py-3 px-3.5">Change from Previous Day</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRecords.map((rec, index) => {
                  const recYesterdayDate = getYesterdayDateString(rec.date);
                  const priorRecord =
                    records.find((r) => r.date === recYesterdayDate) ||
                    sortedRecords[index + 1] ||
                    null;

                  let changeText = '—';
                  let isSurge = false;
                  let isReduction = false;

                  if (priorRecord) {
                    const diff = rec.meter_units - priorRecord.meter_units;
                    const pct =
                      priorRecord.meter_units > 0
                        ? (diff / priorRecord.meter_units) * 100
                        : 0;
                    const sign = diff > 0 ? '+' : '';
                    changeText = `${sign}${diff.toFixed(2)} u (${sign}${pct.toFixed(1)}%)`;
                    isSurge = diff > 0;
                    isReduction = diff < 0;
                  }

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-semibold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{rec.date}</span>
                        {rec.date === todayStr && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                        {rec.meter_units.toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-slate-700">
                          {rec.state}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            rec.subsidy_available === 'Yes'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {rec.subsidy_available}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono">
                        <span
                          className={`font-semibold ${
                            isSurge
                              ? 'text-rose-600'
                              : isReduction
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {changeText}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          id={`delete-record-${rec.id}`}
                          onClick={() => handleDeleteRecord(rec.id)}
                          title="Delete Record"
                          className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
