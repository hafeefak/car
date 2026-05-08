import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { InputField, SelectField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { api } from "../lib/api";
import type { Booking, BookingPayload, Lead, Vehicle } from "../types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const defaultForm = (): BookingPayload => ({
  leadId: 0,
  vehicleId: 0,
  amount: 0,
  paymentMode: "UPI",
  deliveryDate: "",
  finalPrice: undefined
});

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<BookingPayload>(defaultForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [bookingData, leadData, vehicleData] = await Promise.all([api.bookings(), api.leads(), api.vehicles()]);
    setBookings(bookingData);
    setLeads(leadData.filter((lead) => lead.rawStatus !== "WON"));
    setVehicles(vehicleData.filter((vehicle) => vehicle.rawStatus !== "SOLD"));
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const openCreateModal = () => {
    setError("");
    setForm(defaultForm());
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }
    setModalOpen(false);
    setForm(defaultForm());
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.createBooking({
        ...form,
        deliveryDate: form.deliveryDate || undefined,
        finalPrice: form.finalPrice || undefined
      });
      setModalOpen(false);
      setForm(defaultForm());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Bookings"
        
      />
      {error ? <div className="error-banner">{error}</div> : null}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Revenue view</h3>
            <span>{bookings.length} bookings</span>
          </div>
          <button className="primary-button" type="button" onClick={openCreateModal}>
            New Booking
          </button>
        </div>
        <div className="table-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="table-row">
              <div>
                <strong>{booking.customerName}</strong>
                <p>{booking.paymentMode}</p>
              </div>
              <div>
                <strong>{booking.vehicleTitle}</strong>
                <p>{booking.leadInterest ?? "Direct booking"}</p>
              </div>
              <div>{inr.format(booking.amount)}</div>
              <div>{booking.finalPrice ? inr.format(booking.finalPrice) : booking.deliveryLabel}</div>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={modalOpen}
        title="Create booking"
        subtitle="Pick an active lead and convert it into a booking against a vehicle."
        onClose={closeModal}
        actions={
          <>
            <button className="ghost-button" type="button" onClick={closeModal}>
              Cancel
            </button>
            <button className="primary-button" form="booking-modal-form" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create booking"}
            </button>
          </>
        }
      >
        <form className="modal-form" id="booking-modal-form" onSubmit={submit}>
          <div className="form-grid">
            <SelectField label="Lead" value={form.leadId || ""} onChange={(e) => setForm({ ...form, leadId: Number(e.target.value), amount: form.amount || leads.find((lead) => lead.id === Number(e.target.value))?.expectedPrice || 0 })} required>
              <option value="" disabled>
                Select lead
              </option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.customerName} - {lead.interest}
                </option>
              ))}
            </SelectField>
            <SelectField label="Vehicle" value={form.vehicleId || ""} onChange={(e) => setForm({ ...form, vehicleId: Number(e.target.value) })} required>
              <option value="" disabled>
                Select vehicle
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.stockCode} - {vehicle.title}
                </option>
              ))}
            </SelectField>
            <InputField label="Booking amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
            <InputField label="Final price" type="number" value={form.finalPrice ?? ""} onChange={(e) => setForm({ ...form, finalPrice: e.target.value ? Number(e.target.value) : undefined })} />
            <InputField label="Payment mode" value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} required />
            <InputField label="Delivery date" type="date" value={form.deliveryDate ?? ""} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
