import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import Auth from "../src/components/Auth";
import { useSession } from "../src/contexts/SessionContext";

export default function AuthScreen() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64C59A" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Auth />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
