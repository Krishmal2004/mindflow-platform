import { Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Icons } from "../../src/components/common/AppIcons";

const TabIconWithLabel = ({
  Icon,
  label,
  focused,
}: {
  Icon: React.FC<{ focused: boolean }>;
  label: string;
  focused: boolean;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.1 : 1) }],
  }));

  return (
    <Animated.View style={[styles.tabContainer, animatedStyle]}>
      <Icon focused={focused} />
      <Text
        style={[styles.label, focused && styles.labelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 88,
          paddingBottom: 30,
          paddingTop: 12,
          paddingHorizontal: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel
              Icon={Icons.TabHome}
              label="Home"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel
              Icon={Icons.TabCalendar}
              label="Calendar"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel
              Icon={Icons.TabProgress}
              label="Progress"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel
              Icon={Icons.TabAccount}
              label="Account"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    color: "#999999",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  labelActive: {
    color: "#64C59A",
    fontWeight: "700",
  },
});
