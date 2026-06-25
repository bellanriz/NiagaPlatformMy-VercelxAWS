import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { OrgSettings } from "@/components/settings/org-settings";
import { DatabaseStatus } from "@/components/settings/database-status";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Manage your account and organization" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-3xl">
        <ProfileSettings
          name={user?.name ?? ""}
          email={user?.email ?? ""}
          role={user?.role ?? "member"}
        />
        <OrgSettings
          orgName={user?.orgName ?? ""}
          orgSlug={user?.orgSlug ?? ""}
          plan={user?.plan ?? "starter"}
        />
        <DatabaseStatus />
      </div>
    </div>
  );
}
