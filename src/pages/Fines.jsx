import React, { useState, useEffect } from 'react';
import fineCategories from '../data/fines';

const STORAGE_KEY = 'golf_trip_fines';

export default function Fines() {
  const [fines, setFines] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({ name: '', type: fineCategories[0].name, description: '' });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fines));
  }, [fines]);

  const addFine = e => {
    e.preventDefault();
    const category = fineCategories.find(c => c.name === form.type);
    setFines([...fines, { ...form, amount: category.amount, date: new Date().toLocaleDateString() }]);
    setForm({ name: '', type: fineCategories[0].name, description: '' });
  };

  const total = fines.reduce((sum, f) => sum + parseFloat(f.amount), 0);

  return (
    <section className="page" id="fines">
      <h2>Banter & Fines</h2>
      <form className="mt-8" onSubmit={addFine}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Fine Type</label>
          <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {fineCategories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name} (€{cat.amount})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn btn--primary mt-4">Add Fine</button>
      </form>

      <div className="card mt-8">
        <div className="card__body">
          <table className="fines-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fine Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine, idx) => (
                <tr key={idx}>
                  <td>{fine.name}</td>
                  <td>{fine.type}</td>
                  <td>€{fine.amount}</td>
                  <td>{fine.description || '-'}</td>
                  <td>{fine.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-8">Total fines: €{total.toFixed(2)}</p>
        </div>
      </div>
    </section>
  );
}
