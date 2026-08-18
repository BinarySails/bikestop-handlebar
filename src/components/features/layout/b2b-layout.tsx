import { AppFooter } from "./app-footer";
import { CatalogHeader } from "@/components/features/catalog/catalog-header";

export function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <CatalogHeader />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <AppFooter />
    </div>
  );
}
