// The design mockup's backlog data, packaged as a BacklogView for the
// Shared backlog page's demo state.

import { BacklogView } from '../logic/backlog-engine';
import { BACKLOG, PICKS } from './animatch-data';

export const DEMO_BACKLOG: BacklogView = {
  nameA: 'yuki_47',
  nameB: 'renko_lists',
  planningA: 96,
  planningB: 143,
  bothPlanned: 34,
  bothCount: 34,
  onlyOneCount: 171,
  watchingCount: 2,
  overlapPct: 24,
  items: BACKLOG.map((k) => ({
    title: k.title,
    meta: k.meta,
    note: k.note,
    chip: k.chip,
    chipKind: k.chipKind,
    cover: null,
    predicted: Number(k.score),
    popularity: 0,
    year: 0,
  })),
  onlyOne: [],
  watching: [],
  picks: PICKS,
};
