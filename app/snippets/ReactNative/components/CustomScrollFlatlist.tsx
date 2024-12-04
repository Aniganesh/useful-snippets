import { useCustomScrollIndicator } from "../hooks/useCustomScrollIndicator";
import { StyleProp, ViewStyle } from "react-native";

import React from "react";
import { FlatList, FlatListProps, useColorScheme, View } from "react-native";
import Animated from "react-native-reanimated";

interface CustomScrollFlatListProps<T>
  extends Omit<
    FlatListProps<T>,
    "onScroll" | "onLayout" | "onContentSizeChange"
  > {
  $trackStyleOverride?: StyleProp<ViewStyle>;
}

const $containerStyle: StyleProp<ViewStyle> = {
  paddingVertical: 16,
};

const $flatListStyle: StyleProp<ViewStyle> = {
  paddingHorizontal: 16,
  maxHeight: 384,
};

const $trackStyle: StyleProp<ViewStyle> = {
  position: "absolute",
  right: 20,
  bottom: 16,
  top: 16,
  backgroundColor: "gray", // Adjust as needed
  borderRadius: 9999,
};

export function ThemedFlatList<T>({
  $trackStyleOverride,
  ...props
}: CustomScrollFlatListProps<T>) {
  const {
    handleScroll,
    handleLayout,
    handleContentSizeChange,
    handleTrackTouchStart,
    handleTrackTouchMove,
    handleTrackTouchEnd,
    indicatorStyle,
    trackStyle,
    scrollableRef,
  } = useCustomScrollIndicator<FlatList<T>>();
  const theme = useColorScheme() ?? "light";

  return (
    <View style={$containerStyle}>
      <FlatList
        ref={scrollableRef}
        style={$flatListStyle}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        {...props}
      />
      <Animated.View
        onTouchStart={handleTrackTouchStart}
        onTouchMove={handleTrackTouchMove}
        onTouchEnd={handleTrackTouchEnd}
        style={[$trackStyle, $trackStyleOverride]}
      >
        <Animated.View
          style={[
            {
              backgroundColor: "red",
            },
            indicatorStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}

export default ThemedFlatList;
