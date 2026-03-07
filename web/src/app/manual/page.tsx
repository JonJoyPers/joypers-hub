"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface Section {
  id: number;
  title: string;
  body: string | null;
  version: number;
  updated_at: string;
}

interface Acknowledgment {
  id: number;
  section_id: number;
  section_version: number;
  employee_id: string;
  created_at: string;
  employee: { name: string } | null;
}

export default function ManualPage() {
  const supabase = createClient();
  const [sections, setSections] = useState<Section[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [acks, setAcks] = useState<Acknowledgment[]>([]);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  async function fetchSections() {
    const { data } = await supabase.from("manual_sections").select("*").order("id");
    setSections(data || []);
  }

  async function fetchAcks(sectionId: number) {
    const { data } = await supabase
      .from("manual_acknowledgments")
      .select("*, employee:employees(name)")
      .eq("section_id", sectionId)
      .order("created_at", { ascending: false });
    setAcks(data || []);
  }

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (selected) fetchAcks(selected);
  }, [selected]);

  async function saveSection() {
    if (!selected) return;
    const section = sections.find((s) => s.id === selected);
    if (!section) return;

    await supabase
      .from("manual_sections")
      .update({
        title: editTitle,
        body: editBody,
        version: section.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected);

    setEditing(false);
    fetchSections();
  }

  async function addSection() {
    const { data } = await supabase
      .from("manual_sections")
      .insert({ title: "New Section", body: "", version: 1 })
      .select()
      .single();

    if (data) {
      fetchSections();
      setSelected(data.id);
    }
  }

  const currentSection = sections.find((s) => s.id === selected);
  const currentVersionAcks = acks.filter(
    (a) => currentSection && a.section_version === currentSection.version
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cream">Store Manual</h2>
        <button onClick={addSection} className="px-4 py-1.5 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">
          + Add Section
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section List */}
        <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-4 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => { setSelected(section.id); setEditing(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                selected === section.id
                  ? "bg-teal-dark text-cream"
                  : "text-cream-muted hover:bg-charcoal-light hover:text-cream"
              }`}
            >
              <p className="font-medium">{section.title}</p>
              <p className="text-xs opacity-60 mt-0.5">v{section.version}</p>
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="lg:col-span-2">
          {currentSection ? (
            <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6">
              {editing ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-charcoal-light border border-charcoal-light rounded-lg px-4 py-2 text-cream mb-4"
                  />
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full bg-charcoal-light border border-charcoal-light rounded-lg px-4 py-3 text-cream text-sm min-h-[300px] font-mono"
                  />
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveSection} className="px-4 py-2 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">
                      Save (bumps to v{currentSection.version + 1})
                    </button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-charcoal-light text-cream-muted rounded-lg text-sm">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-cream">{currentSection.title}</h3>
                      <p className="text-xs text-cream-muted mt-1">
                        Version {currentSection.version} | Updated {new Date(currentSection.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditing(true);
                        setEditTitle(currentSection.title);
                        setEditBody(currentSection.body || "");
                      }}
                      className="px-3 py-1.5 bg-charcoal-light text-cream-muted rounded-lg text-sm hover:text-cream"
                    >
                      Edit
                    </button>
                  </div>
                  <div
                    className="prose prose-invert prose-sm max-w-none text-cream-muted"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentSection.body || "<p>No content yet.</p>") }}
                  />

                  {/* Acknowledgments */}
                  <div className="mt-6 pt-4 border-t border-charcoal-light">
                    <h4 className="text-sm font-semibold text-cream mb-3">
                      Acknowledgments (v{currentSection.version})
                    </h4>
                    {currentVersionAcks.length === 0 ? (
                      <p className="text-cream-muted text-xs">No acknowledgments for this version yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {currentVersionAcks.map((ack) => (
                          <div key={ack.id} className="flex justify-between text-xs py-1">
                            <span className="text-cream">{ack.employee?.name}</span>
                            <span className="text-cream-muted">{new Date(ack.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 text-center text-cream-muted">
              Select a section to view or edit.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
