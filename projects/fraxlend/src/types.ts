import { BigDecimal } from "@sentio/sdk";
import { EthChainId } from "@sentio/sdk/eth";
import { Token } from "@uniswap/sdk-core";

export type Id = "hypurr_hwhlp_usdt0_999" | "hypurr_hwhlp_usdhl_999";

export interface FraxlendConfig {
  network: EthChainId;
  poolAddress: string;
  collateral: TokenConfig;
  // supply and borrow is same token,
  // but we keep them separate for different point configurations
  supply: TokenConfig;
  borrowable: TokenConfig;
  startBlock: number;
}

export interface FraxlendState {
  totalCollateral: BigDecimal;
  totalSupplyAmount: BigDecimal;
  totalBorrowAmount: BigDecimal;
  supplyExchangeRate: BigDecimal;
  borrowExchangeRate: BigDecimal;
}

export interface TokenConfig {
  token: Token;
  points: PointInfo[];
}

// POINTS (might want to move to swentio-utils)
export interface PointInfo {
  campaignId: string;
  pointId: string;
  startTimestamp: bigint;
  endTimestamp: bigint;
  baseRatePerHour: number | BigDecimal;
  multiplier: number;
}

export interface PointOutput {
  campaignId: string;
  pointId: string;
  pointSeconds: bigint;
  pointsEarned: BigDecimal;
  pointSpeed: BigDecimal;
  calcStartTimestamp: bigint;
  calcEndTimestamp: bigint;
}

export interface GroupedPoints {
  pointId: string;
  totalPointsEarned: BigDecimal;
  totalPointSpeed: BigDecimal;
}

export interface AprOutput {
  aprId: "supply" | "reward" | "underlying" | "borrow";
  apr: BigDecimal;
}

export interface BalanceOutput {
  token: string;
  symbol: string;
  native: BigDecimal;
  usd: BigDecimal;
}
