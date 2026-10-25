'use client';
import { categoryColors, categoryEmojis, statusColors, statusLabels } from './journeyConstants';

export default function AnalyticsPanel({ data }) {
  const { heatmap, weeklyData, categoryData, pipeline, counts, roadmapSummaries, streak } = data;

  const heatmapEntries = Object.entries(heatmap || {}).sort((a, b) => a[0].localeCompare(b[0]));
  const maxActivity = Math.max(...Object.values(heatmap || {}), 1);

  return (
    <div className="analytics-grid">
      {/* Top Stats */}
      <div className="analytics-stats-row">
        {[
          { label: 'Activity Streak', value: `${streak || 0} days`, icon: '' },
          { label: 'Study Hours', value: `${counts?.totalStudyHours || 0}h`, icon: '' },
          { label: 'Tasks Done', value: `${counts?.tasksDone || 0}/${counts?.tasks || 0}`, icon: '' },
          { label: 'Active Roadmaps', value: counts?.roadmapsActive || 0, icon: '' },
          { label: 'Applications', value: counts?.applications || 0, icon: '' },
          { label: 'Files Stored', value: counts?.files || 0, icon: '' },
        ].map((s, i) => (
          <div key={i} className="analytics-stat-card">
            <span className="analytics-stat-icon">{s.icon}</span>
            <span className="analytics-stat-value">{s.value}</span>
            <span className="analytics-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Activity Heatmap */}
      <div className="card analytics-heatmap-card">
        <h3 className="card-title">Activity Heatmap — Last 90 Days</h3>
        <div className="analytics-heatmap">
          {heatmapEntries.map(([date, count]) => (
            <div key={date} className="heatmap-cell" title={`${date}: ${count} actions`}
              style={{ opacity: count === 0 ? 0.08 : 0.2 + (count / maxActivity) * 0.8, background: count > 0 ? 'var(--text-primary)' : 'var(--border-light)' }} />
          ))}
        </div>
      </div>

      {/* Weekly Progress + Category */}
      <div className="analytics-charts-row">
        <div className="card">
          <h3 className="card-title">Weekly Task Completion</h3>
          <div className="analytics-bars">
            {(weeklyData || []).map((w, i) => (
              <div key={i} className="analytics-bar-group">
                <div className="analytics-bar-container">
                  <div className="analytics-bar" style={{ height: `${w.total > 0 ? (w.done / w.total) * 100 : 0}%`, background: 'var(--text-primary)' }} />
                </div>
                <span className="analytics-bar-label">{w.week}</span>
                <span className="analytics-bar-value">{w.done}/{w.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Application Pipeline</h3>
          {pipeline && Object.keys(pipeline).length > 0 ? (
            <div className="analytics-pipeline">
              {Object.entries(pipeline).map(([status, count]) => (
                <div key={status} className="analytics-pipeline-row">
                  <span className="analytics-pipeline-label" style={{ color: statusColors[status] }}>
                    {statusLabels[status] || status}
                  </span>
                  <div className="analytics-pipeline-bar">
                    <div style={{ width: `${(count / Math.max(...Object.values(pipeline))) * 100}%`, background: statusColors[status], height: '100%', borderRadius: 'var(--radius-sm)', transition: 'width 0.5s' }} />
                  </div>
                  <span className="analytics-pipeline-count">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No applications yet</p>
          )}
        </div>
      </div>

      {/* Roadmap Progress */}
      {roadmapSummaries?.length > 0 && (
        <div className="card">
          <h3 className="card-title">Active Roadmap Progress</h3>
          <div className="analytics-roadmap-bars">
            {roadmapSummaries.map(r => (
              <div key={r._id || r.id} className="analytics-roadmap-row">
                <span>{categoryEmojis[r.category]} {r.title}</span>
                <div className="analytics-roadmap-bar">
                  <div style={{ width: `${r.progress}%`, background: categoryColors[r.category], height: '100%', borderRadius: 'var(--radius-sm)', transition: 'width 0.5s' }} />
                </div>
                <span className="analytics-roadmap-pct">{r.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
