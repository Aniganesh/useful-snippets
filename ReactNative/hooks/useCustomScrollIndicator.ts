import { useCallback } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  AnimatedStyle,
} from "react-native-reanimated";

interface CustomScrollIndicatorReturn {
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleLayout: (event: LayoutChangeEvent) => void;
  handleContentSizeChange: (width: number, height: number) => void;
  indicatorStyle: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  trackStyle: StyleProp<ViewStyle>;
}

/**
 * A custom hook that provides functionality for a custom scroll indicator/scrollbar.
 *
 * This hook manages the scroll indicator's position and size based on the scroll position
 * and container dimensions. It uses react-native-reanimated for smooth animations.
 *
 * @returns {Object} An object containing:
 *   - handleScroll: Callback for ScrollView's onScroll event
 *   - handleLayout: Callback for ScrollView's onLayout event
 *   - handleContentSizeChange: Callback for ScrollView's onContentSizeChange event
 *   - indicatorStyle: Animated style for the scroll indicator (thumb)
 *   - trackStyle: Animated style for the scroll track (background)
 *
 * @example
 * ```tsx
 * const MyScrollView = () => {
 *   const {
 *     handleScroll,
 *     handleLayout,
 *     handleContentSizeChange,
 *     indicatorStyle,
 *     trackStyle
 *   } = useCustomScrollIndicator();
 *
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <ScrollView
 *         onScroll={handleScroll}
 *         onLayout={handleLayout}
 *         onContentSizeChange={handleContentSizeChange}
 *         scrollEventThrottle={16}
 *       >
 *         {/* Your content *\/}
 *       </ScrollView>
 *
 *       <Animated.View style={[styles.track, trackStyle]}>
 *         <Animated.View style={[styles.indicator, indicatorStyle]} />
 *       </Animated.View>
 *     </View>
 *   );
 * };
 * ```
 *
 * @limitations
 * 1. Padding: This hook does not account for ScrollView's contentContainerStyle padding
 *    or contentInset. The scroll indicator will not adjust its position or size based
 *    on padding values.
 *
 * 2. Direction: Currently only supports vertical scrolling. Horizontal scrolling would
 *    require modifications to the calculations.
 *
 * 3. Nested ScrollViews: May not work correctly with nested scroll views as it only
 *    tracks a single scroll position.
 *
 * @performance
 * This hook uses Reanimated's shared values and animated styles to ensure smooth
 * animations that run on the UI thread. It avoids React state to minimize re-renders.
 *
 * @styling
 * You'll need to provide your own styles for the track and indicator. Example styles:
 * ```tsx
 * const styles = StyleSheet.create({
 *   track: {
 *     position: 'absolute',
 *     right: 4,
 *     width: 6,
 *     backgroundColor: 'rgba(0,0,0,0.1)',
 *     borderRadius: 3,
 *   },
 *   indicator: {
 *     width: '100%',
 *     backgroundColor: 'rgba(0,0,0,0.4)',
 *     borderRadius: 3,
 *   },
 * });
 * ```
 */
export const useCustomScrollIndicator = (): CustomScrollIndicatorReturn => {
  const scrollPosition = useSharedValue(0);
  const contentSize = useSharedValue(0);
  const containerSize = useSharedValue(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {
        contentOffset,
        contentSize: size,
        layoutMeasurement,
      } = event.nativeEvent;

      const maxScroll = size.height - layoutMeasurement.height;
      const currentPosition = Math.max(
        0,
        Math.min(1, contentOffset.y / maxScroll)
      );

      scrollPosition.value = withSpring(currentPosition, {
        damping: 15,
        stiffness: 100,
      });
    },
    []
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    containerSize.value = height;
  }, []);

  const handleContentSizeChange = useCallback((_: number, height: number) => {
    contentSize.value = height;
  }, []);

  const indicatorStyle = useAnimatedStyle(() => {
    const scrollIndicatorSize =
      containerSize.value > 0
        ? (containerSize.value / contentSize.value) * containerSize.value
        : 0;

    const maxTranslation = containerSize.value - scrollIndicatorSize;

    return {
      height: scrollIndicatorSize,
      transform: [
        {
          translateY: scrollPosition.value * maxTranslation,
        },
      ],
    };
  }, []);

  const trackStyle = useAnimatedStyle(() => {
    return {
      height: containerSize.value,
    };
  }, []);

  return {
    handleScroll,
    handleLayout,
    handleContentSizeChange,
    indicatorStyle,
    trackStyle,
  };
};
