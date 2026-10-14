/* oxlint-disable react/no-unstable-nested-components -- entity-index-page cell renderers are callbacks, not components */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgePercent,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Power,
} from "lucide-react";

import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { SiteHeader } from "@/components/features/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCatalogProductRequest,
  getProductRequest,
  listVariantsRequest,
  updatePromotionStatusRequest,
  useListPromotionsRequest,
} from "@/lib/api/api";
import type { Promotion, PromotionRule, RuleValue } from "@/lib/api/schemas";

import { CreatePromotionDialog } from "./create-promotion-dialog";
import { discountValueLabel, promotionKind } from "./promotion-labels";
import {
  LINE_RULE_ATTRIBUTES,
  OPERATOR_OPTIONS,
  ORDER_RULE_ATTRIBUTES,
} from "./promotion-form";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});
const EMPTY_PROMOTION_RULES: PromotionRule[] = [];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function getRuleAttribute(rule: PromotionRule): string {
  return typeof rule.attribute === "string"
    ? rule.attribute
    : "variant_property";
}

function getRuleValues(rule: PromotionRule): string[] {
  return rule.values.map((value: RuleValue) => {
    if ("uuid" in value) return value.uuid;
    if ("string" in value) return value.string;
    return String(value.integer);
  });
}

function getRuleLabel(attribute: string): string {
  return (
    [...ORDER_RULE_ATTRIBUTES, ...LINE_RULE_ATTRIBUTES].find(
      (option) => option.value === attribute
    )?.label ?? attribute
  );
}

type PromotionProduct = {
  name: string;
  variantName?: string | undefined;
  imageUrl?: string;
};

function RuleSummary({
  rules,
  products,
}: {
  rules: PromotionRule[];
  products: Map<string, PromotionProduct>;
}) {
  if (rules.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin condiciones.</p>;
  }

  return (
    <ul className="space-y-2">
      {rules.map((rule, index) => {
        const attribute = getRuleAttribute(rule);
        const operator = OPERATOR_OPTIONS.find(
          (option) => option.value === rule.operator
        )?.label;
        return (
          <li key={rule.id ?? `${attribute}-${index}`} className="text-sm">
            <span className="font-medium">{getRuleLabel(attribute)}</span>
            {operator && (
              <span className="text-muted-foreground"> {operator} </span>
            )}
            <span className="inline-flex flex-wrap gap-1">
              {getRuleValues(rule).map((value) => {
                const productDetails =
                  attribute === "product_id" || attribute === "variant_id"
                    ? products.get(value)
                    : undefined;
                return (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 text-xs"
                  >
                    {productDetails?.imageUrl && (
                      <img
                        src={productDetails.imageUrl}
                        alt=""
                        className="size-8 rounded object-cover"
                        loading="lazy"
                      />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span>{productDetails?.name ?? value}</span>
                      {productDetails?.variantName && (
                        <span className="text-muted-foreground">
                          {productDetails.variantName}
                        </span>
                      )}
                    </span>
                  </span>
                );
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PromotionDetails({ promotion }: { promotion: Promotion }) {
  const applicationMethod = promotion.application_method;
  const targetRules =
    "Standard" in applicationMethod
      ? applicationMethod.Standard.target_rules
      : applicationMethod.BuyGet.target_rules;
  const buyRules =
    "BuyGet" in applicationMethod
      ? applicationMethod.BuyGet.buy_rules
      : EMPTY_PROMOTION_RULES;
  const allRules = useMemo(
    () => [...promotion.rules, ...targetRules, ...buyRules],
    [promotion.rules, targetRules, buyRules]
  );
  const productReferences = useMemo(() => {
    const references = new Map<string, { id: string; attribute: string }>();
    for (const rule of allRules) {
      const attribute = getRuleAttribute(rule);
      if (attribute !== "product_id" && attribute !== "variant_id") continue;
      for (const id of getRuleValues(rule)) {
        references.set(`${attribute}:${id}`, { id, attribute });
      }
    }
    return [...references.values()];
  }, [allRules]);
  const [products, setProducts] = useState<Map<string, PromotionProduct>>(
    new Map()
  );

  useEffect(() => {
    let cancelled = false;
    if (productReferences.length === 0) {
      setProducts(new Map());
      return;
    }

    void Promise.all(
      productReferences.map(async ({ id, attribute }) => {
        try {
          if (attribute === "variant_id") {
            const response = await getCatalogProductRequest(id);
            if (response.status !== 200) return null;

            const productResponse = await getProductRequest(
              response.data.product_id
            );
            const imageUrl = [...response.data.images]
              .sort((a, b) => a.image_index - b.image_index)
              .find((image) => image.status === "enable")?.image_url;
            const productName =
              productResponse.status === 200
                ? productResponse.data.display_name
                : response.data.display_name;
            return [
              id,
              {
                name: productName,
                variantName:
                  productName === response.data.display_name
                    ? undefined
                    : response.data.display_name,
                imageUrl,
              },
            ] as const;
          }

          const [productResponse, variantsResponse] = await Promise.all([
            getProductRequest(id),
            listVariantsRequest(id),
          ]);
          if (productResponse.status !== 200) return null;

          const variants =
            variantsResponse.status === 200 ? variantsResponse.data : [];
          const imageUrl = variants
            .filter((variant) => variant.status === "enable")
            .flatMap((variant) => variant.images)
            .filter((image) => image.status === "enable")
            .sort((a, b) => a.image_index - b.image_index)[0]?.image_url;

          return [
            id,
            {
              name: productResponse.data.display_name,
              imageUrl:
                imageUrl ?? productResponse.data.brand.image_url ?? undefined,
            },
          ] as const;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!cancelled) {
        const resolvedProducts = new Map<string, PromotionProduct>();
        for (const result of results) {
          if (result) resolvedProducts.set(result[0], result[1]);
        }
        setProducts(resolvedProducts);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [productReferences]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Quién puede usarla</h3>
        <RuleSummary rules={promotion.rules} products={products} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Productos con descuento</h3>
        <RuleSummary rules={targetRules} products={products} />
      </div>
      {buyRules.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Productos que califican</h3>
          <RuleSummary rules={buyRules} products={products} />
        </div>
      )}
    </div>
  );
}

export function PromotionsCatalog() {
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedPromotionId, setExpandedPromotionId] = useState<string | null>(
    null
  );
  const [updatingPromotionId, setUpdatingPromotionId] = useState<string | null>(
    null
  );
  const listQuery = useListPromotionsRequest();
  const promotions =
    listQuery.data?.status === 200 ? listQuery.data.data : undefined;

  const hasError =
    Boolean(listQuery.error) ||
    (Boolean(listQuery.data) && listQuery.data!.status !== 200);

  async function togglePromotionStatus(promotion: Promotion) {
    if (updatingPromotionId) return;
    const status = promotion.status === "active" ? "inactive" : "active";
    setUpdatingPromotionId(promotion.id);
    try {
      const response = await updatePromotionStatusRequest(promotion.id, {
        status,
      });
      if (response.status !== 200) {
        throw new Error("No se pudo actualizar el estado de la promoción.");
      }
      toast.success(
        status === "active" ? "Promoción activada." : "Promoción desactivada."
      );
      await listQuery.mutate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la promoción."
      );
    } finally {
      setUpdatingPromotionId(null);
    }
  }

  const columns: EntityColumn<Promotion>[] = [
    {
      header: "Código",
      cell: (promotion) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${expandedPromotionId === promotion.id ? "Ocultar" : "Ver"} detalles de ${promotion.code}`}
            aria-expanded={expandedPromotionId === promotion.id}
            onClick={() =>
              setExpandedPromotionId((current) =>
                current === promotion.id ? null : promotion.id
              )
            }
          >
            {expandedPromotionId === promotion.id ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
          <div className="flex flex-col">
            <span className="font-medium tracking-tight">{promotion.code}</span>
            <span className="text-xs text-muted-foreground">
              {promotion.is_automatic ? "Automática" : "Código de promoción"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Tipo",
      cell: (promotion) => promotionKind(promotion),
    },
    {
      header: "Descuento",
      cell: (promotion) => discountValueLabel(promotion),
    },
    {
      header: "Vigencia",
      cell: (promotion) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(promotion.starts_at)} → {formatDate(promotion.ends_at)}
        </span>
      ),
    },
    {
      header: "Uso",
      cell: (promotion) => (
        <span className="tabular-nums">
          {promotion.used_count}
          {promotion.usage_limit != null
            ? ` / ${promotion.usage_limit}`
            : " / ∞"}
        </span>
      ),
    },
    {
      header: "Estado",
      cell: (promotion) => (
        <Badge
          variant={
            promotion.status === "active"
              ? "default"
              : promotion.status === "draft"
                ? "secondary"
                : "outline"
          }
        >
          {promotion.status === "active"
            ? "Activa"
            : promotion.status === "draft"
              ? "Borrador"
              : "Inactiva"}
        </Badge>
      ),
    },
    {
      header: "Acciones",
      className: "w-36 text-right",
      cell: (promotion) => {
        const isUpdating = updatingPromotionId === promotion.id;
        const activate = promotion.status !== "active";
        return (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updatingPromotionId !== null}
              onClick={() => void togglePromotionStatus(promotion)}
            >
              {isUpdating ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Power className="size-4" />
              )}
              {activate ? "Activar" : "Desactivar"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <SiteHeader
        title="Promociones"
        description="Crea descuentos para aplicar a tus pedidos."
        actions={
          <EntityCreateButton onClick={() => setCreateOpen(true)}>
            Nueva promoción
          </EntityCreateButton>
        }
      />
      <EntityIndexPage<Promotion>
        ariaLabel="Promociones"
        cardTitle={
          <EntityCardTitle icon={BadgePercent}>
            Todas las promociones
          </EntityCardTitle>
        }
        columns={columns}
        rows={promotions ?? []}
        rowKey={(promotion) => promotion.id}
        expandedRowKey={expandedPromotionId}
        expandedRowContent={(promotion) => (
          <PromotionDetails promotion={promotion} />
        )}
        loading={listQuery.isLoading}
        validating={listQuery.isValidating && Boolean(promotions)}
        hasError={hasError}
        errorMessage="No se pudieron cargar las promociones. Revisa tu conexión e intenta nuevamente."
        onRetry={() => listQuery.mutate()}
        emptyMessage="No hay promociones."
      />
      <CreatePromotionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={async () => {
          await listQuery.mutate();
        }}
      />
    </>
  );
}
