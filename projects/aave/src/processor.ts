import { ERC20Processor } from "@sentio/sdk/eth/builtin";
import { EthContext, isNullAddress } from "@sentio/sdk/eth";

import { configs } from "./config.js";
import { deploymentID } from "./deployment.js";
import { ERC20State, GroupedPoints, PointOutput } from "./types.js";
import { Account } from "./schema/schema.js";
import { getProtocolState } from "./state.js";
import { getERC20ContractOnContext } from "@sentio/sdk/eth/builtin/erc20";

const config = configs[deploymentID];

ERC20Processor.bind({
  address: config.tokenAddress,
  network: config.network,
  startBlock: config.startBlock,
})
  .onEventTransfer(async (event, ctx) => {
    const protocolState = await getProtocolState(ctx, "Transfer");
    const { from, to, value } = event.args;
    if (from === to) {
      await processTransfer(ctx, protocolState, from);
      return;
    }
    await Promise.all([
      processTransfer(ctx, protocolState, from),
      processTransfer(ctx, protocolState, to),
    ]);
  })
  .onTimeInterval(
    async (_, ctx) => {
      await updateAllAccounts(ctx, "TimeInterval");
    },
    4 * 60,
    4 * 60,
  );

async function updateAllAccounts(ctx: EthContext, triggerEvent: string) {
  const accounts = await ctx.store.list(Account);
  let newAccounts: Account[] = [];
  let accountUpdatePromises: Promise<void>[] = [];
  const protocolState = await getProtocolState(ctx, triggerEvent);
  accounts.map(async (account) => {
    const newAccount = new Account({
      id: account.id,
      updatedAt: BigInt(ctx.timestamp.getTime()),
      balance: account.balance,
    });
    newAccounts.push(newAccount);
    accountUpdatePromises.push(
      processAccount(ctx, protocolState, account, newAccount, triggerEvent),
    );
  });
  await Promise.all([...accountUpdatePromises, ctx.store.upsert(newAccounts)]);
}

async function processTransfer(
  ctx: EthContext,
  protocolState: ERC20State,
  address: string,
) {
  if (isNullAddress(address)) {
    return;
  }
  let account = await ctx.store.get(Account, address);
  if (!account) {
    account = new Account({
      id: address,
      updatedAt: BigInt(ctx.timestamp.getTime()),
      balance: 0n,
    });
  }
  const newBalance = await getERC20ContractOnContext(
    ctx,
    config.tokenAddress,
  ).balanceOf(address);
  const newAccount = new Account({
    id: account.id,
    updatedAt: BigInt(ctx.timestamp.getTime()),
    balance: newBalance,
  });
  if (newAccount.balance === 0n) {
    await ctx.store.delete(Account, account.id as string);
  } else {
    await ctx.store.upsert(newAccount);
  }

  await processAccount(ctx, protocolState, account, newAccount, "Transfer");
}

async function processAccount(
  ctx: EthContext,
  protocolState: ERC20State,
  oldAccount: Account,
  newAccount: Account,
  triggerEvent: string,
) {
  const prevUpdatedAt = oldAccount.updatedAt;
  const prevBalance = oldAccount.balance.scaleDown(config.decimals);

  const newUpdatedAt = newAccount.updatedAt;
  const newBalance = newAccount.balance.scaleDown(config.decimals);

  const deltaSeconds = (newUpdatedAt - prevUpdatedAt) / 1000n;
  const hoursElapsed = deltaSeconds.asBigDecimal().div(3600);
  const balanceHours = prevBalance.times(hoursElapsed);

  const points: PointOutput[] = config.points.map((point) => {
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

    return {
      campaignId,
      pointId,
      pointSeconds,
      pointsEarned,
      calcStartTimestamp,
      calcEndTimestamp,
    };
  });

  const newBalanceUSD = newBalance.times(protocolState.usdPrice);

  ctx.eventLogger.emit("account_snapshot", {
    account: oldAccount.id,
    triggerEvent,
    points: JSON.stringify(groupAndSumPoints(points)),
    pointsBreakDown: JSON.stringify(points),
    prevBalance,
    newBalance,
    prevUpdatedAt,
    newUpdatedAt,
    balanceHours,
    newBalanceUSD,
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
    } else {
      groupedMap.set(key, {
        pointId: point.pointId,
        totalPointsEarned: point.pointsEarned,
      });
    }
  });

  return Array.from(groupedMap.values());
}
