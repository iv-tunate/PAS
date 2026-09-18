"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type BookPurchase = {
  id: string;
  gateway: string;
  reference: string;
  amount: number;
  currency: "NGN" | "USD";
  status: string;
  created_at: string;
};

function formatAmount(amount: number, currency: "NGN" | "USD") {
  return currency === "USD" ? `$${(amount / 100).toFixed(2)}` : `₦${(amount / 100).toLocaleString()}`;
}

export default function AdminBookPurchasesPage() {
  const [purchases, setPurchases] = useState<BookPurchase[] | null>(null);

  useEffect(() => {
    api.get<BookPurchase[]>("/admin/book-purchases", true).then(setPurchases).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Book purchases</h1>

      {!purchases ? (
        <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-stone dark:text-stone-light">No book purchases yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone dark:text-stone-light border-b border-current/10">
                <th className="py-2 pr-4 font-normal">Reference</th>
                <th className="py-2 pr-4 font-normal">Gateway</th>
                <th className="py-2 pr-4 font-normal">Amount</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-current/5">
                  <td className="py-2 pr-4 font-mono text-xs">{p.reference}</td>
                  <td className="py-2 pr-4 capitalize">{p.gateway}</td>
                  <td className="py-2 pr-4">{formatAmount(p.amount, p.currency)}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        p.status === "success"
                          ? "text-accent-light"
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
