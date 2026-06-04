import { fetchProductsFromSource, successResponse } from "../../../lib/apiUtils";

export async function GET() {
  const { products, source } = await fetchProductsFromSource();

  return successResponse({ products, source }, 200, { products, source });
}
