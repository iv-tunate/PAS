"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    api.get<User[]>("/admin/users", true).then(setUsers).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Users</h1>

      {!users ? (
        <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-stone dark:text-stone-light">No users yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone dark:text-stone-light border-b border-current/10">
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Email</th>
                <th className="py-2 pr-4 font-normal">Role</th>
                <th className="py-2 pr-4 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-current/5">
                  <td className="py-2 pr-4">{u.full_name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4 capitalize">{u.role}</td>
                  <td className="py-2 pr-4 text-stone dark:text-stone-light">
                    {new Date(u.created_at).toLocaleDateString()}
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
