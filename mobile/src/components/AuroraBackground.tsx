import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW, height: SH } = Dimensions.get('window');
// Diagonal bands need to be wider than the screen so rotation doesn't expose
// their straight edges along the screen border.
const BAND_W = Math.max(SW, SH) * 1.6;
const BAND_H = Math.max(SW, SH) * 0.55;

interface BandSpec {
  /** Anchor y position (px) on the screen; the band drifts ±travel around it. */
  y: number;
  /** Rotation in degrees so bands flow diagonally rather than horizontally. */
  rotate: number;
  /** Animation duration in ms (one full sweep). */
  duration: number;
  /** Stagger so bands don't sync. */
  delay: number;
  /** How far the band travels (px) along its rotated axis. */
  travel: number;
  /** Peak teal opacity at the band's center. */
  intensity: number;
}

// 5 bands at varied speeds + offsets — feels like a slow aurora rather than
// a regular grid pattern.
const BANDS: BandSpec[] = [
  { y: SH * 0.05, rotate: -22, duration: 14000, delay: 0,    travel: SH * 0.18, intensity: 0.55 },
  { y: SH * 0.22, rotate: -18, duration: 17000, delay: 2400, travel: SH * 0.22, intensity: 0.4 },
  { y: SH * 0.42, rotate: -25, duration: 19000, delay: 4800, travel: SH * 0.28, intensity: 0.5 },
  { y: SH * 0.62, rotate: -15, duration: 16000, delay: 7200, travel: SH * 0.24, intensity: 0.35 },
  { y: SH * 0.85, rotate: -28, duration: 21000, delay: 9600, travel: SH * 0.3,  intensity: 0.45 },
];

function AuroraBand({ y, rotate, duration, delay, travel, intensity }: BandSpec) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, [t, duration, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -travel + t.value * travel * 2 },
      { rotate: `${rotate}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: y - BAND_H / 2,
          left: (SW - BAND_W) / 2,
          width: BAND_W,
          height: BAND_H,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[
          'rgba(126,200,208,0)',
          `rgba(126,200,208,${intensity * 0.55})`,
          `rgba(126,200,208,${intensity})`,
          `rgba(126,200,208,${intensity * 0.55})`,
          'rgba(126,200,208,0)',
        ]}
        locations={[0, 0.35, 0.5, 0.65, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

/**
 * Animated aurora wallpaper for the mobile login. Approximates the web's
 * WebGL shader by stacking diagonal `LinearGradient` bands that drift on the
 * UI thread via reanimated. No new native deps — runs in Expo Go.
 */
export function AuroraBackground() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Base canvas — deep navy with a subtle vertical falloff */}
      <LinearGradient
        colors={['#020617', '#0a0f1c', '#020617']}
        locations={[0, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {BANDS.map((b, i) => (
        <AuroraBand key={i} {...b} />
      ))}

      {/* Top vignette so the brand block on top reads cleanly */}
      <LinearGradient
        colors={['rgba(2,6,23,0.55)', 'rgba(2,6,23,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SH * 0.35 }}
      />
      {/* Bottom vignette so the form card sits on a calmer surface */}
      <LinearGradient
        colors={['rgba(2,6,23,0)', 'rgba(2,6,23,0.7)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.4 }}
      />
    </View>
  );
}
