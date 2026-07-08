import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { formatTime } from '@/lib/format';
import { useCurrentUser, useData } from '@/store';
import type { Message } from '@/types';
import { font, fontSize, radius, spacing, useTheme } from '@/theme';

export default function DiscussionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useCurrentUser();
  const conversation = useData((s) => s.conversations.find((c) => c.id === id));
  const messages = useData((s) => s.messages);
  const sendMessage = useData((s) => s.sendMessage);
  const markConversationRead = useData((s) => s.markConversationRead);
  const [draft, setDraft] = useState('');

  const convMessages = useMemo(
    () =>
      messages
        .filter((m) => m.conversationId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [messages, id],
  );

  useEffect(() => {
    if (id && user) markConversationRead(id, user.id);
  }, [id, user, markConversationRead]);

  if (!conversation || !user || !conversation.participantIds.includes(user.id)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack.Screen options={{ title: 'Discussion' }} />
        <EmptyState icon="chatbubbles-outline" title="Discussion introuvable" />
      </View>
    );
  }

  const isGroup = conversation.kind === 'group';

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(conversation.id, user.id, user.name, text);
    setDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: conversation.title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}>
        <FlatList
          data={convMessages}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <Bubble message={item} own={item.senderId === user.id} showSender={isGroup} />}
          ListEmptyComponent={
            // La liste est inversée (scaleY -1) : on remet le composant vide à l'endroit.
            <View style={{ transform: [{ scaleY: -1 }], paddingTop: spacing['5xl'] }}>
              <EmptyState icon="chatbubble-ellipses-outline" title="Démarrez la discussion" message="Envoyez le premier message à votre équipe." />
            </View>
          }
        />

        {/* Barre de saisie */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.bgElevated,
          }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surfaceAlt,
              borderRadius: radius.xl,
              paddingHorizontal: spacing.lg,
              paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.xs,
              maxHeight: 120,
            }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Votre message…"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ color: colors.text, fontFamily: font.regular, fontSize: fontSize.base, maxHeight: 100 }}
            />
          </View>
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Envoyer le message"
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.full,
              backgroundColor: draft.trim() ? colors.primary : colors.surfaceSunken,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="send" size={20} color={draft.trim() ? colors.onPrimary : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ message, own, showSender }: { message: Message; own: boolean; showSender: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: own ? 'flex-end' : 'flex-start' }}>
      <View style={{ maxWidth: '80%' }}>
        {showSender && !own ? (
          <Text variant="caption" color="primary" style={{ marginLeft: spacing.md, marginBottom: 2 }}>
            {message.senderName}
          </Text>
        ) : null}
        <View
          style={{
            backgroundColor: own ? colors.primary : colors.surface,
            borderWidth: own ? 0 : 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderBottomRightRadius: own ? radius.xs : radius.lg,
            borderBottomLeftRadius: own ? radius.lg : radius.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}>
          <Text style={{ color: own ? colors.onPrimary : colors.text, fontFamily: font.regular, fontSize: fontSize.base, lineHeight: 21 }}>
            {message.text}
          </Text>
        </View>
        <Text variant="caption" muted style={{ alignSelf: own ? 'flex-end' : 'flex-start', marginTop: 2, marginHorizontal: spacing.sm }}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}
