import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/Text';
import { relativeTime } from '@/lib/format';
import { useCurrentUser, useData } from '@/store';
import type { Conversation, Message } from '@/types';
import { radius, spacing, useTheme } from '@/theme';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const conversations = useData((s) => s.conversations);
  const messages = useData((s) => s.messages);
  const employees = useData((s) => s.employees);
  const [query, setQuery] = useState('');

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const rows = useMemo(() => {
    const byConv = new Map<string, Message[]>();
    for (const m of messages) {
      const arr = byConv.get(m.conversationId);
      if (arr) arr.push(m);
      else byConv.set(m.conversationId, [m]);
    }
    const visible = conversations.filter((c) => (user ? c.participantIds.includes(user.id) : false));
    const list = visible.map((conv) => {
      const msgs = (byConv.get(conv.id) ?? []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => !m.read && m.senderId !== user?.id).length;
      return { conv, last, unread, ts: last ? new Date(last.createdAt).getTime() : 0 };
    });
    return list.sort((a, b) => b.ts - a.ts);
  }, [conversations, messages, user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.conv.title.toLowerCase().includes(q) || (r.last?.text ?? '').toLowerCase().includes(q));
  }, [rows, query]);

  const emojiFor = (conv: Conversation): string | undefined => {
    if (conv.emoji) return conv.emoji;
    if (conv.kind === 'direct') {
      const otherId = conv.participantIds.find((id) => id !== user?.id) ?? conv.participantIds[0];
      return empById.get(otherId)?.emoji;
    }
    return undefined;
  };

  return (
    <Screen header={<AppHeader title="Messages" subtitle="Votre équipe" />}>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher une discussion…" style={{ marginBottom: spacing.lg }} />

      {filtered.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="Aucune discussion" message="Vos conversations avec l'équipe apparaîtront ici." />
      ) : (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {filtered.map((r, i) => {
            const preview = r.last
              ? `${r.last.senderId === user?.id ? 'Vous' : r.last.senderName.split(' ')[0]} : ${r.last.text}`
              : 'Aucun message';
            return (
              <Pressable
                key={r.conv.id}
                onPress={() => router.push('/discussion/' + r.conv.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Avatar name={r.conv.title} emoji={emojiFor(r.conv)} size={50} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodySemibold" numberOfLines={1} style={{ flex: 1 }}>
                      {r.conv.title}
                    </Text>
                    {r.last ? (
                      <Text variant="caption" muted style={{ marginLeft: spacing.sm }}>
                        {relativeTime(r.last.createdAt)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 }}>
                    <Text variant="small" secondary={r.unread === 0} numberOfLines={1} style={{ flex: 1 }} color={r.unread > 0 ? 'text' : undefined}>
                      {preview}
                    </Text>
                    {r.unread > 0 ? (
                      <View
                        style={{
                          minWidth: 20,
                          height: 20,
                          borderRadius: radius.full,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 6,
                        }}>
                        <Text variant="caption" style={{ color: colors.onPrimary }}>
                          {r.unread}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
