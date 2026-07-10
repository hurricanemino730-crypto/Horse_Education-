// 馬の頭部・たてがみの線画イラスト（インラインSVG、アウトラインスタイル）
export function HorseIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="馬のイラスト"
    >
      {/* 顔の輪郭 */}
      <path d="M120 20 C104 22 92 34 88 52 C85 66 88 80 82 92 C76 104 62 108 58 122 C55 132 60 142 70 146 C82 150 96 144 104 134 C110 126 112 116 118 108 C126 98 140 96 148 86 C156 76 156 60 150 46 C144 32 132 20 120 20 Z" />
      {/* 鼻先の陰影ライン */}
      <path d="M70 130 C76 128 82 124 86 118" strokeWidth="1.4" opacity="0.6" />
      {/* 耳 */}
      <path d="M112 24 C110 14 112 4 118 -2" strokeWidth="1.6" opacity="0" />
      <path d="M108 26 L114 4" strokeWidth="1.6" />
      {/* たてがみ（複数の流れる線） */}
      <path d="M116 22 C140 10 168 14 186 34 C198 48 202 66 196 82" strokeWidth="1.6" opacity="0.85" />
      <path d="M126 30 C148 22 172 28 186 46 C194 58 196 72 190 84" strokeWidth="1.4" opacity="0.7" />
      <path d="M134 40 C152 36 170 42 180 56 C186 66 186 76 180 84" strokeWidth="1.3" opacity="0.55" />
      <path d="M140 52 C154 50 166 56 172 66" strokeWidth="1.2" opacity="0.4" />
      {/* 目 */}
      <circle cx="118" cy="56" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
