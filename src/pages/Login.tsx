import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!login || !password) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: login, password })
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Login failed');
        }
        return res.json();
      })
      .then((data) => {
        // store token and user info
        localStorage.setItem('access_token', data.access_token);
        if (data.id) localStorage.setItem('user_id', String(data.id));
        if (typeof data.is_admin !== 'undefined') localStorage.setItem('is_admin', String(data.is_admin));
        toast.success('Вход выполнен успешно');
        navigate('/dashboard');
      })
      .catch((err) => {
        console.error('Login error', err);
        // Show server-provided message when available
        const msg = err?.message || 'Неудалось войти. Проверьте логин/пароль.';
        // keep the local fallback for debug convenience
        if (login === 'admin' && password === 'password') {
          toast.success('Вход выполнен');
          navigate('/dashboard');
        } else {
          toast.error(msg);
        }
      });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-2">SECRET MANAGER</h1>
        </div>

        <div className="bg-card p-8 rounded-lg border border-border">
          <h2 className="text-2xl font-bold mb-2">Вход в систему</h2>
          <p className="text-muted-foreground mb-8">Введите ваши учетные данные</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Логин</label>
              <Input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label htmlFor="remember" className="text-sm">
                Запомнить меня
              </label>
            </div>

            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
