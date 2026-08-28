import React from 'react';
import {
  FileText,
  Zap,
  Info,
  ShieldCheck,
  IndianRupee,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { BillBreakdownComponents } from '../types';

interface DetailedBillBreakdownProps {
  breakdown: BillBreakdownComponents;
  units: number;
  label?: string;
  subLabel?: string;
}

export const DetailedBillBreakdown: React.FC<DetailedBillBreakdownProps> = ({
  breakdown,
  units,
  label = 'Rule-Based Tariff Breakdown',
  subLabel = 'Separate component accounting matching actual electricity billing structures',
}) => {
  return (
    <div
      id="detailed-bill-breakdown-card"
      className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {label}
            </h3>
            <p className="text-xs text-slate-500">{subLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
            {units.toFixed(1)} kWh
          </span>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Itemized Bill
          </span>
        </div>
      </div>

      {/* Itemized Table of Components */}
      <div className="overflow-hidden border border-slate-200/90 rounded-2xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Billing Component</th>
              <th className="py-3 px-4">Description / Basis</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* 1. Energy Charge */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Energy Charge</span>
              </td>
              <td className="py-3 px-4 text-slate-500">
                AP Telescopic LT-1 Slab consumption charges
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                ₹{breakdown.energyCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 2. Fixed Charge */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-900">
                Fixed Charge
              </td>
              <td className="py-3 px-4 text-slate-500">
                Contracted connected load capacity fee
              </td>
              <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-right">
                ₹{breakdown.fixedCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 3. Customer Charge */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-900">
                Customer Charge
              </td>
              <td className="py-3 px-4 text-slate-500">
                Discom consumer metering & service fee
              </td>
              <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-right">
                ₹{breakdown.customerCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 4. Electricity Duty */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-900">
                Electricity Duty
              </td>
              <td className="py-3 px-4 text-slate-500">
                Statutory state electricity levy (Duty)
              </td>
              <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-right">
                ₹{breakdown.electricityDuty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 5. FPPCA-2 Charge */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-900">
                FPPCA-2 Charge
              </td>
              <td className="py-3 px-4 text-slate-500">
                Fuel & power purchase cost adjustment
              </td>
              <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-right">
                ₹{breakdown.fppca2Charge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 6. Other Charges */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-900">
                Other Charges
              </td>
              <td className="py-3 px-4 text-slate-500">
                Incidental charges / meter rent
              </td>
              <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-right">
                ₹{breakdown.otherCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 7. Gross Bill Subtotal */}
            <tr className="bg-slate-50 font-bold border-t border-b border-slate-200">
              <td className="py-3 px-4 text-slate-900" colSpan={2}>
                Gross Bill (Sum of Charges)
              </td>
              <td className="py-3 px-4 font-mono text-slate-900 text-right text-sm">
                ₹{breakdown.grossBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 8. Government Subsidy */}
            <tr className="hover:bg-emerald-50/40 transition-colors">
              <td className="py-3 px-4 font-semibold text-emerald-800">
                Government Subsidy
              </td>
              <td className="py-3 px-4 text-emerald-700">
                Government financial relief / subsidy deduction
              </td>
              <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-right">
                - ₹{breakdown.governmentSubsidy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 9. Other Adjustment */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-800">
                Other / Adjustment
              </td>
              <td className="py-3 px-4 text-slate-500">
                Rounding & reconciliation adjustment
              </td>
              <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-right">
                + ₹{breakdown.otherAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* 10. Final Net Bill Total */}
            <tr className="bg-emerald-600 text-white font-extrabold text-sm border-t-2 border-emerald-700">
              <td className="py-3.5 px-4" colSpan={2}>
                Final Net Bill (Payable Amount)
              </td>
              <td className="py-3.5 px-4 font-mono text-right text-base">
                ₹{breakdown.netBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formula & Validation Transparency Note */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            Formula: Gross Bill = Energy Charge + Fixed Charge + Customer Charge + Electricity Duty + FPPCA-2 Charge + Other Charges
          </p>
          <p className="text-[11px] text-slate-500">
            Final Net Bill = Gross Bill - Government Subsidy + Other/Adjustment
          </p>
        </div>
      </div>
    </div>
  );
};
