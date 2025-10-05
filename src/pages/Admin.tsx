import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Req = {
  id: number;
  requester_id: number;
  requester_username?: string;
  secret_name: string;
  reason?: string;
  status: string;
  created_at: string;
};

const Admin = () => {
  const [requests, setRequests] = useState<Req[]>([]);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!token) return;
    const res = await fetch('/api/requests?all=true', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    setRequests(data);
  }

  async function approve(id: number) {
    const secretValue = prompt('Введите значение секрета:');
    if (!secretValue) return;
    const res = await fetch(`/api/requests/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ secret_value: secretValue }) });
    if (res.ok) load(); else alert('Failed to approve');
  }

  async function deny(id: number) {
    const comment = prompt('Комментарий (необязательно):');
    const res = await fetch(`/api/requests/${id}/deny`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ comment }) });
    if (res.ok) load(); else alert('Failed to deny');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Пользователь</th>
                <th className="px-6 py-4 text-left">Секрет</th>
                <th className="px-6 py-4 text-left">Причина</th>
                <th className="px-6 py-4 text-left">Статус</th>
                <th className="px-6 py-4 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">{r.id}</td>
                  <td className="px-6 py-4">{r.requester_username || r.requester_id}</td>
                  <td className="px-6 py-4">{r.secret_name}</td>
                  <td className="px-6 py-4">{r.reason}</td>
                  <td className="px-6 py-4">{r.status}</td>
                  <td className="px-6 py-4">
                    {r.status === 'pending' ? (
                      <>
                        <button className="btn mr-2" onClick={() => approve(r.id)}>Одобрить</button>
                        <button className="btn btn-ghost" onClick={() => deny(r.id)}>Отклонить</button>
                      </>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Admin;
