import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { InputField, SelectField, TextareaField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { SearchBar } from "../components/SearchBar";
import { StatGrid } from "../components/StatGrid";
import { api } from "../lib/api";
import type { Lead, LeadPayload, Snapshot } from "../types";

const defaultLeadForm = (): LeadPayload => ({
  customerName: "",
  phone: "",
  city: "",
  source: "Walk-in",
  interest: "",
  status: "NEW",
  budgetMin: undefined,
  budgetMax: undefined,
  followUpTitle: "",
  dueAt: "",
  notes: ""
});

export function LeadsPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inventoryInterests, setInventoryInterests] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<LeadPayload>(defaultLeadForm());
  const [customInterest, setCustomInterest] = useState("");
  const [leadPendingDelete, setLeadPendingDelete] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    const [snapshotData, leadData, vehicleData] = await Promise.all([api.snapshot(), api.leads(), api.vehicles()]);
    setSnapshot(snapshotData);
    setLeads(leadData);
    setInventoryInterests(
      Array.from(
        new Set(
          vehicleData
            .map((vehicle) => vehicle.title.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b))
    );
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (lead.customerName?.toLowerCase().includes(term) ?? false) ||
           (lead.phone?.toLowerCase().includes(term) ?? false) ||
           (lead.interest?.toLowerCase().includes(term) ?? false);
  });

  useEffect(() => {
    if (!selectedLead) {
      setForm(defaultLeadForm());
      setCustomInterest("");
      return;
    }

    const useCustomInterest =
      selectedLead.interest !== "Other" && !inventoryInterests.includes(selectedLead.interest);

    setForm({
      customerName: selectedLead.customerName,
      phone: selectedLead.phone,
      city: selectedLead.city,
      source: selectedLead.source,
      interest: useCustomInterest ? "Other" : selectedLead.interest,
      status: selectedLead.rawStatus,
      budgetMin: selectedLead.budgetMin,
      budgetMax: selectedLead.budgetMax,
      followUpTitle: selectedLead.followUpTitle ?? "",
      dueAt: selectedLead.dueAt ?? "",
      notes: selectedLead.notes ?? ""
    });
    setCustomInterest(useCustomInterest ? selectedLead.interest : "");
  }, [inventoryInterests, selectedLead]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(phoneDigits)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    const resolvedInterest = (form.interest === "Other" ? customInterest : form.interest).trim();
    if (!resolvedInterest) {
      setError("Vehicle interest is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        phone: phoneDigits,
        interest: resolvedInterest
      };

      if (selectedLead) {
        await api.updateLead(selectedLead.id, payload);
      } else {
        await api.createLead(payload);
      }

      setSelectedLead(null);
      setModalOpen(false);
      setForm(defaultLeadForm());
      setCustomInterest("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead save failed.");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setSelectedLead(null);
    setForm(defaultLeadForm());
    setCustomInterest("");
    setModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setSelectedLead(null);
    setModalOpen(false);
    setForm(defaultLeadForm());
    setCustomInterest("");
  };

  const removeLead = async () => {
    if (!leadPendingDelete) {
      return;
    }

    setDeleting(true);
    try {
      await api.deleteLead(leadPendingDelete.id);
      if (selectedLead?.id === leadPendingDelete.id) {
        setSelectedLead(null);
      }
      setLeadPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Leads"
        subtitle="Manage the full sales pipeline, adjust customer budgets, and keep follow-up commitments current."
        sideLabel="Lead desk"
        sideValue={`${snapshot?.stats[0]?.value ?? "0"} open leads`}
      />
      {snapshot ? <StatGrid stats={snapshot.stats} /> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Current pipeline</h3>
            <p>{filteredLeads.length} records</p>
          </div>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          <button className="primary-button" type="button" onClick={openCreateModal}>
            New Lead
          </button>
        </div>
        <div className="table-list">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="table-row">
              <div>
                <strong>{lead.customerName}</strong>
                <p>{lead.phone} | {lead.city}</p>
              </div>
              <div>{lead.interest}</div>
              <div>
                <span className="badge">{lead.status}</span>
              </div>
              <div>{lead.source}</div>
              <div>
                <strong>{lead.budget}</strong>
                <p>Min: {lead.budgetMin?.toLocaleString("en-IN") ?? "-"}</p>
                <p>Max: {lead.budgetMax?.toLocaleString("en-IN") ?? "-"}</p>
              </div>
              <div className="row-actions">
                <button className="ghost-button" type="button" onClick={() => openEditModal(lead)}>
                  Edit
                </button>
                <button className="ghost-button danger" type="button" onClick={() => setLeadPendingDelete(lead)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {searchTerm && filteredLeads.length === 0 && (
          <p className="muted">No matching records found</p>
        )}
      </section>

      <Modal
        open={modalOpen}
        title={selectedLead ? "Edit lead" : "Add new lead"}
        
        onClose={closeModal}
        actions={
          <>
            <button className="ghost-button" type="button" onClick={closeModal}>
              Cancel
            </button>
            <button className="primary-button" form="lead-modal-form" type="submit" disabled={saving}>
              {saving ? "Saving..." : selectedLead ? "Update lead" : "Save lead"}
            </button>
          </>
        }
      >
        <form className="modal-form" id="lead-modal-form" onSubmit={submit}>
          <div className="form-grid">
            <InputField label="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
            <InputField
              label="Phone"
              value={form.phone}
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              placeholder="10 digit mobile number"
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              required
            />
            <InputField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <label className="field">
              <span>Vehicle interest</span>
              <input
                list="inventory-interest-options"
                value={form.interest}
                placeholder="Search inventory or choose Other"
                onChange={(e) => setForm({ ...form, interest: e.target.value })}
                required
              />
              <datalist id="inventory-interest-options">
                {inventoryInterests.map((interest) => (
                  <option key={interest} value={interest} />
                ))}
                <option value="Other" />
              </datalist>
              {form.interest === "Other" ? (
                <input
                  value={customInterest}
                  placeholder="Type requested vehicle, e.g. i20"
                  onChange={(e) => setCustomInterest(e.target.value)}
                  autoFocus
                />
              ) : null}
            </label>
            <InputField label="Min budget" type="number" value={form.budgetMin ?? ""} onChange={(e) => setForm({ ...form, budgetMin: e.target.value ? Number(e.target.value) : undefined })} />
            <InputField label="Max budget" type="number" value={form.budgetMax ?? ""} onChange={(e) => setForm({ ...form, budgetMax: e.target.value ? Number(e.target.value) : undefined })} />
            <SelectField label="Lead source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {["Walk-in", "OLX", "Facebook", "Referral", "Website"].map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </SelectField>
            <SelectField label="Lead status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["NEW", "CONTACTED", "NEGOTIATING", "WON", "LOST"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
            <InputField label="Follow-up due" type="datetime-local" value={form.dueAt ?? ""} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
            <InputField label="Follow-up title" value={form.followUpTitle ?? ""} onChange={(e) => setForm({ ...form, followUpTitle: e.target.value })} />
            <TextareaField label="Notes" rows={4} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={leadPendingDelete !== null}
        title="Delete lead"
        message={leadPendingDelete ? `Delete ${leadPendingDelete.customerName}'s lead? This cannot be undone.` : ""}
        confirmLabel="Delete lead"
        busy={deleting}
        onCancel={() => {
          if (!deleting) {
            setLeadPendingDelete(null);
          }
        }}
        onConfirm={removeLead}
      />
    </AppShell>
  );
}
