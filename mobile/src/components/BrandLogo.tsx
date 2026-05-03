import { Image } from 'react-native';

const LOGO = require('@/assets/icon.png');

export function BrandLogo({ size = 48 }: { size?: number }) {
  return <Image source={LOGO} style={{ width: size, height: size }} resizeMode="contain" />;
}
