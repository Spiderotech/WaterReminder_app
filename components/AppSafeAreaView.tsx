import React, { useMemo } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

type AppSafeAreaViewProps = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

const IOS_TOP_INSET_CAP = 36;
const DEFAULT_EDGES: Edge[] = ['top'];

const AppSafeAreaView = ({ children, edges, style }: AppSafeAreaViewProps) => {
  const insets = useSafeAreaInsets();
  const activeEdges = useMemo(
    () => edges || DEFAULT_EDGES,
    [edges],
  );
  const topInset = Platform.OS === 'ios'
    ? Math.min(insets.top, IOS_TOP_INSET_CAP)
    : insets.top;
  const safeAreaStyle = useMemo(
    () => ({
      paddingTop: activeEdges.includes('top') ? topInset : 0,
      paddingRight: activeEdges.includes('right') ? insets.right : 0,
      paddingBottom: activeEdges.includes('bottom') ? insets.bottom : 0,
      paddingLeft: activeEdges.includes('left') ? insets.left : 0,
    }),
    [activeEdges, insets.bottom, insets.left, insets.right, topInset],
  );

  return (
    <View
      style={[
        style,
        safeAreaStyle,
      ]}
    >
      {children}
    </View>
  );
};

export { AppSafeAreaView as SafeAreaView };
export default AppSafeAreaView;
