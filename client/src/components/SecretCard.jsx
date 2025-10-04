import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { SECRET_TYPES } from '../constants';

export default function SecretCard({ request, onShowSecret }) {
  const secretTypeInfo = SECRET_TYPES.find(s=>s.id===request.secretType);
  const statusMap = { 'GRANTED': { text: 'разрешено', color: 'bg-green-100 text-green-800' }, 'PENDING': { text: 'на рассмотрении', color: 'bg-yellow-100 text-yellow-800' }, 'DENIED': { text: 'отклонено', color: 'bg-red-100 text-red-800' } };
  const statusInfo = statusMap[request.status] || { text: 'неизвестно', color: 'bg-gray-100 text-gray-800' };
  const handleView = () => { if (request.status==='GRANTED') onShowSecret(request.id, request.secretValue, ()=>navigator.clipboard?.writeText(request.secretValue)); };
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200">
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-gray-900">{secretTypeInfo?.name || request.secretType}</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
        </div>
        <p className="text-sm text-gray-600">{secretTypeInfo?.description}</p>
        <p className="text-xs text-gray-400 mt-1">Последний доступ: {new Date(request.requestedAt).toLocaleDateString('ru-RU')}</p>
      </div>
      <button onClick={handleView} disabled={request.status!=='GRANTED'} className={`px-4 py-2 text-sm font-semibold rounded-md ${request.status==='GRANTED'? 'bg-black text-white':'bg-gray-200 text-gray-500'}`}>Просмотр</button>
    </div>
  );
}
