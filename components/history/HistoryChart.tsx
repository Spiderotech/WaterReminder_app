import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { ChartPoint } from '../../constants/historyData';

interface HistoryChartProps {
  data: ChartPoint[];
}

const chartWidth = Dimensions.get('window').width - 58;
const chartHeight = 250;

const buildSmoothPath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) {
    return '';
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
};

const HistoryChart = ({ data }: HistoryChartProps) => {
  const displayData = data.length === 1 ? [data[0], { ...data[0], day: '' }] : data;
  const leftPad = 38;
  const rightPad = 8;
  const topPad = 22;
  const bottomPad = 40;
  const plotWidth = chartWidth - leftPad - rightPad;
  const plotHeight = chartHeight - topPad - bottomPad;
  const maxValue = Math.max(3, ...displayData.map(point => point.value));
  const stepX = displayData.length > 1 ? plotWidth / (displayData.length - 1) : 0;

  const points = displayData.map((point, index) => ({
    ...point,
    x: leftPad + stepX * index,
    y: topPad + (1 - point.value / maxValue) * plotHeight,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${topPad + plotHeight} L ${points[0].x} ${topPad + plotHeight} Z`;

  return (
    <View style={styles.wrap}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="historyArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1d78ff" stopOpacity="0.88" />
            <Stop offset="1" stopColor="#0a1a3a" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {[0, 1, 2, 3].map(index => {
          const y = topPad + plotHeight - (plotHeight / 3) * index;
          return (
            <G key={index}>
              <Line x1={leftPad} y1={y} x2={chartWidth - rightPad} y2={y} stroke="#17375d" strokeDasharray="4 6" strokeWidth={1} />
              <SvgText x={0} y={y + 5} fill="#aeb8d6" fontSize="15">
                {index === 0 ? '0L' : `${(maxValue / 3 * index).toFixed(maxValue > 10 ? 0 : 1)}L`}
              </SvgText>
            </G>
          );
        })}

        <Line x1={leftPad} y1={topPad} x2={leftPad} y2={topPad + plotHeight} stroke="#2f496f" />
        <Line x1={leftPad} y1={topPad + plotHeight} x2={chartWidth - rightPad} y2={topPad + plotHeight} stroke="#2f496f" />
        <Path d={areaPath} fill="url(#historyArea)" />
        <Path d={linePath} fill="none" stroke="#62e6ff" strokeWidth={4} strokeLinecap="round" />

        {points.map((point, index) => (
          <G key={`${point.day}-${index}`}>
            <Line x1={point.x} y1={point.y} x2={point.x} y2={topPad + plotHeight} stroke="#2d67a8" strokeDasharray="4 5" />
            <Circle cx={point.x} cy={point.y} r={7} fill="#66e6ff" stroke="#c9ffff" strokeWidth={1} />
            <SvgText x={point.x - 17} y={point.y - 18} fill="#d4dcff" fontSize="16" fontWeight="700">
              {point.value.toFixed(1)}L
            </SvgText>
            {point.day ? (
              <SvgText x={point.x - 14} y={chartHeight - 10} fill="#bec5db" fontSize="15">
                {point.day}
              </SvgText>
            ) : null}
          </G>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 14,
  },
});

export default HistoryChart;
