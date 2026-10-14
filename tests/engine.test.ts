import { describe, it, expect } from 'vitest';
import { calculateOwnershipSuggestions } from '../src/engine.js';
import { ContributorMetrics, WeightConfig } from '../src/types.js';
import { DEFAULT_CONFIG } from '../src/configManager.js';

describe('calculateOwnershipSuggestions', () => {
  const sampleContributors: ContributorMetrics[] = [
    {
      username: 'alice_mentor',
      commits: 10,
      linesChanged: 200,
      reviewsCount: 15,
      recencyDays: 2,
      role: 'mentor',
    },
    {
      username: 'bob_dev',
      commits: 20,
      linesChanged: 500,
      reviewsCount: 5,
      recencyDays: 5,
      role: 'member',
    },
    {
      username: 'carol_dev',
      commits: 5,
      linesChanged: 50,
      reviewsCount: 2,
      recencyDays: 30,
      role: 'member',
    },
  ];

  it('returns empty array when contributors list is empty', () => {
    expect(calculateOwnershipSuggestions([])).toEqual([]);
  });

  it('calculates default ownership suggestions with default weights', () => {
    const suggestions = calculateOwnershipSuggestions(sampleContributors, DEFAULT_CONFIG);

    expect(suggestions).toHaveLength(3);
    const alice = suggestions.find((s) => s.username === 'alice_mentor');
    const bob = suggestions.find((s) => s.username === 'bob_dev');

    expect(alice).toBeDefined();
    expect(bob).toBeDefined();

    // Alice gets 1.5x review boost due to default mentor multiplier
    expect(alice?.breakdown.mentorBoostApplied).toBe(true);
    expect(alice?.breakdown.explanation).toContain('boost x1.5');
  });

  it('allows team leads to override review count weight and mentor boost', () => {
    const customConfig: WeightConfig = {
      weights: {
        commits: 0.1,
        linesChanged: 0.1,
        reviewsCount: 0.7, // Heavy emphasis on reviews
        recency: 0.1,
      },
      roleMultipliers: {
        mentorReviewMultiplier: 2.5, // Strong mentor review boost
        mentorOverallMultiplier: 1.0,
      },
      customOverridesEnabled: true,
    };

    const suggestions = calculateOwnershipSuggestions(sampleContributors, customConfig);

    const alice = suggestions.find((s) => s.username === 'alice_mentor');
    expect(alice?.isTopOwner).toBe(true);
    expect(alice?.breakdown.explanation).toContain('boost x2.5');
    expect(alice?.breakdown.explanation).toContain('weight 0.7');
    expect(alice?.breakdown.explanation).toContain('Custom team lead weights active');
  });

  it('falls back to default weights when customOverridesEnabled is false', () => {
    const disabledConfig: WeightConfig = {
      weights: {
        commits: 0.0,
        linesChanged: 0.0,
        reviewsCount: 1.0,
        recency: 0.0,
      },
      roleMultipliers: {
        mentorReviewMultiplier: 3.0,
        mentorOverallMultiplier: 1.0,
      },
      customOverridesEnabled: false,
    };

    const suggestions = calculateOwnershipSuggestions(sampleContributors, disabledConfig);
    const alice = suggestions.find((s) => s.username === 'alice_mentor');

    // Should use default weight of 0.3 for reviews and 1.5 for mentor review multiplier
    expect(alice?.breakdown.explanation).toContain('weight 0.3');
    expect(alice?.breakdown.explanation).toContain('boost x1.5');
    expect(alice?.breakdown.explanation).not.toContain('Custom team lead weights active');
  });
});
