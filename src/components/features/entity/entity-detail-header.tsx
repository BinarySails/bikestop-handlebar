import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type EntityDetailHeaderProps = {
  backTo: string;
  backParams?: Record<string, string>;
  backLabel: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  extraActions?: ReactNode;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
};

export function EntityDetailHeader({
  backTo,
  backParams,
  backLabel,
  title,
  subtitle,
  badge,
  extraActions,
  isDirty,
  isSubmitting,
  onSave,
  onDiscard,
  onDelete,
  showDelete,
}: EntityDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          render={<Link to={backTo} params={backParams as never} />}
          variant="ghost"
          size="icon"
          aria-label={backLabel}
          className="size-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="inline-flex items-center gap-2">
              {title}
              {badge}
            </span>
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {extraActions}

        {isDirty ? (
          <>
            {onDiscard && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onDiscard}
              >
                <RotateCcw className="size-4" />
                <span>Descartar</span>
              </Button>
            )}
            <Button type="button" disabled={isSubmitting} onClick={onSave}>
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Guardar cambios</span>
                </>
              )}
            </Button>
          </>
        ) : showDelete ? (
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            <span>Eliminar</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
