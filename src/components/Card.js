import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "../theme/colors";

export default function Card({
  children,
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
  style,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const color = iconColor || Colors.orange;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Container
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, Shadows.medium]}
      >
        {(title || icon) && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {icon && (
                <View
                  style={[styles.iconBox, { backgroundColor: color + "12" }]}
                >
                  <Ionicons name={icon} size={20} color={color} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
            </View>
            {onPress && (
              <View style={styles.arrowBox}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.gray400}
                />
              </View>
            )}
          </View>
        )}
        {children}
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
});
