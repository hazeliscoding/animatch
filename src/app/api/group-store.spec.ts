import { TestBed } from '@angular/core/testing';
import { GroupStore, defaultGroupName } from './group-store';

describe('GroupStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('creates groups newest-first and persists them', () => {
    const store = TestBed.inject(GroupStore);
    store.create('Movie night', ['alice', 'bob']);
    const club = store.create('Anime club', ['carol', 'dan', 'erin']);
    expect(store.saved().map((g) => g.name)).toEqual(['Anime club', 'Movie night']);
    const raw = JSON.parse(localStorage.getItem('animatch.savedGroups')!);
    expect(raw).toHaveLength(2);
    expect(store.byId(club.id)?.users).toEqual(['carol', 'dan', 'erin']);
  });

  it('renames and updates members in place', () => {
    const store = TestBed.inject(GroupStore);
    const g = store.create('Movie night', ['alice', 'bob']);
    store.rename(g.id, 'Friday club');
    store.setMembers(g.id, ['alice', 'bob', 'carol']);
    expect(store.byId(g.id)?.name).toBe('Friday club');
    expect(store.byId(g.id)?.users).toEqual(['alice', 'bob', 'carol']);
  });

  it('removes groups', () => {
    const store = TestBed.inject(GroupStore);
    const g = store.create('Movie night', ['alice', 'bob']);
    store.remove(g.id);
    expect(store.saved()).toEqual([]);
    expect(store.byId(g.id)).toBeUndefined();
  });

  it('survives corrupt localStorage', () => {
    localStorage.setItem('animatch.savedGroups', '{not json');
    const store = TestBed.inject(GroupStore);
    expect(store.saved()).toEqual([]);
  });
});

describe('defaultGroupName', () => {
  it('joins the first two members and counts the rest', () => {
    expect(defaultGroupName(['alice', 'bob'])).toBe('alice & bob');
    expect(defaultGroupName(['alice', 'bob', 'carol', 'dan'])).toBe('alice & bob +2');
  });
});
