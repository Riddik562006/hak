import React, { useEffect, useState } from 'react';
import DetailedAccessRequestModal from './DetailedAccessRequestModal';
import SecretCard from './SecretCard';

export default function AvailableSecretsView({ grantedSecrets, allRequests, handleDetailedRequestAccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [secretToView, setSecretToView] = useState(null);

  const handleShowSecret = (id, value, handleCopy) => setSecretToView({ id, value, handleCopy });
  const handleCloseSecret = () => setSecretToView(null);

  useEffect(()=>{ if (secretToView) { const t = setTimeout(handleCloseSecret, 10000); return ()=>clearTimeout(t); } }, [secretToView]);

  return (
    <div className="p-8">
      <DetailedAccessRequestModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSubmitRequest={handleDetailedRequestAccess} requests={allRequests} />
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Доступные секреты</h2><button onClick={()=>setIsModalOpen(true)} className="px-4 py-2 bg-black text-white rounded-md">Создать заявку</button></div>
      <p className="text-gray-600 mb-6">Секреты, к которым у вас есть доступ</p>
      <div className="bg-white border rounded-lg shadow-lg divide-y">
        {allRequests.length>0 ? allRequests.map(r=> <SecretCard key={r.id} request={r} onShowSecret={handleShowSecret} />) : <p className="p-4 text-gray-500 italic">Нет запросов</p>}
      </div>
      {secretToView && (<div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg"><h3 className="text-xl font-bold">Секрет будет скрыт через 10 сек</h3><div className="p-4 bg-gray-50 border rounded-md font-mono break-all">{secretToView.value}</div><div className="mt-4 flex justify-end space-x-3"><button onClick={()=>{secretToView.handleCopy()}} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Копировать</button><button onClick={handleCloseSecret} className="px-4 py-2 border rounded-md">Закрыть</button></div></div></div>)}
    </div>
  );
}
