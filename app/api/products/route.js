import { NextResponse } from "next/server";
import { fallbackProducts } from "../../../lib/fallbackProducts";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const mapProduct = (product) => ({
  id: product.id,
  name: product.name,
  desc: product.description,
  tags: product.tags || [],
  price: Number(product.price),
  image: product.image_url,
});

export async function GET() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      products: fallbackProducts,
      source: "fallback",
    });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=id,name,description,tags,price,image_url&active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}`);
    }

    const products = await response.json();

    return NextResponse.json({
      products: products.map(mapProduct),
      source: "supabase",
    });
  } catch (error) {
    console.error("Could not load products from Supabase:", error);

    return NextResponse.json({
      products: fallbackProducts,
      source: "fallback",
    });
  }
}
