import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trade, TokenInfo, MyOrder, MarketTrade, Orders } from './type';
import { getMarketTrades, getOrderlyPublic, getOpenOrders, getAllOrders } from './off-chain-api';
import { useWalletSelector } from '../WalletSelectorContext';

const useIntervalAsync = <R = unknown>(fn: () => Promise<R>, ms: number) => {
  const runningCount = useRef(0);
  const timeout = useRef<number>();
  const mountedRef = useRef(false);

  const next = useCallback(
    (handler: TimerHandler) => {
      if (mountedRef.current && runningCount.current === 0) {
        timeout.current = window.setTimeout(handler, ms);
      }
    },
    [ms]
  );

  const run = useCallback(async () => {
    runningCount.current += 1;
    const result = await fn();
    runningCount.current -= 1;

    next(run);

    return result;
  }, [fn, next]);

  useEffect(() => {
    mountedRef.current = true;
    run();

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timeout.current);
    };
  }, [run]);

  const flush = useCallback(() => {
    window.clearTimeout(timeout.current);
    return run();
  }, [run]);

  return flush;
};

export function useMarketTrades({ symbol, limit, marketTrade }: { symbol: string; limit: number; marketTrade: MarketTrade | undefined }) {
  console.log('marketTrade111: ', marketTrade);
  const [trades, setTrades] = useState<Trade[]>([]);

  const setFunc = useCallback(async () => {
    try {
      const res = await getMarketTrades({ symbol, limit });
      setTrades(res?.data?.rows);
    } catch (error) {}
  }, [symbol, limit]);

  useEffect(() => {
    setFunc();
  }, [setFunc, marketTrade]);

  return trades;
}

export function usePendingOrders({ symbol, refreshingTag }: { symbol: string; refreshingTag: boolean }) {
  const [liveOrders, setLiveOrders] = useState<MyOrder[]>([]);

  const { accountId } = useWalletSelector();

  const setFunc = useCallback(async () => {
    if (accountId === null) return;
    try {
      const pendingOrders = await getOpenOrders({
        accountId,
      });

      setLiveOrders(pendingOrders.data.rows);
    } catch (error) {}
  }, [refreshingTag, symbol]);

  useEffect(() => {
    setFunc();
  }, [refreshingTag, symbol, setFunc]);

  return liveOrders.filter((o) => o.symbol === symbol);
}

export function useAllOrders({ symbol, refreshingTag }: { symbol: string; refreshingTag: boolean }) {
  const [liveOrders, setLiveOrders] = useState<MyOrder[]>([]);
  console.log('liveOrders: ', liveOrders);

  const { accountId } = useWalletSelector();

  const setFunc = useCallback(async () => {
    if (accountId === null) return;
    try {
      const allOrders = await getAllOrders({
        accountId,
        OrderProps: {
          size: 200,
          symbol,
        },
      });

      setLiveOrders(allOrders);
    } catch (error) {}
  }, [refreshingTag, symbol]);

  useEffect(() => {
    setFunc();
  }, [refreshingTag, symbol, setFunc]);

  return liveOrders;
}

export function useTokenInfo() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo[]>();

  useEffect(() => {
    getOrderlyPublic('/v1/public/token').then((res) => {
      setTokenInfo(res?.data?.rows);
    });
  }, []);

  return tokenInfo;
}
