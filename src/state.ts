import { EthContext } from "@sentio/sdk/eth";
import { configs } from "./config.js";
import { deploymentID } from "./deployment.js";
import { getFraxLendPairContractOnContext } from "./types/eth/fraxlendpair.js";
import { BalanceOutput, FraxlendState } from "./types.js";
import { PositionType } from "./schema/schema.js";
import { BigDecimal } from "@sentio/sdk";

export async function getProtocolState(
  ctx: EthContext,
  triggerEvent: string = "Transfer",
): Promise<FraxlendState> {
  const config = configs[deploymentID];
  const pool = getFraxLendPairContractOnContext(ctx, config.poolAddress);

  const pairAccounting = await pool.getPairAccounting();
  const currentRateInfo = await pool.currentRateInfo();

  const {
    _totalAssetAmount,
    _totalAssetShares,
    _totalBorrowAmount,
    _totalBorrowShares,
    _totalCollateral,
  } = pairAccounting;
  const {
    lastBlock,
    feeToProtocolRate,
    lastTimestamp,
    ratePerSec,
    fullUtilizationRate,
  } = currentRateInfo;

  const totalCollateral = _totalCollateral.scaleDown(
    config.collateral.token.decimals,
  );
  const totalSupplyAmount = _totalAssetAmount.scaleDown(
    config.supply.token.decimals,
  );
  const totalBorrowAmount = _totalBorrowAmount.scaleDown(
    config.borrowable.token.decimals,
  );
  const totalBorrowShares = _totalBorrowShares.scaleDown(
    config.borrowable.token.decimals,
  );
  const totalAssetShares = _totalAssetShares.scaleDown(
    config.supply.token.decimals,
  );
  const supplyExchangeRate = totalSupplyAmount.div(totalAssetShares);
  const borrowExchangeRate = totalBorrowAmount.div(totalBorrowShares);

  const ratePrecision = 18;
  const feePrecision = 5;
  // const borrowApr = ratePerSec
  //   .scaleDown(ratePrecision)
  //   .plus(1)
  //   .pow(31536000)
  //   .minus(1);
  const borrowApr = ratePerSec
    .scaleDown(ratePrecision)
    .times(31536000)
    .times(100);
  const feeToProtocolRateScaled = feeToProtocolRate.scaleDown(feePrecision);
  const supplyToBorrowRatio = totalSupplyAmount.div(totalBorrowAmount);
  const supplyApr = borrowApr
    .times(BigDecimal(1).minus(feeToProtocolRateScaled))
    .div(supplyToBorrowRatio);

  const supplyAprOutput = [
    {
      aprId: "supply",
      apr: supplyApr,
    },
  ];
  const borrowAprOutput = [
    {
      aprId: "borrow",
      apr: borrowApr,
    },
  ];

  const borrowBreakdown: BalanceOutput[] = [
    {
      token: config.borrowable.token.address,
      symbol: config.borrowable.token.symbol ?? "",
      native: totalBorrowAmount,
      usd: totalBorrowAmount,
    },
  ];
  const supplyBreakdown: BalanceOutput[] = [
    {
      token: config.supply.token.address,
      symbol: config.supply.token.symbol ?? "",
      native: totalSupplyAmount,
      usd: totalSupplyAmount,
    },
  ];
  const collateralBreakdown: BalanceOutput[] = [
    {
      token: config.collateral.token.address,
      symbol: config.collateral.token.symbol ?? "",
      native: totalCollateral,
      usd: totalCollateral,
    },
  ];

  ctx.eventLogger.emit("protocol_state", {
    triggerEvent,
    // protocol status
    sub_protocol_id: PositionType.Collateral,
    supply: totalCollateral,
    supplyBreakdown: JSON.stringify(collateralBreakdown),
    exchangeRate: BigDecimal(1),
    rateLastUpdatedAt: BigInt(lastTimestamp),
    apr: JSON.stringify([]),
    // earnAPI
    supplyUsd: totalCollateral,
  });

  ctx.eventLogger.emit("protocol_state", {
    triggerEvent,
    // protocol status
    sub_protocol_id: PositionType.Supply,
    supply: totalAssetShares,
    supplyBreakdown: JSON.stringify(supplyBreakdown),
    exchangeRate: BigDecimal(supplyExchangeRate),
    rateLastUpdatedAt: BigInt(lastTimestamp),
    apr: JSON.stringify(supplyAprOutput),
    // earnAPI
    supplyUsd: totalSupplyAmount,
  });

  ctx.eventLogger.emit("protocol_state", {
    triggerEvent,
    // protocol status
    sub_protocol_id: PositionType.Borrow,
    supply: totalBorrowShares,
    supplyBreakdown: JSON.stringify(borrowBreakdown),
    exchangeRate: BigDecimal(borrowExchangeRate),
    rateLastUpdatedAt: BigInt(lastTimestamp),
    apr: JSON.stringify(borrowAprOutput),
    // earnAPI
    supplyUsd: totalBorrowAmount,
  });

  return {
    totalCollateral,
    totalSupplyAmount,
    totalBorrowAmount,
    supplyExchangeRate,
    borrowExchangeRate,
  };
}
