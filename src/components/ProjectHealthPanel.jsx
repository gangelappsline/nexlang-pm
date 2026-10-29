const ACTIVITY = [
  {
    id: 1,
    type: 'edit',
    color: 'bg-blue-100 text-blue-600',
    user: 'Sarah Chen',
    action: 'updated word count for',
    target: 'Marketing Kit',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'warning',
    color: 'bg-amber-100 text-amber-600',
    user: 'System',
    action: 'marked project #LEG-2024-001 as At Risk',
    target: '',
    time: '5 hours ago',
  },
  {
    id: 3,
    type: 'check',
    color: 'bg-emerald-100 text-emerald-600',
    user: 'Legal Team',
    action: 'completed technical review',
    target: '',
    time: 'Yesterday',
  },
];

const ActivityIcon = ({ type, color }) => {
  const icons = {
    edit: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  };
  return (
    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${color}`}>
      {icons[type]}
    </div>
  );
};

const ProjectHealthPanel = ({ projects = [] }) => {
  const onTrack = projects.filter((p) => p.health === 'on-track').length;
  const atRisk = projects.filter((p) => p.health === 'at-risk').length;
  const overdue = projects.filter((p) => p.health === 'overdue').length;
  const total = projects.length || 12;

  const onTrackPct = Math.round((onTrack / total) * 100) || 75;
  const atRiskPct = Math.round((atRisk / total) * 100) || 18;
  const overduePct = Math.round((overdue / total) * 100) || 7;
  const onTrackCount = onTrack || 12;

  // Simple donut math
  const r = 38;
  const circ = 2 * Math.PI * r;
  const slices = [
    { pct: onTrackPct, color: '#22c55e', offset: 0 },
    { pct: atRiskPct, color: '#f59e0b', offset: onTrackPct },
    { pct: overduePct, color: '#ef4444', offset: onTrackPct + atRiskPct },
  ];

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col gap-6 overflow-y-auto border-l border-slate-200 bg-white px-5 py-5">
      <h2 className="text-base font-bold text-slate-900">Project Health</h2>

      {/* Overall status */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Overall Status
          </span>
          <button className="text-xs font-semibold text-blue-600 hover:underline">
            View Details
          </button>
        </div>

        {/* Donut chart */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
              {slices.map((s, i) => (
                <circle
                  key={i}
                  cx="45"
                  cy="45"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="12"
                  strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
                  strokeDashoffset={-((s.offset / 100) * circ)}
                  transform="rotate(-90 45 45)"
                  strokeLinecap="butt"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{onTrackCount}</span>
              <span className="text-[10px] text-slate-500">on track</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { label: 'On track', pct: onTrackPct, color: 'bg-emerald-500' },
              { label: 'At risk', pct: atRiskPct, color: 'bg-amber-400' },
              { label: 'Overdue', pct: overduePct, color: 'bg-red-500' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${color}`} />
                <span className="text-xs text-slate-600">{label}</span>
                <span className="ml-auto text-xs font-semibold text-slate-900">
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Recent Activity
        </p>
        <div className="flex flex-col gap-4">
          {ACTIVITY.map((item) => (
            <div key={item.id} className="flex gap-2.5">
              <ActivityIcon type={item.type} color={item.color} />
              <div className="min-w-0">
                <p className="text-xs text-slate-700 leading-snug">
                  <span className="font-semibold">{item.user}</span>{' '}
                  {item.action}
                  {item.target && (
                    <span className="font-semibold"> {item.target}</span>
                  )}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50">
          View Full History
        </button>
      </div>
    </aside>
  );
};

export default ProjectHealthPanel;
