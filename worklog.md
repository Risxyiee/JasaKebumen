---
Task ID: 1
Agent: main
Task: Ensure all code is consistent with user's tailwind.config.ts - fix hardcoded colors

Work Log:
- Audited all component files for hardcoded hex colors in className strings
- Fixed HowItWorks.tsx: `bg-[#062A20]` → `bg-green-dark`, `bg-[#25D366]` → `bg-green`
- Fixed Benefits.tsx: SVG strokes `#E7E4DE` → `var(--color-line)`, `#064E3B` → `var(--color-green)`, `fill="#064E3B"` → `fill="var(--color-green)"`, `bg-[#25D366]` → `bg-green`, `bg-[#DDE8E1]` → `bg-green-tint`, `bg-[#EAE6DC]` → `bg-line`
- Fixed HeroDiorama.tsx: `border-[#1C4A39]` → `border-green-dark`, `bg-[#0A241C]` → `bg-green-dark`
- Fixed Features.tsx: `bg-[#25D366]` → `bg-green`
- Fixed Hero.tsx: SVG stroke `#F59E0B` → `var(--color-amber, #F59E0B)`
- Ran ESLint: 0 errors
- Verified with Agent Browser: all sections render, search/filter works, FAQ accordion works, Benefits tabs work, mobile menu works, no console errors

Stage Summary:
- All hardcoded hex colors in Tailwind class strings replaced with proper utility classes (bg-paper, text-ink, text-mute, text-faint, border-line, bg-green, bg-green-dark, bg-green-tint)
- SVG attribute colors use CSS custom properties (var(--color-green), var(--color-line))
- Site is fully functional with zero lint errors and zero runtime errors
