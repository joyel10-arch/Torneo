import React, { useState, useEffect } from 'react';
import { FlaskConical, Play, RotateCcw, ChevronRight, ChevronLeft, Search, SortAsc, GitBranch, Share2 } from 'lucide-react';
import { tournamentsApi, rankingsApi, treeApi, graphApi } from '../lib/api';
import { type Tournament, type BubbleSortResult, type BinarySearchResult, type TournamentTreeData, type GraphData, type TraversalResult } from '../types';
import { PageLoader, EmptyState, Tabs, InfoAlert } from '../components/ui';
import toast from 'react-hot-toast';

const DSA_TABS = [
  { id: 'bubble', label: 'Bubble Sort', icon: SortAsc },
  { id: 'binary', label: 'Binary Search', icon: Search },
  { id: 'tree', label: 'Tournament Tree', icon: GitBranch },
  { id: 'graph', label: 'Match Graph', icon: Share2 },
];

// ---- Bubble Sort Panel ----
function BubbleSortPanel({ tournamentId }: { tournamentId: string }) {
  const [result, setResult] = useState<BubbleSortResult | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    setStepIdx(0);
    try {
      const data = await rankingsApi.sortWithBubble(tournamentId);
      setResult(data);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Sort failed');
    } finally { setLoading(false); }
  };

  const step = result?.steps[stepIdx];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Bubble Sort Ranking</h2>
          <p className="text-sm text-text-secondary">Manual sort with step-by-step comparison visualization</p>
        </div>
        <button onClick={run} disabled={loading} className="btn-primary">
          <Play className="w-4 h-4" />{loading ? 'Sorting…' : 'Run Sort'}
        </button>
      </div>

      {result && (
        <>
          {/* Complexity info */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Comparisons', value: result.comparisons, color: 'text-magenta-neon' },
              { label: 'Swaps', value: result.swaps, color: 'text-teal-electric' },
              { label: 'Complexity', value: 'O(n²)', color: 'text-status-warning' },
              { label: 'Teams Sorted', value: result.sorted_teams.length, color: 'text-status-success' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-3 text-center">
                <div className={`text-2xl font-black tabular-nums ${color}`}>{value}</div>
                <div className="text-xs text-text-secondary mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Algorithm info */}
          <div className="card p-4">
            <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Complexity Analysis</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                { label: 'Best Case', value: result.complexity_info.best_case, color: 'text-status-success' },
                { label: 'Average Case', value: result.complexity_info.average_case, color: 'text-status-warning' },
                { label: 'Worst Case', value: result.complexity_info.worst_case, color: 'text-status-error' },
                { label: 'Space', value: result.complexity_info.space, color: 'text-teal-electric' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-muted-dark rounded p-3">
                  <div className={`font-mono font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step navigator */}
          {result.steps.length > 0 && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-text-primary">Step-by-Step Visualization</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0} className="btn-ghost btn-sm p-1">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm tabular-nums text-text-secondary">{stepIdx + 1} / {result.steps.length}</span>
                  <button onClick={() => setStepIdx((s) => Math.min(result.steps.length - 1, s + 1))} disabled={stepIdx === result.steps.length - 1} className="btn-ghost btn-sm p-1">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => setStepIdx(0)} className="btn-ghost btn-sm p-1"><RotateCcw className="w-4 h-4" /></button>
                </div>
              </div>

              {step && (
                <>
                  <div className="p-2.5 rounded bg-midnight-light border border-muted-border text-sm">
                    <span className={`font-semibold ${step.swapped ? 'text-magenta-neon' : 'text-teal-electric'}`}>
                      {step.phase === 'swap' ? '🔄 SWAP' : step.phase === 'compare' ? '🔍 COMPARE' : '📊 PASS'}:
                    </span>
                    <span className="text-text-secondary ml-2">{step.message}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step.array.map((name, idx) => (
                      <div key={idx}
                        className={`px-3 py-1.5 rounded text-sm font-semibold transition-all ${
                          step.comparison_indices.includes(idx)
                            ? step.swapped
                              ? 'bg-magenta-neon text-white glow-magenta'
                              : 'bg-teal-electric/20 text-teal-electric border border-teal-electric'
                            : 'bg-muted-dark text-text-secondary border border-muted-border'
                        }`}
                      >
                        <span className="text-2xs text-text-secondary/50 mr-1">{idx + 1}.</span>
                        {name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sorted results */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-muted-border bg-muted-dark">
              <span className="text-sm font-bold text-text-primary">Sorted Rankings</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Team</th><th className="text-center">Pts</th><th className="text-center">GD</th><th className="text-center">GF</th></tr>
              </thead>
              <tbody>
                {result.sorted_teams.map((s, i) => (
                  <tr key={s.team_id}>
                    <td className="text-center font-black text-magenta-neon">{i + 1}</td>
                    <td className="font-semibold">{s.team_name}</td>
                    <td className="text-center font-bold text-magenta-neon tabular-nums">{s.points}</td>
                    <td className="text-center tabular-nums text-text-secondary">{s.goals_scored - s.goals_conceded}</td>
                    <td className="text-center tabular-nums text-text-secondary">{s.goals_scored}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!result && !loading && (
        <EmptyState icon={SortAsc} title="Run Bubble Sort" description="Click 'Run Sort' to visualize the ranking algorithm with step-by-step comparisons" />
      )}
    </div>
  );
}

// ---- Binary Search Panel ----
function BinarySearchPanel({ tournamentId }: { tournamentId: string }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<BinarySearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setStepIdx(0);
    try {
      const data = await rankingsApi.getAnalysis(tournamentId);
      // binary search is nested in analysis; call standings first then use search
      // For now call the correct endpoint
      const res = await import('../lib/api').then(({ api }) =>
        api.post(`/tournaments/${tournamentId}/rankings/search`, null, { params: { team_name: query } }).then((r) => r.data)
      );
      setResult(res);
    } catch (e: unknown) {
      const err = (e as { response?: { data?: { detail?: string } } });
      if (err?.response?.data?.detail) {
        setResult({ found: false, index: -1, comparisons: 0, steps: [], error: err.response.data.detail });
      } else {
        toast.error('Search failed');
      }
    } finally { setLoading(false); }
  };

  const step = result?.steps[stepIdx];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Binary Search</h2>
        <p className="text-sm text-text-secondary">Search for a team in the sorted standings using binary search (O log n)</p>
      </div>

      <InfoAlert message="Teams must first be sorted by Bubble Sort before binary search can run. Standings are sorted by points, then goal difference." />

      <div className="flex gap-3">
        <input
          className="form-input flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter team name to search…"
          onKeyDown={(e) => e.key === 'Enter' && run()}
        />
        <button onClick={run} disabled={loading || !query.trim()} className="btn-primary">
          <Search className="w-4 h-4" />{loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {result.error ? (
            <div className="card p-4 border-status-error/30 bg-status-error/5">
              <div className="text-status-error font-semibold">⚠️ {result.error}</div>
            </div>
          ) : (
            <>
              <div className={`card p-4 flex items-center gap-3 ${result.found ? 'border-status-success/30 bg-status-success/5' : 'border-status-error/30 bg-status-error/5'}`}>
                <div className="text-3xl">{result.found ? '✅' : '❌'}</div>
                <div>
                  <div className={`font-bold text-lg ${result.found ? 'text-status-success' : 'text-status-error'}`}>
                    {result.found ? `Found at index ${result.index + 1}` : 'Not Found'}
                  </div>
                  <div className="text-sm text-text-secondary">{result.comparisons} comparison{result.comparisons !== 1 ? 's' : ''} | O(log n) complexity</div>
                  {result.result && <div className="text-sm font-semibold text-text-primary mt-1">{result.result.team_name}</div>}
                </div>
              </div>

              {result.steps.length > 0 && (
                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">Search Steps</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0} className="btn-ghost btn-sm p-1"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-sm tabular-nums text-text-secondary">{stepIdx + 1}/{result.steps.length}</span>
                      <button onClick={() => setStepIdx((s) => Math.min(result.steps.length - 1, s + 1))} disabled={stepIdx === result.steps.length - 1} className="btn-ghost btn-sm p-1"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {step && (
                    <div className="bg-midnight-light border border-muted-border rounded-lg p-3 space-y-2 font-mono text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Low', value: step.low, color: 'text-status-success' },
                          { label: 'Mid', value: step.mid, color: 'text-magenta-neon' },
                          { label: 'High', value: step.high, color: 'text-status-warning' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-muted-dark rounded p-2 text-center">
                            <div className={`font-bold text-lg tabular-nums ${color}`}>{value}</div>
                            <div className="text-xs text-text-secondary">{label}</div>
                          </div>
                        ))}
                      </div>
                      {step.mid_value && <div className="text-teal-electric">Mid element: <strong>{step.mid_value}</strong></div>}
                      <div className="text-text-secondary">{step.message}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState icon={Search} title="Search Teams" description="Enter a team name and click Search to visualize binary search" />
      )}
    </div>
  );
}

// ---- Tree Panel ----
function TreePanel({ tournamentId }: { tournamentId: string }) {
  const [treeData, setTreeData] = useState<TournamentTreeData | null>(null);
  const [traversal, setTraversal] = useState<string>('preorder');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await treeApi.get(tournamentId);
      setTreeData(data);
    } catch { toast.error('Failed to load tree'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tournamentId]);

  const displayNodes = traversal === 'preorder' ? treeData?.preorder
    : traversal === 'inorder' ? treeData?.inorder
    : traversal === 'postorder' ? treeData?.postorder
    : treeData?.level_order?.flat() || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Tournament Tree (Binary Tree)</h2>
          <p className="text-sm text-text-secondary">Bracket as a binary tree with 4 traversal methods</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary btn-sm">
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? <PageLoader /> : !treeData ? (
        <EmptyState icon={GitBranch} title="No tree data" description="Generate a bracket first to view the binary tree" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Height', value: treeData.height, color: 'text-magenta-neon' },
              { label: 'Nodes', value: treeData.node_count, color: 'text-teal-electric' },
              { label: 'Champion', value: treeData.champion?.winner || '—', color: 'text-status-success' },
              { label: 'Root', value: treeData.root ? `Round ${treeData.root.round_number}` : '—', color: 'text-status-warning' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-3 text-center">
                <div className={`text-lg font-black ${color}`}>{value}</div>
                <div className="text-xs text-text-secondary mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {treeData.champion && (
            <div className="card p-4 flex items-center gap-3 border-magenta-neon/30 bg-magenta-neon/5">
              <span className="text-3xl">🏆</span>
              <div>
                <div className="text-xs text-magenta-neon font-semibold uppercase">Tournament Champion</div>
                <div className="text-xl font-black text-text-primary">{treeData.champion.winner}</div>
                <div className="text-xs text-text-secondary">Final score: {treeData.champion.final_score}</div>
              </div>
            </div>
          )}

          {/* Traversal selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold text-text-primary">Traversal Order:</div>
              <div className="flex gap-1 bg-muted-dark border border-muted-border rounded-lg p-1">
                {['preorder', 'inorder', 'postorder', 'level_order'].map((t) => (
                  <button key={t} onClick={() => setTraversal(t)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${traversal === t ? 'bg-magenta-neon text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {t === 'level_order' ? 'Level Order' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-text-secondary px-1">
              {traversal === 'preorder' && 'Preorder: Root → Left → Right (Visit Final first)'}
              {traversal === 'inorder' && 'Inorder: Left → Root → Right (Chronological order)'}
              {traversal === 'postorder' && 'Postorder: Left → Right → Root (First matches first)'}
              {traversal === 'level_order' && 'Level Order: BFS — Round by Round (Final → then previous rounds)'}
            </div>

            <div className="flex flex-wrap gap-2">
              {(displayNodes || []).map((node, idx) => {
                const label = node.winner || `${node.home_team || 'TBD'} vs ${node.away_team || 'TBD'}`;
                return (
                  <div key={node.match_id + idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium ${
                    node.winner ? 'bg-magenta-neon/10 border-magenta-neon/30 text-magenta-neon' : 'bg-muted-dark border-muted-border text-text-secondary'
                  }`}>
                    <span className="text-text-secondary/50 font-mono">{idx + 1}.</span>
                    <span>{label}</span>
                    <span className={`ml-1 px-1 rounded text-2xs ${node.status === 'completed' ? 'bg-status-success/20 text-status-success' : 'bg-muted text-text-secondary'}`}>
                      R{node.round_number}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level-order grid */}
          {traversal === 'level_order' && treeData.level_order && (
            <div className="card p-4 space-y-3">
              <div className="text-sm font-bold text-text-primary">Level-Order View (BFS)</div>
              {treeData.level_order.map((level, lIdx) => (
                <div key={lIdx}>
                  <div className="text-xs text-text-secondary mb-1">Level {lIdx} ({level.length} node{level.length > 1 ? 's' : ''})</div>
                  <div className="flex flex-wrap gap-2">
                    {level.map((node) => (
                      <div key={node.match_id} className={`px-3 py-1.5 rounded border text-xs ${node.winner ? 'border-magenta-neon/40 text-magenta-neon bg-magenta-neon/10' : 'border-muted-border text-text-secondary bg-muted-dark'}`}>
                        {node.winner || `${node.home_team || '?'} vs ${node.away_team || '?'}`}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- Graph Panel ----
function GraphPanel({ tournamentId }: { tournamentId: string }) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [traversalResult, setTraversalResult] = useState<TraversalResult | null>(null);
  const [traversalType, setTraversalType] = useState<'bfs' | 'dfs'>('bfs');
  const [startVertex, setStartVertex] = useState('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    graphApi.get(tournamentId)
      .then((data) => { setGraphData(data); if (data.vertices?.length > 0) setStartVertex(data.vertices[0]); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [tournamentId]);

  const runTraversal = async () => {
    if (!startVertex) return;
    setRunning(true);
    setStepIdx(0);
    try {
      const fn = traversalType === 'bfs' ? graphApi.bfs : graphApi.dfs;
      const result = await fn(tournamentId, startVertex);
      setTraversalResult(result);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Traversal failed');
    } finally { setRunning(false); }
  };

  const step = traversalResult?.steps[stepIdx];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Match Dependency Graph</h2>
        <p className="text-sm text-text-secondary">Directed graph showing match dependencies with BFS and DFS traversal</p>
      </div>

      {loading ? <PageLoader /> : !graphData ? (
        <EmptyState icon={Share2} title="No graph data" description="Generate a bracket first" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Vertices (Matches)', value: graphData.vertex_count, color: 'text-magenta-neon' },
              { label: 'Edges (Dependencies)', value: graphData.edge_count, color: 'text-teal-electric' },
              { label: 'Structure', value: 'DAG', color: 'text-status-success' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-3 text-center">
                <div className={`text-2xl font-black tabular-nums ${color}`}>{value}</div>
                <div className="text-xs text-text-secondary mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Adjacency display */}
          <div className="card p-4 space-y-2">
            <div className="text-sm font-bold text-text-primary mb-3">Adjacency List</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {Object.entries(graphData.edges).map(([vertex, neighbors]) => {
                const match = graphData.vertex_data[vertex];
                const label = match ? `R${match.round_number}:M${match.match_number || 1}` : vertex.slice(0, 8);
                return (
                  <div key={vertex} className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-magenta-neon/20 text-magenta-neon font-mono font-bold min-w-[60px] text-center">{label}</span>
                    <span className="text-text-secondary">→</span>
                    <div className="flex gap-1 flex-wrap">
                      {(neighbors as string[]).length === 0 ? (
                        <span className="text-text-secondary italic">(no outgoing edges)</span>
                      ) : (
                        (neighbors as string[]).map((n) => {
                          const nm = graphData.vertex_data[n];
                          return (
                            <span key={n} className="px-2 py-0.5 rounded bg-teal-electric/15 text-teal-electric font-mono">
                              {nm ? `R${nm.round_number}:M${nm.match_number || 1}` : n.slice(0, 8)}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traversal control */}
          <div className="card p-4 space-y-4">
            <div className="text-sm font-bold text-text-primary">Run Graph Traversal</div>
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-1 bg-muted-dark border border-muted-border rounded-lg p-1">
                {(['bfs', 'dfs'] as const).map((t) => (
                  <button key={t} onClick={() => setTraversalType(t)}
                    className={`px-4 py-1.5 rounded text-sm font-semibold transition-all ${traversalType === t ? 'bg-magenta-neon text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <select className="form-input py-1.5 w-44 text-sm" value={startVertex} onChange={(e) => setStartVertex(e.target.value)}>
                {graphData.vertices.map((v) => {
                  const m = graphData.vertex_data[v];
                  return <option key={v} value={v}>{m ? `R${m.round_number}:M${m.match_number || 1}` : v.slice(0, 12)}</option>;
                })}
              </select>
              <button onClick={runTraversal} disabled={running} className="btn-primary">
                <Play className="w-4 h-4" />{running ? 'Running…' : `Run ${traversalType.toUpperCase()}`}
              </button>
            </div>

            {traversalResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-text-secondary">Visited {traversalResult.visited_count} vertices</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setStepIdx((s) => Math.max(0, s - 1))} disabled={stepIdx === 0} className="btn-ghost btn-sm p-1"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs tabular-nums">{stepIdx + 1}/{traversalResult.steps.length}</span>
                    <button onClick={() => setStepIdx((s) => Math.min(traversalResult.steps.length - 1, s + 1))} disabled={stepIdx === traversalResult.steps.length - 1} className="btn-ghost btn-sm p-1"><ChevronRight className="w-4 h-4" /></button>
                    <button onClick={() => setStepIdx(0)} className="btn-ghost btn-sm p-1"><RotateCcw className="w-3 h-3" /></button>
                  </div>
                </div>

                {step && (
                  <div className="bg-midnight-light border border-muted-border rounded-lg p-3 font-mono text-xs space-y-2">
                    <div>
                      <span className="text-magenta-neon font-bold">{step.action}</span>
                      <span className="text-teal-electric ml-2">{step.vertex.slice(0, 8)}…</span>
                    </div>
                    <div className="text-text-secondary">{step.message}</div>
                    <div className="flex gap-2 flex-wrap">
                      {step.visited.map((v) => (
                        <span key={v} className="px-1.5 py-0.5 rounded bg-status-success/20 text-status-success">{v.slice(0, 8)}</span>
                      ))}
                    </div>
                    {step.queue && step.queue.length > 0 && (
                      <div className="text-status-warning">Queue: [{step.queue.map((v) => v.slice(0, 6)).join(', ')}]</div>
                    )}
                    {step.stack && step.stack.length > 0 && (
                      <div className="text-status-warning">Stack: [{step.stack.map((v) => v.slice(0, 6)).join(', ')}]</div>
                    )}
                  </div>
                )}

                <div>
                  <div className="text-xs text-text-secondary mb-1">Full traversal order:</div>
                  <div className="flex flex-wrap gap-1">
                    {traversalResult.traversal.map((v, idx) => {
                      const m = graphData.vertex_data[v];
                      return (
                        <span key={v + idx} className="px-2 py-0.5 rounded bg-teal-electric/15 text-teal-electric text-xs font-mono">
                          {idx + 1}. {m ? `R${m.round_number}:M${m.match_number || 1}` : v.slice(0, 8)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Main DSA Lab Page ----
export function DSALabPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bubble');

  useEffect(() => {
    tournamentsApi.list().then((ts) => {
      setTournaments(ts);
      if (ts.length > 0) setSelected(ts[0].id);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-magenta-neon" />
            DSA Lab
          </h1>
          <p className="page-subtitle">Interactive visualizations: Bubble Sort · Binary Search · Binary Tree · Graph Traversal</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <select className="form-input w-72" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {tournaments.length === 0 && <option value="">No tournaments</option>}
          {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex flex-wrap gap-2 text-xs text-text-secondary items-center">
          <span className="badge-magenta">CO3</span> Sorting
          <span className="badge-teal">CO3</span> Searching
          <span className="badge-success">CO4</span> Trees
          <span className="badge-warning">CO5</span> Graphs
        </div>
      </div>

      <Tabs tabs={DSA_TABS} active={activeTab} onChange={setActiveTab} />

      {selected ? (
        <div className="animate-fade-in">
          {activeTab === 'bubble' && <BubbleSortPanel tournamentId={selected} />}
          {activeTab === 'binary' && <BinarySearchPanel tournamentId={selected} />}
          {activeTab === 'tree' && <TreePanel tournamentId={selected} />}
          {activeTab === 'graph' && <GraphPanel tournamentId={selected} />}
        </div>
      ) : (
        <EmptyState icon={FlaskConical} title="Select a tournament" description="Choose a tournament above to visualize its DSA structures" />
      )}
    </div>
  );
}
