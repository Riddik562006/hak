import React from 'react';

export default function MyRequestsView({ requests = [] }) {
  return (
    <div className="main-content">
      <h1 className="page-title">Мои заявки</h1>
      
      <table className="table">
        <thead>
          <tr>
            <th>НАЗВАНИЕ СЕКРЕТА</th>
            <th>ДАТА ЗАПРОСА</th>
            <th>СТАТУС</th>
            <th>ДЕЙСТВИЯ</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr key={request.id}>
              <td>{request.secretType}</td>
              <td>{new Date(request.requestedAt).toLocaleDateString('ru-RU')}</td>
              <td>
                <span className={`status-badge ${
                  request.status === 'GRANTED' ? 'status-approved' :
                  request.status === 'PENDING' ? 'status-pending' :
                  'status-rejected'
                }`}>
                  {request.status === 'GRANTED' ? 'Одобрено' :
                   request.status === 'PENDING' ? 'На рассмотрении' :
                   'Отклонено'}
                </span>
              </td>
              <td>
                <span style={{ color: '#999', fontSize: '14px' }}>Ожидание</span>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                Нет активных заявок
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}