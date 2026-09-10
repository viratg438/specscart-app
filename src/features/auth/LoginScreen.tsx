// File: LoginScreen.tsx
// First screen on launch — Gmail login from local users.json, or skip to home.

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { STATIC_URL } from "@/constants/cdn";
import { colors, layout, spacing } from "@/theme";

import { useAuth } from "./AuthContext";
import { AppleIcon, GoogleIcon } from "./BrandIcons";
import {
  canSubmitLogin,
  findUser,
  LoginErrors,
  validateLogin,
} from "./validate-login";

const HERO = STATIC_URL("1770626815691-dale-frame_vehvh8.webp");

export function LoginScreen() {
  const router = useRouter();
  const { login, skip } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const canSubmit = canSubmitLogin(email, password);

  const goHome = () => {
    router.replace("/home");
  };

  const onSkip = () => {
    skip();
    goHome();
  };

  const onLogin = () => {
    const next = validateLogin(email, password);
    setErrors(next);
    if (next.email || next.password || next.form) {
      return;
    }
    const user = findUser(email.trim(), password.trim());
    if (!user) {
      setErrors({ form: "Gmail or password is incorrect." });
      return;
    }
    login(user);
    goHome();
  };

  return (
    <View style={styles.page}>
      <View style={styles.screen}>
        <View style={styles.hero}>
          {HERO ? (
            <Image
              source={{ uri: HERO }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.heroFallback} />
          )}
          <View style={styles.heroShade} />
          <SafeAreaView edges={["top"]} style={styles.heroBar}>
            <Text style={styles.logo}>Specscart.</Text>
            <Pressable onPress={onSkip} style={styles.skip} hitSlop={8}>
              <Text style={styles.skipLabel}>Skip</Text>
            </Pressable>
          </SafeAreaView>
        </View>

        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Text style={styles.title}>Login or signup</Text>
          <Text style={styles.subtitle}>
            Login and get extra offers on frames and lenses.
          </Text>

          <View style={[styles.field, errors.email ? styles.fieldError : null]}>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrors((current) => ({
                  ...current,
                  email: undefined,
                  form: undefined,
                }));
              }}
              placeholder="Email Address (admin@gmail.com)"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
          {errors.email ? (
            <Text style={styles.error}>{errors.email}</Text>
          ) : null}

          <View
            style={[
              styles.field,
              styles.fieldNext,
              errors.password ? styles.fieldError : null,
            ]}
          >
            <TextInput
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setErrors((current) => ({
                  ...current,
                  password: undefined,
                  form: undefined,
                }));
              }}
              placeholder="Password (admin@123)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
            />
          </View>
          {errors.password ? (
            <Text style={styles.error}>{errors.password}</Text>
          ) : null}
          {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}

          <Pressable
            onPress={onLogin}
            disabled={!canSubmit}
            style={[styles.otp, canSubmit ? styles.otpOn : styles.otpOff]}
          >
            <Text
              style={[styles.otpLabel, canSubmit ? styles.otpLabelOn : null]}
            >
              Login
            </Text>
          </Pressable>

          <View style={styles.orSeparator}>
            <View style={styles.orLine}></View>
            <Text style={styles.or}>Or sign in with</Text>
            <View style={styles.orLine}></View>
          </View>

          <View style={styles.orRow}>
            <Pressable style={styles.orButton}>
              <GoogleIcon size={18} />
              <Text style={styles.orButtonText}>Google</Text>
            </Pressable>
            <Pressable style={styles.orButton}>
              <AppleIcon size={18} />
              <Text style={styles.orButtonText}>Apple</Text>
            </Pressable>
          </View>

          <Text style={styles.legal}>
            By signing in, you agree to the{" "}
            <Text style={styles.link}>Terms of Service</Text> &{" "}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor:
      Platform.OS === "web" ? colors.webCanvas : colors.background,
    alignItems: Platform.OS === "web" ? "center" : "stretch",
  },
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? layout.phoneWidth : undefined,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  hero: {
    flex: 1.05,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.brand,
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 12, 28, 0.18)",
  },
  heroBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  logo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.background,
    letterSpacing: -0.4,
  },
  skip: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  skipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  field: {
    marginTop: 22,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  fieldNext: {
    marginTop: 12,
  },
  fieldError: {
    borderColor: colors.sale,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: colors.sale,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    height: "100%",
    paddingHorizontal: 10,
    outlineStyle: "solid",
    outlineWidth: 0,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  otp: {
    marginTop: 16,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  otpOff: {
    backgroundColor: "#E5E5E5",
  },
  otpOn: {
    backgroundColor: colors.brand,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMuted,
  },
  otpLabelOn: {
    color: colors.background,
  },
  orRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  or: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  whatsapp: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  waIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  waLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  legal: {
    marginTop: 22,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },
  link: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  orSeparator: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  orButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
});
