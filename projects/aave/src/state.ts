import { EthContext } from "@sentio/sdk/eth";
import { BigDecimal } from "@sentio/sdk";
import { AprOutput, ERC20State } from "./types.js";
import { configs } from "./config.js";
import { deploymentID } from "./deployment.js";
import { getERC20ContractOnContext } from "@sentio/sdk/eth/builtin/erc20";
import { oracle } from "@swell-network/swentio-utils";
import { getAaveLendingPoolContractOnContext } from "./types/eth/aavelendingpool.js";

const config = configs[deploymentID];

export async function getProtocolState(
  ctx: EthContext,
  triggerEvent: string = "Transfer",
): Promise<ERC20State> {
  const [
    supply,
    usdPrice,
    // ethPrice,ß
    reserveData,
  ] = await Promise.all([
    getERC20ContractOnContext(ctx, config.tokenAddress).totalSupply(),
    oracle.getUsdExchangeRate(ctx, config.underlyingAddress),
    // oracle.getEthExchangeRate(ctx, config.underlyingAddress),
    getAaveLendingPoolContractOnContext(
      ctx,
      config.lendingPool,
    ).getReserveDataExtended(config.underlyingAddress),
  ]);
  const protocolState = {
    supply: supply.scaleDown(config.decimals),
    exchangeRate: BigDecimal(1),
    usdPrice: usdPrice,
    // ethPrice: ethPrice,
  };

  const aprOutput: AprOutput = {
    aprId: "supply",
    apr: reserveData.currentLiquidityRate.scaleDown(27).times(100),
  };

  ctx.eventLogger.emit("protocol_state", {
    triggerEvent,
    supply: protocolState.supply,
    usdPrice: protocolState.usdPrice,
    exchangeRate: reserveData.liquidityIndex.scaleDown(27),
    supplyUSD: protocolState.supply.times(protocolState.usdPrice),
    apr: JSON.stringify([aprOutput]),
  });

  return protocolState;
}
