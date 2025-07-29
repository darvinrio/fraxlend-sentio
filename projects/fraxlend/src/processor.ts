import { EthContext } from "@sentio/sdk/eth";
import { configs } from "./config.js";
import { deploymentID } from "./deployment.js";
import { FraxLendPairProcessor } from "./types/eth/fraxlendpair.js";
import { PositionState, PositionType } from "./schema/schema.js";
import { BigDecimal } from "@sentio/sdk";
import {
  BalanceOutput,
  FraxlendState,
  GroupedPoints,
  PointOutput,
  TokenConfig,
} from "./types.js";
import { getProtocolState } from "./state.js";

const config = configs[deploymentID];

FraxLendPairProcessor.bind({
  network: config.network,
  address: config.poolAddress,
  startBlock: config.startBlock,
})
  .onEventAddCollateral(async (event, ctx) => {
    const { sender, borrower, collateralAmount } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      borrower,
      PositionType.Collateral,
      collateralAmount,
      event.name,
    );
  })
  .onEventBorrowAsset(async (event, ctx) => {
    const { _borrowAmount, _borrower, _receiver, _sharesAdded } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      _borrower,
      PositionType.Borrow,
      _sharesAdded,
      event.name,
    );
  })
  .onEventDeposit(async (event, ctx) => {
    const { assets, caller, owner, shares } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      owner,
      PositionType.Supply,
      shares,
      event.name,
    );
  })
  .onEventRepayAsset(async (event, ctx) => {
    const { amountToRepay, borrower, shares, payer } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      borrower,
      PositionType.Borrow,
      -shares,
      event.name,
    );
  })
  .onEventRepayAssetWithCollateral(async (event, ctx) => {
    const {
      _amountAssetOut,
      _borrower,
      _collateralToSwap,
      _sharesRepaid,
      _swapperAddress,
    } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      _borrower,
      PositionType.Borrow,
      -_sharesRepaid,
      event.name,
    );
    await updateOne(
      ctx,
      poolState,
      _borrower,
      PositionType.Collateral,
      -_collateralToSwap,
      event.name,
    );
  })
  .onEventLiquidate(async (event, ctx) => {
    const {
      _amountLiquidatorToRepay,
      _amountToAdjust,
      _borrower,
      _collateralForLiquidator,
      _feesAmount,
      _sharesToAdjust,
      _sharesToLiquidate,
    } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      _borrower,
      PositionType.Borrow,
      0n,
      event.name,
    );
    await updateOne(
      ctx,
      poolState,
      _borrower,
      PositionType.Collateral,
      0n,
      event.name,
    );
  })
  .onEventWithdraw(async (event, ctx) => {
    const { assets, caller, owner, receiver, shares } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      owner,
      PositionType.Supply,
      -shares,
      event.name,
    );
  })
  .onEventRemoveCollateral(async (event, ctx) => {
    const { _sender, _borrower, _collateralAmount, _receiver } = event.args;
    const poolState = await getProtocolState(ctx, event.name);
    await updateOne(
      ctx,
      poolState,
      _borrower,
      PositionType.Collateral,
      -_collateralAmount,
      event.name,
    );
  })
  // .onEventLeveragedPosition(async (event, ctx) => {
  //   // MAYBE LOGGING ??
  // })
  .onTimeInterval(
    async (_, ctx) => {
      await updateAll(ctx, "TimeInterval");
    },
    4 * 60,
    4 * 60,
  );

async function updateAll(ctx: EthContext, triggerEvent: string) {
  const poolState = await getProtocolState(ctx, triggerEvent);
  const positions = await ctx.store.list(PositionState);
  let newPositions: PositionState[] = [];
  positions.map(async (position) => {
    const newposition = new PositionState({
      id: position.id,
      address: position.address,
      type: position.type,
      updatedAt: BigInt(ctx.timestamp.getTime()),
      balance: position.balance,
    });
    newPositions.push(newposition);
    processPosition(ctx, poolState, position, newposition, triggerEvent);
  });
  await Promise.all([ctx.store.upsert(newPositions)]);
}

async function updateOne(
  ctx: EthContext,
  poolState: FraxlendState,
  address: string,
  positionType: PositionType,
  deltaAmount: bigint,
  triggerEvent: string,
) {
  const id = address + "_" + positionType;
  let position = await ctx.store.get(PositionState, id);
  if (!position) {
    position = new PositionState({
      id: id,
      type: positionType,
      address: address,
      updatedAt: BigInt(ctx.timestamp.getTime()),
      balance: BigDecimal(0),
    });
  }

  const decimals = positionTypeToTokenConfig(positionType).token.decimals;
  const balance = position.balance.plus(deltaAmount.scaleDown(decimals));

  const newPosition = new PositionState({
    id: id,
    address: address,
    type: positionType,
    updatedAt: BigInt(ctx.timestamp.getTime()),
    balance: balance,
  });

  processPosition(ctx, poolState, position, newPosition, triggerEvent);
  if (newPosition.balance.eq(0)) {
    await ctx.store.delete(PositionState, newPosition.id as string);
  } else {
    await ctx.store.upsert(newPosition);
  }
}

function processPosition(
  ctx: EthContext,
  poolState: FraxlendState,
  oldPosition: PositionState,
  newPosition: PositionState,
  triggerEvent: string,
) {
  const prevUpdatedAt = oldPosition.updatedAt;
  const newUpdatedAt = newPosition.updatedAt;
  const deltaSeconds = (newUpdatedAt - prevUpdatedAt) / 1000n;
  const hoursElapsed = deltaSeconds.asBigDecimal().div(3600);

  const rate = positionTypeToTokenRate(oldPosition.type, poolState);
  const oldTokenBalances = [oldPosition.balance.times(rate)];
  const newTokenBalances = [newPosition.balance.times(rate)];
  const pointMap = [positionTypeToTokenConfig(oldPosition.type).points];

  const points: PointOutput[] = oldTokenBalances.flatMap(
    (prevBalance, index) => {
      return pointMap[index].map((point) => {
        const {
          campaignId,
          pointId,
          startTimestamp,
          endTimestamp,
          baseRatePerHour,
          multiplier,
        } = point;

        const calcStartTimestamp =
          startTimestamp < prevUpdatedAt ? prevUpdatedAt : startTimestamp;
        const calcEndTimestamp =
          endTimestamp > newUpdatedAt ? newUpdatedAt : endTimestamp;
        const pointSeconds =
          calcEndTimestamp > calcStartTimestamp
            ? (calcEndTimestamp - calcStartTimestamp) / 1000n
            : 0n;
        const pointHours = pointSeconds.asBigDecimal().div(3600);

        const pointsEarned = prevBalance
          .times(pointHours)
          .times(baseRatePerHour)
          .times(multiplier);

        const pointSpeed = newTokenBalances[index]
          .times(baseRatePerHour)
          .times(multiplier)
          .div(3600); // convert 1 hour point to 1 second point

        return {
          campaignId,
          pointId,
          pointSeconds,
          pointsEarned,
          pointSpeed,
          calcStartTimestamp,
          calcEndTimestamp,
        };
      });
    },
  );

  const newBalanceUSD = newPosition.balance.times(
    positionTypeToTokenRate(oldPosition.type, poolState),
  );
  const balanceBreakdown: BalanceOutput[] = [];

  ctx.eventLogger.emit("account_snapshot", {
    id: oldPosition.id as string,
    account: oldPosition.address,
    sub_protocol_id: oldPosition.type,
    triggerEvent,
    points: JSON.stringify(groupAndSumPoints(points)),
    pointsBreakDown: JSON.stringify(points),
    prevBalance: oldPosition.balance,
    newBalance: newPosition.balance,
    prevUpdatedAt,
    newUpdatedAt,
    // balanceHours,
    // rate,
    newBalanceUSD: newBalanceUSD,
    newBalanceBreakDown: JSON.stringify(balanceBreakdown),
  });
}

function groupAndSumPoints(points: PointOutput[]): GroupedPoints[] {
  const groupedMap = new Map<string, GroupedPoints>();

  points.forEach((point) => {
    const key = `${point.pointId}`;

    if (groupedMap.has(key)) {
      const existing = groupedMap.get(key)!;
      existing.totalPointsEarned = existing.totalPointsEarned.plus(
        point.pointsEarned,
      );
      existing.totalPointSpeed = existing.totalPointSpeed.plus(
        point.pointSpeed,
      );
    } else {
      groupedMap.set(key, {
        pointId: point.pointId,
        totalPointsEarned: point.pointsEarned,
        totalPointSpeed: point.pointSpeed,
      });
    }
  });

  return Array.from(groupedMap.values());
}

function positionTypeToTokenConfig(positionType: PositionType): TokenConfig {
  switch (positionType) {
    case PositionType.Collateral:
      return config.collateral;
    case PositionType.Supply:
      return config.supply;
    case PositionType.Borrow:
      return config.borrowable;
    default:
      throw new Error(`Unknown position type: ${positionType}`);
  }
}

function positionTypeToTokenRate(
  positionType: PositionType,
  poolState: FraxlendState,
): BigDecimal {
  switch (positionType) {
    case PositionType.Collateral:
      return BigDecimal(1);
    case PositionType.Supply:
      return poolState.supplyExchangeRate;
    case PositionType.Borrow:
      return poolState.borrowExchangeRate;
    default:
      throw new Error(`Unknown position type: ${positionType}`);
  }
}
