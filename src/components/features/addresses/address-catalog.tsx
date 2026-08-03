import { CreateStateLocalityDialog } from "./create-state-locality-modal";

export function AddressCatalog() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Catálogo de ubicaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea los estados y las localidades disponibles para las direcciones.
          </p>
        </div>

        <CreateStateLocalityDialog />
      </div>
    </main>
  );
}
