import { BigDecimal } from "@sentio/sdk";
import { EthChainId, EthContext } from "@sentio/sdk/eth";

export type Id = "hyperlend_usde_999";

export interface ERCConfig {
  network: EthChainId;
  tokenAddress: string;
  underlyingAddress: string;
  decimals: number;
  startBlock: number;
  points: PointInfo[];
  /**
   * An async function that takes a EthContext, triggerEvent and returns a ERC20State.
   * @param ctx EthContext
   * @returns A Promise that resolves to ERC20State at EthContext ctx.
   */
  // stateQuery: (ctx: EthContext) => Promise<ERC20State>;
  lendingPool: string;
}

// ERC20 State
export interface ERC20State {
  supply: BigDecimal;
  exchangeRate: BigDecimal;
  usdPrice: BigDecimal;
  // ethPrice: BigDecimal;
}

// POINTS (might want to move to swentio-utils)
export interface PointInfo {
  campaignId: string;
  pointId: string;
  startTimestamp: bigint;
  endTimestamp: bigint;
  baseRatePerHour: number;
  multiplier: number;
}

export interface PointOutput {
  campaignId: string;
  pointId: string;
  pointSeconds: bigint;
  pointsEarned: BigDecimal;
  calcStartTimestamp: bigint;
  calcEndTimestamp: bigint;
}

export interface GroupedPoints {
  pointId: string;
  totalPointsEarned: BigDecimal;
}

export interface AprOutput {
  aprId: "supply" | "reward" | "underlying" | "borrow";
  apr: BigDecimal;
}
