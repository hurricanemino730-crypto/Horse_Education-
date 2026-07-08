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
import { SKILL_KEYS, SKILL_LABELS } from "@/types/survey";

interface Props {
  participant: ParticipantData;
}

export function SkillRadarChart({ participant }: Props) {
  const data = SKILL_KEYS.map((key) => ({
    skill: SKILL_LABELS[key].en,
    pre: participant.preTraining?.[key] ?? 0,
    post: participant.postTraining?.[key] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid gridType="polygon" stroke="hsl(25 30% 75%)" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: "hsl(20 25% 29%)", fontSize: 13, fontWeight: 500 }}
        />
        <PolarRadiusAxis
          domain={[0, 10]}
          tickCount={6}
          tick={{ fill: "hsl(20 15% 45%)", fontSize: 10 }}
        />
        {participant.preTraining && (
          <Radar
            name="研修前"
            dataKey="pre"
            stroke="hsl(220 65% 35%)"
            fill="hsl(220 65% 35%)"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
          />
        )}
        {participant.postTraining && (
          <Radar
            name="研修後"
            dataKey="post"
            stroke="hsl(340 35% 50%)"
            fill="hsl(340 35% 50%)"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
          />
        )}
        <Legend wrapperStyle={{ fontSize: 13 }} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
