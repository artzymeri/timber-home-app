import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
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
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { BrandLogo } from '@/components/BrandLogo';

const { width: SW, height: SH } = Dimensions.get('window');
const LOGO = require('@/assets/icon.png');

interface FloatSpec {
  startX: number; // 0..1 fraction of screen width
  dx: number; // horizontal drift in px while ascending — sets the angle
  rotate: number; // initial rotation in degrees
  size: number;
  duration: number; // ms for one full bottom-to-top traversal
  delay: number; // staggered start
}

// Pre-distributed positions/angles/sizes/timings so the field reads as evenly
// random rather than a regular grid. Same Timber Home logo across all of them.
const FLOATERS: FloatSpec[] = [
  { startX: 0.06, dx: 28, rotate: -8, size: 38, duration: 18000, delay: 0 },
  { startX: 0.22, dx: -32, rotate: 14, size: 48, duration: 22000, delay: 3200 },
  { startX: 0.4, dx: 18, rotate: -4, size: 36, duration: 24000, delay: 6500 },
  { startX: 0.58, dx: -24, rotate: 6, size: 52, duration: 20000, delay: 1800 },
  { startX: 0.74, dx: 32, rotate: 0, size: 42, duration: 26000, delay: 9000 },
  { startX: 0.88, dx: -22, rotate: -10, size: 36, duration: 23000, delay: 4400 },
  { startX: 0.14, dx: -18, rotate: 8, size: 46, duration: 21000, delay: 11000 },
  { startX: 0.32, dx: 26, rotate: -6, size: 40, duration: 25000, delay: 14500 },
  { startX: 0.5, dx: -30, rotate: 12, size: 44, duration: 19000, delay: 7500 },
  { startX: 0.66, dx: 22, rotate: -4, size: 36, duration: 27000, delay: 12500 },
  { startX: 0.82, dx: -16, rotate: 4, size: 56, duration: 22000, delay: 5500 },
  { startX: 0.04, dx: 24, rotate: -12, size: 42, duration: 28000, delay: 16500 },
  { startX: 0.46, dx: 14, rotate: 10, size: 34, duration: 24000, delay: 9500 },
  { startX: 0.72, dx: -28, rotate: -6, size: 48, duration: 21000, delay: 13500 },
  { startX: 0.18, dx: 20, rotate: 16, size: 38, duration: 25500, delay: 18000 },
  { startX: 0.62, dx: -18, rotate: -8, size: 40, duration: 23500, delay: 2500 },
  { startX: 0.86, dx: 14, rotate: 6, size: 36, duration: 26500, delay: 8000 },
  { startX: 0.36, dx: -22, rotate: -14, size: 44, duration: 20500, delay: 15500 },
];

function Floater({ startX, dx, rotate, size, duration, delay }: FloatSpec) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
  }, [progress, duration, delay]);

  const style = useAnimatedStyle(() => {
    const ty = interpolate(progress.value, [0, 1], [SH + size, -size * 2]);
    const tx = progress.value * dx;
    const opacity = interpolate(
      progress.value,
      [0, 0.15, 0.85, 1],
      [0, 0.08, 0.08, 0]
    );
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: SW * startX, top: 0 },
        style,
      ]}
    >
      <Image source={LOGO} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useI18n();
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
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      {/* Drifting Timber Home brand marks at low opacity */}
      {FLOATERS.map((f, i) => (
        <Floater key={i} {...f} />
      ))}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 24,
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
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('email')}
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={fieldStyle}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('password')}
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              secureTextEntry
              style={fieldStyle}
            />

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
    </View>
  );
}

const fieldStyle = {
  height: 52,
  borderRadius: 14,
  paddingHorizontal: 16,
  color: 'white',
  fontSize: 15,
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
};
