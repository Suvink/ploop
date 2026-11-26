import type { ParsedBoardingPass } from '@/lib/bcbp';

/** Short-lived hand-off from the scanner to the review screen. Never persisted. */
let pending: ParsedBoardingPass | null = null;

export function setPendingScan(p: ParsedBoardingPass) {
  pending = p;
}

export function takePendingScan(): ParsedBoardingPass | null {
  const p = pending;
  return p;
}

export function clearPendingScan() {
  pending = null;
}
