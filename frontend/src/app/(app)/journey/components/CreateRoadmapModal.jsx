'use client';
import { X, Plus, Trash2 } from 'lucide-react';
import { categoryColors } from './journeyConstants';

export default function CreateRoadmapModal({
  isOpen,
  onClose,
  roadmapForm,
  setRoadmapForm,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Create Roadmap</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label>Title</label>
            <input type="text" className="input" value={roadmapForm.title} onChange={e => setRoadmapForm({...roadmapForm, title: e.target.value})} placeholder="e.g. Learn System Design" />
          </div>
          
          <div>
            <label>Description (Optional)</label>
            <textarea className="input" value={roadmapForm.description} onChange={e => setRoadmapForm({...roadmapForm, description: e.target.value})} placeholder="What is the goal of this journey?" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Category</label>
              <select className="input" value={roadmapForm.category} onChange={e => setRoadmapForm({...roadmapForm, category: e.target.value})}>
                {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Target Date</label>
              <input type="date" className="input" value={roadmapForm.targetDate} onChange={e => setRoadmapForm({...roadmapForm, targetDate: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              Milestones
              <button className="btn btn-secondary" onClick={() => {
                const newMilestones = [...roadmapForm.milestones, { title: '', tasks: [{ title: '', done: false }] }];
                setRoadmapForm({...roadmapForm, milestones: newMilestones});
              }}><Plus size={14} /> Add Milestone</button>
            </h3>
            
            {roadmapForm.milestones.map((milestone, mIdx) => (
              <div key={mIdx} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Milestone {mIdx + 1} Title</label>
                  {roadmapForm.milestones.length > 1 && (
                    <button className="icon-btn" onClick={() => {
                      const newM = [...roadmapForm.milestones];
                      newM.splice(mIdx, 1);
                      setRoadmapForm({...roadmapForm, milestones: newM});
                    }}><Trash2 size={14} style={{color: 'var(--text-error)'}} /></button>
                  )}
                </div>
                <input type="text" className="input" value={milestone.title} onChange={e => {
                  const newM = [...roadmapForm.milestones];
                  newM[mIdx].title = e.target.value;
                  setRoadmapForm({...roadmapForm, milestones: newM});
                }} placeholder="e.g. Week 1: Fundamentals" style={{ marginBottom: '1rem' }} />

                <label>Topics / Tasks</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {milestone.tasks.map((task, tIdx) => (
                    <div key={tIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" className="input" value={task.title} onChange={e => {
                        const newM = [...roadmapForm.milestones];
                        newM[mIdx].tasks[tIdx].title = e.target.value;
                        setRoadmapForm({...roadmapForm, milestones: newM});
                      }} placeholder="Task title" />
                      {milestone.tasks.length > 1 && (
                        <button className="btn btn-secondary" onClick={() => {
                          const newM = [...roadmapForm.milestones];
                          newM[mIdx].tasks.splice(tIdx, 1);
                          setRoadmapForm({...roadmapForm, milestones: newM});
                        }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                  <button className="btn btn-secondary" onClick={() => {
                    const newM = [...roadmapForm.milestones];
                    newM[mIdx].tasks.push({ title: '', done: false });
                    setRoadmapForm({...roadmapForm, milestones: newM});
                  }} style={{ width: 'fit-content' }}>+ Add Topic</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit}>Create Journey</button>
        </div>
      </div>
    </div>
  );
}
