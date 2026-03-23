export const ASSET_TYPES = ['mutual_fund', 'crypto', 'gold'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
