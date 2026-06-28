/**
 * PartnerScreen.tsx — widok partnera.
 *
 * Sekcje:
 *   - Nagłówek z awatarem (bez tła z kobietą)
 *   - 4 zakładki notatek: Przemyślenia / Co kupić / Notatki / Dla dziecka
 *   - Statyczna karta "Urlopy ojca" z info z Kodeksu Pracy
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { useProfileStore } from '@/stores/profile';
import { useT } from '@/i18n';
import { useLanguageStore } from '@/stores/language';
import {
  usePartnerNotesStore,
  PARTNER_CATEGORIES,
  type PartnerCategoryId,
  type PartnerNoteItem,
} from '@/stores/partner-notes';

const TAB_CONTENT_HEIGHT = 56;

interface LeaveCard {
  title: string;
  emoji: string;
  days: string;
  pay: string;
  note: string;
  color: string;
}

// ============ EKRAN ============

export default function PartnerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useProfileStore();
  const t = useT();
  const [activeCategory, setActiveCategory] = useState<PartnerCategoryId | 'urlopy'>('przemyslenia');
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { notes, addNote, toggleDone, deleteNote } = usePartnerNotesStore();

  const partnerInitial = (profile.partnerName?.[0] ?? 'P').toUpperCase();
  const partnerName = profile.partnerName || 'Partner';

  const currentCategory = (PARTNER_CATEGORIES.find((c) => c.id === activeCategory)
    ?? PARTNER_CATEGORIES[0])!;
  const lang = useLanguageStore((s) => s.lang);
  const visibleNotes = activeCategory !== 'urlopy'
    ? notes.filter((n) => n.categoryId === (activeCategory as PartnerCategoryId))
    : [];
  const activeNotes = visibleNotes.filter((n) => !n.done);
  const doneNotes = visibleNotes.filter((n) => n.done);
  const totalActive = notes.filter((n) => !n.done).length;

  const handleAdd = () => {
    if (!inputText.trim()) return;
    addNote(activeCategory as PartnerCategoryId, inputText);
    setInputText('');
    inputRef.current?.focus();
  };

  const kbOffset = Platform.OS === 'ios' ? TAB_CONTENT_HEIGHT + insets.bottom : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={kbOffset}
        >
          {/* Nagłówek */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 20,
            gap: 14,
          }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.surface.DEFAULT,
                borderWidth: 1, borderColor: colors.line.DEFAULT,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="back" size={18} color={colors.ink.soft} />
            </Pressable>

            {/* Awatar partnera */}
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: colors.terracotta.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{
                fontFamily: 'Newsreader_400Regular',
                fontSize: 22,
                color: colors.cream.DEFAULT,
              }}>
                {partnerInitial}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'Newsreader_400Regular',
                fontSize: 22,
                color: colors.ink.DEFAULT,
                lineHeight: 26,
              }}>
                {partnerName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 2 }}>
                {totalActive > 0
                  ? t.partner.activeNotes(totalActive)
                  : t.partner.noNotes}
              </Text>
            </View>
          </View>

          {/* Zakładki kategorii */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            style={{ maxHeight: 48, marginBottom: 16, flexShrink: 0 }}
          >
            {/* Zakładka statyczna: Urlopy ojca — 1. miejsce */}
            <Pressable
              onPress={() => setActiveCategory('urlopy' as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 99,
                borderWidth: 1,
                backgroundColor: (activeCategory as string) === 'urlopy' ? colors.evergreen.DEFAULT : colors.surface.DEFAULT,
                borderColor: (activeCategory as string) === 'urlopy' ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
              }}
            >
              <Text style={{ fontSize: 14 }}>📋</Text>
              <Text style={{
                fontSize: 13,
                fontFamily: 'Geist_500Medium',
                color: (activeCategory as string) === 'urlopy' ? colors.cream.DEFAULT : colors.ink.DEFAULT,
              }}>
                {t.partner.fatherLeave}
              </Text>
            </Pressable>

            {PARTNER_CATEGORIES.map((cat) => {
              const catActive = notes.filter((n) => n.categoryId === cat.id && !n.done).length;
              const isSelected = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 99,
                    borderWidth: 1,
                    backgroundColor: isSelected ? colors.terracotta.DEFAULT : colors.surface.DEFAULT,
                    borderColor: isSelected ? colors.terracotta.DEFAULT : colors.line.DEFAULT,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={{
                    fontSize: 13,
                    fontFamily: 'Geist_500Medium',
                    color: isSelected ? colors.cream.DEFAULT : colors.ink.DEFAULT,
                  }}>
                    {getPartnerCategoryLabel(cat.id, t)}
                  </Text>
                  {catActive > 0 && (
                    <View style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      alignItems: 'center', justifyContent: 'center',
                      paddingHorizontal: 4,
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${colors.terracotta.DEFAULT}22`,
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontFamily: 'Geist_500Medium',
                        color: isSelected ? colors.cream.DEFAULT : colors.terracotta.DEFAULT,
                      }}>
                        {catActive}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Treść */}
          {(activeCategory as string) === 'urlopy' ? (
            <LeaveInfoView />
          ) : (
            <>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {visibleNotes.length === 0 ? (
                  <EmptyState category={currentCategory} onPress={() => inputRef.current?.focus()} />
                ) : (
                  <>
                    {activeNotes.map((note, i) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isFirst={i === 0}
                        onToggle={() => toggleDone(note.id)}
                        onDelete={() => deleteNote(note.id)}
                      />
                    ))}

                    {doneNotes.length > 0 && (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 }}>
                          <View style={{ flex: 1, height: 1, backgroundColor: colors.line.DEFAULT }} />
                          <Text style={{ fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            {t.partner.doneSectionLabel(doneNotes.length)}
                          </Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: colors.line.DEFAULT }} />
                        </View>
                        {doneNotes.map((note, i) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            isFirst={i === 0}
                            onToggle={() => toggleDone(note.id)}
                            onDelete={() => deleteNote(note.id)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </ScrollView>

              {/* Pasek dodawania */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderTopWidth: 0.5,
                borderTopColor: colors.line.DEFAULT,
                backgroundColor: colors.cream.DEFAULT,
              }}>
                <View style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.surface.DEFAULT,
                  borderWidth: 1,
                  borderColor: colors.line.DEFAULT,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                }}>
                  <Text style={{ fontSize: 16 }}>{currentCategory.emoji}</Text>
                  <TextInput
                    ref={inputRef}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: colors.ink.DEFAULT,
                      fontFamily: 'Geist_400Regular',
                      padding: 0,
                      margin: 0,
                    }}
                    placeholder={getPartnerCategoryPlaceholder(currentCategory.id, t)}
                    placeholderTextColor={colors.ink.faint}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleAdd}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    multiline={false}
                  />
                  {inputText.length > 0 && (
                    <Pressable
                      onPress={() => setInputText('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="cross" size={14} color={colors.ink.faint} />
                    </Pressable>
                  )}
                </View>

                <Pressable
                  onPress={handleAdd}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: inputText.trim() ? colors.terracotta.DEFAULT : colors.line.DEFAULT,
                  }}
                >
                  <Icon
                    name="plus"
                    size={20}
                    color={inputText.trim() ? colors.cream.DEFAULT : colors.ink.faint}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            </>
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ============ WIDOK URLOPÓW ============

function getPartnerCategoryLabel(id: PartnerCategoryId, t: ReturnType<typeof useT>): string {
  const map: Record<PartnerCategoryId, string> = {
    przemyslenia: t.partner.categoryPrzemyslenia,
    zakupy: t.partner.categoryZakupy,
    notatki: t.partner.categoryNotatki,
    dziecko: t.partner.categoryDziecko,
  };
  return map[id] ?? id;
}

function getPartnerCategoryPlaceholder(id: PartnerCategoryId, t: ReturnType<typeof useT>): string {
  const map: Record<PartnerCategoryId, string> = {
    przemyslenia: t.partner.placeholderPrzemyslenia,
    zakupy: t.partner.placeholderZakupy,
    notatki: t.partner.placeholderNotatki,
    dziecko: t.partner.placeholderDziecko,
  };
  return map[id] ?? '';
}

function LeaveInfoView() {
  const t = useT();
  const LEAVE_CARDS: LeaveCard[] = [
    {
      title: t.partner.leaveOkolicznosciowyTitle,
      emoji: '🎉',
      days: t.partner.leaveDays2,
      pay: t.partner.pay100pct,
      note: t.partner.leaveOkolicznosciowyNote,
      color: colors.sage.soft,
    },
    {
      title: t.partner.leaveOjcowskiTitle,
      emoji: '👨',
      days: t.partner.leaveWeeks2,
      pay: t.partner.pay100pct,
      note: t.partner.leaveOjcowskiNote,
      color: colors.blush.soft,
    },
    {
      title: t.partner.leaveTacierzynskiTitle,
      emoji: '🤝',
      days: t.partner.leaveWeeksMax6,
      pay: t.partner.pay10081,
      note: t.partner.leaveTacierzynskiNote,
      color: colors.mustard.soft,
    },
    {
      title: t.partner.leaveRodzicielskiTitle,
      emoji: '🏠',
      days: t.partner.leaveWeeks9,
      pay: t.partner.pay70pct,
      note: t.partner.leaveRodzicielskiNote,
      color: colors.sage.soft,
    },
    {
      title: t.partner.leaveOpiekaTitle,
      emoji: '🩺',
      days: t.partner.leaveDaysYear2,
      pay: t.partner.pay100pct,
      note: t.partner.leaveOpiekaNote,
      color: colors.blush.soft,
    },
    {
      title: t.partner.leaveSilaWyszaTitle,
      emoji: '⚡',
      days: t.partner.leaveDaysH16Year,
      pay: t.partner.pay50pct,
      note: t.partner.leaveSilaWyszaNote,
      color: colors.mustard.soft,
    },
  ];
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Intro */}
      <View style={{
        backgroundColor: colors.evergreen.DEFAULT,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
      }}>
        <Text style={{
          fontFamily: 'Newsreader_400Regular',
          fontSize: 20,
          color: colors.cream.DEFAULT,
          marginBottom: 6,
        }}>
          {t.partner.fatherRights}
        </Text>
        <Text style={{ fontSize: 13, color: `${colors.cream.DEFAULT}CC`, lineHeight: 20 }}>
          {t.partner.fatherRightsDesc}
        </Text>
      </View>

      {/* Karty urlopów */}
      {LEAVE_CARDS.map((card, i) => (
        <View
          key={i}
          style={{
            backgroundColor: card.color,
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{card.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'Geist_500Medium',
                fontSize: 14,
                color: colors.ink.DEFAULT,
              }}>
                {card.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
                <View style={{
                  backgroundColor: colors.evergreen.DEFAULT,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: 11, color: colors.cream.DEFAULT, fontFamily: 'Geist_500Medium' }}>
                    {card.days}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: `${colors.evergreen.DEFAULT}22`,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: 11, color: colors.evergreen.DEFAULT, fontFamily: 'Geist_500Medium' }}>
                    {card.pay}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: colors.ink.soft, lineHeight: 19 }}>
            {card.note}
          </Text>
        </View>
      ))}

      {/* Podsumowanie combo */}
      <View style={{
        backgroundColor: colors.terracotta.soft,
        borderRadius: 14,
        padding: 16,
        marginTop: 6,
        borderWidth: 1,
        borderColor: `${colors.terracotta.DEFAULT}40`,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 22 }}>🏆</Text>
          <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 15, color: colors.ink.DEFAULT }}>
            {t.partner.leaveCombo}
          </Text>
        </View>
        <Text style={{
          fontFamily: 'Newsreader_400Regular',
          fontSize: 28,
          color: colors.terracotta.DEFAULT,
          marginBottom: 6,
        }}>
          {t.partner.leaveTotalDays}
        </Text>
        <Text style={{ fontSize: 12, color: colors.ink.soft, lineHeight: 18 }}>
          {t.partner.leaveComboNote}
        </Text>
      </View>

      {/* Dodatkowe info */}
      <View style={{
        marginTop: 14,
        padding: 14,
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.line.DEFAULT,
      }}>
        <Text style={{ fontSize: 12, color: colors.ink.soft, lineHeight: 19, textAlign: 'center' }}>
          {t.partner.remoteTip}
        </Text>
      </View>

      <View style={{
        marginTop: 10,
        padding: 14,
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.line.DEFAULT,
      }}>
        <Text style={{ fontSize: 12, color: colors.ink.soft, lineHeight: 19, textAlign: 'center' }}>
          {t.partner.militaryTip}
        </Text>
      </View>
    </ScrollView>
  );
}

// ============ NOTE CARD ============

function NoteCard({
  note,
  isFirst,
  onToggle,
  onDelete,
}: {
  note: PartnerNoteItem;
  isFirst: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isDone = note.done;
  const lang = useLanguageStore((s) => s.lang);
  const dateLocale = lang === 'en' ? 'en-GB' : 'pl-PL';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderTopWidth: isFirst ? 0 : 0.5,
      borderTopColor: colors.line.DEFAULT,
    }}>
      <View style={{ marginTop: 2, flexShrink: 0 }}>
        <Icon
          name="pin"
          size={16}
          color={isDone ? colors.ink.faint : colors.terracotta.DEFAULT}
        />
      </View>

      <Pressable style={{ flex: 1 }} onPress={onToggle} hitSlop={{ top: 8, bottom: 8 }}>
        <Text style={{
          fontSize: 14,
          lineHeight: 20,
          fontFamily: 'Geist_400Regular',
          color: isDone ? colors.ink.faint : colors.ink.DEFAULT,
          textDecorationLine: isDone ? 'line-through' : 'none',
        }}>
          {note.text}
        </Text>
        <Text style={{ fontSize: 10, color: colors.ink.faint, marginTop: 3 }}>
          {formatDate(note.createdAt, dateLocale)}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1, flexShrink: 0 }}>
        <Pressable
          onPress={onToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          style={{
            width: 32, height: 32, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDone ? `${colors.terracotta.DEFAULT}18` : colors.surface.DEFAULT,
            borderWidth: isDone ? 0 : 1,
            borderColor: colors.line.DEFAULT,
          }}
        >
          <Icon
            name="check"
            size={14}
            color={isDone ? colors.terracotta.DEFAULT : colors.ink.faint}
            strokeWidth={isDone ? 2.2 : 1.6}
          />
        </Pressable>

        <Pressable
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="trash" size={14} color={colors.ink.faint} />
        </Pressable>
      </View>
    </View>
  );
}

// ============ EMPTY STATE ============

function EmptyState({
  category,
  onPress,
}: {
  category: { emoji: string; label: string };
  onPress: () => void;
}) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{category.emoji}</Text>
      <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 16, color: colors.ink.DEFAULT, marginBottom: 4 }}>
        {t.partner.noNotesEmpty}
      </Text>
      <Text style={{ fontSize: 13, color: colors.ink.faint, textAlign: 'center', lineHeight: 20 }}>
        {t.partner.tapToAdd}
      </Text>
      <View style={{
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: `${colors.terracotta.DEFAULT}18`,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
      }}>
        <Icon name="plus" size={14} color={colors.terracotta.DEFAULT} strokeWidth={2} />
        <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.terracotta.DEFAULT }}>
          {t.partner.addNote}
        </Text>
      </View>
    </Pressable>
  );
}

// ============ HELPERS ============

function formatDate(ts: number, locale: string): string {
  try {
    return new Date(ts).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
