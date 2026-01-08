import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, useWindowDimensions, TouchableOpacity, ViewToken } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

// Types
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation';

// ... (existing OnboardingItem types)

type OnboardingItem = {
    id: string;
    title: string;
    description: string;
    // image: any; // Add image support later
};

// ... (existing slides array)

const slides: OnboardingItem[] = [
    {
        id: '1',
        title: 'Track Your Progress',
        description: 'Monitor your mindfulness journey with detailed analytics and insights.',
    },
    {
        id: '2',
        title: 'Daily Exercises',
        description: 'Access a library of guided meditations and breathing exercises tailored for you.',
    },
    {
        id: '3',
        title: 'Stay Connected',
        description: 'Join a community of like-minded individuals and share your experiences.',
    },
];

// ... (existing OnboardingItem and Paginator components) 

const OnboardingItem = ({ item, index, x }: { item: OnboardingItem, index: number, x: SharedValue<number> }) => {
    // ... (implementation same as before, see context)
    const { width } = useWindowDimensions();

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            x.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0, 1, 0],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            x.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [100, 0, 100],
            Extrapolation.CLAMP
        );
        return { opacity, transform: [{ translateY }] };
    });

    return (
        <View style={[styles.itemContainer, { width }]}>
            <View style={styles.imagePlaceholder}>
                <LinearGradient colors={['#A8E6CF', '#64C59A']} style={styles.imageGradient} />
                <Text style={styles.placeholderText}>{index + 1}</Text>
            </View>
            <Animated.View style={[styles.textContainer, animatedStyle]}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
        </View>
    );
};

const Paginator = ({ data, x }: { data: OnboardingItem[], x: SharedValue<number> }) => {
    const { width } = useWindowDimensions();
    return (
        <View style={styles.paginatorContainer}>
            {data.map((_, i) => {
                const animatedDotStyle = useAnimatedStyle(() => {
                    const widthAnim = interpolate(x.value, [(i - 1) * width, i * width, (i + 1) * width], [10, 20, 10], Extrapolation.CLAMP);
                    const opacity = interpolate(x.value, [(i - 1) * width, i * width, (i + 1) * width], [0.3, 1, 0.3], Extrapolation.CLAMP);
                    return { width: widthAnim, opacity };
                });
                return <Animated.View style={[styles.dot, animatedDotStyle]} key={i.toString()} />;
            })}
        </View>
    );
};

export default function OnboardingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const x = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            x.value = event.contentOffset.x;
        },
    });

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0] && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            try {
                await AsyncStorage.setItem('alreadyLaunched', 'true');
            } catch (e) {
                console.error('Error saving onboarding status', e);
            }
            navigation.replace('Login');
        }
    };

    const handleSkip = async () => {
        try {
            await AsyncStorage.setItem('alreadyLaunched', 'true');
        } catch (e) {
            console.error('Error saving onboarding status', e);
        }
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            <Animated.FlatList
                data={slides}
                renderItem={({ item, index }) => <OnboardingItem item={item} index={index} x={x} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                ref={flatListRef}
            />

            <Paginator data={slides} x={x} />

            <View style={styles.footer}>
                {currentIndex < slides.length - 1 ? (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                            <Text style={styles.nextText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={handleNext} style={styles.getStartedButton}>
                        <Text style={styles.getStartedText}>Get Started</Text>
                    </TouchableOpacity>
                )}
            </View>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    imagePlaceholder: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
        borderRadius: 150, // Circle
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    imageGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    placeholderText: {
        fontSize: 100,
        color: 'white',
        fontWeight: 'bold',
        opacity: 0.8,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontWeight: '800',
        fontSize: 28,
        marginBottom: 10,
        color: '#1B5E45',
        textAlign: 'center',
    },
    description: {
        fontWeight: '400',
        fontSize: 16,
        color: '#62656b',
        textAlign: 'center',
        lineHeight: 24,
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#64C59A',
        marginHorizontal: 8,
    },
    footer: {
        marginBottom: 50,
        width: '100%',
        paddingHorizontal: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipButton: {
        padding: 15,
    },
    skipText: {
        color: '#aaa',
        fontSize: 16,
    },
    nextButton: {
        backgroundColor: '#2E8A66',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
    },
    nextText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    getStartedButton: {
        backgroundColor: '#2E8A66',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        width: '100%',
    },
    getStartedText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
