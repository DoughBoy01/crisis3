import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface SparkLineProps {
  data: { value: number }[];
  width?: number;
  height?: number;
  positive: boolean;
}

export default function SparkLine({ data, width = 96, height = 36, positive }: SparkLineProps) {
  if (data.length < 2) return null;

  const color = positive ? '#22c55e' : '#ef4444';
  const gradientId = `spark-${positive ? 'pos' : 'neg'}`;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={() => null}
            cursor={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 2.5, fill: color, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
