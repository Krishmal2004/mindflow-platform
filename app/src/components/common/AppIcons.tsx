import React from 'react';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface IconProps {
    width?: number;
    height?: number;
    color?: string;
    fill?: string;
    strokeWidth?: number;
}

export const Icons = {
    Back: ({ width = 24, height = 24, color = "#333", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Close: ({ width = 24, height = 24, color = "#333", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Check: ({ width = 24, height = 24, color = "#2E8A66", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Microphone: ({ width = 32, height = 32, color = "#2E8A66", fill = "none" }: IconProps & { isRecording?: boolean }) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Rect x="10" y="4" width="4" height="8" rx="2" fill={fill === "none" ? "#fff" : fill} />
            <Circle cx="12" cy="14" r="5" fill={color} stroke="#fff" strokeWidth="2" />
        </Svg>
    ),
    // Add other icons as needed from existing files...
    Stress: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2C16.9706 2 21 6.02944 21 11C21 15.9706 16.9706 20 12 20C7.02944 20 3 15.9706 3 11C3 6.02944 7.02944 2 12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M9 9L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M15 9L9 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    ),
    Mindfulness: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2C13.3137 2 14.6136 2.25866 15.8268 2.75866C17.04 3.25866 18.1421 4.00001 19.071 5.00001C20 6.00001 20.7424 7.14214 21.2424 8.35534C21.7424 9.56854 22 10.8137 22 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M12 22C10.6863 22 9.38642 21.7413 8.17317 21.2413C6.95991 20.7413 5.85786 20 4.92893 19C4 18 3.25759 16.8579 2.75759 15.6447C2.25759 14.4315 2 13.1863 2 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M8 14C8.65661 14.6278 9.50909 15 10.4142 15C12.2142 15 13.4142 13.6569 13.4142 12C13.4142 10.3431 12.2142 9 10.4142 9C9.50909 9 8.65661 9.37216 8 10" stroke={color} strokeWidth="2" />
        </Svg>
    ),
    Sleep: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M17 10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10C7 7.23858 9.23858 5 12 5C14.7614 5 17 7.23858 17 10Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Mood: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2C16.9706 2 21 6.02944 21 11C21 15.9706 16.9706 20 12 20C7.02944 20 3 15.9706 3 11C3 6.02944 7.02944 2 12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="8" cy="9" r="1.5" stroke={color} strokeWidth="1.5" fill="none" />
            <Circle cx="16" cy="9" r="1.5" stroke={color} strokeWidth="1.5" fill="none" />
            <Path d="M7 14C9 16 15 16 17 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    ),
    Relaxation: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2L21 8.5V15.5L12 22L3 15.5V8.5L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 7L16.5 10.5L12 14L7.5 10.5L12 7Z" fill={color} />
            <Path d="M12 11L16.5 14.5L12 18L7.5 14.5L12 11Z" fill={color} />
        </Svg>
    ),
    Play: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M5 4L19 12L5 20V4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Recording: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M14 12L19 8V16L14 12Z" fill={color} />
            <Path d="M9 12L14 8V16L9 12Z" fill={color} />
        </Svg>
    ),
    Factors: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2L21 8.5V15.5L12 22L3 15.5V8.5L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 8L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M16 8L8 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M12 6V18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    ),
    Schedule: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
            <Path d="M16 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M8 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M3 10H21" stroke={color} strokeWidth="2" />
        </Svg>
    ),
    Sun: ({ width = 28, height = 28, color = "#FFA500" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
            <Path d="M12 1V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M12 21V23" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M4.22 4.22L5.64 5.64" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M18.36 18.36L19.78 19.78" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M1 12H3" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M21 12H23" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M4.22 19.78L5.64 18.36" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Path d="M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    ),
    Feather: ({ width = 28, height = 28, color = "#64C59A" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 8L2 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M17.5 15H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    User: ({ width = 28, height = 28, color = "#000" }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
};

// Emojis from DailySliders
export const Emojis = {
    Stress: [
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#A8E6CF" stopOpacity="1" />
                        <Stop offset="1" stopColor="#7FD1AE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grad1)" />
                <Circle cx="9" cy="10" r="1.2" fill="#2E8A66" />
                <Circle cx="15" cy="10" r="1.2" fill="#2E8A66" />
                <Circle cx="14.5" cy="9.5" r="0.4" fill="white" />
                <Path d="M7 8 Q9 6.5 11 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13 8 Q15 6.5 17 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 18 16 15" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#D8F6E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#BDECD5" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grad2)" />
                <Circle cx="9" cy="10" r="1.1" fill="#2E8A66" />
                <Circle cx="15" cy="10" r="1.1" fill="#2E8A66" />
                <Circle cx="8.6" cy="9.6" r="0.35" fill="white" />
                <Circle cx="14.6" cy="9.6" r="0.35" fill="white" />
                <Path d="M7.5 8 Q9 7 10.5 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13.5 8 Q15 7 16.5 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 17 16 15" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grad3" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#F3FFF9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#E0F2E9" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grad3)" />
                <Circle cx="9" cy="10" r="1" fill="#6B8E7A" />
                <Circle cx="15" cy="10" r="1" fill="#6B8E7A" />
                <Circle cx="8.7" cy="9.7" r="0.3" fill="white" />
                <Circle cx="14.7" cy="9.7" r="0.3" fill="white" />
                <Path d="M8 8 H10" stroke="#6B8E7A" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M14 8 H16" stroke="#6B8E7A" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M9 15 H15" stroke="#6B8E7A" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grad4" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFF7F6" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFE0DE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grad4)" />
                <Circle cx="9" cy="10" r="1" fill="#B34D3A" />
                <Circle cx="15" cy="10" r="1" fill="#B34D3A" />
                <Circle cx="8.7" cy="9.7" r="0.3" fill="white" />
                <Circle cx="14.7" cy="9.7" r="0.3" fill="white" />
                <Path d="M7.5 7.5 Q9 8.5 10.5 7.5" stroke="#B34D3A" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13.5 7.5 Q15 8.5 16.5 7.5" stroke="#B34D3A" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 13 16 15" stroke="#B34D3A" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grad5" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFEAEA" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFB3B3" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grad5)" />
                <Circle cx="9" cy="10" r="1" fill="#9B2C2C" />
                <Circle cx="15" cy="10" r="1" fill="#9B2C2C" />
                <Circle cx="8.7" cy="9.7" r="0.3" fill="white" />
                <Circle cx="14.7" cy="9.7" r="0.3" fill="white" />
                <Path d="M7 7 Q9 9 11 7" stroke="#9B2C2C" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13 7 Q15 9 17 7" stroke="#9B2C2C" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 11 16 15" stroke="#9B2C2C" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        )
    ],
    Mood: [
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="gradm1" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFEAEA" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFB3B3" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#gradm1)" />
                <Circle cx="9" cy="10" r="1" fill="#9B2C2C" />
                <Circle cx="15" cy="10" r="1" fill="#9B2C2C" />
                <Circle cx="8.5" cy="9.5" r="0.4" fill="white" />
                <Circle cx="14.5" cy="9.5" r="0.4" fill="white" />
                <Path d="M7 7 Q9 9 11 7" stroke="#9B2C2C" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13 7 Q15 9 17 7" stroke="#9B2C2C" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 11 16 15" stroke="#9B2C2C" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="gradm2" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFF7E6" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFE0B3" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#gradm2)" />
                <Circle cx="9" cy="10" r="1" fill="#C07A39" />
                <Circle cx="15" cy="10" r="1" fill="#C07A39" />
                <Circle cx="8.5" cy="9.5" r="0.4" fill="white" />
                <Circle cx="14.5" cy="9.5" r="0.4" fill="white" />
                <Path d="M7.5 7.5 Q9 8.5 10.5 7.5" stroke="#C07A39" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13.5 7.5 Q15 8.5 16.5 7.5" stroke="#C07A39" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 13 16 15" stroke="#C07A39" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="gradm3" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#F0FFF4" stopOpacity="1" />
                        <Stop offset="1" stopColor="#D4F2DE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#gradm3)" />
                <Circle cx="9" cy="10" r="1" fill="#2E8A66" />
                <Circle cx="15" cy="10" r="1" fill="#2E8A66" />
                <Circle cx="8.5" cy="9.5" r="0.4" fill="white" />
                <Circle cx="14.5" cy="9.5" r="0.4" fill="white" />
                <Path d="M8 8 H10" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M14 8 H16" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M9 15 H15" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="gradm4" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#D8F6E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#BDECD5" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#gradm4)" />
                <Circle cx="9" cy="10" r="1" fill="#2E8A66" />
                <Circle cx="15" cy="10" r="1" fill="#2E8A66" />
                <Circle cx="8.5" cy="9.5" r="0.4" fill="white" />
                <Circle cx="14.5" cy="9.5" r="0.4" fill="white" />
                <Path d="M7.5 8 Q9 7 10.5 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13.5 8 Q15 7 16.5 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 17 16 15" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="gradm5" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#A8E6CF" stopOpacity="1" />
                        <Stop offset="1" stopColor="#7FD1AE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#gradm5)" />
                <Circle cx="9" cy="10" r="1" fill="#2E8A66" />
                <Circle cx="15" cy="10" r="1" fill="#2E8A66" />
                <Circle cx="8.5" cy="9.5" r="0.4" fill="white" />
                <Circle cx="14.5" cy="9.5" r="0.4" fill="white" />
                <Path d="M7 8 Q9 6.5 11 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M13 8 Q15 6.5 17 8" stroke="#2E8A66" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M8 15 Q12 18 16 15" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
    ],
    SleepQuality: [
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grads1" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFEAEA" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFB3B3" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grads1)" />
                <Path d="M8 10 H10" stroke="#9B2C2C" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M14 10 H16" stroke="#9B2C2C" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M8 15 Q12 12 16 15" stroke="#9B2C2C" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M17 6 Q18.5 4.5 20 6" stroke="#9B2C2C" strokeWidth="1.2" strokeLinecap="round" />
                <Path d="M18 7 Q19 5.5 20 7" stroke="#9B2C2C" strokeWidth="1" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grads2" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFF7E6" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFE0B3" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grads2)" />
                <Path d="M8 10 H10" stroke="#C07A39" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M14 10 H16" stroke="#C07A39" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M9 15 H15" stroke="#C07A39" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grads3" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#E8F5F1" stopOpacity="1" />
                        <Stop offset="1" stopColor="#CDEAE1" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Rect x="6" y="8" width="12" height="6" rx="2" fill="url(#grads3)" />
                <Path d="M9 11 H15" stroke="#64C59A" strokeWidth="1.2" strokeLinecap="round" />
                <Rect x="4" y="10" width="4" height="2" rx="1" fill="#64C59A" opacity="0.5" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grads4" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#D8F6E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#BDECD5" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grads4)" />
                <Path d="M8 10 H10" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M14 10 H16" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M8 15 Q12 17 16 15" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="grads5" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#A8E6CF" stopOpacity="1" />
                        <Stop offset="1" stopColor="#7FD1AE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#grads5)" />
                <Path d="M8 10 H10" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M14 10 H16" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M8 15 Q12 18 16 15" stroke="#2E8A66" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
        ),
    ]
};
