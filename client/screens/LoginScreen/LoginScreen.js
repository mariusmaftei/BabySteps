import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/theme-context";
import { useAuth } from "../../context/auth-context";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (text) => {
    setEmail(text);
    setLoginError("");

    if (text.trim() === "") {
      setEmailError("Email is required");
    } else if (!text.includes("@") || !text.includes(".")) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (text) => {
    setPassword(text);
    setLoginError("");
    if (text.trim() === "") {
      setPasswordError("Password is required");
    } else if (text.length < 6) {
      setPasswordError("Password must be at least 6 characters");
    } else {
      setPasswordError("");
    }
  };

  const isInvalidCredentialsError = (error) => {
    return (
      error.message &&
      (error.message.includes("Invalid credentials") ||
        error.message.includes("Invalid email") ||
        error.message.includes("Invalid password"))
    );
  };

  const handleLogin = async () => {
    setLoginError("");

    validateEmail(email);
    validatePassword(password);

    if (
      email.trim() === "" ||
      !email.includes("@") ||
      password.trim() === "" ||
      password.length < 6
    ) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting to login with:", { email });
      await login(email, password);
    } catch (error) {
      if (isInvalidCredentialsError(error)) {
        setLoginError("Invalid email or password. Please try again.");
        console.log("Login failed in component: Invalid credentials");
      } else {
        Alert.alert(
          "Login Failed",
          error.message || "An unexpected error occurred. Please try again."
        );
        console.error("Login failed in component:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/baby-steps-auth-logo-eVQKKLuZHwO00WJyxyU73aNjHpQ2Zx.png",
              }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                backgroundColor: theme.cardBackground,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to continue tracking your child's growth
            </Text>

            {loginError ? (
              <View style={styles.loginErrorContainer}>
                <Text style={[styles.loginErrorText, { color: theme.danger }]}>
                  {loginError}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      emailError || loginError
                        ? theme.danger
                        : theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textTertiary}
                  value={email}
                  onChangeText={validateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {emailError ? (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      passwordError || loginError
                        ? theme.danger
                        : theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={validatePassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text
                style={[styles.forgotPasswordText, { color: theme.primary }]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text
                style={[styles.registerText, { color: theme.textSecondary }]}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={[styles.registerLink, { color: theme.primary }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
    height: 150,
  },
  logo: {
    width: 200,
    height: 150,
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  loginErrorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.2)",
  },
  loginErrorText: {
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
