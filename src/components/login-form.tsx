import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface LoginFormProps extends React.ComponentProps<"form"> {
  disabled?: boolean;
}

export function LoginForm({ className, disabled, ...props }: LoginFormProps) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Ingresa tu correo electrónico para continuar
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@ejemplo.com"
            required
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={disabled}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={disabled}>
            {disabled ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
