import React, { useState } from 'react';

export default function RequestAccessView({ handleRequestAccess }) {
  const [secretName, setSecretName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (secretName) {
      handleRequestAccess(secretName);
      setSecretName('');
    }
  };

  return (
    <div className="main-content">
      <h1 className="page-title">Запросить доступ к секрету</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div className="form-group">
          <label className="form-label">Название секрета</label>
          <input
            type="text"
            className="input-field"
            placeholder="Введите название секрета (например, rddk.bd)"
            value={secretName}
            onChange={(e) => setSecretName(e.target.value)}
          />
        </div>

        <button type="submit" className="btn" disabled={!secretName}>
          Запросить доступ
        </button>

        <div className="helper-text">
          <strong>Как это работает:</strong>
          <br />
          После одобрения заявки секрет станет доступным в вашем локальном кабинете.
          <br />
          Вы получите уведомление о готовности.
        </div>
      </form>
    </div>
  );
}