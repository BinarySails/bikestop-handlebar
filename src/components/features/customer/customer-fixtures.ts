import type { Customer } from "@/lib/api/schemas";

export const customerFixtures: Customer[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    user_id: "22222222-2222-2222-2222-222222222222",
    company_name: "Bicicletas del Norte",
    tax_id: "BIC123456789",
    phone: "5512345678",
    email: "ventas@bicicletasnorte.mx",
    status: "active",
    created_at: "2026-08-06T15:00:00Z",
    updated_at: "2026-08-06T15:00:00Z",
  },
];
