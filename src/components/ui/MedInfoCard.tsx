import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

interface MedInfoCardProps {
  title: string;
  items: string[];
  warning?: string;
}

export function MedInfoCard({ title, items, warning }: MedInfoCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ backgroundColor: '#E6EDEA', borderRadius: 16, overflow: 'hidden' }}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 16, paddingVertical: 13,
        }}
      >
        <Icon name="info" size={16} color={colors.evergreen.DEFAULT} />
        <Text style={{
          flex: 1, fontSize: 13.5, fontFamily: 'Geist_500Medium',
          color: colors.evergreen.DEFAULT,
        }}>
          {title}
        </Text>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon name="chevronDown" size={16} color={colors.evergreen.DEFAULT} />
        </View>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <View style={{ gap: 7 }}>
            {items.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{
                  fontSize: 13.5, color: '#41614C', marginTop: 1, lineHeight: 20,
                }}>
                  {'·'}
                </Text>
                <Text style={{
                  flex: 1, fontSize: 13.5, color: colors.ink.DEFAULT, lineHeight: 20,
                }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
          {warning && (
            <View style={{
              flexDirection: 'row', gap: 9, alignItems: 'flex-start',
              backgroundColor: colors.terracotta.soft, borderRadius: 12,
              padding: 11, marginTop: 10,
            }}>
              <Icon name="info" size={15} color={colors.terracotta.DEFAULT} />
              <Text style={{
                flex: 1, fontSize: 13, color: colors.ink.DEFAULT, lineHeight: 19,
              }}>
                {warning}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
