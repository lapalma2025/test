import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, Image, Linking,
  useWindowDimensions, RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native';

import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { Icon } from '@/components/ui/Icon';
import { fetchProducts, trackClick, type AffiliateProduct } from '@/services/marketplace';

const H_PAD   = 16;
const CAT_GAP = 10;
const PRD_GAP = 12;

const BLOCKED_KEYWORDS = [
  'główka głowa treningowa',
  'głowa treningowa',
  'plaster miodu',
];

const LINE  = '#E5DFD3';
const CREAM = '#FAF7F2';

type ThemeKey = 'sage' | 'clay' | 'sand';

const IC_THEME: Record<ThemeKey, { bg: string; color: string }> = {
  sage: { bg: '#DCE6DD', color: '#3D5147' },
  clay: { bg: '#F5DDD0', color: '#9C4F33' },
  sand: { bg: '#EFE9DC', color: '#8a6a4d' },
};

type Category = { key: string; label: string; icon: string; theme: ThemeKey; apiKey?: string };

const CATEGORIES: Category[] = [
  { key: 'pielegnacja',label: 'Pielęgnacja',    icon: 'lotion', theme: 'clay', apiKey: 'bathing'   },
  { key: 'zabawki',    label: 'Zabawki',        icon: 'blocks', theme: 'sage', apiKey: 'toys'      },
  { key: 'ksiazki',    label: 'Książki',        icon: 'book',   theme: 'clay', apiKey: 'books'     },
  { key: 'pokoj',      label: 'Pokój',           icon: 'crib',   theme: 'sand', apiKey: 'furniture' },
  { key: 'karmienie',  label: 'Karmienie',      icon: 'bottle', theme: 'sage', apiKey: 'feeding'   },
  { key: 'zdrowie',    label: 'Zdrowie',        icon: 'heart',  theme: 'sage', apiKey: 'health'    },
];

// ─── ekran główny ────────────────────────────────────────────────────────────
export default function SklepScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PAD * 2 - PRD_GAP) / 2;

  const [activeCat, setActiveCat]   = useState<string | null>('pielegnacja');
  const [products,  setProducts]    = useState<AffiliateProduct[]>([]);
  const [loading,   setLoading]     = useState(false);
  const [refreshing,setRefreshing]  = useState(false);
  const [error,     setError]       = useState<string | null>(null);
  const [retry,     setRetry]       = useState(0);

  useEffect(() => {
    if (activeCat === null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProducts([]);

    const cat = CATEGORIES.find((c) => c.key === activeCat);
    // pobierz wszystkie produkty z API dla tej kategorii (bez filtra sklepu)
    fetchProducts({ limit: 500, category: cat?.apiKey })
      .then((data) => {
        if (!cancelled) {
          const filtered = data.filter((p) => {
            if (!p.image_url) return false;
            const name = p.name.toLowerCase();
            if (BLOCKED_KEYWORDS.some((kw) => name.includes(kw))) return false;
            if (activeCat === 'pielegnacja' && name.includes('zabawka')) return false;
            return true;
          });
          setProducts(filtered); setLoading(false); setRefreshing(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) { setError(e.message); setLoading(false); setRefreshing(false); }
      });

    return () => { cancelled = true; };
  }, [activeCat, retry]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRetry((n) => n + 1);
  }, []);

  const handleBuy = useCallback((p: AffiliateProduct) => {
    if (!p.tracking_url) return;
    trackClick(p.id, p.shop);
    Linking.openURL(p.tracking_url).catch(() => {});
  }, []);

  const handleImageError = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const activeName = CATEGORIES.find((c) => c.key === activeCat)?.label ?? 'Produkty';

  return (
    <MainScreenShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3D5147"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* BANER MARKETPLACE */}
        <MarketplaceBanner />

        {/* SEKCJA KATEGORIE — jedna linia, przewijana poziomo */}
        <SectionHead title="Kategorie" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 10 }}
        >
          {CATEGORIES.map((cat) => (
            <CategoryTile
              key={cat.key}
              cat={cat}
              active={activeCat === cat.key}
              onPress={() => setActiveCat(cat.key)}
            />
          ))}
        </ScrollView>

        {/* SEKCJA PRODUKTY — widoczna tylko po wyborze kategorii */}
        {activeCat !== null && (
          <>
            <SectionHead
              title={activeName}
              count={!loading && products.length > 0 ? products.length : undefined}
            />

            {loading ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3D5147" />
              </View>
            ) : error ? (
              <ErrorView message={error} onRetry={() => setRetry((n) => n + 1)} />
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <View style={{ paddingHorizontal: H_PAD }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: PRD_GAP }}>
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} width={cardWidth} onBuy={handleBuy} onImageError={handleImageError} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </MainScreenShell>
  );
}

// ─── baner Kidelo Marketplace ─────────────────────────────────────────────────
function MarketplaceBanner() {
  return (
    <Pressable
      onPress={() => Linking.openURL('https://kidelo.pl').catch(() => {})}
      style={({ pressed }) => ({
        marginHorizontal: H_PAD, marginTop: 12, marginBottom: 8,
        borderRadius: 22, overflow: 'hidden', opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ backgroundColor: '#3D5147', padding: 22 }}>

        {/* brand */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../../../assets/kidelo-logo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
          </View>
          <View>
            <Text style={{ fontSize: 19, fontWeight: '500', color: '#F4F1E9', letterSpacing: -0.2, fontStyle: 'normal' }}>
              Kidelo
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 14, color: '#C6D0C3', lineHeight: 22, marginBottom: 12 }}>
          W aplikacji pokazujemy tylko część oferty. Na kidelo.pl znajdziesz szafę dziecka, tworzenie kolekcji ubrań i wiele więcej.{' '}
          <Text style={{ color: '#F4F1E9', fontWeight: '600' }}>Możesz też wystawić własne rzeczy na sprzedaż</Text>
          {' '}— daj dziecięcym ubraniom i zabawkom drugie życie.
        </Text>

        {/* tagi funkcji */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {['Szafa dziecka', 'Kolekcje ubrań', 'I wiele więcej'].map((tag) => (
            <View key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* przycisk */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CREAM, borderRadius: 13, paddingHorizontal: 20, paddingVertical: 13, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#3D5147' }}>Przejdź do kidelo.pl</Text>
          <Icon name="arrow" size={16} color="#3D5147" strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

// ─── nagłówek sekcji ────────────────────────────────────────────────────────
function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginHorizontal: H_PAD, marginTop: 26, marginBottom: 12,
    }}>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#2B2620' }}>{title}</Text>
      {count !== undefined && (
        <Text style={{ fontSize: 12, color: '#AAA193' }}>
          {count} {count === 1 ? 'produkt' : count < 5 ? 'produkty' : 'produktów'}
        </Text>
      )}
    </View>
  );
}

// ─── kafelek kategorii ────────────────────────────────────────────────────────
function CategoryTile({ cat, active, onPress }: {
  cat: Category; active: boolean; onPress: () => void;
}) {
  const theme = IC_THEME[cat.theme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 88,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 15,
        paddingHorizontal: 6,
        paddingBottom: 13,
        backgroundColor: active ? '#FCFBF7' : '#FFFFFF',
        borderWidth: 0.5,
        borderColor: active ? '#3D5147' : LINE,
        borderRadius: 16,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {/* ikona — kwadrat z zaokrąglonymi rogami (15px) jak k-cat__ic */}
      <View style={{
        width: 52, height: 52, borderRadius: 15,
        backgroundColor: theme.bg,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={cat.icon as any} size={23} color={theme.color} strokeWidth={1.6} />
      </View>

      {/* etykieta — odstęp od ikony przez marginTop */}
      <Text
        numberOfLines={2}
        style={{
          fontSize: 12, fontWeight: '500', lineHeight: 15,
          color: active ? '#3D5147' : '#2B2620',
          textAlign: 'center',
          minHeight: 30,
          marginTop: 10,
        }}
      >
        {cat.label}
      </Text>
    </Pressable>
  );
}

// ─── karta produktu — wzorowana na k-listing ─────────────────────────────────
function ProductCard({ product, width, onBuy, onImageError }: {
  product: AffiliateProduct; width: number;
  onBuy: (p: AffiliateProduct) => void;
  onImageError: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onBuy(product)}
      style={({ pressed }) => ({
        width,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: LINE,
        overflow: 'hidden',
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {/* zdjęcie 1:1 */}
      <View style={{ width, height: width, backgroundColor: '#EFE9DC' }}>
        <Image
          source={{ uri: product.image_url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => onImageError(product.id)}
        />
      </View>

      {/* info */}
      <View style={{ padding: 12 }}>
        <Text numberOfLines={2} style={{
          fontSize: 13.5, fontWeight: '500', color: '#2B2620',
          lineHeight: 18, minHeight: 36, marginBottom: 8,
        }}>
          {product.name || 'Produkt'}
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '500', color: '#3D5147', letterSpacing: -0.3 }}>
          {product.price || '—'}
        </Text>

        {product.shop ? (
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: '#AAA193', marginTop: 3 }}>
            {product.shop}
          </Text>
        ) : null}

        <View style={{
          marginTop: 10, backgroundColor: '#3D5147', borderRadius: 10,
          paddingVertical: 9, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'center', gap: 5,
        }}>
          <Text style={{ fontSize: 13, color: '#fff', fontWeight: '500' }}>Kup teraz</Text>
          <Icon name="arrow" size={13} color="#fff" strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

// ─── stany pomocnicze ─────────────────────────────────────────────────────────
function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40 }}>
      <Icon name="info" size={32} color="#AAA193" />
      <Text style={{ fontSize: 15, color: '#6E6457', textAlign: 'center', marginTop: 12, lineHeight: 22 }}>
        Nie udało się załadować produktów
      </Text>
      <Text style={{ fontSize: 11, color: '#AAA193', textAlign: 'center', marginTop: 4, lineHeight: 16 }}>
        {message.slice(0, 80)}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          marginTop: 16, paddingHorizontal: 24, paddingVertical: 11,
          backgroundColor: '#3D5147', borderRadius: 12, opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 14, color: '#fff', fontWeight: '500' }}>Spróbuj ponownie</Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
      <Icon name="bag" size={36} color="#AAA193" />
      <Text style={{ fontSize: 15, color: '#2B2620', marginTop: 12, fontWeight: '500' }}>
        Brak produktów
      </Text>
      <Text style={{ fontSize: 13, color: '#6E6457', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
        W tej kategorii nie ma jeszcze produktów.
      </Text>
    </View>
  );
}
