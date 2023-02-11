import React, { useState, useEffect } from 'react';
import { TokenInfo, TokenMetadata } from '../../orderly/type';
import { getFTmetadata } from '../../near';

export function useTokenMetaFromSymbol(symbol: string, tokenInfo: TokenInfo[] | undefined) {
  console.log('symbol: ', symbol);
  console.log('tokenInfo: ', tokenInfo);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata>();

  useEffect(() => {
    if (!symbol || !tokenInfo) return;

    const token = tokenInfo && tokenInfo.find((t) => t.token === symbol);
    console.log('tokenInfo: ', tokenInfo);

    if (!token?.token_account_id) return;

    getFTmetadata(token.token_account_id).then((t) => {
      console.log('t: ', t);
      setTokenMetadata({
        ...t,
        ...token,
      });
    });
  }, [symbol, tokenInfo]);

  return tokenMetadata;
}
