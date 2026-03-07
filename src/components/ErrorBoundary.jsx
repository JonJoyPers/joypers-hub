import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.charcoal,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emoji: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS.red,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.red + "20",
    textAlign: "center",
    lineHeight: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.cream,
    marginTop: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    marginTop: 12,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 1.5,
  },
});
