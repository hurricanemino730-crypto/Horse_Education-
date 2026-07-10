import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ParticipantData } from "@/types/survey";
import { RADAR_AXIS_ORDER, SKILL_LABELS } from "@/types/survey";

interface Props {
  participant: ParticipantData;
}

export function SkillRadarChart({ participant }: Props) {
  const data = RADAR_AXIS_ORDER.map((key) => ({
    skill: SKILL_LABELS[key].en,
    pre: participant.preTraining?.[key] ?? 0,
    post: participant.postTraining?.[key] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid gridType="polygon" stroke="hsl(25 30% 75%)" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: "hsl(20 25% 29%)", fontSize: 13, fontWeight: 500 }}
        />
        <PolarRadiusAxis
          domain={[0, "dataMax"]}
          tickCount={6}
          tick={{ fill: "hsl(20 15% 45%)", fontSize: 10 }}
        />
        {participant.preTraining && (
          <Radar
            name="受講前"
            dataKey="pre"
            stroke="hsl(var(--chart-pre-training))"
            fill="hsl(var(--chart-pre-training))"
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive={false}
          />
        )}
        {participant.postTraining && (
          <Radar
            name="受講後"
            dataKey="post"
            stroke="hsl(var(--chart-post-training))"
            fill="hsl(var(--chart-post-training))"
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive={false}
          />
        )}
        <Legend
          verticalAlign="top"
          height={32}
          wrapperStyle={{ fontSize: 13 }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
