"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Payment = {
  id: string;
  paystack_reference: string;
  amount_kobo: number;
  status: string;
  created_at: string;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);

  useEffect(() => {
    api.get<Payment[]>("/admin/payments", true).then(setPayments).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Payments</h1>

      {!payments ? (
        <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-stone dark:text-stone-light">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone dark:text-stone-light border-b border-current/10">
                <th className="py-2 pr-4 font-normal">Reference</th>
                <th className="py-2 pr-4 font-normal">Amount</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-current/5">
                  <td className="py-2 pr-4 font-mono text-xs">{p.paystack_reference}</td>
                  <td className="py-2 pr-4">₦{(p.amount_kobo / 100).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        p.status === "success"
                          ? "text-accent"
                          : p.status === "failed"
                          ? "text-wax"
                          : "text-stone dark:text-stone-light"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-stone dark:text-stone-light">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
