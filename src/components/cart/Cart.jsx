"use client";
import styles from "./Cart.module.scss";
import {
  ShoppingCart,
  Printer,
  Trash2,
  ClipboardCheck,
  Receipt,
  ShieldCheck,
  Search,
  ArrowRight,
} from "lucide-react";
import CartItem from "../cartItem/CartItem";
import Link from "next/link";
import { useCartSummary, useClearCart } from "@/lib/cart/hooks/hooks";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import CheckoutModal from "./CheckoutModal.jsx";
import PageBreadcrumbs from "@/components/ui/pageBreadcrumbs/PageBreadcrumbs";
import { SMETA_LOGO } from "./smetaLogo";
import { useMyProfile } from "@/lib/auth/hooks/hooks";
import { useSearchProductsPool } from "@/lib/products/hooks/useSearchProductsPool";
import {
  getAccessToken,
  getCustomerFromProfile,
  getUnit,
} from "@/lib/cart/api/guestOrder";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Строка сметы: цена, сумма, за деньги или за баллы
const buildRow = (item, articles = {}) => {
  const product = item.product || {};
  const price = toNumber(product.price ?? item.price);
  const quantity = toNumber(item.quantity);
  const isBonusOnly = !(price > 0);
  return {
    id: item.id,
    name: product.name || "-",
    article: product.article || item.article || articles[product.id] || "",
    unit: getUnit(product, item),
    quantity,
    isBonusOnly,
    price: isBonusOnly ? toNumber(product.bonus_price) : price,
    sum: isBonusOnly
      ? toNumber(product.bonus_price) * quantity
      : toNumber(item.total_price ?? price * quantity),
  };
};

// Реквизиты для сметы — при необходимости поменяйте здесь
const COMPANY = {
  phones: ["+996 (558) 000-222", "+996 (505) 406-805"],
  email: "baitech.kg@gmail.com",
  inn: "01807202310018",
  account: "1091612555130152",
};

// Сколько пустых строк в разделе «Услуги» (заполняются вручную)
const SERVICE_ROWS = 6;

export default function Cart() {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useCartSummary();
  const items = summary?.items ?? [];
  const { mutate: clearCart, isPending } = useClearCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Имя заказчика для сметы: у вошедшего — из профиля, гость вводит сам
  const [isAuth, setIsAuth] = useState(false);
  const [customerName, setCustomerName] = useState("");
  useEffect(() => {
    setIsAuth(!!getAccessToken());
  }, []);
  const { data: profile } = useMyProfile({ enabled: isAuth });
  useEffect(() => {
    if (!isAuth) return;
    const { name } = getCustomerFromProfile(profile);
    if (name) setCustomerName((prev) => prev || name);
  }, [isAuth, profile]);
  const isEmpty = items.length === 0;

  // Артикул теперь приходит в корзине. Список товаров поиска — запасной вариант
  // для старых ответов (данные из кэша шапки, лишних запросов нет).
  const { data: searchPool = [] } = useSearchProductsPool();
  const articles = useMemo(() => {
    const map = {};
    searchPool.forEach((p) => {
      if (p?.id != null && p.article) map[p.id] = p.article;
    });
    return map;
  }, [searchPool]);

  const handleToggle = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const allSelected = !isEmpty && selectedItems.length === items.length;

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? items.map((i) => i.id) : []);
  };

  const handleClear = () => {
    const ok = window.confirm(
      t("cart.clearConfirm", {
        defaultValue: "Удалить все товары из корзины?",
      }),
    );
    if (ok) {
      clearCart();
      setSelectedIds([]);
    }
  };

  const rows = items.map((item) => buildRow(item, articles));
  const moneyTotal = rows
    .filter((r) => !r.isBonusOnly)
    .reduce((s, r) => s + r.sum, 0);
  const bonusTotal = rows
    .filter((r) => r.isBonusOnly)
    .reduce((s, r) => s + r.sum, 0);
  // Итог берём с бэка, если он есть
  const grandTotal =
    summary?.total_price != null ? toNumber(summary.total_price) : moneyTotal;
  const totalQuantity =
    summary?.total_quantity ?? rows.reduce((s, r) => s + r.quantity, 0);

  const selectedRows = selectedItems.map((item) => buildRow(item, articles));
  const selectedMoney = selectedRows
    .filter((r) => !r.isBonusOnly)
    .reduce((s, r) => s + r.sum, 0);
  const selectedBonus = selectedRows
    .filter((r) => r.isBonusOnly)
    .reduce((s, r) => s + r.sum, 0);

  const currency = t("cartItem.currency");
  const ballLabel = t("ball");
  const today = new Date().toLocaleDateString("ru-RU");

  const breadcrumbs = [
    { label: t("aboutCompany.breadcrumbs.home"), path: "/" },
    { label: t("navbar.catalog"), path: "/catalog" },
    { label: t("cart.card") },
  ];

  // Печать сметы в фирменном виде БайТех (как в Excel-образце)
  const handlePrint = () => {
    const unit = t("checkoutModal.form.pcs");
    // Числа как в Excel-образце: без пробелов (5270, 21080)
    const fmt = (n) => String(Math.round(Number(n || 0) * 100) / 100);

    const tableRows = rows
      .map(
        (r, i) => `
        <tr>
          <td class="c">${i + 1}</td>
          <td>${escapeHtml(r.name)}</td>
          <td class="c">${escapeHtml(r.article || "—")}</td>
          <td class="c">${escapeHtml(r.unit || unit)}</td>
          <td class="c">${r.quantity}</td>
          <td class="c">${fmt(r.price)}${r.isBonusOnly ? ` ${escapeHtml(ballLabel)}` : ""}</td>
          <td class="c">${fmt(r.sum)}${r.isBonusOnly ? ` ${escapeHtml(ballLabel)}` : ""}</td>
        </tr>`,
      )
      .join("");

    // Раздел услуг — пустые строки, менеджер заполняет вручную
    const serviceRows = Array.from(
      { length: SERVICE_ROWS },
      (_, i) => `
        <tr>
          <td class="c">${i + 1}</td>
          <td>&nbsp;</td>
          <td></td>
          <td class="c">${escapeHtml(unit)}</td>
          <td></td><td></td><td></td>
        </tr>`,
    ).join("");

    const docTitle = t("cart.smeta.docTitle", {
      defaultValue: "Смета на поставку и установку оборудования",
    });
    const contactsHtml = `
      ${COMPANY.phones.map((p) => `${escapeHtml(t("cart.smeta.phone", { defaultValue: "Тел" }))}: ${escapeHtml(p)}`).join("<br/>")}<br/>
      E-mail: ${escapeHtml(COMPANY.email)}<br/>
      ${escapeHtml(t("cart.smeta.inn", { defaultValue: "ИНН" }))} ${escapeHtml(COMPANY.inn)}<br/>
      ${escapeHtml(t("cart.smeta.account", { defaultValue: "Р/с" }))}: ${escapeHtml(COMPANY.account)}`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>${escapeHtml(docTitle)} — БайТех</title>
      <style>
        /* margin: 0 — браузер не печатает свою строку с датой и адресом сверху */
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { font-family: Calibri, Carlito, Arial, sans-serif; color: #000; margin: 0; padding: 12mm 12mm; font-size: 14px; }
        .head { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-bottom: 6px; }
        .contacts { font-size: 13px; line-height: 1.4; color: #000; white-space: nowrap; }
        .contacts.left { justify-self: start; }
        .contacts.right { justify-self: end; }
        .logo { height: 88px; display: block; justify-self: center; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 4px 6px; vertical-align: middle; font-weight: normal; }
        .blue { background: #b4c6e7; }
        .title td { text-align: center; font-weight: bold; font-size: 18px; padding: 5px; }
        .cols th { font-weight: bold; text-align: left; font-size: 14px; }
        .cols th.c { text-align: center; }
        .scols th { font-weight: bold; text-align: center; font-family: 'Times New Roman', serif; font-size: 15px; }
        .c { text-align: center; }
        .sum td { font-weight: bold; text-align: right; font-family: 'Times New Roman', serif; font-size: 15px; }
        .sum td.v { text-align: center; font-size: 17px; }
        .note { margin-top: 8px; font-size: 13px; color: #444; }
        .sign { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-weight: bold; font-family: 'Times New Roman', serif; font-size: 16px; }
        .sign .line { display: inline-block; min-width: 200px; border-bottom: 1px solid #000; margin-left: 6px; font-weight: normal; }
        th { white-space: nowrap; }
        col.n { width: 8%; } col.a { width: 11%; } col.u { width: 8%; } col.q { width: 8%; } col.p { width: 10%; } col.s { width: 10%; }
      </style></head><body>
      <div class="head">
        <div class="contacts left">${contactsHtml}</div>
        <img class="logo" src="${SMETA_LOGO}" alt="БайТех" />
        <div class="contacts right">${contactsHtml}</div>
      </div>
      <table>
        <colgroup><col class="n"/><col/><col class="a"/><col class="u"/><col class="q"/><col class="p"/><col class="s"/></colgroup>
        <tr class="title blue"><td colspan="7">${escapeHtml(docTitle)}</td></tr>
        <tr class="cols blue">
          <th>${escapeHtml(t("cart.smeta.number", { defaultValue: "№ П/П" }))}</th>
          <th>${escapeHtml(t("cart.smeta.equipment", { defaultValue: "Наименование оборудования" }))}</th>
          <th class="c">${escapeHtml(t("cartItem.article"))}</th>
          <th>${escapeHtml(t("cart.smeta.unit", { defaultValue: "Ед.изм" }))}</th>
          <th class="c">${escapeHtml(t("cart.smeta.quantity", { defaultValue: "Кол-во" }))}</th>
          <th class="c">${escapeHtml(t("cart.smeta.price", { defaultValue: "Цена" }))}</th>
          <th class="c">${escapeHtml(t("cart.smeta.sum", { defaultValue: "Сумма" }))}</th>
        </tr>
        ${tableRows}
        <tr class="sum"><td colspan="6">${escapeHtml(t("cart.smeta.materialsTotal", { defaultValue: "Итого стоимость материалов" }))}:</td><td class="v">${fmt(moneyTotal)}</td></tr>
        <tr class="scols blue">
          <th>${escapeHtml(t("cart.smeta.number", { defaultValue: "№ П/П" }))}</th>
          <th>${escapeHtml(t("cart.smeta.service", { defaultValue: "Наименование услуги" }))}</th>
          <th></th>
          <th>${escapeHtml(t("cart.smeta.unit", { defaultValue: "Ед.изм" }))}</th>
          <th>${escapeHtml(t("cart.smeta.quantity", { defaultValue: "Кол-во" }))}</th>
          <th>${escapeHtml(t("cart.smeta.price", { defaultValue: "Цена" }))}</th>
          <th>${escapeHtml(t("cart.smeta.sum", { defaultValue: "Сумма" }))}</th>
        </tr>
        ${serviceRows}
        <tr class="sum"><td></td><td colspan="5">${escapeHtml(t("cart.smeta.servicesTotal", { defaultValue: "Итого стоимость услуг" }))}:</td><td class="v"></td></tr>
        <tr class="sum"><td colspan="6">${escapeHtml(t("cart.smeta.grandTotal", { defaultValue: "Итого стоимость по смете" }))}:</td><td class="v">${fmt(grandTotal)}</td></tr>
      </table>
      ${bonusTotal > 0 ? `<div class="note">${escapeHtml(t("cart.smeta.bonusTotal", { defaultValue: "За баллы" }))}: ${fmt(bonusTotal)} ${escapeHtml(ballLabel)}</div>` : ""}
      <div class="sign">
        <span>${escapeHtml(t("cart.smeta.customer", { defaultValue: "Заказчик" }))}:${
          customerName.trim()
            ? ` ${escapeHtml(customerName.trim())}`
            : '<span class="line">&nbsp;</span>'
        }</span>
        <span>${escapeHtml(t("cart.smeta.date", { defaultValue: "Дата" }))}: ${escapeHtml(today)} г.</span>
      </div>
      </body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    };

    // Ждём, пока загрузится логотип, иначе он не попадёт в PDF
    const logo = doc.querySelector("img");
    if (logo && !logo.complete) {
      logo.onload = doPrint;
      logo.onerror = doPrint;
      setTimeout(doPrint, 2000);
    } else {
      setTimeout(doPrint, 250);
    }
  };

  if (isLoading) return <div className="loader"></div>;

  return (
    <div className={`${styles.cartWrapper} container`}>
      <PageBreadcrumbs items={breadcrumbs} />

      <div className={styles.pageHead}>
        <h1 className={styles.title}>
          {t("cart.card")}
          <span className={styles.countBadge}>{items.length}</span>
        </h1>
        {!isEmpty && (
          <p className={styles.subtitle}>
            {t("cart.subtitle", {
              defaultValue:
                "Отметьте нужные товары галочкой и нажмите «Оформить заказ». Регистрация не нужна.",
            })}
          </p>
        )}
      </div>

      {isEmpty ? (
        <div className={styles.emptyCart}>
          <div className={styles.emptyIcon}>
            <ShoppingCart size={48} strokeWidth={1.5} />
          </div>
          <h3>{t("cart.empty.title")}</h3>
          <p>{t("cart.empty.description")}</p>

          <div className={styles.emptyActions}>
            <Link href="/catalog" className={styles.btnPrimary}>
              {t("cart.empty.goToCatalog")}
              <ArrowRight size={16} />
            </Link>
            <Link href="/find-order" className={styles.btnOutline}>
              <Search size={16} />
              {t("cart.findOrder", { defaultValue: "Найти мой заказ" })}
            </Link>
          </div>

          <div className={styles.steps}>
            <div className={styles.step} style={{ animationDelay: "150ms" }}>
              <span className={styles.stepIcon}>
                <ShoppingCart size={20} />
              </span>
              <b>
                1.{" "}
                {t("cart.steps.addTitle", { defaultValue: "Добавьте товары" })}
              </b>
              <span>
                {t("cart.steps.addText", {
                  defaultValue: "Нажмите на значок корзины в карточке товара",
                })}
              </span>
            </div>
            <div className={styles.step} style={{ animationDelay: "250ms" }}>
              <span className={styles.stepIcon}>
                <ClipboardCheck size={20} />
              </span>
              <b>
                2.{" "}
                {t("cart.steps.orderTitle", { defaultValue: "Оформите заказ" })}
              </b>
              <span>
                {t("cart.steps.orderText", {
                  defaultValue: "Без регистрации — только имя и телефон",
                })}
              </span>
            </div>
            <div className={styles.step} style={{ animationDelay: "350ms" }}>
              <span className={styles.stepIcon}>
                <Receipt size={20} />
              </span>
              <b>
                3.{" "}
                {t("cart.steps.receiptTitle", {
                  defaultValue: "Получите квитанцию",
                })}
              </b>
              <span>
                {t("cart.steps.receiptText", {
                  defaultValue: "По номеру заказа вы заберёте покупку",
                })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.cartContent}>
            <div className={styles.itemsCol}>
              <div className={styles.toolbar}>
                <label className={styles.selectAll}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  {t("cart.selectAll", { defaultValue: "Выбрать все" })} (
                  {items.length})
                </label>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={handleClear}
                  disabled={isPending}
                >
                  <Trash2 size={16} />
                  {t("cart.clearAll")}
                </button>
              </div>

              <div className={styles.itemsList}>
                {items.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    index={index}
                    checked={selectedIds.includes(item.id)}
                    onToggle={(checked) => handleToggle(item.id, checked)}
                  />
                ))}
              </div>
            </div>

            <aside className={styles.summary}>
              {/* Инфо: заголовок + сколько в корзине / выбрано */}
              <div className={styles.summaryInfo}>
                <h3 className={styles.summaryTitle}>
                  {t("cart.summary.title", { defaultValue: "Ваш заказ" })}
                </h3>
                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>
                      {t("cart.summary.inCart", { defaultValue: "В корзине" })}
                    </span>
                    <span>
                      {totalQuantity} {t("checkoutModal.form.pcs")}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>
                      {t("cart.summary.selected", {
                        defaultValue: "Выбрано к оформлению",
                      })}
                    </span>
                    <span>{selectedItems.length}</span>
                  </div>
                </div>
              </div>

              {/* Сумма */}
              <div className={styles.summaryTotal}>
                <span>
                  {t("cart.summary.toPay", { defaultValue: "К оплате" })}
                </span>
                <strong key={selectedMoney}>
                  {selectedMoney.toLocaleString("ru-RU")} {currency}
                </strong>
                {selectedBonus > 0 && (
                  <small>
                    + {selectedBonus.toLocaleString("ru-RU")} {ballLabel}
                  </small>
                )}
              </div>

              {/* Кнопка + подсказка */}
              <div className={styles.summaryAction}>
                <button
                  className={`${styles.btnPrimary} ${styles.btnBlock}`}
                  onClick={() => setShowCheckout(true)}
                  disabled={selectedItems.length === 0}
                >
                  {t("cart.checkout")}{" "}
                  {selectedItems.length > 0 ? `(${selectedItems.length})` : ""}
                </button>
                {selectedItems.length === 0 && (
                  <p className={styles.summaryHint}>
                    {t("cart.summary.selectHint", {
                      defaultValue:
                        "Отметьте галочкой товары, которые хотите заказать",
                    })}
                  </p>
                )}
              </div>

              {/* Дополнительно */}
              <div className={styles.summaryExtra}>
                <div className={styles.guestNote}>
                  <ShieldCheck size={18} />
                  <span>
                    {t("cart.summary.guestNote", {
                      defaultValue:
                        "Можно оформить без регистрации. После заказа вы получите номер и квитанцию.",
                    })}
                  </span>
                </div>
                <Link href="/find-order" className={styles.findOrderLink}>
                  <Search size={14} />
                  {t("cart.findOrder", { defaultValue: "Найти мой заказ" })}
                </Link>
              </div>
            </aside>
          </div>

          {/* СМЕТА */}
          <section className={styles.smeta}>
            <div className={styles.smetaHeader}>
              <div>
                <h3 className={styles.smetaTitle}>
                  {t("cart.smeta.docTitle", {
                    defaultValue: "Смета на поставку и установку оборудования",
                  })}
                </h3>
                <p className={styles.smetaSubtitle}>
                  {t("cart.smeta.subtitle", {
                    defaultValue:
                      "Все товары из корзины — можно распечатать или сохранить в PDF",
                  })}
                </p>
              </div>
              <div className={styles.smetaActions}>
                <label className={styles.customerField}>
                  <span>
                    {t("cart.smeta.customer", { defaultValue: "Заказчик" })}
                  </span>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t("cart.smeta.customerPlaceholder", {
                      defaultValue: "ФИО или название организации",
                    })}
                  />
                </label>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={handlePrint}
                >
                  <Printer size={16} />
                  {t("cart.smeta.print", {
                    defaultValue: "Распечатать / Сохранить PDF",
                  })}
                </button>
              </div>
            </div>

            <div className={styles.smetaTableWrap}>
              <table className={styles.smetaTable}>
                <thead>
                  <tr>
                    <th className={styles.center}>
                      {t("cart.smeta.number", { defaultValue: "№ П/П" })}
                    </th>
                    <th>
                      {t("cart.smeta.equipment", {
                        defaultValue: "Наименование оборудования",
                      })}
                    </th>
                    <th className={styles.center}>{t("cartItem.article")}</th>
                    <th className={styles.center}>
                      {t("cart.smeta.unit", { defaultValue: "Ед.изм" })}
                    </th>
                    <th className={styles.center}>
                      {t("cart.smeta.quantity", { defaultValue: "Кол-во" })}
                    </th>
                    <th className={styles.right}>
                      {t("cart.smeta.price", { defaultValue: "Цена" })}
                    </th>
                    <th className={styles.right}>
                      {t("cart.smeta.sum", { defaultValue: "Сумма" })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id ?? i}>
                      <td className={`${styles.center} ${styles.cellNum}`}>
                        {i + 1}
                      </td>
                      <td className={styles.cellName}>{r.name}</td>
                      <td
                        className={styles.center}
                        data-label={t("cartItem.article")}
                      >
                        {r.article || "—"}
                      </td>
                      <td
                        className={styles.center}
                        data-label={t("cart.smeta.unit", {
                          defaultValue: "Ед.изм",
                        })}
                      >
                        {r.unit || t("checkoutModal.form.pcs")}
                      </td>
                      <td
                        className={styles.center}
                        data-label={t("cart.smeta.quantity", {
                          defaultValue: "Кол-во",
                        })}
                      >
                        {r.quantity}
                      </td>
                      <td
                        className={styles.right}
                        data-label={t("cart.smeta.price", {
                          defaultValue: "Цена",
                        })}
                      >
                        {r.price.toLocaleString("ru-RU")}{" "}
                        {r.isBonusOnly ? ballLabel : currency}
                      </td>
                      <td
                        className={`${styles.right} ${styles.cellSum}`}
                        data-label={t("cart.smeta.sum", {
                          defaultValue: "Сумма",
                        })}
                      >
                        {r.sum.toLocaleString("ru-RU")}{" "}
                        {r.isBonusOnly ? ballLabel : currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.smetaFooter}>
              <span>
                {t("cart.smeta.totalQuantity", {
                  defaultValue: "Всего товаров",
                })}
                : {totalQuantity}
              </span>
              <span className={styles.smetaTotal}>
                {t("cart.smeta.grandTotal", {
                  defaultValue: "Итого стоимость по смете",
                })}
                : {grandTotal.toLocaleString("ru-RU")} {currency}
              </span>
              {bonusTotal > 0 && (
                <span className={styles.smetaBonus}>
                  {t("cart.smeta.bonusTotal", { defaultValue: "За баллы" })}:{" "}
                  {bonusTotal.toLocaleString("ru-RU")} {ballLabel}
                </span>
              )}
            </div>
          </section>
        </>
      )}

      {showCheckout && (
        <CheckoutModal
          items={selectedItems}
          allItems={items}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
