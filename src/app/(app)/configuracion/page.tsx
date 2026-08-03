import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import SettingsNotifications from "@/components/SettingsNotifications";
import ThemeToggle from "@/components/ThemeToggle";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { APP_NAME } from "@/config/app";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} />

      <div className="flex flex-col gap-4 p-4">
        <section className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("sessionAs")}
          </p>
          <p className="font-medium">{user?.email}</p>
        </section>

        <section className="card p-4">
          <ThemeToggle />
        </section>

        <SettingsNotifications />

        <section className="card p-4 text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            {t("aboutTitle")}
          </p>
          <p className="mb-2">{t("aboutP1", { appName: APP_NAME })}</p>
          <p>{t("aboutP2")}</p>
        </section>

        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-danger w-full">
            <LogOut className="h-4 w-4" aria-hidden />
            {t("signout")}
          </button>
        </form>

        {user?.email && <DeleteAccountButton email={user.email} />}
      </div>
    </>
  );
}
