import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "../theme/colors";

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  small = false,
  style,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  const iconColor = isOutline || isGhost ? Colors.orange : "#FFF";
  const iconSize = small ? 18 : 20;

  const content = (
    <View style={btnStyles.inner}>
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon && !iconRight && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={iconColor}
              style={{ marginRight: 10 }}
            />
          )}
          <Text
            style={[
              btnStyles.text,
              small && { fontSize: 14 },
              isOutline && { color: Colors.orange },
              isGhost && { color: Colors.textSecondary },
            ]}
          >
            {title}
          </Text>
          {iconRight && (
            <Ionicons
              name={iconRight}
              size={iconSize}
              color={iconColor}
              style={{ marginLeft: 10 }}
            />
          )}
        </>
      )}
    </View>
  );

  if (isPrimary) {
    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          { width: "100%" },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
        >
          <LinearGradient
            colors={
              disabled
                ? [Colors.gray300, Colors.gray400]
                : Colors.gradientOrange
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              btnStyles.button,
              small && { height: 48, borderRadius: 14 },
              Shadows.orange,
            ]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (isSecondary) {
    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          { width: "100%" },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
        >
          <LinearGradient
            colors={
              disabled ? [Colors.gray300, Colors.gray400] : Colors.gradientTeal
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              btnStyles.button,
              small && { height: 48, borderRadius: 14 },
              Shadows.teal,
            ]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[{ transform: [{ scale: scaleAnim }] }, { width: "100%" }, style]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          btnStyles.button,
          small && { height: 48, borderRadius: 14 },
          isOutline && btnStyles.outline,
          isGhost && btnStyles.ghost,
          disabled && { opacity: 0.5 },
        ]}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

const btnStyles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.gray200,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
