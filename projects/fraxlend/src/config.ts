import { EthChainId } from "@sentio/sdk/eth";
import { FraxlendConfig, Id } from "./types.js";
import { BigDecimal } from "@sentio/sdk";
import { Token } from "@uniswap/sdk-core";

export const configs: Record<Id, FraxlendConfig> = {
  hypurr_hwhlp_usdt0_999: {
    network: EthChainId.HYPER_EVM,
    poolAddress: "0x2c910F67DbF81099e6f8e126E7265d7595DC20aD",
    collateral: {
      token: new Token(
        999,
        "0x9FD7466f987Fd4C45a5BBDe22ED8aba5BC8D72d1",
        6,
        "hwHLP",
      ),
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
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 1,
        },
      ],
    },
    supply: {
      token: new Token(
        999,
        "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
        6,
        "USDT0",
      ),
      points: [
        {
          campaignId: "base_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 1,
        },
        {
          campaignId: "lp_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 2,
        },
      ],
    },
    borrowable: {
      token: new Token(
        999,
        "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
        6,
        "USDT0",
      ),
      points: [
        {
          campaignId: "base_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 1,
        },
        {
          campaignId: "lp_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 2,
        },
      ],
    },
    startBlock: 7252417,
  },
  hypurr_hwhlp_usdhl_999: {
    network: EthChainId.HYPER_EVM,
    poolAddress: "0xe8648B00570B5562488d8324c98242EE8FB1A35F",
    collateral: {
      token: new Token(
        999,
        "0x9FD7466f987Fd4C45a5BBDe22ED8aba5BC8D72d1",
        6,
        "hwHLP",
      ),
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
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 1,
        },
      ],
    },
    supply: {
      token: new Token(
        999,
        "0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5",
        6,
        "USDHL",
      ),
      points: [
        {
          campaignId: "base_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 1,
        },
        {
          campaignId: "lp_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 2,
        },
      ],
    },
    borrowable: {
      token: new Token(
        999,
        "0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5",
        6,
        "USDHL",
      ),
      points: [
        {
          campaignId: "base_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 1,
        },
        {
          campaignId: "lp_campaign",
          pointId: "wave",
          startTimestamp: BigInt(0) * 1000n, // / 2025-03-18T00:00:00 IST
          endTimestamp: BigInt(3749148200) * 1000n, // LARGE value
          baseRatePerHour: BigDecimal(1).div(BigDecimal(24)),
          multiplier: 2,
        },
      ],
    },
    startBlock: 7356360,
  },
};
