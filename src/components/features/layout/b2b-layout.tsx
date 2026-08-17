import { AppFooter } from "./app-footer";
import { CatalogHeader } from "@/components/features/catalog/catalog-header";

export function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CatalogHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
