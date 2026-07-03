/** Feature flag lifecycle stage. */
export type FeatureStage = "development" | "beta" | "experimental" | "stable" | "deprecated";

/** A single feature flag definition. */
export interface FeatureFlag {
	id: string;
	name: string;
	description?: string;
	stage: FeatureStage;
	defaultValue: boolean | string;
	override?: boolean | string;
}

/** Registry for feature flags. */
export interface FeatureFlagRegistry {
	register(flag: FeatureFlag): void;
	get(id: string): FeatureFlag | undefined;
	isEnabled(id: string): boolean;
	valueOf(id: string): boolean | string | undefined;
	list(): FeatureFlag[];
}
