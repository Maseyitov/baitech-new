"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useProducts } from "@/lib/products/hooks/hooks";
import { productApi } from "@/lib/products/api/useProducts";
import { Camera } from "lucide-react";
import "./EditProduct.scss";

// Столько же уровней, сколько в AddProduct
const MAX_CATEGORY_LEVELS = 5;

const getLevelTitle = (levelIndex) =>
  levelIndex === 0 ? "Категория" : "Подкатегория";

const EditProduct = () => {
  const params = useParams();
  const id = params.id;
  const router = useRouter();

  const { categories, brands, updateProduct, isInitialLoading, isPending } =
    useProducts();

  // ← Загружаем товар напрямую по id
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });

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
    is_available: true,
  });

  // imageFiles[i] — новый выбранный File (или null, если оставили старое фото)
  // previews[i] — что показывать: либо старый URL с сервера, либо objectURL нового файла
  // removedExisting[i] — true, если пользователь явно удалил существующее фото
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [previews, setPreviews] = useState([null, null, null, null]);
  const [removedExisting, setRemovedExisting] = useState([
    false,
    false,
    false,
    false,
  ]);

  // Чтобы форма заполнялась один раз и не затирала правки,
  // если категории перезапросятся (например, при возврате на вкладку)
  const isFormInitialized = useRef(false);

  // ===== Категории =====

  // Корневые категории (уровень 1)
  const rootCategories = useMemo(
    () =>
      (categories || []).filter(
        (item) => item.parent === null || item.parent === undefined,
      ),
    [categories],
  );

  // Рекурсивно ищем путь от корня до нужной категории: [уровень1, уровень2, ...]
  const findCategoryPath = (nodes, targetId, path = []) => {
    for (const node of nodes || []) {
      const newPath = [...path, node];
      if (String(node.id) === String(targetId)) return newPath;
      if (node.subcategories?.length) {
        const found = findCategoryPath(node.subcategories, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  // ===== Заполняем форму при загрузке товара =====
  useEffect(() => {
    if (!product || isInitialLoading || isFormInitialized.current) return;

    const categoryId = product.category || "";
    const path =
      categoryId && rootCategories.length
        ? findCategoryPath(rootCategories, categoryId)
        : null;

    setFormData({
      name: product.name || "",
      article: product.article || "",
      price: product.price || "",
      categoryPath: (path || [])
        .slice(0, MAX_CATEGORY_LEVELS)
        .map((node) => String(node.id)),
      brand: product.brand ? String(product.brand) : "",
      bonus: product.bonus || "",
      bonusCost: product.bonus_price ? String(product.bonus_price) : "",
      discount: product.discount || "",
      description: product.description || "",
      characteristics: product.characteristics || "",
      is_available: product.is_available ?? true,
    });

    if (product.existing_images && product.existing_images.length > 0) {
      const loadedPreviews = [null, null, null, null];
      product.existing_images.forEach((img, idx) => {
        if (idx < 4) loadedPreviews[idx] = img.image;
      });
      setPreviews(loadedPreviews);
    }

    isFormInitialized.current = true;
  }, [product, rootCategories, isInitialLoading]);

  // Для каждого уровня: какие варианты показать, что выбрано, выбран ли родитель
  const categoryLevels = useMemo(() => {
    const levels = [];
    let options = rootCategories;

    for (let i = 0; i < MAX_CATEGORY_LEVELS; i++) {
      const selectedId = formData.categoryPath[i] || "";
      const isParentSelected = i === 0 || Boolean(formData.categoryPath[i - 1]);

      levels.push({
        index: i,
        options: isParentSelected ? options : [],
        selectedId,
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

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

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newFiles = [...imageFiles];
    newFiles[index] = file;
    setImageFiles(newFiles);

    const newPreviews = [...previews];
    newPreviews[index] = URL.createObjectURL(file);
    setPreviews(newPreviews);

    const newRemoved = [...removedExisting];
    newRemoved[index] = false;
    setRemovedExisting(newRemoved);
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    newFiles[index] = null;
    setImageFiles(newFiles);

    const newPreviews = [...previews];
    newPreviews[index] = null;
    setPreviews(newPreviews);

    const newRemoved = [...removedExisting];
    newRemoved[index] = true;
    setRemovedExisting(newRemoved);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    payload.append("is_available", String(formData.is_available));

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

    imageFiles.forEach((file) => {
      if (file) payload.append("images", file);
    });

    // сообщаем бэкенду, какие существующие фото нужно удалить
    removedExisting.forEach((removed, idx) => {
      if (removed && product?.existing_images?.[idx]) {
        payload.append("remove_images", product.existing_images[idx].id);
      }
    });

    try {
      await updateProduct({ id, payload });
      router.push("/productss");
    } catch (err) {
      console.error("Ошибка при обновлении:", err);
      alert("Ошибка при сохранении данных.");
    }
  };

  if (isInitialLoading || isProductLoading) return <div className="loader" />;

  return (
    <div className="edit-product-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
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
        <h2>Редактирование товара</h2>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="image-upload-section">
          <div className="thumbnail-grid">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="thumbnail-slot">
                {previews[idx] ? (
                  <div className="uploaded-image">
                    <img src={previews[idx]} alt="Превью" />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeImage(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label htmlFor={`thumb-${idx}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, idx)}
                      id={`thumb-${idx}`}
                      hidden
                    />
                    <span className="upload-placeholder">
                      <Camera size={24} />
                    </span>
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="main-image-slot">
            {previews[3] ? (
              <div className="uploaded-image">
                <img src={previews[3]} alt="Главное фото" />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeImage(3)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label htmlFor="main-image">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 3)}
                  id="main-image"
                  hidden
                />
                <div className="upload-placeholder-main">
                  <Camera size={32} />
                  <p>Загрузить главное фото</p>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Название</label>
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-row">
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
        </div>

        {/* ===== Уровни категорий (генерируются автоматически) ===== */}
        <div className="category-levels">
          {categoryLevels.map((level) => {
            const i = level.index;

            let placeholder;
            if (!level.isParentSelected) {
              placeholder = `Сначала выберите уровень ${i}`;
            } else if (level.options.length === 0) {
              placeholder = "Нет подкатегорий";
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
                <select
                  value={level.selectedId}
                  onChange={(e) => handleCategoryChange(i, e.target.value)}
                  disabled={
                    !level.isParentSelected || level.options.length === 0
                  }
                >
                  <option value="">{placeholder}</option>
                  {level.options.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Бренд</label>
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
        </div>

        <div className="form-row">
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

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => router.back()}
          >
            Отмена
          </button>
          <button type="submit" className="submit-btn" disabled={isPending}>
            {isPending ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
