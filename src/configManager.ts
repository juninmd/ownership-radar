import { WeightConfig, MetricWeights, RoleMultipliers } from './types.js';

export const DEFAULT_WEIGHTS: MetricWeights = {
  commits: 0.4,
  linesChanged: 0.2,
  reviewsCount: 0.3,
  recency: 0.1,
};

export const DEFAULT_ROLE_MULTIPLIERS: RoleMultipliers = {
  mentorReviewMultiplier: 1.5,
  mentorOverallMultiplier: 1.0,
};

export const DEFAULT_CONFIG: WeightConfig = {
  weights: { ...DEFAULT_WEIGHTS },
  roleMultipliers: { ...DEFAULT_ROLE_MULTIPLIERS },
  customOverridesEnabled: true,
};

export class ConfigManager {
  private config: WeightConfig;

  constructor(initialConfig?: Partial<WeightConfig>) {
    this.config = this.mergeConfig(initialConfig);
  }

  public getConfig(): WeightConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  public updateConfig(newConfig: Partial<WeightConfig>): WeightConfig {
    this.config = this.mergeConfig(newConfig);
    return this.getConfig();
  }

  public updateWeights(weights: Partial<MetricWeights>): WeightConfig {
    this.config.weights = {
      ...this.config.weights,
      ...weights,
    };
    this.config.updatedAt = new Date().toISOString();
    return this.getConfig();
  }

  public updateRoleMultipliers(multipliers: Partial<RoleMultipliers>): WeightConfig {
    this.config.roleMultipliers = {
      ...this.config.roleMultipliers,
      ...multipliers,
    };
    this.config.updatedAt = new Date().toISOString();
    return this.getConfig();
  }

  public setCustomOverridesEnabled(enabled: boolean): WeightConfig {
    this.config.customOverridesEnabled = enabled;
    this.config.updatedAt = new Date().toISOString();
    return this.getConfig();
  }

  public resetToDefaults(): WeightConfig {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.config.updatedAt = new Date().toISOString();
    return this.getConfig();
  }

  private mergeConfig(partial?: Partial<WeightConfig>): WeightConfig {
    if (!partial) {
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    return {
      weights: {
        ...DEFAULT_WEIGHTS,
        ...(partial.weights || {}),
      },
      roleMultipliers: {
        ...DEFAULT_ROLE_MULTIPLIERS,
        ...(partial.roleMultipliers || {}),
      },
      customOverridesEnabled: partial.customOverridesEnabled ?? DEFAULT_CONFIG.customOverridesEnabled,
      leadUsername: partial.leadUsername || this.config?.leadUsername,
      updatedAt: partial.updatedAt || new Date().toISOString(),
    };
  }
}
