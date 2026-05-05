import { useEffect, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import type { TranslationKeys } from '@/lib/i18n';
import { sq } from '@/lib/i18n/sq';
import { useToast } from '@/components/ui/Toast';
import { BrandLogo } from '@/components/BrandLogo';
import { AuroraBackground } from '@/components/AuroraBackground';

const { width: SW } = Dimensions.get('window');

// Login screen is locked to Albanian regardless of the user's saved locale —
// `useI18n()` would respect the global preference, so we read directly from sq.
const t = (key: TranslationKeys): string => (sq[key] as string | undefined) ?? key;

export default function LoginScreen() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Continuous shimmer sweep across the sign-in button.
  const sheen = useSharedValue(0);
  useEffect(() => {
    sheen.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.linear }),
      -1,
      false
    );
  }, [sheen]);
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SW * 0.4 + sheen.value * SW * 1.2 }],
  }));

  // Press-down feedback.
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  const onPressIn = () => {
    pressScale.value = withTiming(0.97, { duration: 80 });
  };
  const onPressOut = () => {
    pressScale.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
  };

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      toast.error(t('login_required_fields'));
      return;
    }
    setSubmitting(true);
    try {
      const session = await login(email.trim(), password);
      if (session.user.must_change_password) {
        router.replace('/(auth)/change-password');
      } else {
        router.replace((session.role?.default_route || '/admin/dashboard') as any);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('login_invalid'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <AuroraBackground />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 56,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(700)} style={{ alignItems: 'center' }}>
            <BrandLogo size={56} />
            <Text
              style={{
                marginTop: 24,
                color: 'white',
                fontSize: 26,
                fontWeight: '600',
                letterSpacing: -0.4,
              }}
            >
              {t('app_name')}
            </Text>
            <Text style={{ marginTop: 6, color: '#94a3b8', fontSize: 14 }}>{t('login_subtitle')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={{ marginTop: 48, gap: 12 }}>
            <View style={fieldRowStyle}>
              <Mail size={18} color="rgba(255,255,255,0.55)" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('email')}
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={fieldInputStyle}
              />
            </View>
            <View style={fieldRowStyle}>
              <Lock size={18} color="rgba(255,255,255,0.55)" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('password')}
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCapitalize="none"
                secureTextEntry
                style={fieldInputStyle}
              />
            </View>

            <Animated.View
              style={[
                {
                  marginTop: 8,
                  height: 56,
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  elevation: 10,
                },
                pressStyle,
              ]}
            >
              <Pressable
                onPress={onSubmit}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#38bdf8', '#0ea5e9', '#0284c7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  }}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    { position: 'absolute', top: 0, bottom: 0, width: SW * 0.4 },
                    sheenStyle,
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 }}>
                    {t('login_button')}
                  </Text>
                  <ArrowRight size={18} color="white" />
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pinned slogan — sits over the aurora bottom vignette, doesn't scroll. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: insets.bottom + 16,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 12,
            fontStyle: 'italic',
            letterSpacing: 0.3,
          }}
        >
          Thjeshtësi që ju frymëzon
        </Text>
      </View>
    </View>
  );
}

// Black-tinted glass row that hosts a leading icon + the TextInput.
const fieldRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  height: 52,
  borderRadius: 14,
  paddingHorizontal: 16,
  backgroundColor: 'rgba(0,0,0,0.45)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.18)',
};

const fieldInputStyle = {
  flex: 1,
  height: '100%' as const,
  color: '#ffffff',
  fontSize: 15,
};
