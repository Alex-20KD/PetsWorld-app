import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

export default function AnimatedPressable({ children, onPress, style, disabled }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        onPressIn={() => { if(!disabled) scale.value = withSpring(0.93); }}
        onPressOut={() => { if(!disabled) scale.value = withSpring(1); }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
