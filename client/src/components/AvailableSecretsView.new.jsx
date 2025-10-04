import React from 'react';

export default function AvailableSecretsView({ requests }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title">Доступные секреты</h1>
        <button className="btn">Создать новый секрет</button>
      </div>

      <p style={{ marginBottom: '20px', color: '#666' }}>
        Секреты, к которым у вас есть доступ
      </p>
      
      <div className="secrets-list">
        {requests.length > 0 ? (
          requests.map(secret => (
            <div key={secret.id} className="secret-item">
              <div className="secret-info">
                <div className="secret-title">secret-bd-123</div>
                <div className="secret-description">
                  Доступ к производственной базе данных аналитики
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Последний доступ: {new Date(secret.requestedAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <button className="btn" style={{ minWidth: '100px' }}>
                Просмотр
              </button>
            </div>
          ))
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
            Нет доступных секретов
          </div>
        )}
      </div>
    </>
  );
}