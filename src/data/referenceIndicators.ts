export interface ReferenceRow {
  category: string;
  subtitle: string;
  preHigher: string;
  postHigher: string;
}

export const DEFAULT_REFERENCE_ROWS: ReferenceRow[] = [
  {
    category: "Being",
    subtitle: "自分を整える力",
    preHigher:
      "・自分自身のありたい姿が実現できている（できつつある）\n・ビジョン（ありたい姿）と今の現実（ありたい姿に対する現在地）が理解できている",
    postHigher:
      "・好奇心旺盛で、学習、変化、成長を喜んで取り入れる\n・価値観や目的に対して体感した責任とコミットメントの感覚（主体的にかかわる感覚）を持っている",
  },
  {
    category: "Thinking",
    subtitle: "考える力",
    preHigher:
      "・自身の思考の偏りに気づき、自律的に行動できる\n・偏見を持たず、客観的・多面的な視点で判断ができている",
    postHigher:
      "・自身の判断や得られた情報が「本当か？」と問い直すことができる\n・限定的なものの見方から全体最適な思考へと変容できている",
  },
  {
    category: "Relating",
    subtitle: "つながりを築く力",
    preHigher:
      "・感謝、ありがたさ、喜びの基本的な感覚を持っている\n・他の存在に感謝し、思いやり、つながりを意識できている",
    postHigher:
      "・つながっているという感覚が醸成されている\n・知識によってつながりを意識するようになっている",
  },
  {
    category: "Collaborating",
    subtitle: "協働する力",
    preHigher:
      "・学校教育の過程でコミュニケーションの力が育まれている\n・みんなの心配事を何とかしたいと思っている",
    postHigher:
      "・多様なグループに合わせたコミュニケーションを取る力が得られている\n・コミュニケーションスキルを高めるための変化ができている",
  },
  {
    category: "Acting",
    subtitle: "行動する力",
    preHigher:
      "・具体的な結果を出すために果敢に行動できる\n・自分の信じている方向に一歩踏み出す力を持っている",
    postHigher:
      "・自分自身は正しいと思っているが、周りと異なる意見を表明することに勇気が必要だと感じている\n・希望の感覚、前向きな姿勢、意味のある変化の可能性がある",
  },
];

export const DEFAULT_BASIC_INFO = {
  affiliation: "個人",
  instructor: "宮田 朋典",
  program: "Horse Education Program",
  date: "2026.04.05",
  venue: "吉川牧場",
};
