import Sidebar from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Key } from "lucide-react";
import { useEffect, useState, useRef } from "react";

type Req = {
  id: number;
  requester_id: number;
  secret_name: string;
  reason?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  admin_comment?: string;
  secret_id?: number;
};

const Requests = () => {
  const [requests, setRequests] = useState<Req[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newName, setNewName] = useState("");
  const [newReason, setNewReason] = useState("");
  const [visibleSecrets, setVisibleSecrets] = useState<Record<number, string>>({});
  const timersRef = useRef<Record<number, number | undefined>>({});

  const token = localStorage.getItem("access_token");
  const currentUserId = Number(localStorage.getItem('user_id')) || undefined;

  useEffect(() => {
    if (!token) return;
    // fetch user to detect admin, then load requests
    (async () => {
      try {
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setIsAdmin(data.is_admin);
        await loadRequests(data.is_admin);
      } catch (err) {
        console.error(err);
        // token invalid or backend down — redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  async function loadRequests(adminFlag?: boolean) {
    if (!token) return;
    const useAdmin = typeof adminFlag === 'boolean' ? adminFlag : isAdmin;
    const url = useAdmin ? '/api/requests?all=true' : '/api/requests';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.error('Failed to load requests', res.status);
      return;
    }
    const data = await res.json();
    setRequests(data);
  }

  function createRequest() {
    if (!token || !newName) return;
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ secret_name: newName, reason: newReason })
    }).then(() => { setNewName(''); setNewReason(''); loadRequests(); });
  }

  function approve(id: number) {
    const secretValue = prompt('Введите значение секрета для сохранения:');
    if (!secretValue) return;
    fetch(`/api/requests/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ secret_value: secretValue })
    }).then(() => loadRequests(true));
  }

  async function viewSecret(id: number) {
    if (!token) return;
    try {
      const res = await fetch(`/api/requests/${id}/secret`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed');
      }
      const data = await res.json();
      setVisibleSecrets((s) => ({ ...s, [id]: data.secret }));
      // auto-clear after 30s
      if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
      timersRef.current[id] = window.setTimeout(() => {
        setVisibleSecrets((s) => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
        delete timersRef.current[id];
      }, 30_000);
    } catch (err) {
      console.error(err);
      alert('Не удалось получить секрет: ' + err);
    }
  }

  function deny(id: number) {
    const comment = prompt('Комментарий (необязательно):');
    fetch(`/api/requests/${id}/deny`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ comment })
    }).then(() => loadRequests(true));
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Мои заявки</h1>

        <div className="mb-6">
          <input className="input" placeholder="Название секрета" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="input ml-2" placeholder="Причина" value={newReason} onChange={(e) => setNewReason(e.target.value)} />
          <button className="btn ml-2" onClick={createRequest}>Создать заявку</button>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground uppercase">Пользователь</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground uppercase">Название секрета</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground uppercase">Дата запроса</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground uppercase">Статус</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4"><span className="font-medium">{(r as any).requester_username || r.requester_id}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center space-x-2"><Key className="w-4 h-4" /><span className="font-medium">{r.secret_name}</span></div></td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4">{r.status === 'approved' ? <Badge variant="success">Одобрено</Badge> : r.status === 'denied' ? <Badge variant="destructive">Отклонено</Badge> : <Badge>В ожидании</Badge>}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {isAdmin && r.status === 'pending' ? (
                      <>
                        <button className="btn mr-2" onClick={() => approve(r.id)}>Одобрить</button>
                        <button className="btn btn-ghost" onClick={() => deny(r.id)}>Отклонить</button>
                      </>
                    ) : isAdmin && r.status === 'approved' ? (
                      <span>Одобрено</span>
                    ) : (!isAdmin && r.status === 'approved' && r.requester_id === currentUserId) ? (
                      <>
                        <button className="btn mr-2" onClick={() => viewSecret(r.id)}>Посмотреть секрет</button>
                        {visibleSecrets[r.id] ? (
                          <div className="mt-2 p-2 bg-muted rounded">{visibleSecrets[r.id]}</div>
                        ) : null}
                      </>
                    ) : (
                      // default: show human status
                      r.status
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

export default Requests;
