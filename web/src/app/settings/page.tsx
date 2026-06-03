import { SettingsClient } from "./SettingsClient";

type TabId = "profile" | "system" | "appearance" | "update" | "reset";

const validTabs = new Set<TabId>(["profile", "system", "appearance", "update", "reset"]);

function normalizeTab(value: string | string[] | undefined): TabId {
  const tab = Array.isArray(value) ? value[0] : value;
  return validTabs.has(tab as TabId) ? (tab as TabId) : "profile";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <SettingsClient initialTab={normalizeTab(params.tab)} />;
}
