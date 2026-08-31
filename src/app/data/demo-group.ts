// The design mockup's group data, packaged as a GroupView for the demo state.

import { GroupView } from '../logic/group-engine';
import {
  GROUP_ATTRS,
  GROUP_BACKLOG,
  GROUP_HIGHLIGHT,
  GROUP_USERS,
  buildMatrixCells,
} from './animatch-data';

export const DEMO_GROUP: GroupView = {
  users: GROUP_USERS,
  attrs: GROUP_ATTRS,
  highlight: GROUP_HIGHLIGHT,
  matrixCells: buildMatrixCells(),
  backlog: GROUP_BACKLOG,
  backlogTotal: 12,
};
