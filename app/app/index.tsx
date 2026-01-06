import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useSession } from "../src/contexts/SessionContext";
import { Redirect } from "expo-router";

export default function RootScreen() {
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

  return <Redirect href={"/auth" as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
