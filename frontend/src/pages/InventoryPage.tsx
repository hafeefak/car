import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { InputField, SelectField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StatGrid } from "../components/StatGrid";
import { api } from "../lib/api";
import type { Snapshot, Vehicle, VehiclePayload } from "../types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const defaultVehicleForm = (): VehiclePayload => ({
  stockCode: "",
  title: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  fuel: "Petrol",
  transmission: "Manual",
  mileageKm: 0,
  price: 0,
  purchasePrice: 0,
  color: "",
  status: "AVAILABLE"
});

export function InventoryPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<VehiclePayload>(defaultVehicleForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [snapshotData, vehicleData] = await Promise.all([api.snapshot(), api.vehicles()]);
    setSnapshot(snapshotData);
    setVehicles(vehicleData);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedVehicle) {
      setForm(defaultVehicleForm());
      return;
    }

    setForm({
      stockCode: selectedVehicle.stockCode,
      title: selectedVehicle.title,
      make: selectedVehicle.make,
      model: selectedVehicle.model,
      year: selectedVehicle.year,
      fuel: selectedVehicle.fuel,
      transmission: selectedVehicle.transmission,
      mileageKm: selectedVehicle.mileageKm,
      price: selectedVehicle.price,
      purchasePrice: selectedVehicle.purchasePrice,
      color: selectedVehicle.color ?? "",
      status: selectedVehicle.rawStatus
    });
  }, [selectedVehicle]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (selectedVehicle) {
        await api.updateVehicle(selectedVehicle.id, form);
      } else {
        await api.createVehicle(form);
      }

      setSelectedVehicle(null);
      setModalOpen(false);
      setForm(defaultVehicleForm());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vehicle save failed.");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setSelectedVehicle(null);
    setForm(defaultVehicleForm());
    setModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setSelectedVehicle(null);
    setModalOpen(false);
    setForm(defaultVehicleForm());
  };

  const removeVehicle = async (vehicleId: number) => {
    if (!window.confirm("Delete this vehicle?")) {
      return;
    }

    try {
      await api.deleteVehicle(vehicleId);
      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Inventory"
       
        sideLabel="Stock control"
        sideValue={`${snapshot?.stats[1]?.value ?? "0"} cars in stock`}
      />
      {snapshot ? <StatGrid stats={snapshot.stats} /> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Current stock</h3>
            <p>{vehicles.length} records</p>
          </div>
          <button className="primary-button" type="button" onClick={openCreateModal}>
            New Vehicle
          </button>
        </div>
        <div className="table-list">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="table-row inventory-row">
              <div>
                <strong>{vehicle.stockCode}</strong>
                <p>{vehicle.title}</p>
              </div>
              <div>{vehicle.year} | {vehicle.fuel} | {vehicle.transmission}</div>
              <div>{vehicle.mileageKm.toLocaleString("en-IN")} km</div>
              <div>{inr.format(vehicle.price)}</div>
              <div>
                <span className="badge">{vehicle.status}</span>
              </div>
              <div className="row-actions">
                <button className="ghost-button" type="button" onClick={() => openEditModal(vehicle)}>
                  Edit
                </button>
                <button className="ghost-button danger" type="button" onClick={() => removeVehicle(vehicle.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={modalOpen}
        title={selectedVehicle ? "Edit vehicle" : "Add new vehicle"}
        subtitle="Use the popup editor and keep inventory fully visible in the main workspace."
        onClose={closeModal}
        actions={
          <>
            <button className="ghost-button" type="button" onClick={closeModal}>
              Cancel
            </button>
            <button className="primary-button" form="vehicle-modal-form" type="submit" disabled={saving}>
              {saving ? "Saving..." : selectedVehicle ? "Save changes" : "Save vehicle"}
            </button>
          </>
        }
      >
        <form className="modal-form" id="vehicle-modal-form" onSubmit={submit}>
          <div className="form-grid">
            <InputField label="Stock code" value={form.stockCode} onChange={(e) => setForm({ ...form, stockCode: e.target.value })} required />
            <InputField label="Vehicle title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <InputField label="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required />
            <InputField label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
            <InputField label="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required />
            <InputField label="Color" value={form.color ?? ""} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <InputField label="Mileage (km)" type="number" value={form.mileageKm} onChange={(e) => setForm({ ...form, mileageKm: Number(e.target.value) })} required />
            <InputField label="Ask price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            <InputField label="Purchase price" type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} required />
            <SelectField label="Fuel" value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })}>
              {["Petrol", "Diesel", "CNG", "Electric"].map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </SelectField>
            <SelectField label="Transmission" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
              {["Manual", "Automatic"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectField>
            <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["AVAILABLE", "RESERVED", "SOLD"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectField>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
