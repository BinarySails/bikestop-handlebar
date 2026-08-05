import useSwr, { mutate } from "swr";

import {
  useListBrandsRequest,
  createBrandRequest,
  updateBrandRequest,
  deleteBrandRequest,
  toggleBrandRequest,
  getBrandRequest,
  getGetBrandRequestKey,
} from "./api";
import type { Brand } from "./schemas";

export class BrandApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "BrandApiError";
  }
}

type UseBrandsOptions = {
  page?: number;
  limit?: number;
  display_name?: string;
  order?: "asc" | "desc";
};

type BrandsResult = {
  data: Brand[];
  page: number;
  limit: number;
  total: number;
};

function mapError(status: number, fallback: string): BrandApiError {
  return new BrandApiError(status, fallback);
}

export function useBrands(options: UseBrandsOptions) {
  const query = useListBrandsRequest(
    {
      page: options.page,
      limit: options.limit,
      display_name: options.display_name,
      order: options.order,
    },
    {
      swr: {
        revalidateOnFocus: false,
      },
    },
  );

  const response =
    query.data?.status === 200 ? query.data.data : undefined;

  return {
    ...query,
    data: response
      ? ({
          data: response.data ?? [],
          page: response.page ?? options.page ?? 0,
          limit: response.limit ?? options.limit ?? 10,
          total: response.total ?? 0,
        } satisfies BrandsResult)
      : undefined,
  };
}

export function useBrand(id: string | undefined) {
  const query = useSwr(
    id ? getGetBrandRequestKey(id) : null,
    () => getBrandRequest(id!),
  );

  const brand =
    query.data?.status === 200 ? query.data.data : null;

  return {
    ...query,
    data: brand,
  };
}

export async function createBrand(values: {
  display_name: string;
  image_url: string;
}): Promise<Brand> {
  const result = await createBrandRequest(values);
  if (result.status === 201) return result.data;
  if (result.status === 400) throw mapError(400, "Invalid data");
  throw mapError(0, "Error creating brand");
}

export async function updateBrand(
  id: string,
  values: { display_name: string; image_url: string },
): Promise<Brand> {
  const result = await updateBrandRequest(id, values);
  if (result.status === 200) return result.data;
  if (result.status === 400) throw mapError(400, "Invalid data");
  if (result.status === 404) throw mapError(404, "Brand not found");
  if (result.status === 409) throw mapError(409, "Duplicate name");
  throw mapError(0, "Error updating brand");
}

export async function toggleBrand(id: string): Promise<Brand> {
  const result = await toggleBrandRequest(id);
  if (result.status === 200) return result.data;
  if (result.status === 404) throw mapError(404, "Brand not found");
  if (result.status === 409) throw mapError(409, "Cannot toggle brand");
  throw mapError(0, "Error toggling brand");
}

export async function archiveBrand(id: string): Promise<Brand> {
  const result = await deleteBrandRequest(id);
  if (result.status === 200) return result.data;
  if (result.status === 404) throw mapError(404, "Brand not found");
  throw mapError(0, "Error archiving brand");
}

export function invalidateBrands() {
  return mutate((key) => {
    if (Array.isArray(key) && typeof key[0] === "string")
      return key[0].includes("brands");
    return false;
  });
}
