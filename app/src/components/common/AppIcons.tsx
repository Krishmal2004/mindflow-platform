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
    Forward: ({ width = 24, height = 24, color = "#333", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
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
    List: ({ width = 24, height = 24, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M8 6H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 12H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 18H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="3" cy="6" r="2" fill={color} />
            <Circle cx="3" cy="12" r="2" fill={color} />
            <Circle cx="3" cy="18" r="2" fill={color} />
        </Svg>
    ),
    Calendar: ({ width = 24, height = 24, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3 10H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    History: ({ width = 24, height = 24, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M12 8V12L15 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
    ),
    RemoveCircle: ({ width = 24, height = 24, color = "#EF4444", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M8 12H16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
    ),
    Lock: ({ width = 24, height = 24, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path
                d="M15.75 8.25V6C15.75 3.92893 14.0711 2.25 12 2.25C9.92893 2.25 8.25 3.92893 8.25 6V8.25M12 14.25V16.25M10.5 19.5H13.5C14.7426 19.5 15.75 18.4926 15.75 17.25V14.25C15.75 13.0074 14.7426 12 13.5 12H10.5C9.25736 12 8.25 13.0074 8.25 14.25V17.25C8.25 18.4926 9.25736 19.5 10.5 19.5Z"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
        </Svg>
    ),
    LogOut: ({ width = 24, height = 24, color = "#EF4444", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path
                d="M17.75 12H6.25M13.25 7.75L17.75 12L13.25 16.25M17 20.5H9.5C7.42893 20.5 5.75 18.8211 5.75 16.75V7.25C5.75 5.17893 7.42893 3.5 9.5 3.5H17"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    ),
    ChevronRight: ({ width = 24, height = 24, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    School: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 15V22" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Graduation: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M22 10L12 5L2 10L12 15L22 10Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M6 12V18C6 19.1046 7.89543 20 12 20C16.1046 20 18 19.1046 18 18V12" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Book: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20V5H6.5C5.83696 5 5.20107 5.26339 4.73223 5.73223C4.26339 6.20107 4 6.83696 4 7.5V19.5Z" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M20 17H6.5C5.83696 17 5.20107 17.2634 4.73223 17.7322C4.26339 18.2011 4 18.837 4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Home: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M9 22V12H15V22" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Family: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20" stroke={color} strokeWidth={strokeWidth} />
            <Circle cx="19" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} />
            <Circle cx="5" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Globe: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M2 12H22" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Heart: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.90836 3.57831 8.50903 2.99884 7.05 2.99884C5.59096 2.99884 4.19164 3.57831 3.16 4.61C2.12831 5.64169 1.54884 7.04102 1.54884 8.5C1.54884 9.95898 2.12831 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    Target: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
            <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={strokeWidth} />
            <Circle cx="12" cy="12" r="2" fill={color} />
        </Svg>
    ),
    Mindflow: ({ width = 28, height = 28, color = "#64C59A", strokeWidth = 2 }: IconProps) => (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2C13.3137 2 14.6136 2.25866 15.8268 2.75866C17.04 3.25866 18.1421 4.00001 19.071 5.00001C20 6.00001 20.7424 7.14214 21.2424 8.35534C21.7424 9.56854 22 10.8137 22 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M12 22C10.6863 22 9.38642 21.7413 8.17317 21.2413C6.95991 20.7413 5.85786 20 4.92893 19C4 18 3.25759 16.8579 2.75759 15.6447C2.25759 14.4315 2 13.1863 2 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M8 14C8.65661 14.6278 9.50909 15 10.4142 15C12.2142 15 13.4142 13.6569 13.4142 12C13.4142 10.3431 12.2142 9 10.4142 9C9.50909 9 8.65661 9.37216 8 10" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    ),
    TabHome: ({ focused }: { focused: boolean }) => (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill={focused ? '#64C59A' : 'none'}>
            <Path
                d="M3 9L12 2L21 9V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V9Z"
                stroke={focused ? '#64C59A' : '#999999'}
                strokeWidth="2"
                fill={focused ? '#64C59A' : 'none'}
            />
            <Path d="M9 22V12H15V22" stroke={focused ? '#fff' : '#999999'} strokeWidth="2" />
        </Svg>
    ),
    TabCalendar: ({ focused }: { focused: boolean }) => (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
                d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                stroke={focused ? '#64C59A' : '#999999'}
                strokeWidth="2"
            />
            <Path d="M16 2V6" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
            <Path d="M8 2V6" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
            <Path d="M3 10H21" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
        </Svg>
    ),
    TabProgress: ({ focused }: { focused: boolean }) => (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z"
                stroke={focused ? '#64C59A' : '#999999'}
                strokeWidth="2"
            />
            <Path d="M12 6V12L16 14" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    ),
    TabAccount: ({ focused }: { focused: boolean }) => (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
                d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
                stroke={focused ? '#64C59A' : '#999999'}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <Circle cx="12" cy="7" r="4" stroke={focused ? '#64C59A' : '#999999'} strokeWidth="2" />
        </Svg>
    ),
};

// Emojis from DailySliders
export const Emojis = {
    Stress: [
        // 1. Low Stress - Relaxed (Green)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="stress1" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#E8F5E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#69F0AE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#stress1)" />
                <Circle cx="9" cy="10" r="1.2" fill="#2E7D32" />
                <Circle cx="15" cy="10" r="1.2" fill="#2E7D32" />
                <Path d="M9 15 Q12 17 15 15" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 2. Mild - Okay (Light Green)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="stress2" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#F1F8E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#AED581" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#stress2)" />
                <Circle cx="9" cy="10" r="1.2" fill="#558B2F" />
                <Circle cx="15" cy="10" r="1.2" fill="#558B2F" />
                <Path d="M9 15 H15" stroke="#558B2F" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 3. Moderate - Uncertain (Yellow)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="stress3" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFFDE7" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFF176" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#stress3)" />
                <Circle cx="9" cy="10" r="1.2" fill="#F9A825" />
                <Circle cx="15" cy="10" r="1.2" fill="#F9A825" />
                <Path d="M9 16 Q12 14 15 16" stroke="#F9A825" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M18 6 L20 4" stroke="#F9A825" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 4. High - Anxious (Orange)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="stress4" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFF3E0" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFB74D" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#stress4)" />
                <Circle cx="9" cy="10" r="1.2" fill="#EF6C00" />
                <Circle cx="15" cy="10" r="1.2" fill="#EF6C00" />
                <Path d="M9 16 Q12 13 15 16" stroke="#EF6C00" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M19 8 Q20 5 21 8" stroke="#EF6C00" strokeWidth="1.5" strokeLinecap="round" />
                <Circle cx="5" cy="9" r="0.8" fill="#EF6C00" opacity="0.6" />
            </Svg>
        ),
        // 5. Very High - Overwhelmed (Red)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="stress5" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFEBEE" stopOpacity="1" />
                        <Stop offset="1" stopColor="#E57373" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#stress5)" />
                <Path d="M8 9 L10 11 M10 9 L8 11" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M14 9 L16 11 M16 9 L14 11" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M9 15 Q12 12 15 15" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M4 6 L6 4 M20 4 L18 6" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
    ],
    Mood: [
        // 1. Bad - Sad/Crying (Red)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="mood1" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFEBEE" stopOpacity="1" />
                        <Stop offset="1" stopColor="#EF9A9A" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#mood1)" />
                <Circle cx="9" cy="10" r="1.2" fill="#C62828" />
                <Circle cx="15" cy="10" r="1.2" fill="#C62828" />
                <Path d="M9 16 Q12 13 15 16" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M15 11 V13" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 2. Poor - Upset (Orange)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="mood2" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFF3E0" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFCC80" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#mood2)" />
                <Circle cx="9" cy="10" r="1.2" fill="#EF6C00" />
                <Circle cx="15" cy="10" r="1.2" fill="#EF6C00" />
                <Path d="M9 15 Q12 14 15 15" stroke="#EF6C00" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 3. Fair - Neutral (Yellow)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="mood3" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFFDE7" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFF59D" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#mood3)" />
                <Circle cx="9" cy="10" r="1.2" fill="#F9A825" />
                <Circle cx="15" cy="10" r="1.2" fill="#F9A825" />
                <Path d="M9 15 H15" stroke="#F9A825" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 4. Good - Happy (Light Green)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="mood4" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#F1F8E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#C5E1A5" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#mood4)" />
                <Circle cx="9" cy="10" r="1.2" fill="#558B2F" />
                <Circle cx="15" cy="10" r="1.2" fill="#558B2F" />
                <Path d="M9 14 Q12 17 15 14" stroke="#558B2F" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 5. Excellent - Ecstatic (Bright Green)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="mood5" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#E8F5E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#69F0AE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#mood5)" />
                <Path d="M8 10 Q12 8 16 10" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M8 14 Q12 18 16 14" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M7 6 L9 5 M17 6 L15 5" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
    ],
    Relaxation: [
        // 1. Very Tense (Red)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="relax1" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFEBEE" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFCDD2" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#relax1)" />
                <Path d="M8 10 L10 10" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M14 10 L16 10" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M9 15 L10 14 L11 15 L12 14 L13 15 L14 14 L15 15" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 2. Tense (Orange)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="relax2" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFF3E0" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFCC80" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#relax2)" />
                <Circle cx="9" cy="10" r="1.2" fill="#EF6C00" />
                <Circle cx="15" cy="10" r="1.2" fill="#EF6C00" />
                <Path d="M9 15 H15" stroke="#EF6C00" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 3. Okay (Yellow)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="relax3" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFFDE7" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFF59D" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#relax3)" />
                <Circle cx="9" cy="10" r="1.2" fill="#F9A825" />
                <Circle cx="15" cy="10" r="1.2" fill="#F9A825" />
                <Path d="M9 15 Q12 16 15 15" stroke="#F9A825" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 4. Relaxed (Teal)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="relax4" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#E0F7FA" stopOpacity="1" />
                        <Stop offset="1" stopColor="#80DEEA" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#relax4)" />
                <Path d="M8 10 Q9 11 10 10" stroke="#00838F" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M14 10 Q15 11 16 10" stroke="#00838F" strokeWidth="1.5" strokeLinecap="round" />
                <Circle cx="12" cy="14" r="0.5" fill="#00838F" />
                <Path d="M9 15 Q12 16 15 15" stroke="#00838F" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 5. Very Relaxed - Zen (Blue/Purple)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="relax5" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#E3F2FD" stopOpacity="1" />
                        <Stop offset="1" stopColor="#90CAF9" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#relax5)" />
                <Path d="M7 11 Q12 13 17 11" stroke="#1565C0" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M9 15 Q12 17 15 15" stroke="#1565C0" strokeWidth="1.5" strokeLinecap="round" />
                {/* Third Eye / Chakra */}
                <Circle cx="12" cy="7" r="1" fill="#1565C0" opacity="0.6" />
            </Svg>
        ),
    ],
    SleepQuality: [
        // 1. Very Poor - Tired/Exhausted (Reddish)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="sleep1" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFEAEA" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFB3B3" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#sleep1)" />
                {/* Tired Eyes (X shape or drooping) */}
                <Path d="M8 9 L10 11 M10 9 L8 11" stroke="#9B2C2C" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M14 9 L16 11 M16 9 L14 11" stroke="#9B2C2C" strokeWidth="1.5" strokeLinecap="round" />
                {/* Frown */}
                <Path d="M9 16 Q12 14 15 16" stroke="#9B2C2C" strokeWidth="1.5" strokeLinecap="round" />
                {/* Zzz symbol small */}
                <Path d="M19 5 L21 5 L19 8 L21 8" stroke="#9B2C2C" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </Svg>
        ),
        // 2. Poor - Groggy (Orange/Peach)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="sleep2" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFF7E6" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFE0B3" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#sleep2)" />
                {/* Droopy Eyes */}
                <Path d="M7 10 Q9 11 11 10" stroke="#C07A39" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M13 10 Q15 11 17 10" stroke="#C07A39" strokeWidth="1.5" strokeLinecap="round" />
                {/* Flat Mouth */}
                <Path d="M9 15 H15" stroke="#C07A39" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 3. Fair - Neutral (Light Yellow/Green)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="sleep3" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#F9FBE7" stopOpacity="1" />
                        <Stop offset="1" stopColor="#E6EE9C" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#sleep3)" />
                {/* Neutral Open Eyes */}
                <Circle cx="9" cy="10" r="1.2" fill="#827717" />
                <Circle cx="15" cy="10" r="1.2" fill="#827717" />
                {/* Slight Smile */}
                <Path d="M9 15 Q12 16 15 15" stroke="#827717" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 4. Good - Rested (Light Teal/Green)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="sleep4" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#E0F2F1" stopOpacity="1" />
                        <Stop offset="1" stopColor="#80CBC4" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#sleep4)" />
                {/* Happy Eyes */}
                <Path d="M8 10 Q9 9 10 10" stroke="#00695C" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M14 10 Q15 9 16 10" stroke="#00695C" strokeWidth="1.5" strokeLinecap="round" />
                {/* Smile */}
                <Path d="M8 14 Q12 17 16 14" stroke="#00695C" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
        ),
        // 5. Excellent - Energized (Bright Mint/Green)
        (props: any) => (
            <Svg width={props?.width ?? 28} height={props?.height ?? 28} viewBox="0 0 24 24" fill="none">
                <Defs>
                    <LinearGradient id="sleep5" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#E8F5E9" stopOpacity="1" />
                        <Stop offset="1" stopColor="#69F0AE" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="10" fill="url(#sleep5)" />
                {/* Big Happy Eyes (Curves) */}
                <Path d="M7 10 Q9 8 11 10" stroke="#004D40" strokeWidth="1.5" strokeLinecap="round" />
                <Path d="M13 10 Q15 8 17 10" stroke="#004D40" strokeWidth="1.5" strokeLinecap="round" />
                {/* Big Smile */}
                <Path d="M8 14 Q12 18 16 14" stroke="#004D40" strokeWidth="1.5" strokeLinecap="round" />
                {/* Star/Sparkle (Optional, simpler is better for professional look) */}
            </Svg>
        ),
    ]
};
