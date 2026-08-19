import { AppFooter } from "./app-footer";
import { CartDrawer } from "@/components/features/catalog/cart-drawer";
import { CatalogHeader } from "@/components/features/catalog/catalog-header";
import { useCartDrawerStore } from "@/lib/cart/use-cart-drawer-store";

export function B2BLayout({ children }: { children: React.ReactNode }) {
  const open = useCartDrawerStore((s) => s.open);
  const setOpen = useCartDrawerStore((s) => s.setOpen);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <CatalogHeader />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <AppFooter />
      <CartDrawer open={open} onOpenChange={setOpen} />
    </div>
  );
}
