import { describe, it, expect } from 'vitest';
import { ConfigManager, DEFAULT_CONFIG, DEFAULT_WEIGHTS, DEFAULT_ROLE_MULTIPLIERS } from '../src/configManager.js';

describe('ConfigManager', () => {
  it('should initialize with default weight configuration', () => {
    const manager = new ConfigManager();
    const config = manager.getConfig();

    expect(config.weights).toEqual(DEFAULT_WEIGHTS);
    expect(config.roleMultipliers).toEqual(DEFAULT_ROLE_MULTIPLIERS);
    expect(config.customOverridesEnabled).toBe(true);
  });

  it('should update metric weights independently', () => {
    const manager = new ConfigManager();
    manager.updateWeights({ reviewsCount: 0.6, commits: 0.2 });
    const config = manager.getConfig();

    expect(config.weights.reviewsCount).toBe(0.6);
    expect(config.weights.commits).toBe(0.2);
    expect(config.weights.linesChanged).toBe(DEFAULT_WEIGHTS.linesChanged);
    expect(config.weights.recency).toBe(DEFAULT_WEIGHTS.recency);
  });

  it('should update role multipliers independently', () => {
    const manager = new ConfigManager();
    manager.updateRoleMultipliers({ mentorReviewMultiplier: 2.0 });
    const config = manager.getConfig();

    expect(config.roleMultipliers.mentorReviewMultiplier).toBe(2.0);
    expect(config.roleMultipliers.mentorOverallMultiplier).toBe(1.0);
  });

  it('should enable or disable custom overrides', () => {
    const manager = new ConfigManager();
    manager.setCustomOverridesEnabled(false);
    expect(manager.getConfig().customOverridesEnabled).toBe(false);

    manager.setCustomOverridesEnabled(true);
    expect(manager.getConfig().customOverridesEnabled).toBe(true);
  });

  it('should reset configuration back to defaults', () => {
    const manager = new ConfigManager();
    manager.updateWeights({ reviewsCount: 0.8 });
    manager.updateRoleMultipliers({ mentorReviewMultiplier: 3.0 });
    manager.setCustomOverridesEnabled(false);

    const resetConfig = manager.resetToDefaults();
    expect(resetConfig.weights).toEqual(DEFAULT_WEIGHTS);
    expect(resetConfig.roleMultipliers).toEqual(DEFAULT_ROLE_MULTIPLIERS);
    expect(resetConfig.customOverridesEnabled).toBe(true);
  });
});
