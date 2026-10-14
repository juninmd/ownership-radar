import { ContributorMetrics, WeightConfig, OwnershipSuggestion, ComponentScoreBreakdown } from './types.js';
import { DEFAULT_CONFIG } from './configManager.js';

export function calculateOwnershipSuggestions(
  contributors: ContributorMetrics[],
  config: WeightConfig = DEFAULT_CONFIG
): OwnershipSuggestion[] {
  if (!contributors || contributors.length === 0) {
    return [];
  }

  // Determine maximum values across contributors for normalization
  const maxCommits = Math.max(...contributors.map((c) => c.commits), 1);
  const maxLines = Math.max(...contributors.map((c) => c.linesChanged), 1);
  const maxReviews = Math.max(...contributors.map((c) => c.reviewsCount), 1);

  // Normalize recency: 0 days = score 1.0; 180+ days decay towards 0.1
  const calculateRecencyScore = (days: number): number => {
    if (days <= 0) return 1.0;
    const score = Math.max(0.1, 1 - days / 180);
    return Math.round(score * 100) / 100;
  };

  const weights = config.customOverridesEnabled ? config.weights : DEFAULT_CONFIG.weights;
  const multipliers = config.customOverridesEnabled ? config.roleMultipliers : DEFAULT_CONFIG.roleMultipliers;

  const rawSuggestions = contributors.map((c) => {
    const normCommits = c.commits / maxCommits;
    const normLines = c.linesChanged / maxLines;

    let effectiveReviews = c.reviewsCount;
    let mentorBoostApplied = false;
    let mentorBoostAmount = 0;

    if (c.role === 'mentor' && multipliers.mentorReviewMultiplier > 1) {
      effectiveReviews = c.reviewsCount * multipliers.mentorReviewMultiplier;
      mentorBoostApplied = true;
    }

    const normReviews = effectiveReviews / maxReviews;
    const normRecency = calculateRecencyScore(c.recencyDays);

    const commitsScore = Math.round(normCommits * weights.commits * 100) / 100;
    const linesChangedScore = Math.round(normLines * weights.linesChanged * 100) / 100;
    const reviewsScore = Math.round(normReviews * weights.reviewsCount * 100) / 100;
    const recencyScore = Math.round(normRecency * weights.recency * 100) / 100;

    let subtotal = commitsScore + linesChangedScore + reviewsScore + recencyScore;

    if (c.role === 'mentor' && multipliers.mentorOverallMultiplier !== 1) {
      subtotal *= multipliers.mentorOverallMultiplier;
    }

    if (mentorBoostApplied) {
      const baseReviewsScore = (c.reviewsCount / maxReviews) * weights.reviewsCount;
      mentorBoostAmount = Math.round((reviewsScore - baseReviewsScore) * 100) / 100;
    }

    const totalScore = Math.round(subtotal * 100) / 100;

    // Generate clear, transparent explanation for GitHub UI display
    const explanationParts: string[] = [
      `Commits: ${c.commits} (${Math.round(normCommits * 100)}% relative, weight ${weights.commits})`,
      `Lines: ${c.linesChanged} (${Math.round(normLines * 100)}% relative, weight ${weights.linesChanged})`,
      `Reviews: ${c.reviewsCount}${
        mentorBoostApplied ? ` -> boost x${multipliers.mentorReviewMultiplier} (${effectiveReviews.toFixed(1)})` : ''
      } (weight ${weights.reviewsCount})`,
      `Recency: ${c.recencyDays}d ago (score ${normRecency}, weight ${weights.recency})`,
    ];

    if (config.customOverridesEnabled) {
      explanationParts.push(`Custom team lead weights active.`);
    }
    if (mentorBoostApplied) {
      explanationParts.push(`Mentor review count boosted by ${multipliers.mentorReviewMultiplier}x.`);
    }

    const breakdown: ComponentScoreBreakdown = {
      commitsScore,
      linesChangedScore,
      reviewsScore,
      recencyScore,
      mentorBoostApplied,
      mentorBoostAmount,
      totalScore,
      explanation: explanationParts.join(' | '),
    };

    return {
      username: c.username,
      role: c.role,
      rawScore: totalScore,
      breakdown,
    };
  });

  // Calculate percentage shares
  const sumScores = rawSuggestions.reduce((acc, curr) => acc + curr.rawScore, 0);
  const highestScore = Math.max(...rawSuggestions.map((s) => s.rawScore));

  const sortedSuggestions = rawSuggestions
    .map((item) => {
      const finalScore = sumScores > 0 ? Math.round((item.rawScore / sumScores) * 100) : 0;
      return {
        username: item.username,
        role: item.role,
        finalScore,
        breakdown: item.breakdown,
        isTopOwner: item.rawScore === highestScore && highestScore > 0,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);

  return sortedSuggestions;
}
