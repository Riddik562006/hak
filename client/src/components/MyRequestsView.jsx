import React from 'react';
import { Lock } from 'lucide-react';
import { SECRET_TYPES } from '../constants';

export default function MyRequestsView({ requests }) {
  const myRequests = requests.filter(r => r.status !== 'GRANTED');
  const getSecretTitle = (secretType) => { const info = SECRET_TYPES.find(s=>s.id===secretType); return info? info.name : secretType; };
  const getDurationText = (d) => { if (!d) return 'Стандартный срок'; if (d===1) return '1 день'; if (d>1 && d<5) return `${d} дня`; return `${d} дней`; };
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Мои заявки</h2>
      <div className="bg-white border rounded-lg shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-50"><tr><th>Название</th><th>Срок</th><th>Дата</th><th>Статус</th><th>Обоснование</th></tr></thead>
          <tbody>
            {myRequests.length>0 ? myRequests.map(r=> (
              <tr key={r.id} className="hover:bg-gray-50"><td className="px-6 py-4"><div className="flex items-center"><Lock className="w-4 h-4 mr-2"/>{getSecretTitle(r.secretType)}</div></td><td className="px-6 py-4">{getDurationText(r.durationDays)}</td><td className="px-6 py-4">{new Date(r.requestedAt).toLocaleDateString('ru-RU')}</td><td className="px-6 py-4">{r.status}</td><td className="px-6 py-4">{r.justification? r.justification.substring(0,30)+'...': 'Быстрый запрос'}</td></tr>
            )) : (<tr><td colSpan="5" className="p-4 text-center text-sm text-gray-500 italic">Нет активных заявок.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
