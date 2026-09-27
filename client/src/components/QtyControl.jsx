export default function QtyControl({ qty, onAdd, onChange, disabled }) {
  if (!qty) {
    return (
      <button className="btn btn-outline btn-sm" onClick={onAdd} disabled={disabled}>
        {disabled ? 'Unavailable' : 'Add'}
      </button>
    );
  }
  return (
    <div className="qty">
      <button onClick={() => onChange(qty - 1)} aria-label="Decrease">−</button>
      <span>{qty}</span>
      <button onClick={() => onChange(qty + 1)} aria-label="Increase" disabled={qty >= 50}>+</button>
    </div>
  );
}
