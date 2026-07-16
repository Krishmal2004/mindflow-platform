import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

export function PanelWave() {
    const h = 90;
    const w = width;
    return (
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', bottom: 0, left: 0 }} pointerEvents="none">
            <Defs>
                <SvgGradient id="lwg" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#A7D7C5" stopOpacity="1" />
                    <Stop offset="0.5" stopColor="#7FD9D1" stopOpacity="1" />
                    <Stop offset="1" stopColor="#63C9D9" stopOpacity="1" />
                </SvgGradient>
            </Defs>
            <Path d={`M0 ${h * 0.4} C${w * 0.25} ${h * 0.1} ${w * 0.5} ${h * 0.7} ${w * 0.75} ${h * 0.3} C${w * 0.88} ${h * 0.1} ${w} ${h * 0.4} ${w} ${h * 0.4} L${w} ${h} L0 ${h} Z`} fill="url(#lwg)" opacity={0.22} />
            <Path d={`M0 ${h * 0.6} C${w * 0.22} ${h * 0.35} ${w * 0.5} ${h * 0.82} ${w * 0.72} ${h * 0.5} C${w * 0.86} ${h * 0.3} ${w} ${h * 0.58} ${w} ${h * 0.58} L${w} ${h} L0 ${h} Z`} fill="url(#lwg)" opacity={0.14} />
        </Svg>
    );
}
