import { EthChainId } from "@sentio/sdk/eth";
import { Id, ERCConfig } from "./types.js";

export const configs: Record<Id, ERCConfig> = {
  hyperlend_usde_999: {
    network: EthChainId.HYPER_EVM,
    decimals: 18,
    tokenAddress: "0x333819c04975554260AaC119948562a0E24C2bd6",
    underlyingAddress: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    startBlock: 3503064, // May 07 2025 20:53:00 PM (+05:30 UTC)
    lendingPool: "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b",
    // points: [],
    points: [
      {
        campaignId: "invariant",
        pointId: "invariant",
        startTimestamp: BigInt(0) * 1000n, // from beginning
        endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
        baseRatePerHour: 1,
        multiplier: 1,
      },
      {
        campaignId: "base_campaign",
        pointId: "wave",
        startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
        endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
        baseRatePerHour: 10,
        multiplier: 1,
      },
      {
        campaignId: "first_month_extra_2x_boost",
        pointId: "wave",
        startTimestamp: BigInt(0), // from beginning
        endTimestamp: BigInt(1749309780) * 1000n, // June 07 2025 20:53:00 PM (+05:30 UTC)
        baseRatePerHour: 10,
        multiplier: 2,
      },
      {
        campaignId: "swell_june_first_7_days",
        pointId: "swell",
        startTimestamp: BigInt(1748716200) * 1000n, // June 01 2025 00:00:00 PM (+05:30 UTC)
        endTimestamp: BigInt(1748716200) * 1000n, // June 06 2025 23:59:59 PM (+05:30 UTC)
        baseRatePerHour: 4,
        multiplier: 10,
      },
    ],
  },
};
