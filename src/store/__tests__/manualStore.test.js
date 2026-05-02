/**
 * manualStore tests
 *
 * Focus areas:
 *   1. Acknowledgment lifecycle — ensures Joy-Per's "did employee read v3?"
 *      check stays correct as section versions bump.
 *   2. fetchFromGoogleDocs version-bump logic — when a section's contentHash
 *      changes, version increments; when unchanged, it stays. New sections
 *      start at version 1. Identical contentHash short-circuits early.
 *
 * setup.js mocks Supabase as unconfigured so the store falls back to
 * MANUAL_SECTIONS seed data. We mock googleDocsService per-file so
 * fetchFromGoogleDocs is fully deterministic.
 */

// Per-file mock of the Google Docs service. The factory must be self-contained
// (no out-of-scope vars without `mock` prefix), so we expose a setter via
// a global accessor pattern.
let mockManualPayload = null;
let mockManualShouldThrow = false;

jest.mock('../../services/googleDocsService', () => ({
  fetchManual: jest.fn(() => {
    if (mockManualShouldThrow) {
      return Promise.reject(new Error('docs offline'));
    }
    return Promise.resolve(mockManualPayload);
  }),
}));

import { useManualStore } from '../manualStore';
import { MANUAL_SECTIONS } from '../../data/mockManual';

// Snapshot the seeded state so each test starts from the same baseline
const initialSnapshot = JSON.parse(
  JSON.stringify({
    sections: useManualStore.getState().sections,
    acknowledgments: [],
    loading: false,
    error: null,
    lastContentHash: null,
  })
);

beforeEach(() => {
  useManualStore.setState(JSON.parse(JSON.stringify(initialSnapshot)));
  mockManualPayload = null;
  mockManualShouldThrow = false;
});

describe('manualStore (mock mode)', () => {
  describe('initial state', () => {
    test('loads MANUAL_SECTIONS seed', () => {
      const s = useManualStore.getState();
      expect(s.sections.length).toBe(MANUAL_SECTIONS.length);
      expect(s.acknowledgments).toEqual([]);
      expect(s.loading).toBe(false);
      expect(s.error).toBeNull();
    });

    test('getSections returns current sections', () => {
      const sections = useManualStore.getState().getSections();
      expect(sections.length).toBe(MANUAL_SECTIONS.length);
      expect(sections[0].title).toBe('Opening Procedures');
    });
  });

  describe('updateSection', () => {
    test('bumps version, updates body, sets updatedBy', async () => {
      const before = useManualStore
        .getState()
        .sections.find((s) => s.id === 'ms001');
      const beforeVersion = before.version;

      await useManualStore
        .getState()
        .updateSection('ms001', { body: 'Updated body' }, 'admin_user');

      const after = useManualStore
        .getState()
        .sections.find((s) => s.id === 'ms001');
      expect(after.version).toBe(beforeVersion + 1);
      expect(after.body).toBe('Updated body');
      expect(after.updatedBy).toBe('admin_user');
      expect(after.title).toBe(before.title); // untouched when not provided
    });

    test('preserves title when body-only update is supplied', async () => {
      const before = useManualStore
        .getState()
        .sections.find((s) => s.id === 'ms001');

      await useManualStore
        .getState()
        .updateSection('ms001', { body: 'New' }, 'admin');

      const after = useManualStore
        .getState()
        .sections.find((s) => s.id === 'ms001');
      expect(after.title).toBe(before.title);
    });
  });

  describe('addSection', () => {
    test('appends a new section with version=1', async () => {
      const before = useManualStore.getState().sections.length;
      const result = await useManualStore
        .getState()
        .addSection({ title: 'New Section', body: 'Body text' }, 'admin');

      expect(result).toBeDefined();
      expect(result.version).toBe(1);
      expect(result.title).toBe('New Section');
      expect(result.updatedBy).toBe('admin');
      expect(useManualStore.getState().sections.length).toBe(before + 1);
    });
  });

  describe('acknowledge + getUnacknowledged', () => {
    test('acknowledge stores an ack tied to current section version', async () => {
      const section = useManualStore
        .getState()
        .sections.find((s) => s.id === 'ms001');
      await useManualStore.getState().acknowledge('ms001', 'u001');

      const acks = useManualStore.getState().acknowledgments;
      expect(acks.length).toBe(1);
      expect(acks[0].sectionId).toBe('ms001');
      expect(acks[0].userId).toBe('u001');
      expect(acks[0].sectionVersion).toBe(section.version);
    });

    test('getUnacknowledged excludes sections the user has acknowledged at current version', async () => {
      const totalSections = useManualStore.getState().sections.length;

      const beforeUnread = useManualStore
        .getState()
        .getUnacknowledged('u001');
      expect(beforeUnread.length).toBe(totalSections);

      await useManualStore.getState().acknowledge('ms001', 'u001');

      const afterUnread = useManualStore.getState().getUnacknowledged('u001');
      expect(afterUnread.length).toBe(totalSections - 1);
      expect(afterUnread.find((s) => s.id === 'ms001')).toBeUndefined();
    });

    test('an old version ack does NOT cover a newer version (re-ack required after edit)', async () => {
      // u001 acknowledges v1
      await useManualStore.getState().acknowledge('ms001', 'u001');
      let unread = useManualStore.getState().getUnacknowledged('u001');
      expect(unread.find((s) => s.id === 'ms001')).toBeUndefined();

      // Admin updates the section → version bumps to v2
      await useManualStore
        .getState()
        .updateSection('ms001', { body: 'Updated' }, 'admin');

      // The old v1 ack should NOT cover v2 — section reappears in unread list
      unread = useManualStore.getState().getUnacknowledged('u001');
      expect(unread.find((s) => s.id === 'ms001')).toBeDefined();
    });

    test("acknowledge ignores unknown section IDs (no throw, no ack stored)", async () => {
      await useManualStore.getState().acknowledge('does_not_exist', 'u001');
      expect(useManualStore.getState().acknowledgments).toEqual([]);
    });
  });

  describe('fetchFromGoogleDocs — version-bump logic', () => {
    test('short-circuits when contentHash matches lastContentHash (no work)', async () => {
      mockManualPayload = {
        contentHash: 'hash_xyz',
        sections: [
          { id: 'ms001', title: 'A', body: 'a', contentHash: 'inner1' },
        ],
      };
      useManualStore.setState({ lastContentHash: 'hash_xyz' });

      const sectionsBefore = useManualStore.getState().sections;
      await useManualStore.getState().fetchFromGoogleDocs();

      // Sections list is untouched
      expect(useManualStore.getState().sections).toEqual(sectionsBefore);
      expect(useManualStore.getState().loading).toBe(false);
    });

    test('preserves version when an existing section content_hash is unchanged', async () => {
      // Seed an existing section with a known contentHash + version
      useManualStore.setState({
        sections: [
          {
            id: 'ms001',
            title: 'Opening',
            body: 'old body',
            contentHash: 'h1',
            version: 3,
            updatedAt: '2026-01-01',
            updatedBy: 'admin',
          },
        ],
        lastContentHash: 'doc_old',
      });

      mockManualPayload = {
        contentHash: 'doc_new',
        sections: [
          { id: 'ms001', title: 'Opening', body: 'old body', contentHash: 'h1' },
        ],
      };

      await useManualStore.getState().fetchFromGoogleDocs();

      const after = useManualStore
        .getState()
        .sections.find((s) => s.id === 'ms001');
      expect(after.version).toBe(3); // unchanged because contentHash matched
      expect(useManualStore.getState().lastContentHash).toBe('doc_new');
    });

    test('bumps version when an existing section contentHash changes', async () => {
      useManualStore.setState({
        sections: [
          {
            id: 'ms001',
            title: 'Opening',
            body: 'old body',
            contentHash: 'h1',
            version: 3,
            updatedAt: '2026-01-01',
            updatedBy: 'admin',
          },
        ],
        lastContentHash: 'doc_old',
      });

      mockManualPayload = {
        contentHash: 'doc_new',
        sections: [
          { id: 'ms001', title: 'Opening', body: 'NEW body', contentHash: 'h2' },
        ],
      };

      await useManualStore.getState().fetchFromGoogleDocs();

      const after = useManualStore
        .getState()
        .sections.find((s) => s.id === 'ms001');
      expect(after.version).toBe(4);
      expect(after.body).toBe('NEW body');
      expect(after.contentHash).toBe('h2');
      expect(after.updatedBy).toBe('Google Docs');
    });

    test('treats a brand-new section as version=1', async () => {
      useManualStore.setState({
        sections: [],
        lastContentHash: null,
      });

      mockManualPayload = {
        contentHash: 'doc_first',
        sections: [
          { id: 'ms_brand_new', title: 'New', body: 'Hello', contentHash: 'hN' },
        ],
      };

      await useManualStore.getState().fetchFromGoogleDocs();

      const after = useManualStore.getState().sections;
      expect(after).toHaveLength(1);
      expect(after[0].id).toBe('ms_brand_new');
      expect(after[0].version).toBe(1);
      expect(after[0].updatedBy).toBe('Google Docs');
    });

    test('sets error state and clears loading when fetch throws', async () => {
      mockManualShouldThrow = true;

      await useManualStore.getState().fetchFromGoogleDocs();

      const s = useManualStore.getState();
      expect(s.error).toBe('docs offline');
      expect(s.loading).toBe(false);
    });
  });
});
