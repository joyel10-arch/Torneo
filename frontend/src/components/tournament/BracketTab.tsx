import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  Position, Handle,
  type Node, type Edge, type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { bracketApi } from '../../lib/api';
import { type Bracket, type Match } from '../../types';
import { PageLoader, EmptyState, TeamAvatar } from '../ui';
import { getMatchStatusClass, getMatchStatusLabel, formatScore } from '../../lib/utils';
import { GitBranch } from 'lucide-react';

interface Props { tournamentId: string; }

// Determine if the bracket is round-robin by absence of feeder relationships
function isRoundRobinBracket(bracket: Bracket): boolean {
  return bracket.rounds.length > 0 &&
    bracket.rounds.every(r => r.matches.every(m => !m.home_feeder_match_id && !m.away_feeder_match_id));
}

// Round-robin matchday view
function RoundRobinView({ bracket }: { bracket: Bracket }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-electric/10 border border-teal-electric/30">
        <span className="text-lg">🔄</span>
        <div>
          <div className="text-sm font-bold text-teal-electric">Round Robin — League Format</div>
          <div className="text-xs text-text-secondary">Every team plays every other team. Points: Win=3, Draw=1, Loss=0</div>
        </div>
      </div>

      {bracket.rounds.map((round) => (
        <div key={round.round_number} className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-muted-dark border-b border-muted-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-electric" />
            <span className="text-sm font-bold text-text-primary">{round.round_name}</span>
            <span className="text-xs text-text-secondary ml-1">({round.matches.length} matches)</span>
          </div>
          <div className="divide-y divide-muted-border/50">
            {round.matches.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className={`text-sm font-semibold truncate ${
                    m.status === 'completed' && m.home_score !== undefined && m.away_score !== undefined
                      ? m.home_score > m.away_score ? 'text-status-success'
                      : m.home_score < m.away_score ? 'text-status-error'
                      : 'text-status-warning'
                      : 'text-text-primary'
                  }`}>{m.home_team_name || 'TBD'}</span>
                  <TeamAvatar name={m.home_team_name || 'TBD'} size="sm" />
                </div>
                <div className="text-center w-24 flex-shrink-0">
                  <div className="text-lg font-black tabular-nums">
                    {m.status === 'completed' ? `${m.home_score} – ${m.away_score}` : '–'}
                  </div>
                  <span className={`text-2xs ${getMatchStatusClass(m.status)}`}>
                    {m.status === 'completed' && m.home_score !== undefined && m.away_score !== undefined
                      ? m.home_score === m.away_score ? 'DRAW'
                      : m.home_score > m.away_score ? 'HOME WIN' : 'AWAY WIN'
                      : getMatchStatusLabel(m.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <TeamAvatar name={m.away_team_name || 'TBD'} size="sm" />
                  <span className={`text-sm font-semibold truncate ${
                    m.status === 'completed' && m.home_score !== undefined && m.away_score !== undefined
                      ? m.away_score > m.home_score ? 'text-status-success'
                      : m.away_score < m.home_score ? 'text-status-error'
                      : 'text-status-warning'
                      : 'text-text-primary'
                  }`}>{m.away_team_name || 'TBD'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Custom bracket match node
function MatchNode({ data }: NodeProps) {
  const m: Match = data.match;
  const isCompleted = m.status === 'completed';
  const isBye = m.is_bye;

  return (
    <div className={`bracket-match ${data.highlighted ? 'border-teal-electric' : ''}`} style={{ width: 200 }}>
      <Handle type="target" position={Position.Left} style={{ background: '#493650' }} />

      {/* Round label */}
      <div className="px-3 py-1 bg-midnight-light border-b border-muted-border">
        <span className="text-2xs font-semibold text-text-secondary uppercase tracking-wide">
          {m.round_name || `Round ${m.round_number}`}
        </span>
        <span className={`float-right text-2xs ${getMatchStatusClass(m.status)}`}>
          {isBye ? 'BYE' : getMatchStatusLabel(m.status)}
        </span>
      </div>

      {/* Home team */}
      <div className={`bracket-team ${m.winner_id === m.home_team_id && isCompleted ? 'bracket-team-winner' : ''}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <TeamAvatar name={m.home_team_name || 'TBD'} size="sm" />
          <span className="text-xs font-semibold truncate">{m.home_team_name || 'TBD'}</span>
        </div>
        <span className="text-sm font-black tabular-nums ml-2">
          {m.home_score ?? '—'}
        </span>
      </div>

      {/* Away team */}
      <div className={`bracket-team ${m.winner_id === m.away_team_id && isCompleted ? 'bracket-team-winner' : ''}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <TeamAvatar name={m.away_team_name || 'TBD'} size="sm" />
          <span className="text-xs font-semibold truncate">{m.away_team_name || 'TBD'}</span>
        </div>
        <span className="text-sm font-black tabular-nums ml-2">
          {m.away_score ?? '—'}
        </span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#493650' }} />
    </div>
  );
}

const nodeTypes = { matchNode: MatchNode };

export function BracketTab({ tournamentId }: Props) {
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const buildFlowGraph = useCallback((b: Bracket) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const MATCH_W = 220;
    const MATCH_H = 110;
    const COL_GAP = 80;
    const ROW_GAP = 20;

    b.rounds.forEach((round, roundIdx) => {
      const col = roundIdx;
      const totalHeight = round.matches.length * (MATCH_H + ROW_GAP) - ROW_GAP;
      const startY = -totalHeight / 2;

      round.matches.forEach((match, matchIdx) => {
        const x = col * (MATCH_W + COL_GAP);
        const y = startY + matchIdx * (MATCH_H + ROW_GAP);

        newNodes.push({
          id: match.id,
          type: 'matchNode',
          position: { x, y },
          data: { match },
        });

        // Edge from feeder matches
        if (match.home_feeder_match_id) {
          newEdges.push({
            id: `e-${match.home_feeder_match_id}-${match.id}-home`,
            source: match.home_feeder_match_id,
            target: match.id,
            style: { stroke: '#493650', strokeWidth: 2 },
            animated: match.status === 'in_progress',
          });
        }
        if (match.away_feeder_match_id) {
          newEdges.push({
            id: `e-${match.away_feeder_match_id}-${match.id}-away`,
            source: match.away_feeder_match_id,
            target: match.id,
            style: { stroke: '#493650', strokeWidth: 2 },
            animated: match.status === 'in_progress',
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const b = await bracketApi.get(tournamentId);
        setBracket(b);
        if (b.rounds.length > 0) buildFlowGraph(b);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [tournamentId, buildFlowGraph]);

  if (loading) return <PageLoader />;
  if (!bracket || bracket.total_matches === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No fixtures generated yet"
        description="Use the 'Generate Bracket' or 'Generate Schedule' button to create fixtures"
      />
    );
  }

  // Round-robin: show league matchday view
  if (isRoundRobinBracket(bracket)) {
    return <RoundRobinView bracket={bracket} />;
  }

  // Find champion (knockout only)
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  const champion = finalMatch?.status === 'completed' ? finalMatch.winner_name : null;

  return (
    <div className="space-y-4">
      {champion && (
        <div className="card p-4 flex items-center gap-3 border-magenta-neon/40 bg-magenta-neon/5">
          <div className="text-3xl">🏆</div>
          <div>
            <div className="text-xs text-magenta-neon font-semibold uppercase tracking-wide">Champion</div>
            <div className="text-xl font-black text-text-primary">{champion}</div>
          </div>
        </div>
      )}

      {/* Round headers */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {bracket.rounds.map((round) => (
          <div key={round.round_number} className="flex-shrink-0 text-center px-4 py-1.5 rounded bg-muted border border-muted-border">
            <div className="text-xs font-bold text-text-primary">{round.round_name}</div>
            <div className="text-2xs text-text-secondary">{round.matches.length} match{round.matches.length !== 1 ? 'es' : ''}</div>
          </div>
        ))}
      </div>

      {/* React Flow bracket */}
      <div className="card" style={{ height: 520 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          attributionPosition="bottom-right"
        >
          <Background color="#493650" gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              const m: Match = node.data?.match;
              if (m?.status === 'completed') return '#21C58E';
              if (m?.status === 'in_progress') return '#F500A8';
              return '#30203B';
            }}
          />
        </ReactFlow>
      </div>

      {/* Text-based fallback */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-muted-dark border-b border-muted-border">
          <span className="text-sm font-bold text-text-primary">Bracket Summary</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Match</th>
                <th>Home</th>
                <th>Score</th>
                <th>Away</th>
                <th>Winner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bracket.rounds.flatMap((r) =>
                r.matches.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-magenta-neon">{r.round_name}</td>
                    <td className="tabular-nums text-text-secondary">#{m.match_number}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <TeamAvatar name={m.home_team_name || 'TBD'} size="sm" />
                        <span className={m.winner_id === m.home_team_id ? 'text-magenta-neon font-semibold' : ''}>{m.home_team_name || 'TBD'}</span>
                      </div>
                    </td>
                    <td className="text-center font-black tabular-nums">
                      {m.status === 'completed' ? formatScore(m.home_score, m.away_score) : '–'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <TeamAvatar name={m.away_team_name || 'TBD'} size="sm" />
                        <span className={m.winner_id === m.away_team_id ? 'text-magenta-neon font-semibold' : ''}>{m.away_team_name || 'TBD'}</span>
                      </div>
                    </td>
                    <td className={m.winner_name ? 'text-status-success font-semibold' : 'text-text-secondary'}>
                      {m.winner_name || (m.is_bye ? 'Bye' : '—')}
                    </td>
                    <td><span className={getMatchStatusClass(m.status)}>{getMatchStatusLabel(m.status)}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
