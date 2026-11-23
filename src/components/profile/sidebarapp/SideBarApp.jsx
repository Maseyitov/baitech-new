"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Key,
  BookOpen,
  Package,
  RotateCcw,
  CreditCard,
  Gift,
  LogOut,
  X,
} from "lucide-react";
import ChangePassword from "../changepassword/ChangePassword";
import OrderHistory from "../historyorders/HistoryOrders";
import img from "../../../../assets/svg/Vector (49).svg";
import Image from "next/image";
import TransactionHistory from "../transitionhistory/TransitionHistory";
import { Returns } from "../return/Returns";
import AddressBook from "../adressbook/AdressBook";
import { useMyProfile, usePatchProfile } from "@/lib/auth/hooks/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "./style.scss";
import { getAccessToken } from "@/lib/cart/api/guestOrder";

export default function SidebarApp() {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = () => {
      // Общая проверка входа (как в API/api.jsx): учитывает и adminToken
      const token = getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    };

    checkAuth();
    const handleAuthChange = () => checkAuth();
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  const { data: profile, isLoading: profileLoading } = useMyProfile({
    enabled: isAuthenticated,
  });
  const bonusBalance = Number(profile?.bonus_balance ?? 0);
  const bonusUpdatedAt =
    profile?.bonus_updated_at || profile?.updated_at || null;

  const patchMutation = usePatchProfile();

  const [profileForm, setProfileForm] = useState({
    name: "",
    surname: "",
    email: "",
    number: "",
  });

  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        surname: profile.surname || "",
        email: profile.email || "",
        number: profile.number || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActivePage(tab);
  }, [searchParams]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await patchMutation.mutateAsync(profileForm);
      toast.success(t("profile.messages.profileUpdated"));
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      toast.error(t("profile.messages.profileUpdateError"));
    }
  };

  const handleLogout = () => {
    queryClient.clear();
    localStorage.removeItem("access_token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("accesToken");
    localStorage.removeItem("acces_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    setProfileForm({ name: "", surname: "", email: "", number: "" });
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("authChange"));
    toast.success(t("profile.messages.loggedOut"));
    router.push("/");
  };

  const handleGoToLogin = () => router.push("/login");

  const menuItems = [
    { id: "profile", label: t("profile.menu.myInfo"), icon: User },
    { id: "password", label: t("profile.menu.changePassword"), icon: Key },
    { id: "address", label: t("profile.menu.addressBook"), icon: BookOpen },
    { id: "orders", label: t("profile.menu.orderHistory"), icon: Package },
    { id: "returns", label: t("profile.menu.returns"), icon: RotateCcw },
    {
      id: "transactions",
      label: t("profile.menu.transactions"),
      icon: CreditCard,
    },
    { id: "bonuses", label: t("profile.menu.bonuses"), icon: Gift },
  ];

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("profile.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h2 className="text-[20px] font-bold text-gray-800 mb-2">
              {t("profile.notRegistered.title")}
            </h2>
            <p className="text-[#00162ACC] mb-6 text-[16px]">
              {t("profile.notRegistered.description")}
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full px-6 py-3 bg-[#0E2E5B] text-white rounded-lg hover:bg-[#092144] cursor-pointer transition-colors font-medium"
            >
              {t("profile.notRegistered.loginButton")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderPageContent = () => {
    switch (activePage) {
      case "profile":
        return (
          <div className="fsds">
            <h1 className="text-[30px] font-bold mb-6">
              {t("profile.myInfo.title")}
            </h1>
            {profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  {t("profile.myInfo.loadingProfile")}
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleProfileUpdate}
                className="space-y-4 max-w-md flex flex-col gap-[15px]"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("profile.myInfo.fields.name")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder={t("profile.myInfo.placeholders.name")}
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    disabled={patchMutation.isPending}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("profile.myInfo.fields.surname")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder={t("profile.myInfo.placeholders.surname")}
                    value={profileForm.surname}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        surname: e.target.value,
                      })
                    }
                    disabled={patchMutation.isPending}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("profile.myInfo.fields.email")}
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    placeholder="email@example.com"
                    value={profileForm.email}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("profile.myInfo.emailNote")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("profile.myInfo.fields.phone")}
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="+996 XXX XXX XXX"
                    value={profileForm.number}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, number: e.target.value })
                    }
                    disabled={patchMutation.isPending}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0E2E5B] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={patchMutation.isPending}
                >
                  {patchMutation.isPending
                    ? t("profile.myInfo.saving")
                    : t("profile.myInfo.save")}
                </button>
              </form>
            )}
          </div>
        );
      case "password":
        return (
          <div className="container">
            <ChangePassword />
          </div>
        );
      case "address":
        return (
          <>
            <AddressBook />
          </>
        );
      case "orders":
        return (
          <>
            <OrderHistory />
          </>
        );
      case "returns":
        return (
          <>
            <Returns />
          </>
        );
      case "transactions":
        return (
          <>
            <TransactionHistory />
          </>
        );
      case "bonuses":
        return (
          <div>
            <h1 className="text-[20px] font-[500] mb-4">
              {t("profile.bonuses.title")}
            </h1>

            {bonusBalance > 0 ? (
              <div className="bg-[#F5F7FA] max-w-[420px] rounded-[8px] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[20px]">
                    <div className="w-8 h-8 rounded-full bg-[#3AA15B] flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M2 8.5L6 12.5L14 4"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[18px] font-[500] text-[#00162A]">
                        {bonusBalance.toLocaleString("ru-RU")}{" "}
                        {t("profile.bonuses.bonusesText")}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        {t("profile.bonuses.available")}
                      </p>
                    </div>
                  </div>
                  <span className="text-[14px] font-[500] text-[#3AA15B]">
                    + {bonusBalance.toLocaleString("ru-RU")}{" "}
                    {t("profile.bonuses.bonusesText")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="max-w-[420px] rounded-2xl border border-gray-100 py-16 px-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 60 60" fill="none">
                    <circle
                      cx="30"
                      cy="30"
                      r="28"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                    />
                    <circle cx="20" cy="24" r="2.5" fill="#9CA3AF" />
                    <circle cx="40" cy="24" r="2.5" fill="#9CA3AF" />
                    <path
                      d="M20 40C20 40 23 36 30 36C37 36 40 40 40 40"
                      stroke="#9CA3AF"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="text-[14px] text-gray-500">
                  {t("profile.bonuses.empty")}
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const MenuContent = () => (
    <nav className="py-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActivePage(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
              activePage === item.id
                ? "bg-blue-50 text-blue-600 font-medium border-l-4 border-[#0E2E5B]"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="sidebarprofile flex h-screen relative">
      {/* Основной контент */}
      <div className="sidebarapp flex-1 relative pb-[30px]">
        <div className="">{renderPageContent()}</div>
      </div>

      {/* Десктоп сайдбар */}
      <div className="hidden md:block w-[288px] max-h-[363px] rounded-[15px] bg-white shadow-lg py-1 absolute right-0 top-[0px]">
        <nav className="space-y-1 py-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[30px] transition-colors text-left ${
                  activePage === item.id
                    ? "bg-blue-50 text-blue-600 font-medium border-l-8 border-[#0E2E5B] rounded-l-[7px]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm ml-[5px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Мобильный бургер + выпадающее меню */}
      <div className="md:hidden absolute right-[24px] top-[16px] z-50">
        {isMobileMenuOpen && (
          <>
            {/* Закрытие по клику вне */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Выпадающее меню над кнопкой */}
            <div className="absolute top-[60px] right-0 w-[260px] bg-white rounded-[15px] shadow-2xl z-50 overflow-hidden">
              {/* <div className="flex justify-between items-center px-4 py-3 border-b">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                </button>
              </div> */}
              <MenuContent />
            </div>
          </>
        )}

        {/* Кнопка бургера */}
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="flex flex-col gap-[2px] items-center py-2 px-3 rounded-[12px] bg-[#0E2E5B] shadow-lg relative z-50"
        >
          <Image src={img} alt="Menu" width={22} height={20} />
          <p className="text-[11px] text-center text-white">
            {t("profile.menuButton")}
          </p>
        </button>
      </div>
    </div>
  );
}
