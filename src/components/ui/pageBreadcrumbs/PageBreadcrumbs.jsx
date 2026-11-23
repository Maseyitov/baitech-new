// src/components/ui/pageBreadcrumbs/PageBreadcrumbs.jsx
"use client";
import Link from "next/link";
import styles from "./PageBreadcrumbs.module.scss";

// items: [{ label: 'Главная', path: '/' }, { label: 'Корзина' }]
// Последний пункт — текущая страница (синим, без ссылки)
export default function PageBreadcrumbs({ items = [] }) {
  return (
    <nav aria-label="breadcrumb" className={styles.breadcrumbs}>
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {isLast || !item.path ? (
                <span
                  className={isLast ? styles.current : styles.plain}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.path} className={styles.link}>
                  {item.label}
                </Link>
              )}
              {!isLast && <span className={styles.sep}>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
