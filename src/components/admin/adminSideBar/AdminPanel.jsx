"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, Image as ImageIcon, Users, Settings, LogOut, BarChart3 } from "lucide-react";
import { useLogout } from "@/lib/auth/hooks/hooks";
import "./AdminPanel.scss";

const menuItems = [
  {
    id: 0,
    text: "Товары",
    path: "/productss",
    matchPaths: ["/productss", "/admin/camera", "/add-product", "/edit-product"],
    icon: <Package size={22} />,
  },
  {
    id: 1,
    text: "Заказы",
    path: "/order-table",
    matchPaths: ["/order-table"],
    icon: <Truck size={22} />,
  },
  {
    id: 2,
    text: "Баннеры",
    path: "/our-banner",
    matchPaths: ["/our-banner"],
    icon: <ImageIcon size={22} />,
  },
  {
    id: 3,
    text: "Пользователи",
    path: "/users-table",
    matchPaths: ["/users-table"],
    icon: <Users size={22} />,
  },
  {
    id: 4,
    text: "Настройки сайта",
    path: "/setting-web",
    matchPaths: ["/setting-web"],
    icon: <Settings size={22} />,
  },
    {
    id: 5,
    text: "Статистика",
    path: "/stats",
    matchPaths: ["/stats"],
    icon: <BarChart3 size={22} />,
  },
];

const isPathActive = (pathname, item) =>
  item.matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const AdminPanel = () => {
  const pathname = usePathname();
  const menuRef = useRef(null);
  const itemRefs = useRef({});
  const { mutate: logout } = useLogout();

  const activeIndex = menuItems.findIndex((item) => isPathActive(pathname, item));

  const updateIndicatorPosition = (index) => {
    const itemElement = itemRefs.current[index];

    if (itemElement && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = itemElement.getBoundingClientRect();
      const topPos = itemRect.top - menuRect.top;

      menuRef.current.style.setProperty("--indicator-top", `${topPos}px`);
      menuRef.current.style.setProperty("--indicator-height", `${itemRect.height}px`);
    }
  };

  useEffect(() => {
    if (activeIndex === -1) return;

    updateIndicatorPosition(activeIndex);

    const handleResize = () => {
      updateIndicatorPosition(activeIndex);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === -1 && menuRef.current) {
      menuRef.current.style.removeProperty("--indicator-top");
      menuRef.current.style.removeProperty("--indicator-height");
    }
  }, [activeIndex]);

  return (
    <div className="admin-panel">
      <h2 className="admin-title">Админ панель</h2>
      <nav className="admin-nav">
        <ul className="admin-menu" ref={menuRef}>
          {menuItems.map((item, index) => (
            <li key={item.id} className="admin-menu-item">
              <Link
                href={item.path}
                className={`admin-menu-link ${isPathActive(pathname, item) ? "active" : ""}`}
                onClick={() => updateIndicatorPosition(index)}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
              >
                <div className="icon-text-container">
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-text">{item.text}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="admin-logout-container">
        <button className="admin-logout-btn" onClick={() => logout()}>
          <LogOut size={22} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;


