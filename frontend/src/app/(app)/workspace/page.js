'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, Map, Network, ArrowRight, ListTodo } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function itemId(item) {
  return item._id || item.id;
}

export default function WorkspacePage() {
  const [tasks, setTasks] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      setLoading(true);
      const today = todayIso();
      try {
        const [tasksRes, roadmapsRes, graphRes] = await Promise.all([
          apiFetch(`/api/planner?start=${today}&end=${today}`),
          apiFetch('/api/roadmaps'),
          apiFetch('/api/graph'),
        ]);
        const [tasksData, roadmapsData, graphData] = await Promise.all([
          tasksRes.json(),
          roadmapsRes.json(),
          graphRes.json(),
        ]);

        if (!active) return;
        setTasks(tasksData.success ? tasksData.data || [] : []);
        setRoadmaps(roadmapsData.success ? roadmapsData.data || [] : []);
        setGraph(graphData.success ? graphData.data || { nodes: [], links: [] } : { nodes: [], links: [] });
      } catch (err) {
        if (active) {
          setTasks([]);
          setRoadmaps([]);
          setGraph({ nodes: [], links: [] });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWorkspace();
    return () => {
      active = false;
    };
  }, []);

  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const activeRoadmaps = roadmaps.filter((roadmap) => roadmap.status !== 'completed');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Growth System</h1>
          <p className="capture-hub-subtitle">
            Plan the day, follow the journey, and connect what you learn.
          </p>
        </div>
        <Link className="btn btn-primary" href="/planner">
          <CalendarDays size={16} /> Open Planner
        </Link>
      </header>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <ListTodo size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{tasks.length}</span>
          <span className="dash-stat-label">Today</span>
        </div>
        <div className="dash-stat-card">
          <CheckCircle2 size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{completedTasks}</span>
          <span className="dash-stat-label">Completed</span>
        </div>
        <div className="dash-stat-card">
          <Map size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{activeRoadmaps.length}</span>
          <span className="dash-stat-label">Active Journeys</span>
        </div>
        <div className="dash-stat-card">
          <Network size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{graph.nodes?.length || 0}</span>
          <span className="dash-stat-label">Knowledge Nodes</span>
        </div>
      </div>

      {loading ? (
        <div className="dash-main-grid">
          <SkeletonCard height="260px" />
          <SkeletonCard height="260px" />
        </div>
      ) : (
        <div className="dash-main-grid">
          <div className="dash-left">
            <section className="card">
              <div className="card-title-row">
                <h2 className="card-title">Today&apos;s Plan</h2>
                <Link className="dash-see-all" href="/planner">Planner <ArrowRight size={14} /></Link>
              </div>
              <div className="dash-task-list">
                {tasks.slice(0, 8).map((task) => (
                  <Link
                    key={itemId(task)}
                    href="/planner"
                    className={`dash-task-item ${task.status === 'completed' ? 'done' : ''}`}
                  >
                    <CheckCircle2 size={15} />
                    <span className={task.status === 'completed' ? 'line-through' : ''}>
                      {task.title || 'Untitled task'}
                    </span>
                    {task.durationMinutes && <span className="dash-task-dur">{task.durationMinutes}m</span>}
                  </Link>
                ))}
                {tasks.length === 0 && (
                  <div className="dash-empty-mini">
                    <CalendarDays size={24} />
                    <p>No tasks scheduled for today.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-title-row">
                <h2 className="card-title">Journey Progress</h2>
                <Link className="dash-see-all" href="/journey">Journey <ArrowRight size={14} /></Link>
              </div>
              <div className="dash-roadmap-list">
                {activeRoadmaps.slice(0, 6).map((roadmap) => (
                  <Link key={itemId(roadmap)} href="/journey" className="dash-roadmap-item">
                    <span className="dash-roadmap-name">{roadmap.title || roadmap.name || 'Untitled journey'}</span>
                    <div className="dash-roadmap-bar">
                      <div className="dash-roadmap-fill" style={{ width: `${roadmap.progress || 0}%` }} />
                    </div>
                    <span className="dash-roadmap-pct">{roadmap.progress || 0}%</span>
                  </Link>
                ))}
                {activeRoadmaps.length === 0 && (
                  <div className="dash-empty-mini">
                    <Map size={24} />
                    <p>No active journeys yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="dash-right">
            <section className="card">
              <div className="card-title-row">
                <h2 className="card-title">Knowledge Graph</h2>
                <Link className="dash-see-all" href="/graph">Graph <ArrowRight size={14} /></Link>
              </div>
              <div className="dash-exam-grid">
                <div className="dash-exam-stat">
                  <span className="dash-exam-val">{graph.nodes?.length || 0}</span>
                  <span>Nodes</span>
                </div>
                <div className="dash-exam-stat">
                  <span className="dash-exam-val">{graph.links?.length || 0}</span>
                  <span>Connections</span>
                </div>
              </div>
              <div className="dash-empty-mini">
                <Network size={24} />
                <p>Use the graph when you want to see how captures, files, and journeys relate.</p>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
