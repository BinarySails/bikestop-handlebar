import type { Brand } from "@/lib/api/schemas";

export const brandFixtures: Brand[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    display_name: "Specialized",
    image_url: "https://images.example.com/specialized.png",
    status: "enable",
    created_at: "2025-01-10T12:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    display_name: "Trek",
    image_url: "https://images.example.com/trek.png",
    status: "disable",
    created_at: "2025-02-15T12:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    display_name: "Cannondale",
    image_url: "https://invalid.example.com/broken-logo.png",
    status: "archive",
    created_at: "2025-03-20T12:00:00Z",
  },
];
