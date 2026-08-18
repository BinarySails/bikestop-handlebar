import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Brand, Category } from "@/lib/api/schemas";

interface CatalogSidebarProps {
  categories: Category[];
  brands: Brand[];
  sortBy: string;
  onSortByChange: (value: string) => void;
  availability: string;
  onAvailabilityChange: (value: string) => void;
  selectedCategoryIds: string[];
  onCategoryToggle: (categoryId: string) => void;
  selectedBrandIds: string[];
  onBrandToggle: (brandId: string) => void;
}

const sortByLabel: Record<string, string> = {
  name_asc: "Nombre: A-Z",
  name_desc: "Nombre: Z-A",
  price_asc: "Precio: menor a mayor",
  price_desc: "Precio: mayor a menor",
  created_at_desc: "Más nuevos",
};

const availabilityLabel: Record<string, string> = {
  all: "Todas",
  available: "En existencia",
  out_of_stock: "Agotado",
};

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
        {title}
      </h4>
      {children}
    </div>
  );
}

function SidebarContent(props: CatalogSidebarProps) {
  return (
    <div className="space-y-6">
      <FilterSection title="Ordenar por">
        <Select
          value={props.sortBy}
          onValueChange={(value) => props.onSortByChange(value ?? "name_asc")}
        >
          <SelectTrigger>
            <SelectValue>{sortByLabel[props.sortBy]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc" label="Nombre: A-Z">
              Nombre: A-Z
            </SelectItem>
            <SelectItem value="name_desc" label="Nombre: Z-A">
              Nombre: Z-A
            </SelectItem>
            <SelectItem value="price_asc" label="Precio: menor a mayor">
              Precio: menor a mayor
            </SelectItem>
            <SelectItem value="price_desc" label="Precio: mayor a menor">
              Precio: mayor a menor
            </SelectItem>
            <SelectItem value="created_at_desc" label="Más nuevos">
              Más nuevos
            </SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      <Separator />

      <FilterSection title="Disponibilidad">
        <Select
          value={props.availability}
          onValueChange={(value) => props.onAvailabilityChange(value ?? "all")}
        >
          <SelectTrigger>
            <SelectValue>{availabilityLabel[props.availability]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="Todas">
              Todas
            </SelectItem>
            <SelectItem value="available" label="En existencia">
              En existencia
            </SelectItem>
            <SelectItem value="out_of_stock" label="Agotado">
              Agotado
            </SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      <Separator />

      <FilterSection title="Categorías">
        <div className="space-y-2">
          {props.categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={props.selectedCategoryIds.includes(category.id)}
                onCheckedChange={() => props.onCategoryToggle(category.id)}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-sm leading-none"
              >
                {category.display_name}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Marcas">
        <div className="space-y-2">
          {props.brands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-2">
              <Checkbox
                id={`brand-${brand.id}`}
                checked={props.selectedBrandIds.includes(brand.id)}
                onCheckedChange={() => props.onBrandToggle(brand.id)}
              />
              <Label
                htmlFor={`brand-${brand.id}`}
                className="text-sm leading-none"
              >
                {brand.display_name}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

export function CatalogSidebar(props: CatalogSidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 rounded-lg border p-4">
          <SidebarContent {...props} />
        </div>
      </aside>

      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal className="mr-2 size-4" />
              Filtros
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    </>
  );
}
