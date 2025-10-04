import React, { useState } from 'react';
import { SECRET_TYPES } from '../constants';

export default function RequestAccessView({ handleRequestAccess, requests, setRequestStatus }) {
  const [secretQuery, setSecretQuery] = useState('');
  const availableSecrets = SECRET_TYPES.filter(type => !requests.some(r => r.secretType === type.id && (r.status === 'PENDING' || r.status === 'GRANTED')));
  const filteredSecrets = secretQuery ? availableSecrets.filter(s=>s.name.toLowerCase().includes(secretQuery.toLowerCase())||s.id.toLowerCase().includes(secretQuery.toLowerCase())) : availableSecrets;
  const handleSubmit = () => {
    const secretToRequest = SECRET_TYPES.find(s => s.id.toLowerCase() === secretQuery.toLowerCase() || s.name.toLowerCase() === secretQuery.toLowerCase());
    if (secretToRequest) { handleRequestAccess(secretToRequest.id); setSecretQuery(''); }
    else { setRequestStatus('Секрет не найден'); setTimeout(()=>setRequestStatus(null),3000); }
  }
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Запросить доступ (Быстрый)</h2>
      <div className="max-w-xl">
        <input value={secretQuery} onChange={e=>setSecretQuery(e.target.value)} placeholder="Введите ID секрета" className="w-full p-3 border rounded-md" />
        <button onClick={handleSubmit} className="mt-4 px-6 py-3 bg-black text-white rounded-md">Отправить быстрый запрос</button>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Доступные к запросу:</h3>
          {filteredSecrets.length>0 ? (<ul className="space-y-2 text-sm text-gray-600">{filteredSecrets.map(s=> <li key={s.id} onClick={()=>setSecretQuery(s.id)} className="cursor-pointer">{s.id} ({s.name})</li>)}</ul>) : (<p className="text-sm text-gray-500 italic">Нет доступных</p>)}
        </div>
      </div>
    </div>
  );
}
