/**
 * NotatkiScreen.tsx — notatki rodziców podzielone na 5 kategorii.
 *
 * Układ klawiatury:
 *   - SafeAreaView edges=['top'] → wysuwa treść poniżej status baru
 *   - KeyboardAvoidingView bezpośrednio pod SafeAreaView
 *     iOS:     behavior="padding", offset = wysokość tab bara (content + safeArea.bottom)
 *     Android: behavior="height", offset = 0
 *   - Input bar bez dodatkowego SafeAreaView (tab bar obsługuje dół)
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

import { Icon } from '@/components/ui';
import { colors } from '@/theme/tokens';
import {
  useNotesStore,
  NOTE_CATEGORIES,
  type CategoryId,
  type NoteItem,
} from '@/stores/notes';

const TAB_CONTENT_HEIGHT = 56; // musi być zgodne z _layout.tsx

export default function NotatkiScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('mysli');
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { notes, addNote, toggleDone, deleteNote } = useNotesStore();

  const currentCategory = NOTE_CATEGORIES.find((c) => c.id === activeCategory)!;
  const visibleNotes = notes.filter((n) => n.categoryId === activeCategory);
  const activeNotes = visibleNotes.filter((n) => !n.done);
  const doneNotes = visibleNotes.filter((n) => n.done);

  const handleAdd = () => {
    if (!inputText.trim()) return;
    addNote(activeCategory, inputText);
    setInputText('');
    inputRef.current?.focus();
  };

  // Na iOS klawiaturaHeight raportowana jest od dolnej krawędzi ekranu,
  // więc KAV musi odjąć wysokość tab bara żeby nie "przepychać" za dużo.
  const kbOffset = Platform.OS === 'ios' ? TAB_CONTENT_HEIGHT + insets.bottom : 0;

  return (
    // Pełnoekranowy kontener — bg ustawiony tutaj, nie wewnątrz KAV
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {/* Tylko top — dół obsługuje tab bar */}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={kbOffset}
        >

          {/* Nagłówek */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
            <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 30, color: colors.ink.DEFAULT, lineHeight: 34 }}>
              Notatki
            </Text>
            <Text style={{ fontSize: 13, color: colors.ink.faint, marginTop: 4 }}>
              {notes.length > 0
                ? `${notes.filter((n) => !n.done).length} do zrobienia · ${notes.filter((n) => n.done).length} zrealizowanych`
                : 'Zacznij pisać…'}
            </Text>
          </View>

          {/* Kategorie */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            style={{ maxHeight: 48, marginBottom: 16, flexShrink: 0 }}
          >
            {NOTE_CATEGORIES.map((cat) => {
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
                    backgroundColor: isSelected ? colors.evergreen.DEFAULT : colors.surface.DEFAULT,
                    borderColor: isSelected ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={{
                    fontSize: 13,
                    fontFamily: 'Geist_500Medium',
                    color: isSelected ? colors.cream.DEFAULT : colors.ink.DEFAULT,
                  }}>
                    {cat.label}
                  </Text>
                  {catActive > 0 && (
                    <View style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      alignItems: 'center', justifyContent: 'center',
                      paddingHorizontal: 4,
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${colors.evergreen.DEFAULT}22`,
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontFamily: 'Geist_500Medium',
                        color: isSelected ? colors.cream.DEFAULT : colors.evergreen.DEFAULT,
                      }}>
                        {catActive}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Lista notatek — flex:1 żeby wypełnić dostępną przestrzeń */}
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
                        Zrealizowane ({doneNotes.length})
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

          {/* Pasek dodawania — przyklejony do dołu KAV.
              KAV podnosi go nad klawiaturę — BRAK dodatkowej SafeAreaView. */}
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
                placeholder={`Dodaj do "${currentCategory.label}"…`}
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
                backgroundColor: inputText.trim() ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
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

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ============ NOTE CARD ============

function NoteCard({
  note,
  isFirst,
  onToggle,
  onDelete,
}: {
  note: NoteItem;
  isFirst: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isDone = note.done;

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
      {/* Pinezka */}
      <View style={{ marginTop: 2, flexShrink: 0 }}>
        <Icon
          name="pin"
          size={16}
          color={isDone ? colors.ink.faint : colors.evergreen.DEFAULT}
        />
      </View>

      {/* Tekst */}
      <Pressable
        style={{ flex: 1 }}
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8 }}
      >
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
          {formatDate(note.createdAt)}
        </Text>
      </Pressable>

      {/* Przyciski */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1, flexShrink: 0 }}>
        <Pressable
          onPress={onToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          style={{
            width: 32, height: 32, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDone ? `${colors.evergreen.DEFAULT}18` : colors.surface.DEFAULT,
            borderWidth: isDone ? 0 : 1,
            borderColor: colors.line.DEFAULT,
          }}
        >
          <Icon
            name="check"
            size={14}
            color={isDone ? colors.evergreen.DEFAULT : colors.ink.faint}
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
  return (
    <Pressable
      onPress={onPress}
      style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{category.emoji}</Text>
      <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 16, color: colors.ink.DEFAULT, marginBottom: 4 }}>
        Brak notatek
      </Text>
      <Text style={{ fontSize: 13, color: colors.ink.faint, textAlign: 'center', lineHeight: 20 }}>
        {'Dotknij poniżej, aby dodać\npierwszą notatkę w tej kategorii'}
      </Text>
      <View style={{
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: `${colors.evergreen.DEFAULT}18`,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
      }}>
        <Icon name="plus" size={14} color={colors.evergreen.DEFAULT} strokeWidth={2} />
        <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
          Dodaj notatkę
        </Text>
      </View>
    </Pressable>
  );
}

// ============ HELPERS ============

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
