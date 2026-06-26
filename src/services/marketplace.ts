const BASE = 'https://rnqrjwvootmkvpinctkq.supabase.co/functions/v1/affiliate-products-api';
const API_KEY = '7ac1f827bdcbef42e442a11cdf7adee46837ebd0af25bbb3b08b4f0565005306';
const SUPABASE_URL = 'https://igboapwixwfepujggqew.supabase.co';
const ANON_KEY = 'sb_publishable_TWPx_MhQB2XqYhVqRSZmmA_679VTBLW';

const API_HEADERS = {
  'x-app-key': API_KEY,
};

export type AffiliateProduct = {
  id: string;
  name: string;
  description?: string;
  price: string;
  image_url?: string;
  tracking_url: string;
  category?: string;
  subcategory?: string;
  shop?: string;
};

function toHttps(url: unknown): string | undefined {
  if (!url) return undefined;
  const s = String(url);
  if (!s) return undefined;
  if (s.startsWith('//')) return 'https:' + s;
  return s.replace(/^http:\/\//i, 'https://');
}

function normalize(raw: Record<string, unknown>): AffiliateProduct {
  // price jest liczbą — formatujemy z walutą
  const priceNum = raw.price ?? raw.sale_price ?? raw.priceLabel;
  const currency = String(raw.currency ?? 'PLN');
  const priceStr = typeof priceNum === 'number'
    ? `${priceNum} ${currency}`
    : String(priceNum ?? '');

  const rawImages = raw.images as unknown[] | undefined;
  const firstImage = Array.isArray(rawImages) && rawImages.length > 0 ? rawImages[0] : undefined;

  return {
    id:           String(raw.id ?? raw.productId ?? Math.random()),
    name:         String(raw.title ?? raw.name ?? ''),
    description:  raw.description as string | undefined,
    price:        priceStr,
    image_url:    toHttps(raw.image_url ?? raw.imageUrl ?? raw.image ?? raw.img ?? raw.photo ?? raw.picture ?? raw.main_image ?? raw.primary_image ?? raw.thumbnail ?? firstImage),
    tracking_url: String(raw.tracking_url ?? raw.trackingUrl ?? raw.product_url ?? raw.url ?? ''),
    category:     (raw.subcategory ?? raw.category) as string | undefined,
    subcategory:  raw.subcategory as string | undefined,
    shop:         (raw.shop_name ?? raw.shopName ?? raw.shop ?? raw.shop_slug ?? raw.merchant) as string | undefined,
    // pola pomocnicze dla UI — rzutowane przez NoImagePlaceholder przez (product as any)
    ...(raw.shop_slug   ? { shop_slug:    raw.shop_slug   } : {}),
    ...(raw.category    ? { raw_category: raw.category    } : {}),
  };
}

export async function fetchProducts(params: {
  limit?: number;
  offset?: number;
  category?: string;
  shop?: string;
  q?: string;
} = {}): Promise<AffiliateProduct[]> {
  const query = new URLSearchParams();
  query.set('limit',  String(params.limit  ?? 30));
  query.set('offset', String(params.offset ?? 0));
  if (params.category) query.set('category', params.category);
  if (params.shop)     query.set('shop',     params.shop);
  if (params.q)        query.set('q',        params.q);

  const url = `${BASE}/products?${query}`;
  const res = await fetch(url, { headers: API_HEADERS });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`);
  }

  const data = await res.json();
  const raw: unknown[] = Array.isArray(data)
    ? data
    : (data.products ?? data.data ?? data.items ?? data.results ?? []);
  return raw.map((item) => normalize(item as Record<string, unknown>));
}

export function trackClick(productId: string, shopSlug?: string): void {
  fetch(`${SUPABASE_URL}/functions/v1/track-affiliate-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
    body: JSON.stringify({ productId, source: 'mobile', shopSlug }),
  }).catch(() => {});
}
