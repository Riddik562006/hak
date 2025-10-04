import React from 'react';

export default function LoginView({ onLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">SECRET<br/>MANAGER</h1>
        <h2 className="login-subtitle">Вход в систему</h2>
        <p className="text-gray-500 mb-8">Введите ваши учетные данные</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input type="text" className="input-field" disabled placeholder="Загрузка..." />
          </div>
          
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input type="password" className="input-field" disabled placeholder="Загрузка..." />
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox-input" disabled />
              Запомнить меня
            </label>
          </div>
          
          <button type="submit" className="btn" style={{ width: '100%' }}>
            Войти
          </button>

          <p className="helper-text" style={{ textAlign: 'center', background: 'none', border: 'none' }}>
            Автоматическая аутентификация...
          </p>
        </form>
      </div>
    </div>
  );
}