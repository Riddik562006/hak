import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const baseMenu = [
  { path: "/dashboard", label: "Запросить данные" },
  { path: "/requests", label: "Мои заявки" },
  { path: "/secrets", label: "Доступные секреты" },
];

const Sidebar = () => {
  const location = useLocation();
  const [menuItems, setMenuItems] = useState(baseMenu);

  useEffect(() => {
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('is_admin') === 'true';
    const items = [...baseMenu];
    if (isAdmin) items.splice(1, 0, { path: '/admin', label: 'Панель админа' });
    setMenuItems(items);

    // update on storage events (e.g., login in another tab)
    const onStorage = () => {
      const ia = localStorage.getItem('is_admin') === 'true';
      const it = [...baseMenu];
      if (ia) it.splice(1, 0, { path: '/admin', label: 'Панель админа' });
      setMenuItems(it);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="w-64 bg-card border-r border-border min-h-screen p-6">
      <div className="mb-12">
        <h1 className="text-2xl font-black">SECRET<br/>MANAGER</h1>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "block px-4 py-3 rounded-md transition-colors",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-secondary"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <button
          onClick={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('is_admin');
            // navigate to login
            window.location.href = '/login';
          }}
          className="block w-full text-left px-4 py-3 rounded-md hover:bg-secondary mt-4"
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
