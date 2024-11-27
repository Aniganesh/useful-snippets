import { useCallback, useRef } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  GestureResponderEvent,
  ScrollView,
  FlatList,
  ViewStyle,
} from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  AnimatedStyle,
} from "react-native-reanimated";

type ScrollViewRef = ScrollView;
type FlatListRef = FlatList<any>;
type ScrollableRef<T> = T extends ScrollView ? ScrollViewRef : FlatListRef;

/**
 * Interface for the return type of the useCustomScrollIndicator hook.
 */
interface CustomScrollIndicatorReturn<T> {
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleLayout: (event: LayoutChangeEvent) => void;
  handleContentSizeChange: (width: number, height: number) => void;
  handleTrackTouchStart: (event: GestureResponderEvent) => void;
  handleTrackTouchMove: (event: GestureResponderEvent) => void;
  handleTrackTouchEnd: () => void;
  indicatorStyle: AnimatedStyle<ViewStyle>;
  trackStyle: AnimatedStyle<ViewStyle>;
  scrollableRef: React.RefObject<ScrollableRef<T>>;
}

/**
 * Custom hook to manage a scroll indicator for ScrollView and FlatList components.
 *
 * @template T - The type of the scrollable component (ScrollView or FlatList).
 * @returns {CustomScrollIndicatorReturn<T>} An object containing handlers and styles for the scroll indicator.
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
 * @example
 * ```tsx
 * import React from 'react';
 * import { ScrollView, View, StyleSheet } from 'react-native';
 * import { useCustomScrollIndicator } from 'path/to/hooks';
 *
 * const MyComponent = () => {
 *   const {
 *     handleScroll,
 *     handleLayout,
 *     indicatorStyle,
 *     trackStyle,
 *     scrollableRef,
 *   } = useCustomScrollIndicator<ScrollView>();
 *
 *   return (
 *     <View style={styles.container}>
 *       <ScrollView
 *         ref={scrollableRef}
 *         onScroll={handleScroll}
 *         onLayout={handleLayout}
 *         scrollEventThrottle={16}
 *       >
 *         {/* Your scrollable content goes here *\/}
 *       </ScrollView>
 *       <View style={[styles.track, trackStyle]} />
 *       <View style={[styles.indicator, indicatorStyle]} />
 *     </View>
 *   );
 * };
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *   },
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
 *
 * @performance
 * This hook uses Reanimated's shared values and animated styles to ensure smooth
 * animations that run on the UI thread. It avoids React state to minimize re-renders.
 *
 * @remarks
 * This hook provides a custom scroll indicator for ScrollView and FlatList components.
 * It manages the visibility and position of the scroll indicator based on the scroll position.
 *
 * Pitfalls:
 * - This hook does not account for any padding that may be applied to the ScrollView or FlatList.
 *   Ensure to adjust the calculations if padding is used to avoid incorrect scroll indicator positioning.
 */
export const useCustomScrollIndicator = <
  T extends ScrollView | FlatList<any>
>(): CustomScrollIndicatorReturn<T> => {
  const scrollViewHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const scrollPosition = useSharedValue(0);
  const isDraggingWithTrack = useSharedValue(false);
  const isScrolling = useSharedValue(false);
  const opacity = useSharedValue(0);
  const scrollableRef = useRef<ScrollableRef<T>>(null);

  let hideTimeout: NodeJS.Timeout;

  const showScrollIndicator = () => {
    clearTimeout(hideTimeout);
    opacity.value = withTiming(1, { duration: 150 });

    hideTimeout = setTimeout(() => {
      if (!isDraggingWithTrack.value) {
        opacity.value = withTiming(0, { duration: 300 });
      }
    }, 1000);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    console.log({ isDragging: isDraggingWithTrack.value });
    if (!isDraggingWithTrack.value) {
      scrollPosition.value = event.nativeEvent.contentOffset.y;
      isScrolling.value = true;
      showScrollIndicator();
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    scrollViewHeight.value = event.nativeEvent.layout.height;
  };

  const handleContentSizeChange = (_: number, height: number) => {
    contentHeight.value = height;
  };

  const calculateScrollPosition = (locationY: number) => {
    const trackHeight = scrollViewHeight.value - 32;
    const contentSize = contentHeight.value - scrollViewHeight.value;
    return Math.max(
      0,
      Math.min(contentSize, (locationY / trackHeight) * contentSize)
    );
  };

  const scrollTo = (y: number, animated: boolean) => {
    if (scrollableRef.current) {
      if ("scrollTo" in scrollableRef.current) {
        (scrollableRef.current as ScrollView).scrollTo({ y, animated });
      } else {
        (scrollableRef.current as FlatList<any>).scrollToOffset({
          offset: y,
          animated,
        });
      }
    }
  };

  const handleTrackTouchStart = useCallback((event: GestureResponderEvent) => {
    isDraggingWithTrack.value = true;
    opacity.value = withTiming(1, { duration: 150 });
    const newScrollPosition = calculateScrollPosition(
      event.nativeEvent.locationY
    );
    scrollTo(newScrollPosition, true);
  }, []);

  const handleTrackTouchMove = useCallback((event: GestureResponderEvent) => {
    if (isDraggingWithTrack.value) {
      const newScrollPosition = calculateScrollPosition(
        event.nativeEvent.locationY
      );
      scrollTo(newScrollPosition, false);
    }
  }, []);

  const handleTrackTouchEnd = useCallback(() => {
    isDraggingWithTrack.value = false;
    showScrollIndicator();
  }, []);

  const trackStyle = useAnimatedStyle(() => {
    return {
      width: 8,
      opacity: opacity.value,
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const indicatorHeight = Math.max(
      (scrollViewHeight.value / contentHeight.value) * scrollViewHeight.value,
      30
    );

    const percentage = Math.min(
      scrollPosition.value /
        Math.max(contentHeight.value - scrollViewHeight.value, 1),
      1
    );

    const translateY = percentage * (scrollViewHeight.value - indicatorHeight);

    return {
      height: indicatorHeight,
      transform: [{ translateY }],
    };
  });

  return {
    handleScroll,
    handleLayout,
    handleContentSizeChange,
    handleTrackTouchStart,
    handleTrackTouchMove,
    handleTrackTouchEnd,
    indicatorStyle,
    trackStyle,
    scrollableRef,
  };
};
