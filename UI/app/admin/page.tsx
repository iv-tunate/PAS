"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Stats = {
  total_users: number;
  total_subscribers: number;
  total_revenue_kobo: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>("/admin/stats", true).then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Dashboard</h1>

      {!stats ? (
        <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-lg border border-current/10">
            <p className="text-xs text-stone dark:text-stone-light mb-2">Total users</p>
            <p className="font-display text-3xl">{stats.total_users}</p>
          </div>
          <div className="p-6 rounded-lg border border-current/10">
            <p className="text-xs text-stone dark:text-stone-light mb-2">Newsletter subscribers</p>
            <p className="font-display text-3xl">{stats.total_subscribers}</p>
          </div>
          <div className="p-6 rounded-lg border border-current/10">
            <p className="text-xs text-stone dark:text-stone-light mb-2">Total revenue</p>
            <p className="font-display text-3xl">
              ₦{(stats.total_revenue_kobo / 100).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
