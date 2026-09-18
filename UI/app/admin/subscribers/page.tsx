"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Subscriber = {
  id: string;
  email: string;
  brevo_synced: boolean;
  created_at: string;
};

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);

  useEffect(() => {
    api.get<Subscriber[]>("/admin/subscribers", true).then(setSubscribers).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Newsletter subscribers</h1>

      {!subscribers ? (
        <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : subscribers.length === 0 ? (
        <p className="text-sm text-stone dark:text-stone-light">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone dark:text-stone-light border-b border-current/10">
                <th className="py-2 pr-4 font-normal">Email</th>
                <th className="py-2 pr-4 font-normal">Synced to Brevo</th>
                <th className="py-2 pr-4 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-current/5">
                  <td className="py-2 pr-4">{s.email}</td>
                  <td className="py-2 pr-4">{s.brevo_synced ? "Yes" : "Not yet"}</td>
                  <td className="py-2 pr-4 text-stone dark:text-stone-light">
                    {new Date(s.created_at).toLocaleDateString()}
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
