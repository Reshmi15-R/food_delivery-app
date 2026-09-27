import { useState } from 'react';

const EMPTY = { label: 'Home', line1: '', city: '', pincode: '', phone: '' };

export default function AddressForm({ initial, onSubmit, onCancel, submitLabel = 'Save address' }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form address-form" onSubmit={submit}>
      <div className="form-row">
        <label>Label<input value={form.label} onChange={set('label')} placeholder="Home / Work" /></label>
        <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
      </div>
      <label>Address<input required value={form.line1} onChange={set('line1')} placeholder="House no, street, area" /></label>
      <div className="form-row">
        <label>City<input required value={form.city} onChange={set('city')} /></label>
        <label>Pincode<input required value={form.pincode} onChange={set('pincode')} /></label>
      </div>
      <div className="actions">
        <button className="btn btn-sm" disabled={busy}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
