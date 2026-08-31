// The design mockup's data, packaged as a ComparisonView so the Compare
// page can show something meaningful before two real users are entered.

import { ComparisonView } from '../logic/comparison-engine';
import {
  BREAKDOWN,
  COMPAT_SCORE,
  DISAGREEMENTS,
  GENRES,
  HIST_A,
  HIST_B,
  SHARED_FOOTER,
  SHARED_ROWS,
  USER_A,
  USER_B,
} from './animatch-data';

export const DEMO_COMPARISON: ComparisonView = {
  userA: { ...USER_A, avatar: null },
  userB: { ...USER_B, avatar: null },
  compatScore: COMPAT_SCORE,
  breakdown: BREAKDOWN,
  disagreements: DISAGREEMENTS.map((d) => ({ ...d, cover: null })),
  sharedRows: SHARED_ROWS,
  sharedFooter: SHARED_FOOTER,
  sharedTotal: 118,
  disagreementTotal: 23,
  histA: HIST_A,
  histB: HIST_B,
  genres: GENRES,
};
