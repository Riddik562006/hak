import React, { useState, useEffect } from 'react';
import { fetchRequestsForUser, createRequest } from './api';
import LoginView from './components/LoginView';
import RequestAccessView from './components/RequestAccessView';
import MyRequestsView from './components/MyRequestsView';
import AvailableSecretsView from './components/AvailableSecretsView';
import './styles.css';

export default function App() {
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [currentView, setCurrentView] = useState('request');

  // Authentication
  useEffect(() => {
    const stored = window.localStorage.getItem('adminth_user_id');
    if (stored) {
      setUserId(stored);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    const id = crypto.randomUUID();
    setUserId(id);
    setIsAuthenticated(true);
    window.localStorage.setItem('adminth_user_id', id);
  };

  // Load user requests
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    fetchRequestsForUser(userId).then(data => {
      if (!mounted) return;
      setRequests(data);
    }).catch(console.error);
    return () => { mounted = false };
  }, [userId]);

  // Request handlers
  const handleRequestAccess = async (secretId) => {
    if (!userId) return;
    try {
      await createRequest({ userId, secretType: secretId });
      setRequestStatus('Запрос отправлен');
      const data = await fetchRequestsForUser(userId);
      setRequests(data);
    } catch (e) {
      console.error(e);
      setRequestStatus('Ошибка при отправке запроса');
    }
    setTimeout(() => setRequestStatus(null), 3000);
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1 className="app-title">SECRET<br/>MANAGER</h1>
        <nav>
          <button 
            className={`nav-item ${currentView === 'request' ? 'active' : ''}`}
            onClick={() => setCurrentView('request')}
          >
            Запросить данные
          </button>
          <button 
            className={`nav-item ${currentView === 'my_requests' ? 'active' : ''}`}
            onClick={() => setCurrentView('my_requests')}
          >
            Мои заявки
          </button>
          <button 
            className={`nav-item ${currentView === 'available_secrets' ? 'active' : ''}`}
            onClick={() => setCurrentView('available_secrets')}
          >
            Доступные секреты
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {requestStatus && (
          <div className="notification">{requestStatus}</div>
        )}
        
        {currentView === 'request' && (
          <RequestAccessView 
            handleRequestAccess={handleRequestAccess}
            requests={requests}
          />
        )}
        
        {currentView === 'my_requests' && (
          <MyRequestsView requests={requests} />
        )}
        
        {currentView === 'available_secrets' && (
          <AvailableSecretsView 
            requests={requests.filter(r => r.status === 'GRANTED')}
          />
        )}
      </main>
    </div>
  );
}