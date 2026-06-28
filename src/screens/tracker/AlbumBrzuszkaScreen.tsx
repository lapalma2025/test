import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, Modal,
  Alert, useWindowDimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';

import { Icon } from '@/components/ui';
import { useTrackersStore, type UsgPhoto } from '@/stores/trackers';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

const ALBUM_WEEKS = Array.from({ length: 40 }, (_, i) => i + 1);

function currentPregnancyWeek(childDueDate: string | null): number {
  if (!childDueDate) return 40;
  const dueMs = new Date(childDueDate).getTime();
  const todayMs = Date.now();
  const daysUntilDue = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(40, 40 - Math.ceil(daysUntilDue / 7)));
}

async function copyToPermanentStorage(src: string, filename: string): Promise<string> {
  if (!documentDirectory) {
    throw new Error('No document directory available');
  }
  const dest = `${documentDirectory}${filename}`;
  await copyAsync({ from: src, to: dest });
  return dest;
}

// ─── TAB TOGGLE ───────────────────────────────────────────────────────────────

interface TabToggleProps {
  active: 'belly' | 'usg';
  onSelect: (tab: 'belly' | 'usg') => void;
  labelBelly: string;
  labelUsg: string;
}

function TabToggle({ active, onSelect, labelBelly, labelUsg }: TabToggleProps) {
  return (
    <View style={{
      flexDirection: 'row', gap: 6,
      backgroundColor: colors.surface.DEFAULT,
      borderRadius: 14, padding: 4,
      borderWidth: 0.5, borderColor: colors.line.DEFAULT,
      marginHorizontal: 20, marginBottom: 20, marginTop: 4,
    }}>
      {(['belly', 'usg'] as const).map((tab) => {
        const isActive = active === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onSelect(tab)}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
              backgroundColor: isActive ? colors.cream.DEFAULT : 'transparent',
              shadowColor: isActive ? '#000' : 'transparent',
              shadowOpacity: isActive ? 0.06 : 0,
              shadowRadius: isActive ? 4 : 0,
              shadowOffset: { width: 0, height: 1 },
              elevation: isActive ? 2 : 0,
            }}
          >
            <Text style={{
              fontSize: 13.5, fontFamily: 'Geist_500Medium',
              color: isActive ? colors.ink.DEFAULT : colors.ink.faint,
            }}>
              {tab === 'belly' ? labelBelly : labelUsg}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── USG WEEK PICKER MODAL ────────────────────────────────────────────────────

interface WeekPickerModalProps {
  visible: boolean;
  maxWeek: number;
  selectedWeek: number;
  onSelect: (week: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  photoCount: number;
  t: ReturnType<typeof useT>;
}

function WeekPickerModal({
  visible, maxWeek, selectedWeek, onSelect, onConfirm, onClose, photoCount, t,
}: WeekPickerModalProps) {
  const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1).reverse();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => undefined} style={{
          backgroundColor: colors.cream.DEFAULT,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingTop: 14, paddingBottom: 32, maxHeight: '80%',
        }}>
          {/* Handle */}
          <View style={{
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: colors.line.DEFAULT, alignSelf: 'center', marginBottom: 18,
          }} />

          <Text style={{
            fontSize: 16, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT,
            paddingHorizontal: 22, marginBottom: 4,
          }}>
            {t.album.usgPickWeek}
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink.soft, paddingHorizontal: 22, marginBottom: 16 }}>
            {photoCount === 1
              ? '1 wybrane zdjęcie'
              : `${photoCount} wybrane zdjęcia`}
          </Text>

          <FlatList
            data={weeks}
            keyExtractor={(w) => String(w)}
            style={{ flexGrow: 0, maxHeight: 280 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 6 }}
            renderItem={({ item: week }) => {
              const isSelected = selectedWeek === week;
              return (
                <Pressable
                  onPress={() => onSelect(week)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 13, borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                    backgroundColor: isSelected ? `${colors.evergreen.DEFAULT}0D` : colors.surface.DEFAULT,
                  }}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                    borderColor: isSelected ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                    backgroundColor: isSelected ? colors.evergreen.DEFAULT : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <Icon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                  </View>
                  <Text style={{
                    fontSize: 14, fontFamily: isSelected ? 'Geist_500Medium' : 'Geist_400Regular',
                    color: isSelected ? colors.evergreen.DEFAULT : colors.ink.DEFAULT,
                  }}>
                    {t.album.weekTitle(week)}
                  </Text>
                </Pressable>
              );
            }}
          />

          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginTop: 16 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 14,
                backgroundColor: colors.surface.DEFAULT,
                borderWidth: 1, borderColor: colors.line.DEFAULT,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.soft }}>
                Anuluj
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={{
                flex: 2, paddingVertical: 14, borderRadius: 14,
                backgroundColor: colors.evergreen.DEFAULT, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#fff' }}>
                {t.album.usgConfirm}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── USG TAB ──────────────────────────────────────────────────────────────────

interface UsgTabProps {
  maxWeek: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  t: ReturnType<typeof useT>;
}

function UsgTab({ maxWeek, cellWidth, cellHeight, gap, t }: UsgTabProps) {
  const { usgPhotos, addUsgPhotos, removeUsgPhoto } = useTrackersStore();
  const [pendingUris, setPendingUris] = useState<string[]>([]);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [pickedWeek, setPickedWeek] = useState(maxWeek);

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.album.noAccess, t.album.noAccessDesc);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPendingUris(result.assets.map((a) => a.uri));
      setPickedWeek(maxWeek);
      setWeekPickerOpen(true);
    }
  };

  const confirmAdd = async () => {
    setWeekPickerOpen(false);
    const items: { uri: string; week: number }[] = [];
    for (const src of pendingUris) {
      const id = `usg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      try {
        const finalUri = await copyToPermanentStorage(src, `${id}.jpg`);
        items.push({ uri: finalUri, week: pickedWeek });
      } catch {
        Alert.alert(t.album.saveErrorTitle, t.album.saveErrorDesc);
      }
    }
    if (items.length > 0) {
      addUsgPhotos(items);
    }
    setPendingUris([]);
  };

  // Group photos by week, sorted descending
  const byWeek: { week: number; photos: UsgPhoto[] }[] = [];
  const seen = new Set<number>();
  [...usgPhotos].sort((a, b) => b.week - a.week || b.addedAt - a.addedAt).forEach((p) => {
    if (!seen.has(p.week)) {
      seen.add(p.week);
      byWeek.push({ week: p.week, photos: [] });
    }
    byWeek.find((g) => g.week === p.week)!.photos.push(p);
  });

  return (
    <>
      {usgPhotos.length === 0 ? (
        <Text style={{ fontSize: 14, color: colors.ink.faint, textAlign: 'center', marginTop: 32, lineHeight: 22 }}>
          {t.album.usgNoPhotos}
        </Text>
      ) : (
        byWeek.map(({ week, photos }) => (
          <View key={week} style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.soft,
              marginBottom: 10, letterSpacing: 0.3,
            }}>
              {t.album.weekTitle(week)}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
              {photos.map((photo) => (
                <View key={photo.id} style={{ width: cellWidth, height: cellHeight }}>
                  <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Usuń zdjęcie?', undefined, [
                        { text: 'Anuluj', style: 'cancel' },
                        { text: 'Usuń', style: 'destructive', onPress: () => removeUsgPhoto(photo.id) },
                      ])
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 26, height: 26, borderRadius: 13,
                      backgroundColor: 'rgba(0,0,0,0.42)',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon name="cross" size={11} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      {/* Add button */}
      <Pressable
        onPress={pickPhotos}
        style={{
          marginTop: 12, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
          borderWidth: 1.5, borderColor: colors.evergreen.DEFAULT,
          borderStyle: 'dashed', backgroundColor: `${colors.evergreen.DEFAULT}08`,
        }}
      >
        <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
          {t.album.usgAddPhotos}
        </Text>
      </Pressable>

      <WeekPickerModal
        visible={weekPickerOpen}
        maxWeek={maxWeek}
        selectedWeek={pickedWeek}
        onSelect={setPickedWeek}
        onConfirm={confirmAdd}
        onClose={() => { setWeekPickerOpen(false); setPendingUris([]); }}
        photoCount={pendingUris.length}
        t={t}
      />
    </>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function AlbumBrzuszkaScreen() {
  const router = useRouter();
  const t = useT();
  const { width } = useWindowDimensions();
  const { albumPhotos, setAlbumPhoto, removeAlbumPhoto } = useTrackersStore();
  const { childDueDate } = useProfileStore();

  const [tab, setTab] = useState<'belly' | 'usg'>('belly');
  const [actionWeek, setActionWeek] = useState<number | null>(null);

  const maxWeek = currentPregnancyWeek(childDueDate);

  const photoForWeek = (week: number) => albumPhotos.find((p) => p.week === week);
  const actionPhoto = actionWeek !== null ? photoForWeek(actionWeek) : null;

  const pickBellyPhoto = async (week: number) => {
    setActionWeek(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.album.noAccess, t.album.noAccessDesc);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const src = result.assets[0].uri;
      try {
        const finalUri = await copyToPermanentStorage(src, `kidelo-album-week-${week}.jpg`);
        setAlbumPhoto(week, finalUri);
      } catch {
        Alert.alert(t.album.saveErrorTitle, t.album.saveErrorDesc);
      }
    }
  };

  const handleBellyDelete = (week: number) => {
    setActionWeek(null);
    removeAlbumPhoto(week);
  };

  const gap = 12;
  const hPad = 20;
  const cellWidth = (width - hPad * 2 - gap) / 2;
  const cellHeight = cellWidth * (4 / 3);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* TopBar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 18, paddingVertical: 14,
          backgroundColor: colors.cream.DEFAULT,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
              borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="back" size={20} color={colors.ink.DEFAULT} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {t.album.title}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Toggle */}
        <TabToggle
          active={tab}
          onSelect={setTab}
          labelBelly={t.album.tabBelly}
          labelUsg={t.album.tabUsg}
        />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'belly' ? (
            <>
              <Text style={{
                fontSize: 14, color: colors.ink.soft, lineHeight: 21,
                marginBottom: 24, marginTop: 4,
              }}>
                {t.album.description}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
                {ALBUM_WEEKS.map((week) => {
                  const photo = photoForWeek(week);
                  return (
                    <View key={week} style={{ width: cellWidth, height: cellHeight }}>
                      <Pressable
                        onPress={() => photo ? setActionWeek(week) : pickBellyPhoto(week)}
                        style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}
                      >
                        {photo ? (
                          <Image
                            source={{ uri: photo.uri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{
                            flex: 1,
                            borderWidth: 1.5,
                            borderColor: colors.line.strong,
                            borderStyle: 'dashed',
                            borderRadius: 14,
                            backgroundColor: colors.surface.DEFAULT,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}>
                            <Icon name="camera" size={30} color={colors.ink.faint} />
                            <Text style={{ fontSize: 13, color: colors.ink.faint }}>
                              {t.album.addPhoto}
                            </Text>
                          </View>
                        )}

                        {/* Tag tygodnia */}
                        <View style={{
                          position: 'absolute', bottom: 10, left: 10,
                          backgroundColor: photo ? 'rgba(0,0,0,0.38)' : colors.evergreen.DEFAULT,
                          borderRadius: 8,
                          paddingHorizontal: 10, paddingVertical: 4,
                        }}>
                          <Text style={{
                            fontSize: 11, fontFamily: 'Geist_500Medium', color: '#F2EEE4',
                          }}>
                            {t.album.week(week)}
                          </Text>
                        </View>
                      </Pressable>

                      {/* X — szybkie usuń */}
                      {photo && (
                        <Pressable
                          onPress={() => handleBellyDelete(week)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 26, height: 26, borderRadius: 13,
                            backgroundColor: 'rgba(0,0,0,0.42)',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Icon name="cross" size={11} color="#fff" />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <UsgTab
              maxWeek={maxWeek}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              gap={gap}
              t={t}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom sheet — akcje na zdjęciu brzuszka */}
      <Modal
        visible={actionWeek !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActionWeek(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setActionWeek(null)} />

          <View style={{
            backgroundColor: colors.cream.DEFAULT,
            borderTopLeftRadius: 26, borderTopRightRadius: 26,
            paddingHorizontal: 22, paddingBottom: 44, paddingTop: 14,
          }}>
            {/* Uchwyt */}
            <View style={{
              width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line.strong,
              alignSelf: 'center', marginBottom: 22,
            }} />

            {/* Miniatura + tytuł */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              {actionPhoto && (
                <View style={{
                  width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
                  borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                }}>
                  <Image
                    source={{ uri: actionPhoto.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'Newsreader_400Regular', fontSize: 20, color: colors.ink.DEFAULT, lineHeight: 24,
                }}>
                  {t.album.weekTitle(actionWeek ?? 0)}
                </Text>
                <Text style={{ fontSize: 12.5, color: colors.ink.faint, marginTop: 3 }}>
                  {t.album.whatToDo}
                </Text>
              </View>
            </View>

            {/* Zmień zdjęcie */}
            <Pressable
              onPress={() => actionWeek !== null && pickBellyPhoto(actionWeek)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 13,
                backgroundColor: colors.surface.DEFAULT,
                borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16,
                marginBottom: 10,
              }}
            >
              <View style={{
                width: 38, height: 38, borderRadius: 11,
                backgroundColor: colors.sage.soft,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="camera" size={18} color={colors.evergreen.DEFAULT} />
              </View>
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                {t.album.changePhoto}
              </Text>
              <View style={{ marginLeft: 'auto' }}>
                <Icon name="chevron" size={16} color={colors.ink.faint} />
              </View>
            </Pressable>

            {/* Usuń zdjęcie */}
            <Pressable
              onPress={() => actionWeek !== null && handleBellyDelete(actionWeek)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 13,
                backgroundColor: colors.terracotta.soft,
                borderWidth: 0.5, borderColor: 'rgba(180,70,50,0.15)',
                borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16,
              }}
            >
              <View style={{
                width: 38, height: 38, borderRadius: 11,
                backgroundColor: 'rgba(180,70,50,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="trash" size={18} color={colors.terracotta.DEFAULT} />
              </View>
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.terracotta.DEFAULT }}>
                {t.album.deletePhoto}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
