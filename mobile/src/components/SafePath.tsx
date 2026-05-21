import React from 'react';
import { Path, PathProps } from 'react-native-svg';
import { normalizeSvgPath } from '../utils/svgPath';

/** Path with d-string normalized for react-native-svg parsing */
export function SafePath({ d, ...rest }: PathProps) {
    const normalized = typeof d === 'string' ? normalizeSvgPath(d) : d;
    return <Path d={normalized} {...rest} />;
}
