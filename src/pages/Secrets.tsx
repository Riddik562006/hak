import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Secret {
  id: string;
  name: string;
  description: string;
  lastAccess: string;
  status: "declined" | "approved" | "pending";
}

const mockSecrets: Secret[] = [];

const Secrets = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    login: "",
    password: "",
    host: "",
  });
  const [secrets, setSecrets] = useState<Secret[]>(mockSecrets);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch('/api/secrets', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        // expect array of secret objects
        setSecrets(data as Secret[]);
      })
      .catch(() => {});
  }, []);

  const handleCreateSecret = () => {
    if (!formData.name) {
      toast.error("Введите название секрета");
      return;
    }
    
    toast.success("Секрет создан успешно");
    setIsDialogOpen(false);
    setFormData({ name: "", value: "", login: "", password: "", host: "" });
  };

  const getStatusBadge = (status: Secret["status"]) => {
    switch (status) {
      case "declined":
        return <Badge variant="destructive">отклонено</Badge>;
      case "approved":
        return <Badge variant="success">разрешено</Badge>;
      case "pending":
        return <Badge variant="warning">на рассмотрении</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Доступные секреты</h1>
            <p className="text-muted-foreground mt-1">Секреты, к которым у вас есть доступ</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Создать новый секрет</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Создать новый секрет</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название секрета</label>
                  <Input
                    placeholder="Например Riddik"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Значение</label>
                  <Textarea
                    placeholder="Введите значение секрета"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Логин</label>
                  <Input
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Пароль</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Хост</label>
                  <Input
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Отмена
                  </Button>
                  <Button onClick={handleCreateSecret} className="flex-1">
                    Создать
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {secrets.map((secret) => (
            <div key={secret.id} className="bg-card border border-border rounded-lg p-6 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold">{secret.name}</h3>
                  {/* assume backend provides a status field or not */}
                </div>
                <p className="text-muted-foreground text-sm mb-1">{secret.description}</p>
                <p className="text-xs text-muted-foreground">Последний доступ: {secret.lastAccess}</p>
              </div>
              <Button variant="default" onClick={() => {
                // show secret value in alert for now (value provided by backend for authorized users)
                const token = localStorage.getItem('access_token');
                fetch(`/api/secrets`, { headers: { Authorization: `Bearer ${token}` } })
                  .then(r => r.json())
                  .then(list => {
                    const s = (list as any[]).find(x => String(x.id) === String(secret.id));
                    if (s && s.value) alert('Секрет: ' + s.value);
                    else alert('Секрет недоступен или не найден');
                  }).catch(() => alert('Ошибка получения секрета'))
              }}>Просмотр</Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Secrets;
