// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: Record<string, MaterialIconName> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'plus': 'add',
  'minus': 'remove',
  'clock.fill': 'access-time',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.circle.fill': 'error',
  'clock.arrow.circlepath': 'update',
  'checkmark.seal.fill': 'verified',
  'archivebox': 'inventory-2',
  'archivebox.fill': 'inventory-2',
  'refrigerator': 'kitchen',
  'refrigerator.fill': 'kitchen',
  'leaf.fill': 'eco',
  'envelope.fill': 'email',
  'lock.fill': 'lock',
  'eye.slash.fill': 'visibility-off',
  'eye.fill': 'visibility',
  'checkmark.shield.fill': 'verified-user',
  'applelogo': 'apple',
  'pencil': 'edit',
  'trash.fill': 'delete',
  'checkmark.circle': 'check-circle',
  'checkmark.circle.fill': 'check-circle',
  'bell.fill': 'notifications',
  'arrow.left': 'arrow-back',
  'xmark': 'close',
  'book.fill': 'menu-book',
  'cart.fill': 'shopping-cart',
  'gearshape.fill': 'settings',
  'sparkles': 'auto-awesome',
  'lightbulb.fill': 'lightbulb',
  'barcode.viewfinder': 'qr-code-scanner',
  'doc.text.viewfinder': 'document-scanner',
  'calendar': 'calendar-today',
  'chart.bar.fill': 'bar-chart',
  'fork.knife': 'restaurant',
  'egg.fill': 'egg',
  'bag.fill': 'bakery-dining',
  'cup.and.saucer.fill': 'local-cafe',
  'flame.fill': 'whatshot',
  'rectangle.portrait.and.arrow.right': 'logout',
};

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] || 'help-outline';
  return <MaterialIcons color={color} size={size} name={iconName as MaterialIconName} style={style} />;
}
