import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, Modal, Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';

import { Icon } from '@/components/ui';
import { useTrackersStore } from '@/stores/trackers';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

const ALBUM_WEEKS = Array.from({ length: 40 }, (_, i) => i + 1);

export default function AlbumBrzuszkaScreen() {
  const router = useRouter();
  const t = useT();
  const { width } = useWindowDimensions();
  const { albumPhotos, setAlbumPhoto, removeAlbumPhoto } = useTrackersStore();

  const [actionWeek, setActionWeek] = useState<number | null>(null);

  const photoForWeek = (week: number) => albumPhotos.find((p) => p.week === week);
  const actionPhoto = actionWeek !== null ? photoForWeek(actionWeek) : null;

  const pickPhoto = async (week: number) => {
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
      const dest = `${documentDirectory ?? ''}kidelo-album-week-${week}.jpg`;
      try {
        await copyAsync({ from: src, to: dest });
        setAlbumPhoto(week, dest);
      } catch {
        setAlbumPhoto(week, src);
      }
    }
  };

  const handleDelete = (week: number) => {
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

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
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
                    onPress={() => photo ? setActionWeek(week) : pickPhoto(week)}
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
                      onPress={() => handleDelete(week)}
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
        </ScrollView>
      </SafeAreaView>

      {/* Bottom sheet — akcje na zdjęciu */}
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
              onPress={() => actionWeek !== null && pickPhoto(actionWeek)}
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
              onPress={() => actionWeek !== null && handleDelete(actionWeek)}
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
