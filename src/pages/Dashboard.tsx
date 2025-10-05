import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Dashboard = () => {
  const [secretName, setSecretName] = useState("");

  const handleRequest = () => {
    if (!secretName) {
      toast.error("Введите название секрета");
      return;
    }
    
    toast.success("Заявка на доступ отправлена");
    setSecretName("");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Запросить доступ к секрету</h1>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Название секрета
              </label>
              <Input
                type="text"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                placeholder="Введите название секрета (например ridik.bd)"
                className="w-full"
              />
            </div>

            <Button onClick={handleRequest} className="mb-8">
              Запросить доступ
            </Button>

            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <div className="mt-1">ℹ️</div>
              <div>
                <p className="font-medium mb-1">Как это работает:</p>
                <p>После одобрения заявки секрет станет доступным в вашем локальном кабинете.</p>
                <p>Вы получите уведомление о готовности.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
