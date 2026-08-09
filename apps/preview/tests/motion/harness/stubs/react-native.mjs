/**
 * Minimal `react-native` stub for the motion engine tests.
 *
 * Every host records what it was asked to render into a global render log so tests can
 * assert on the resolved style, on which host variant was chosen (raw vs animated) and on
 * the props that reached the host.
 */
import * as React from 'react';

export const renderLog = [];

export function resetRenderLog() {
  renderLog.length = 0;
}

/** Merge a RN style prop (object | array | nested arrays | falsy) the way RN does. */
export function flattenStyle(style) {
  if (!style) return {};
  if (Array.isArray(style)) {
    let out = {};
    for (const entry of style) {
      out = { ...out, ...flattenStyle(entry) };
    }
    return out;
  }
  if (typeof style === 'object') return { ...style };
  return {};
}

/** The raw style prop as a JSON-safe array, so tests can inspect ownership order. */
function toStyleArray(style) {
  if (!style) return [];
  if (Array.isArray(style)) return style.flatMap((entry) => toStyleArray(entry));
  if (typeof style === 'object') return [{ ...style }];
  return [];
}

function makeHost(name, domTag) {
  function Host(props) {
    const { style, children, __motionAnimated, ...rest } = props;
    renderLog.push({
      host: name,
      animated: __motionAnimated === true,
      style: flattenStyle(style),
      styleArray: toStyleArray(style),
      props: rest,
    });
    return React.createElement(domTag, { 'data-host': name }, children ?? null);
  }
  Host.displayName = name;
  return Host;
}

export const View = makeHost('View', 'div');
export const Text = makeHost('Text', 'span');
export const Pressable = makeHost('Pressable', 'div');
export const TextInput = makeHost('TextInput', 'div');
export const ScrollView = makeHost('ScrollView', 'div');
export const Image = makeHost('Image', 'img');
export const Modal = makeHost('Modal', 'div');
export const ActivityIndicator = makeHost('ActivityIndicator', 'div');
export const TouchableOpacity = makeHost('TouchableOpacity', 'div');
export const Switch = makeHost('Switch', 'div');

export const Keyboard = { dismiss() {}, addListener: () => ({ remove() {} }) };
export const BackHandler = { addEventListener: () => ({ remove() {} }) };
export const Appearance = {
  getColorScheme: () => 'light',
  addChangeListener: () => ({ remove() {} }),
};
export const useColorScheme = () => 'light';
export const I18nManager = { isRTL: false };
export const PixelRatio = { get: () => 1, roundToNearestPixel: (value) => value };
export const InteractionManager = { runAfterInteractions: (task) => task?.() };
export const LayoutAnimation = { configureNext() {}, Presets: {} };
export const UIManager = { measure() {} };
export const Linking = { openURL: async () => {}, addEventListener: () => ({ remove() {} }) };

export const StyleSheet = {
  flatten: flattenStyle,
  create: (sheet) => sheet,
  absoluteFill: {},
  absoluteFillObject: {},
  hairlineWidth: 1,
};

export const Platform = {
  get OS() {
    return globalThis.__TEST_PLATFORM__ ?? 'web';
  },
  select(spec) {
    if (Object.prototype.hasOwnProperty.call(spec, Platform.OS)) return spec[Platform.OS];
    if (Platform.OS !== 'web' && Object.prototype.hasOwnProperty.call(spec, 'native')) {
      return spec.native;
    }
    return spec.default;
  },
};

export const AccessibilityInfo = {
  isReduceMotionEnabled: async () => globalThis.__TEST_REDUCED_MOTION__ === true,
  addEventListener: () => ({ remove() {} }),
};

export const Animated = {
  View,
  Text,
  timing: () => ({ start: () => {}, stop: () => {} }),
  Value: class {
    constructor(value) {
      this.value = value;
    }
    setValue(value) {
      this.value = value;
    }
  },
};

export const Dimensions = { get: () => ({ width: 1024, height: 768 }) };
export const useWindowDimensions = () => ({ width: 1024, height: 768 });
export const findNodeHandle = () => null;
