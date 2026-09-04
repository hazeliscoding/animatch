import { Injectable, signal } from '@angular/core';

export interface SavedGroup {
  id: string;
  name: string;
  users: string[];
  at: number;
}

const KEY = 'animatch.savedGroups';

function read(): SavedGroup[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function newId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Named watch groups the user keeps — local-first, backend sync later. */
@Injectable({ providedIn: 'root' })
export class GroupStore {
  readonly saved = signal<SavedGroup[]>(read());

  byId(id: string): SavedGroup | undefined {
    return this.saved().find((g) => g.id === id);
  }

  create(name: string, users: string[]): SavedGroup {
    const group: SavedGroup = { id: newId(), name, users: [...users], at: Date.now() };
    this.write([group, ...this.saved()]);
    return group;
  }

  rename(id: string, name: string) {
    this.update(id, (g) => ({ ...g, name }));
  }

  setMembers(id: string, users: string[]) {
    this.update(id, (g) => ({ ...g, users: [...users] }));
  }

  remove(id: string) {
    this.write(this.saved().filter((g) => g.id !== id));
  }

  private update(id: string, fn: (g: SavedGroup) => SavedGroup) {
    this.write(this.saved().map((g) => (g.id === id ? { ...fn(g), at: Date.now() } : g)));
  }

  private write(groups: SavedGroup[]) {
    this.saved.set(groups);
    localStorage.setItem(KEY, JSON.stringify(groups));
  }
}

/** "alice & bob", "alice & bob +2" */
export function defaultGroupName(users: string[]): string {
  const head = users.slice(0, 2).join(' & ');
  return users.length > 2 ? `${head} +${users.length - 2}` : head;
}
