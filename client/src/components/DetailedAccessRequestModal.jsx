import React, { useState } from 'react';
import { FileText, XCircle } from 'lucide-react';
import { SECRET_TYPES } from '../constants';

export default function DetailedAccessRequestModal({ isOpen, onClose, onSubmitRequest, requests }) {
  const [resource, setResource] = useState('');
  const [justification, setJustification] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [error, setError] = useState(null);

  const availableResources = SECRET_TYPES.filter(type => !requests.some(r => r.secretType === type.id && (r.status === 'PENDING' || r.status === 'GRANTED')));

  const handleSubmit = () => {
    setError(null);
    if (!resource || !justification || durationDays <= 0) { setError('Заполните поля'); return; }
    onSubmitRequest({ secretId: resource, justification, durationDays });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center"><FileText className="w-5 h-5 mr-2"/>Создать заявку</h2>
            <button onClick={onClose}><XCircle/></button>
          </div>
          <label>Ресурс</label>
          <select value={resource} onChange={e=>setResource(e.target.value)} className="w-full p-3 border rounded-md">
            <option value="">Выберите ресурс</option>
            {availableResources.map(s=> <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </select>
          <label className="mt-3">Обоснование</label>
          <textarea value={justification} onChange={e=>setJustification(e.target.value)} className="w-full p-3 border rounded-md h-24" />
          <label className="mt-3">Срок (дней)</label>
          <input type="number" min={1} value={durationDays} onChange={e=>setDurationDays(Math.max(1, parseInt(e.target.value)||1))} className="w-full p-3 border rounded-md" />
          {error && <div className="mt-3 text-red-600">{error}</div>}
          <div className="mt-4 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-md">Отмена</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-black text-white rounded-md">Отправить</button>
          </div>
        </div>
      </div>
    </div>
  );
}
