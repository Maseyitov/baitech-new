"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/lib/products/hooks/hooks";
import { Plus, Trash2, X, Camera } from "lucide-react";
import "./AddProduct.scss";

// Сколько уровней категорий показываем в форме.
// Если бэк добавит ещё — просто поменяй число.
const MAX_CATEGORY_LEVELS = 5;

// Подписи: 1-й уровень — "Категория", остальные — "Подкатегория" + номер уровня
const getLevelTitle = (levelIndex) =>
  levelIndex === 0 ? "Категория" : "Подкатегория";

const AddProduct = () => {
  const router = useRouter();
  const {
    categories,
    brands,
    isInitialLoading,
    addProduct,
    addCategory,
    addBrand,
    deleteCategory,
    deleteBrand,
  } = useProducts();

  const [formData, setFormData] = useState({
    name: "",
    article: "",
    price: "",
    // Путь выбранных категорий: [id уровня 1, id уровня 2, ... id уровня 5]
    categoryPath: [],
    brand: "",
    bonus: "",
    bonusCost: "", // стоимость товара в бонусных баллах — используется, если цена не указана
    discount: "",
    description: "",
    characteristics: "",
    images: [null, null, null, null],
  });

  const [modalType, setModalType] = useState(null);
  // level — индекс уровня (0 = категория, 1 = подкатегория уровня 2, ...)
  const [modalData, setModalData] = useState({
    name: "",
    parent: "",
    level: 0,
  });
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "bonus") {
      const num = Number(value);
      if (num > 9999 || num < 0) return;
      setFormData((prev) => ({ ...prev, bonus: value }));
      return;
    }

    if (name === "bonusCost") {
      const num = Number(value);
      if (num < 0) return;
      setFormData((prev) => ({ ...prev, bonusCost: value }));
      return;
    }

    if (name === "discount") {
      const num = Number(value);
      if (num > 100 || num < 0) return;
      setFormData((prev) => ({ ...prev, discount: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newImages = [...formData.images];
    newImages[index] = file;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages[index] = null;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  // ===== Категории =====

  // Корневые категории (уровень 1)
  const rootCategories = useMemo(
    () =>
      (categories || []).filter(
        (item) => item.parent === null || item.parent === undefined,
      ),
    [categories],
  );

  // Плоский список всего дерева с глубиной — нужен для модалок
  const flattenCategories = (items, depth = 0) => {
    let flat = [];
    items?.forEach((item) => {
      flat.push({ ...item, depth });
      if (item.subcategories?.length) {
        flat = flat.concat(flattenCategories(item.subcategories, depth + 1));
      }
    });
    return flat;
  };

  const flatCategories = useMemo(
    () => flattenCategories(rootCategories),
    [rootCategories],
  );

  const findCategoryName = (id) =>
    flatCategories.find((item) => String(item.id) === String(id))?.name || "";

  // Для каждого уровня считаем: какие варианты показать, что выбрано, кто родитель
  const categoryLevels = useMemo(() => {
    const levels = [];
    let options = rootCategories;

    for (let i = 0; i < MAX_CATEGORY_LEVELS; i++) {
      const selectedId = formData.categoryPath[i] || "";
      const parentId = i === 0 ? null : formData.categoryPath[i - 1] || "";
      const isParentSelected = i === 0 || Boolean(parentId);

      levels.push({
        index: i,
        options: isParentSelected ? options : [],
        selectedId,
        parentId,
        isParentSelected,
      });

      const selected = options.find(
        (item) => String(item.id) === String(selectedId),
      );
      options = selected?.subcategories || [];
    }

    return levels;
  }, [rootCategories, formData.categoryPath]);

  // Выбор на уровне N — всё, что глубже, сбрасывается
  const handleCategoryChange = (levelIndex, value) => {
    setFormData((prev) => {
      const newPath = prev.categoryPath.slice(0, levelIndex);
      if (value) newPath.push(value);
      return { ...prev, categoryPath: newPath };
    });
  };

  // Список для модалки "Управление" на конкретном уровне:
  // если родитель выбран — только его дети, иначе все категории этой глубины
  const getManageList = (levelIndex) => {
    if (levelIndex === 0) return rootCategories;
    const level = categoryLevels[levelIndex];
    if (level?.parentId) return level.options;
    return flatCategories.filter((item) => item.depth === levelIndex);
  };

  const closeModal = () => {
    setModalType(null);
    setModalData({ name: "", parent: "", level: 0 });
  };

  const handleAddQuickInfo = async () => {
    if (!modalData.name.trim()) {
      alert("Название обязательно");
      return;
    }

    setIsSubmittingModal(true);
    try {
      if (modalType === "category") {
        await addCategory({
          name: modalData.name,
          parent: modalData.parent ? Number(modalData.parent) : null,
        });
      } else if (modalType === "brand") {
        await addBrand({
          name: modalData.name,
        });
      }

      closeModal();
    } catch (error) {
      const serverMessage = error?.response?.data;
      console.error("Ошибка при создании:", serverMessage || error);
      alert(
        "Не удалось создать: " +
          (serverMessage
            ? typeof serverMessage === "object"
              ? JSON.stringify(serverMessage, null, 2)
              : serverMessage
            : error.message),
      );
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const isCategory = modalType === "manage-category";
    const itemType = isCategory ? "категорию" : "бренд";
    if (
      !window.confirm(
        `Вы уверены, что хотите удалить ${itemType} "${item.name}"?`,
      )
    ) {
      return;
    }

    try {
      if (isCategory) {
        await deleteCategory(item.id);
        // Если удалили выбранную категорию — обрезаем путь до неё
        setFormData((prev) => {
          const idx = prev.categoryPath.findIndex(
            (id) => String(id) === String(item.id),
          );
          if (idx === -1) return prev;
          return { ...prev, categoryPath: prev.categoryPath.slice(0, idx) };
        });
      } else {
        await deleteBrand(item.id);
        if (String(formData.brand) === String(item.id)) {
          setFormData((prev) => ({ ...prev, brand: "" }));
        }
      }
      closeModal();
    } catch (err) {
      console.error("Ошибка удаления", err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmittingProduct(true);

    // Отправляем самую глубокую выбранную категорию
    const finalCategory =
      [...formData.categoryPath].reverse().find(Boolean) || "";

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("article", formData.article);
    payload.append("category", finalCategory);
    payload.append("brand", formData.brand);
    payload.append("discount", formData.discount || "0");
    payload.append("description", formData.description);
    payload.append("characteristics", formData.characteristics);
    payload.append("is_available", "true");

    const isBonusOnly = !(Number(formData.price) > 0);

    if (isBonusOnly) {
      // Товар доступен только за бонусные баллы — цены нет, есть только стоимость в баллах
      payload.append("price", "0");
      payload.append("bonus_price", formData.bonusCost);
      payload.append("bonus", "0");
    } else {
      payload.append("price", formData.price);
      payload.append("bonus", formData.bonus);
    }

    formData.images.forEach((file) => {
      if (file) payload.append("images", file);
    });

    try {
      await addProduct(payload);
      router.push("/productss");
    } catch (err) {
      console.error("Ошибка публикации:", err);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  if (isInitialLoading) return <div className="loader" />;

  // ===== Рендер модалки =====
  const renderModal = () => {
    if (!modalType) return null;

    const isManage =
      modalType === "manage-category" || modalType === "manage-brand";
    const level = modalData.level;
    const levelLabel = level === 0 ? "" : ` (уровень ${level + 1})`;

    if (isManage) {
      const list =
        modalType === "manage-brand" ? brands || [] : getManageList(level);
      const parentName =
        modalType === "manage-category" && level > 0
          ? findCategoryName(formData.categoryPath[level - 1])
          : "";

      return (
        <>
          <h3>
            {modalType === "manage-brand"
              ? "Управление брендами"
              : level === 0
                ? "Управление категориями"
                : `Управление подкатегориями${levelLabel}`}
          </h3>
          {parentName && (
            <p className="modal-subtitle">Внутри «{parentName}»</p>
          )}
          <div className="management-list">
            {list.length === 0 && (
              <p className="empty-list">Здесь пока ничего нет</p>
            )}
            {list.map((item) => (
              <div key={item.id} className="management-item">
                <span>{item.name}</span>
                <button
                  className="delete-item-btn"
                  onClick={() => handleDeleteItem(item)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={closeModal}>
              Закрыть
            </button>
          </div>
        </>
      );
    }

    const parentName =
      modalType === "category" && modalData.parent
        ? findCategoryName(modalData.parent)
        : "";

    return (
      <>
        <h3>
          {modalType === "brand"
            ? "Добавить бренд"
            : level === 0
              ? "Добавить категорию"
              : `Добавить подкатегорию${levelLabel}`}
        </h3>
        {parentName && <p className="modal-subtitle">В «{parentName}»</p>}
        <div className="modal-fields">
          <div className="modal-group">
            <label>Название *</label>
            <input
              type="text"
              value={modalData.name}
              onChange={(e) =>
                setModalData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Введите название..."
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={closeModal}>
            Отмена
          </button>
          <button
            className="confirm-btn"
            onClick={handleAddQuickInfo}
            disabled={isSubmittingModal}
          >
            {isSubmittingModal ? "..." : "Добавить"}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="add-product-page">
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={closeModal}>
              <X size={20} />
            </button>
            {renderModal()}
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="header-left">
          <button
            className="back-btn-new"
            onClick={() => router.back()}
            aria-label="Назад"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="header-titles">
            <h2>Добавление товара</h2>
            <p>Заполните информацию о новом продукте</p>
          </div>
        </div>
      </div>

      <div className="form-container">
        <div className="image-upload-section">
          <div className="thumbnail-grid">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="thumbnail-slot">
                {formData.images[idx] ? (
                  <div className="preview-container">
                    <img
                      src={URL.createObjectURL(formData.images[idx])}
                      alt="Превью"
                    />
                    <button
                      type="button"
                      className="remove-btn-top"
                      onClick={() => removeImage(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, idx)}
                      id={`thumb-${idx}`}
                      hidden
                    />
                    <label
                      htmlFor={`thumb-${idx}`}
                      className="upload-placeholder"
                    >
                      <Camera size={24} />
                    </label>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="main-image-slot">
            {formData.images[3] ? (
              <div className="preview-container main">
                <img
                  src={URL.createObjectURL(formData.images[3])}
                  alt="Главное"
                />
                <button
                  type="button"
                  className="remove-btn-top"
                  onClick={() => removeImage(3)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 3)}
                  id="main-image"
                  hidden
                />
                <label htmlFor="main-image" className="upload-placeholder-main">
                  <Camera size={32} />
                  <span>Загрузить главное фото</span>
                </label>
              </>
            )}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Название</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Артикул</label>
            <input
              name="article"
              type="text"
              value={formData.article}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Цена (сом)</label>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
            />
            <small className="field-hint">
              Оставьте пустым, если товар продаётся только за бонусные баллы
            </small>
          </div>

          {/* ===== Уровни категорий (генерируются автоматически) ===== */}
          {categoryLevels.map((level) => {
            const i = level.index;
            const isSelectDisabled =
              !level.isParentSelected || level.options.length === 0;

            let placeholder;
            if (!level.isParentSelected) {
              placeholder = `Сначала выберите уровень ${i}`;
            } else if (level.options.length === 0) {
              placeholder = "Нет подкатегорий — добавьте через +";
            } else {
              placeholder =
                i === 0 ? "Выберите категорию" : "Выберите подкатегорию";
            }

            return (
              <div className="form-group" key={`category-level-${i}`}>
                <label>
                  {getLevelTitle(i)}
                  <span className="level-badge">уровень {i + 1}</span>
                </label>
                <div className="select-wrapper">
                  <select
                    value={level.selectedId}
                    onChange={(e) => handleCategoryChange(i, e.target.value)}
                    disabled={isSelectDisabled}
                  >
                    <option value="">{placeholder}</option>
                    {level.options.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="add-small-btn"
                    disabled={!level.isParentSelected}
                    title={
                      level.isParentSelected
                        ? "Добавить"
                        : `Сначала выберите уровень ${i}`
                    }
                    onClick={() => {
                      setModalType("category");
                      setModalData({
                        name: "",
                        parent: i === 0 ? "" : level.parentId,
                        level: i,
                      });
                    }}
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    type="button"
                    className="delete-small-btn"
                    onClick={() => {
                      setModalType("manage-category");
                      setModalData({ name: "", parent: "", level: i });
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="form-group">
            <label>Бренд</label>
            <div className="select-wrapper">
              <select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
              >
                <option value="">Выберите бренд</option>
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="add-small-btn"
                onClick={() => {
                  setModalType("brand");
                  setModalData({ name: "", parent: "", level: 0 });
                }}
              >
                <Plus size={20} />
              </button>
              <button
                type="button"
                className="delete-small-btn"
                onClick={() => setModalType("manage-brand")}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="form-group">
            {Number(formData.price) > 0 ? (
              <>
                <label>Бонусные баллы (%)</label>
                <input
                  name="bonus"
                  type="number"
                  value={formData.bonus}
                  onChange={handleInputChange}
                />
              </>
            ) : (
              <>
                <label>Стоимость в бонусных баллах</label>
                <input
                  name="bonusCost"
                  type="number"
                  value={formData.bonusCost}
                  onChange={handleInputChange}
                />
                <small className="field-hint">
                  Сколько баллов нужно накопить, чтобы получить этот товар
                </small>
              </>
            )}
          </div>

          <div className="form-group">
            <label>Скидка (%)</label>
            <input
              name="discount"
              type="number"
              value={formData.discount}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="full-width-fields">
          <div className="form-group">
            <label>Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Характеристики</label>
            <textarea
              name="characteristics"
              value={formData.characteristics}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => router.back()}
          >
            Отмена
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={handleSubmit}
            disabled={isSubmittingProduct}
          >
            {isSubmittingProduct ? "Публикация..." : "Опубликовать"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
