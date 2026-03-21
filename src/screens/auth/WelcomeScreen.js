import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Button from "../../components/Button";
import { Colors, Spacing } from "../../theme/colors";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ onGoToLogin, onGoToRegister }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <LinearGradient colors={Colors.gradientWarm} style={styles.container}>
        {/* Shapes */}
        <View style={styles.shape1} />
        <View style={styles.shape2} />

        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoBox,
              {
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              styles.textBox,
              {
                opacity: textAnim,
                transform: [
                  {
                    translateY: textAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.tagline}>
              Controle de ponto{" "}
              <Text style={styles.taglineAccent}>inteligente</Text>
              {"\n"}para o trabalho doméstico
            </Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View
            style={[
              styles.buttons,
              {
                opacity: buttonAnim,
                transform: [
                  {
                    translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Button
              title="Vamos começar"
              iconRight="arrow-forward"
              onPress={onGoToRegister}
              style={{ marginBottom: Spacing.sm }}
            />
            <Button
              title="Já tenho conta"
              variant="outline"
              onPress={onGoToLogin}
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  shape1: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: Colors.orange + "06",
    top: -width * 0.2,
    right: -width * 0.15,
  },
  shape2: {
    position: "absolute",
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: Colors.teal + "05",
    bottom: height * 0.12,
    left: -width * 0.15,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logoBox: {
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.75,
    height: width * 0.4,
  },
  textBox: {
    marginBottom: height * 0.06,
  },
  tagline: {
    fontSize: width * 0.05,
    fontWeight: "400",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: width * 0.075,
  },
  taglineAccent: {
    fontWeight: "700",
    color: Colors.orange,
  },
  buttons: {
    width: "100%",
  },
});
