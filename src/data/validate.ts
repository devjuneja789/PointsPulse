/**
 * PointsPulse Data Validator (Phase 1)
 * Validates rules, squad integrity, match script continuity, coverage matrix, and golden anchors.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RulesSchema,
  SquadSchema,
  MyTeamSchema,
  MatchScriptSchema,
  FallbackSchema,
  GoldenAnchorsSchema,
  CoverageMatrixSchema,
} from './schemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson<T>(relPath: string): T {
  const fullPath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content) as T;
}

export function validateAllData(): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  console.log('[Validator] Validating Rules...');
  try {
    const rules = loadJson('rules.json');
    RulesSchema.parse(rules);
  } catch (err: unknown) {
    errors.push(`RulesSchema validation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log('[Validator] Validating Squads...');
  const allPlayerIds = new Set<string>();
  const playerRoles = new Map<string, string>();
  const playerTeams = new Map<string, string>();

  try {
    const miSquad = loadJson<{ players: Array<{ id: string; role: string; team: string }> }>('squads/mi.json');
    SquadSchema.parse(miSquad);
    for (const p of miSquad.players) {
      allPlayerIds.add(p.id);
      playerRoles.set(p.id, p.role);
      playerTeams.set(p.id, p.team);
    }
  } catch (err: unknown) {
    errors.push(`MI Squad validation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const cskSquad = loadJson<{ players: Array<{ id: string; role: string; team: string }> }>('squads/csk.json');
    SquadSchema.parse(cskSquad);
    for (const p of cskSquad.players) {
      allPlayerIds.add(p.id);
      playerRoles.set(p.id, p.role);
      playerTeams.set(p.id, p.team);
    }
  } catch (err: unknown) {
    errors.push(`CSK Squad validation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log('[Validator] Validating User Team Legality...');
  try {
    const myTeam = loadJson<{
      players: string[];
      captain: string;
      viceCaptain: string;
      composition: { MI: number; CSK: number; roles: Record<string, number> };
      metadata: { captainRole: string; viceCaptainRole: string; benchedPlayer: string };
    }>('myTeam.json');
    MyTeamSchema.parse(myTeam);

    if (myTeam.captain === myTeam.viceCaptain) {
      errors.push('Captain and Vice-Captain cannot be the same player.');
    }

    if (playerRoles.get(myTeam.captain) !== 'BOWL') {
      errors.push(`Captain must be a bowler, got: ${playerRoles.get(myTeam.captain)}`);
    }

    if (playerRoles.get(myTeam.viceCaptain) !== 'BAT') {
      errors.push(`Vice-Captain must be a batter, got: ${playerRoles.get(myTeam.viceCaptain)}`);
    }

    let miCount = 0;
    let cskCount = 0;
    for (const pId of myTeam.players) {
      if (!allPlayerIds.has(pId)) {
        errors.push(`User team player ${pId} does not exist in squad rosters.`);
      }
      const team = playerTeams.get(pId);
      if (team === 'MI') miCount++;
      if (team === 'CSK') cskCount++;
    }

    if (miCount > 7 || cskCount > 7) {
      errors.push(`Team violates max 7 players per team rule (MI: ${miCount}, CSK: ${cskCount})`);
    }

    if (!myTeam.players.includes(myTeam.metadata.benchedPlayer)) {
      errors.push(`Benched player ${myTeam.metadata.benchedPlayer} must be in the user's 11.`);
    }
  } catch (err: unknown) {
    errors.push(`MyTeamSchema validation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log('[Validator] Validating Match Scripts & Continuity...');
  const scripts = ['full-match.json', 'powerplay-blitz.json', 'late-collapse.json'];
  const fullMatchEventIds = new Set<string>();

  for (const scriptFile of scripts) {
    try {
      const script = loadJson<{
        id: string;
        matchInfo: { playingXI: { MI: string[]; CSK: string[] }; benchedPlayers: string[] };
        events: Array<{
          id: string;
          batter: string;
          nonStriker?: string;
          bowler: string;
          fielders?: string[];
          wicket?: { playerOut: string; fielders?: string[] } | null;
        }>;
      }>(`scripts/${scriptFile}`);

      MatchScriptSchema.parse(script);

      // Continuity check: Ensure all player IDs in events exist in squad rosters
      for (const ev of script.events) {
        if (script.id === 'full-match') {
          fullMatchEventIds.add(ev.id);
        }

        if (!allPlayerIds.has(ev.batter)) {
          errors.push(`Script ${scriptFile}: unknown batter ID '${ev.batter}' in event ${ev.id}`);
        }
        if (ev.nonStriker && !allPlayerIds.has(ev.nonStriker)) {
          errors.push(`Script ${scriptFile}: unknown nonStriker ID '${ev.nonStriker}' in event ${ev.id}`);
        }
        if (!allPlayerIds.has(ev.bowler)) {
          errors.push(`Script ${scriptFile}: unknown bowler ID '${ev.bowler}' in event ${ev.id}`);
        }
        if (ev.wicket && !allPlayerIds.has(ev.wicket.playerOut)) {
          errors.push(`Script ${scriptFile}: unknown playerOut ID '${ev.wicket.playerOut}' in event ${ev.id}`);
        }
        if (ev.fielders) {
          for (const fId of ev.fielders) {
            if (!allPlayerIds.has(fId)) {
              errors.push(`Script ${scriptFile}: unknown fielder ID '${fId}' in event ${ev.id}`);
            }
          }
        }
      }
    } catch (err: unknown) {
      errors.push(`Script ${scriptFile} validation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('[Validator] Validating Fallback Explanations...');
  for (const scriptFile of scripts) {
    try {
      const fallback = loadJson(`fallback-explanations/${scriptFile}`);
      FallbackSchema.parse(fallback);
    } catch (err: unknown) {
      errors.push(`Fallback ${scriptFile} validation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('[Validator] Validating Golden Anchors...');
  try {
    const goldenAnchors = loadJson<{
      anchors: Record<string, { expectedBase: number; expectedTotal: number; multiplier: number; breakdown: Array<{ points: number }> }>;
    }>('golden-anchors.json');
    GoldenAnchorsSchema.parse(goldenAnchors);

    for (const [key, anchor] of Object.entries(goldenAnchors.anchors)) {
      const sumBreakdown = anchor.breakdown.reduce((acc, curr) => acc + curr.points, 0);
      if (Math.abs(sumBreakdown - anchor.expectedBase) > 0.001) {
        errors.push(
          `Anchor ${key}: sum of breakdown (${sumBreakdown}) does not match expectedBase (${anchor.expectedBase})`
        );
      }
      if (Math.abs(anchor.expectedBase * anchor.multiplier - anchor.expectedTotal) > 0.001) {
        errors.push(
          `Anchor ${key}: expectedBase * multiplier (${anchor.expectedBase * anchor.multiplier}) does not match expectedTotal (${anchor.expectedTotal})`
        );
      }
    }
  } catch (err: unknown) {
    errors.push(`GoldenAnchors validation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log('[Validator] Validating Coverage Matrix...');
  try {
    const coverage = loadJson<{
      scenarios: Array<{ id: number; name: string; script: string; eventId: string }>;
    }>('coverage-matrix.json');
    CoverageMatrixSchema.parse(coverage);

    for (const sc of coverage.scenarios) {
      if (sc.script === 'full-match' && !fullMatchEventIds.has(sc.eventId)) {
        errors.push(`Coverage scenario ${sc.id} maps to event ${sc.eventId} which is missing in full-match.json`);
      }
    }
  } catch (err: unknown) {
    errors.push(`CoverageMatrix validation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

if (process.env.NODE_ENV !== 'test') {
  const result = validateAllData();
  if (!result.success) {
    console.error('\n❌ Data Validation Failed with errors:');
    result.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }
  console.log('\n✅ All Phase 1 data validations, schemas, continuity checks, squad legality, coverage, and golden anchors passed!');
}
