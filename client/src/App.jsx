import React, { useState, useEffect } from 'react';
import { fetchRequestsForUser, createRequest } from './api';
import LoginView from './components/LoginView';
import RequestAccessView from './components/RequestAccessView';
import MyRequestsView from './components/MyRequestsView';
import AvailableSecretsView from './components/AvailableSecretsView';
import './styles.css';

export default function App() {
  const [userId, setUserId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [currentView, setCurrentView] = useState('request');

  useEffect(() => {
    // In this simplified client we generate a stable UUID per session
    const stored = window.localStorage.getItem('adminth_user_id');
    if (stored) setUserId(stored);
    else {
      const id = crypto.randomUUID();
      window.localStorage.setItem('adminth_user_id', id);
      setUserId(id);
    }
  }, []);

  const loadRequests = async (id) => {
    if (!id) return;
    try {
      const data = await fetchRequestsForUser(id);
      setRequests(data.map(r => ({ ...r, requestedAt: r.requestedAt })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadRequests(userId);
  }, [userId]);

  const handleRequestAccess = async (secretId) => {
    if (!userId) return setRequestStatus('Ошибка: нет userId');
    try {
      await createRequest({ userId, secretType: secretId });
      setRequestStatus('Запрос отправлен.');
      await loadRequests(userId);
    } catch (e) {
      console.error(e);
      setRequestStatus('Ошибка при отправке запроса');
    }
    setTimeout(() => setRequestStatus(null), 3000);
  };

  const handleDetailedRequestAccess = async ({ secretId, justification, durationDays }) => {
    if (!userId) return setRequestStatus('Ошибка: нет userId');
    try {
      await createRequest({ userId, secretType: secretId, justification, durationDays });
      setRequestStatus('Детальная заявка отправлена.');
      await loadRequests(userId);
    } catch (e) {
      console.error(e);
      setRequestStatus('Ошибка при отправке детальной заявки');
    }
    setTimeout(() => setRequestStatus(null), 3000);
  };

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <div className="w-64 bg-white border-r border-gray-200 shadow-xl flex flex-col">
        <div className="p-6"><h1 className="text-xl font-extrabold tracking-wider">SECRET<br/>MANAGER</h1></div>
        <nav className="flex-1 mt-4">
          <button onClick={() => setCurrentView('request')} className={`w-full text-left px-6 py-3 font-semibold ${currentView==='request'? 'bg-black text-white':''}`}>Запросить данные</button>
          <button onClick={() => setCurrentView('my_requests')} className={`w-full text-left px-6 py-3 font-semibold ${currentView==='my_requests'? 'bg-black text-white':''}`}>Мои заявки</button>
          <button onClick={() => setCurrentView('available_secrets')} className={`w-full text-left px-6 py-3 font-semibold ${currentView==='available_secrets'? 'bg-black text-white':''}`}>Доступные секреты</button>
        </nav>
        <div className="p-6 border-t border-gray-200 text-xs text-gray-500"><p>User ID:</p><p className="font-mono break-words">{userId}</p></div>
      </div>
      <main className="flex-1 p-0">
        <div className="bg-white min-h-full shadow-lg">
          {requestStatus && <div className="p-4 text-center text-sm font-medium text-white bg-black rounded-b-lg">{requestStatus}</div>}
          {currentView === 'request' && <RequestAccessView handleRequestAccess={handleRequestAccess} requests={requests} setRequestStatus={setRequestStatus} />}
          {currentView === 'my_requests' && <MyRequestsView requests={requests} />}
          {currentView === 'available_secrets' && <AvailableSecretsView grantedSecrets={requests.filter(r=>r.status==='GRANTED')} allRequests={requests} handleDetailedRequestAccess={handleDetailedRequestAccess} />}
        </div>
      </main>
    </div>
  );
}
