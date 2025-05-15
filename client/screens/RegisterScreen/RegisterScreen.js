import React, { useState, useRef, useEffect } from "react";
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

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { register, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Navigate to Activity screen when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, navigating to Activity");
      navigation.reset({
        index: 0,
        routes: [{ name: "Activity" }],
      });
    }
  }, [isAuthenticated, navigation]);

  // Start animations when component mounts
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

  // Validate name
  const validateName = (text) => {
    setName(text);
    if (text.trim() === "") {
      setNameError("Name is required");
    } else if (text.length < 2) {
      setNameError("Name must be at least 2 characters");
    } else {
      setNameError("");
    }
  };

  // Validate email
  const validateEmail = (text) => {
    setEmail(text);
    if (text.trim() === "") {
      setEmailError("Email is required");
    } else if (!text.includes("@") || !text.includes(".")) {
      setEmailError("Please enter a valid email address");
    } else {
      // Clear any existing errors, including "already exists" errors
      setEmailError("");
    }
  };

  // Validate password
  const validatePassword = (text) => {
    setPassword(text);
    if (text.trim() === "") {
      setPasswordError("Password is required");
    } else if (text.length < 6) {
      setPasswordError("Password must be at least 6 characters");
    } else {
      setPasswordError("");
    }

    // Also validate confirm password if it's already been entered
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, text);
    }
  };

  // Validate confirm password
  const validateConfirmPassword = (text, pass = password) => {
    setConfirmPassword(text);
    if (text.trim() === "") {
      setConfirmPasswordError("Please confirm your password");
    } else if (text !== pass) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  // Check if an error is a duplicate email error
  const isDuplicateEmailError = (error) => {
    return (
      error &&
      (error.code === "EMAIL_EXISTS" ||
        (error.message && error.message.includes("User already exists")))
    );
  };

  // Handle registration
  const handleRegister = async () => {
    // Validate all inputs
    validateName(name);
    validateEmail(email);
    validatePassword(password);
    validateConfirmPassword(confirmPassword);

    // Check if there are any errors
    if (
      nameError ||
      emailError ||
      passwordError ||
      confirmPasswordError ||
      name.trim() === "" ||
      email.trim() === "" ||
      password.trim() === "" ||
      confirmPassword.trim() === ""
    ) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare user data for API
      const userData = {
        username: name,
        email: email,
        password: password,
        imageSrc: null, // Default to null, can be updated later
      };

      console.log("Sending registration data:", userData);

      // Call the register function from auth context
      await register(userData);

      // Navigation will be handled by the useEffect that watches isAuthenticated
      console.log("Registration successful, auth state updated");
    } catch (error) {
      // Check if the error is about existing user
      if (isDuplicateEmailError(error)) {
        // For duplicate email errors, just set the error without logging
        setEmailError(
          "This email is already registered. Please use a different email or try logging in."
        );
      } else {
        // Only log non-duplicate email errors
        console.error("Registration error in component:", error);
        const errorMessage =
          error.message ||
          "Registration failed. Please check your information and try again.";
        Alert.alert("Registration Failed", errorMessage);
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
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign up to start tracking your child's growth
            </Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Parent Name
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: nameError ? theme.danger : theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={(text) => {
                    // Limit to 30 characters
                    if (text.length <= 30) {
                      validateName(text);
                    }
                  }}
                  autoCapitalize="words"
                  maxLength={30}
                />
              </View>
              {nameError ? (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {nameError}
                </Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: emailError ? theme.danger : theme.borderLight,
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

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: passwordError
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
                  placeholder="Create a password"
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: confirmPasswordError
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
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.textTertiary}
                  value={confirmPassword}
                  onChangeText={(text) => validateConfirmPassword(text)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={[styles.loginLink, { color: theme.primary }]}>
                  Sign In
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
  registerButton: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
