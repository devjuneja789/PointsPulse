import { describe, it, expect } from 'vitest';
import { validateAllData } from '../../src/data/validate';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 1: Truth & Data Validation Suite', () => {
  it('passes the full data validation pipeline with 0 errors', () => {
    const result = validateAllData();
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
  });

  it('contains verified Dream11 rules with proper rulesVersion and metadata', () => {
    const rulesPath = path.resolve(__dirname, '../../src/data/rules.json');
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

    expect(rules.metadata.format).toBe('T20');
    expect(rules.metadata.rulesVersion).toBe('2026.1-t20');
    expect(rules.batting.run).toBe(1);
    expect(rules.batting.boundaryFourBonus).toBe(1);
    expect(rules.batting.sixBonus).toBe(2);
    expect(rules.batting.milestones['50']).toBe(8);
    expect(rules.bowling.wicket).toBe(25);
    expect(rules.bowling.bowledLbwBonus).toBe(8);
    expect(rules.multipliers.captain).toBe(2.0);
    expect(rules.multipliers.viceCaptain).toBe(1.5);
  });

  it('verifies user team compliance with Dream11 rules', () => {
    const teamPath = path.resolve(__dirname, '../../src/data/myTeam.json');
    const team = JSON.parse(fs.readFileSync(teamPath, 'utf-8'));

    expect(team.players).toHaveLength(11);
    expect(team.captain).not.toBe(team.viceCaptain);
    expect(team.captain).toBe('mi_bumrah'); // Bowler Captain (x2 scenario)
    expect(team.viceCaptain).toBe('mi_sky'); // Batter VC (x1.5 scenario)
    expect(team.players).toContain(team.metadata.benchedPlayer);
    expect(team.metadata.benchedPlayer).toBe('mi_brevis'); // Benched player
  });

  it('covers all 14 required demo scenarios in coverage-matrix.json', () => {
    const matrixPath = path.resolve(__dirname, '../../src/data/coverage-matrix.json');
    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));

    expect(matrix.scenarios).toHaveLength(14);
    const scenarioIds = matrix.scenarios.map((s: { id: number }) => s.id);
    for (let i = 1; i <= 14; i++) {
      expect(scenarioIds).toContain(i);
    }
  });

  it('validates golden anchors exact mathematical reconciliation', () => {
    const anchorsPath = path.resolve(__dirname, '../../src/data/golden-anchors.json');
    const { anchors } = JSON.parse(fs.readFileSync(anchorsPath, 'utf-8'));

    // Batter anchor (Rohit)
    expect(anchors.batter.expectedBase).toBe(9.0);
    expect(anchors.batter.expectedTotal).toBe(9.0);

    // Bowler anchor (Pathirana)
    expect(anchors.bowler.expectedBase).toBe(101.0);
    expect(anchors.bowler.expectedTotal).toBe(101.0);

    // Fielder anchor (Jadeja)
    expect(anchors.fielder.expectedBase).toBe(44.0);
    expect(anchors.fielder.expectedTotal).toBe(44.0);

    // Captain anchor (Bumrah, 2.0x)
    expect(anchors.captain.expectedBase).toBe(81.0);
    expect(anchors.captain.multiplier).toBe(2.0);
    expect(anchors.captain.expectedTotal).toBe(162.0);

    // Vice-Captain anchor (SKY, 1.5x)
    expect(anchors.viceCaptain.expectedBase).toBe(88.0);
    expect(anchors.viceCaptain.multiplier).toBe(1.5);
    expect(anchors.viceCaptain.expectedTotal).toBe(132.0);
  });
});
