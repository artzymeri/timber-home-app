import { forwardRef, useImperativeHandle, useRef, useCallback, ReactNode } from 'react';
import { View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { vars } from 'nativewind';
import { useTheme } from '@/lib/theme';
import { paletteFor } from '@/lib/theme-vars';

export interface SheetRef {
  open: () => void;
  close: () => void;
}

interface SheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  /** When true, content scrolls vertically inside the sheet via gorhom's
   *  scroll-aware container — drag-to-close still works at the top of scroll. */
  scrollable?: boolean;
}

export const Sheet = forwardRef<SheetRef, SheetProps>(
  ({ children, snapPoints = ['50%', '90%'], scrollable }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { resolved } = useTheme();
    const palette = paletteFor(resolved);
    const sheetBg = resolved === 'dark' ? '#1c1917' : '#ffffff';

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
      close: () => sheetRef.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      ),
      []
    );

    // Wrap children in a View carrying the palette vars. gorhom's
    // BottomSheetScrollView didn't reliably propagate vars from `style` /
    // `contentContainerStyle` to descendants — putting them on a real View
    // immediately around the children does.
    const themedChildren = (
      <View style={[{ backgroundColor: sheetBg, flex: scrollable ? undefined : 1 }, vars(palette)]}>
        {children}
      </View>
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: sheetBg }}
        handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}
      >
        {scrollable ? (
          <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
            {themedChildren}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={{ flex: 1, padding: 20 }}>{themedChildren}</BottomSheetView>
        )}
      </BottomSheetModal>
    );
  }
);
Sheet.displayName = 'Sheet';
