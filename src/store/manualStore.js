import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { MANUAL_SECTIONS } from "../data/mockManual";
import { fetchManual } from "../services/googleDocsService";

/**
 * manualStore — manages store manual sections and acknowledgments
 *
 * Persists to Supabase when configured, with Google Docs sync preserved.
 * Falls back to in-memory mock data when Supabase is not configured.
 */
export const useManualStore = create((set, get) => ({
  sections: isSupabaseConfigured() ? [] : [...MANUAL_SECTIONS],
  acknowledgments: [],
  loading: false,
  error: null,
  lastContentHash: null,

  /**
   * Fetch sections and acknowledgments from Supabase.
   */
  fetchSections: async () => {
    if (!isSupabaseConfigured()) return;

    set({ loading: true });
    const { data, error } = await supabase
      .from("manual_sections")
      .select("*")
      .order("id");

    if (error) {
      console.error("Failed to fetch manual sections:", error.message);
      set({ loading: false });
      return;
    }

    const sections = (data || []).map((row) => ({
      id: String(row.id),
      dbId: row.id,
      title: row.title,
      body: row.body,
      version: row.version,
      contentHash: row.content_hash,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    }));

    set({ sections, loading: false });
  },

  fetchAcknowledgments: async (userId) => {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from("manual_acknowledgments")
      .select("*")
      .eq("employee_id", userId);

    if (data) {
      const acks = data.map((row) => ({
        id: String(row.id),
        sectionId: String(row.section_id),
        sectionVersion: row.section_version,
        userId: row.employee_id,
        timestamp: row.created_at,
      }));
      set({ acknowledgments: acks });
    }
  },

  /**
   * Fetch live manual from Google Docs and sync to Supabase.
   */
  fetchFromGoogleDocs: async () => {
    set({ loading: true, error: null });
    try {
      const { sections: fetched, contentHash } = await fetchManual();
      const { sections: existing, lastContentHash } = get();

      if (contentHash === lastContentHash) {
        set({ loading: false });
        return;
      }

      const existingById = {};
      for (const s of existing) {
        existingById[s.id] = s;
      }

      const now = new Date().toISOString();
      const merged = fetched.map((section) => {
        const prev = existingById[section.id];
        if (prev) {
          const contentChanged = prev.contentHash !== section.contentHash;
          return {
            ...section,
            version: contentChanged ? (prev.version || 1) + 1 : prev.version || 1,
            updatedAt: contentChanged ? now : prev.updatedAt || now,
            updatedBy: contentChanged ? "Google Docs" : prev.updatedBy || "Google Docs",
          };
        }
        return {
          ...section,
          version: 1,
          updatedAt: now,
          updatedBy: "Google Docs",
        };
      });

      set({ sections: merged, lastContentHash: contentHash, loading: false });

      // Persist to Supabase if configured
      if (isSupabaseConfigured()) {
        for (const section of merged) {
          // Upsert by title (unique) so Google Docs sections map to stable DB rows
          const { data: upserted, error: upsertErr } = await supabase
            .from("manual_sections")
            .upsert(
              {
                title: section.title,
                body: section.body,
                version: section.version,
                content_hash: section.contentHash,
                updated_at: section.updatedAt,
              },
              { onConflict: "title" }
            )
            .select("id")
            .single();

          if (!upsertErr && upserted) {
            section.dbId = upserted.id;
          }
        }
        // Re-set sections so dbId values are persisted in state
        set({ sections: [...merged] });
      }
    } catch (err) {
      console.warn("Failed to fetch manual from Google Docs:", err.message);
      set({ error: err.message, loading: false });
    }
  },

  getSections: () => get().sections,

  updateSection: async (sectionId, { title, body }, adminUserId) => {
    const now = new Date().toISOString();

    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              title: title ?? s.title,
              body: body ?? s.body,
              version: s.version + 1,
              updatedAt: now,
              updatedBy: adminUserId,
            }
          : s
      ),
    }));

    if (!isSupabaseConfigured()) return;

    const numId = parseInt(sectionId, 10);
    if (isNaN(numId)) return;

    const section = get().sections.find((s) => s.id === sectionId);
    if (section) {
      await supabase
        .from("manual_sections")
        .update({
          title: section.title,
          body: section.body,
          version: section.version,
          updated_by: adminUserId,
          updated_at: now,
        })
        .eq("id", numId);
    }
  },

  addSection: async ({ title, body }, adminUserId) => {
    if (!isSupabaseConfigured()) {
      const id = `ms${Date.now()}`;
      const newSection = {
        id,
        title,
        body,
        updatedAt: new Date().toISOString(),
        updatedBy: adminUserId,
        version: 1,
      };
      set((state) => ({
        sections: [...state.sections, newSection],
      }));
      return newSection;
    }

    const { data, error } = await supabase
      .from("manual_sections")
      .insert({
        title,
        body,
        version: 1,
        updated_by: adminUserId,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add section:", error.message);
      return null;
    }

    const newSection = {
      id: String(data.id),
      title: data.title,
      body: data.body,
      version: data.version,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
    set((state) => ({
      sections: [...state.sections, newSection],
    }));
    return newSection;
  },

  acknowledge: async (sectionId, userId) => {
    const section = get().sections.find((s) => s.id === sectionId);
    if (!section) return;

    const ack = {
      id: `ack${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sectionId,
      sectionVersion: section.version,
      userId,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      acknowledgments: [...state.acknowledgments, ack],
    }));

    if (!isSupabaseConfigured()) return;

    // section.dbId is the Supabase integer PK (set during fetchFromGoogleDocs
    // sync or fetchSections). Fall back to parsing the string id directly.
    const numSectionId = section.dbId ?? parseInt(sectionId, 10);
    if (!numSectionId || isNaN(numSectionId)) {
      console.warn(
        "Cannot acknowledge: no numeric DB id for section",
        sectionId
      );
      return;
    }

    try {
      const { error } = await supabase.from("manual_acknowledgments").insert({
        section_id: numSectionId,
        section_version: section.version,
        employee_id: userId,
      });

      if (error) {
        console.error("Failed to save acknowledgment:", error.message);
        // Roll back optimistic update so the button reappears
        set((state) => ({
          acknowledgments: state.acknowledgments.filter((a) => a.id !== ack.id),
        }));
      }
    } catch (err) {
      console.error("Acknowledgment insert threw:", err);
      set((state) => ({
        acknowledgments: state.acknowledgments.filter((a) => a.id !== ack.id),
      }));
    }
  },

  getUnacknowledged: (userId) => {
    const { sections, acknowledgments } = get();
    return sections.filter((section) => {
      const hasCurrentAck = acknowledgments.some(
        (a) =>
          // Match by section.id (string) or by dbId (Supabase PK stored as string)
          (a.sectionId === section.id ||
            (section.dbId && a.sectionId === String(section.dbId))) &&
          a.sectionVersion === section.version &&
          a.userId === userId
      );
      return !hasCurrentAck;
    });
  },

  getAcknowledgmentsForSection: (sectionId) => {
    const section = get().sections.find((s) => s.id === sectionId);
    return get().acknowledgments.filter(
      (a) =>
        a.sectionId === sectionId ||
        (section?.dbId && a.sectionId === String(section.dbId))
    );
  },
}));
