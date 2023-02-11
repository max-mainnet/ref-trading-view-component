import React, { useState, useEffect, useRef } from 'react';
import { useOrderlyContext } from '../../orderly/OrderlyContext';
import { parseSymbol } from '../RecentTrade/index';
import {
  nearMetadata,
  getFTmetadata,
  orderlyViewFunction,
  ftGetBalance,
  toPrecision,
  percent,
  scientificNotationToString,
  percentOfBigNumber,
} from '../../near';
import { useWalletSelector } from '../../WalletSelectorContext';
import { depositFT, depositOrderly, registerOrderly, storageDeposit, withdrawOrderly } from '../../orderly/api';
import { getAccountInformation, getCurrentHolding, createOrder, getOrderByOrderId } from '../../orderly/off-chain-api';
import { Holding, ClientInfo, TokenInfo, TokenMetadata } from '../../orderly/type';
import { BuyButton, SellButton } from './Button';
import './index.css';
import { FaMinus, FaPlus } from 'react-icons/fa';
import Modal from 'react-modal';
import Big from 'big.js';
import { IoClose } from 'react-icons/io5';

import { IoIosArrowForward, IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { toReadableNumber } from '../../orderly/utils';
import { user_request_withdraw } from '../../orderly/on-chain-api';
import { CheckBox, ConnectWallet, TipWrapper, WithdrawButton } from '../Common';
import { orderPopUp, DepositButton } from '../Common/index';
import { useTokenBalance } from './state';
import { digitWrapper } from '../../utiles';

Modal.defaultStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    outline: 'none',
  },
  content: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -65%)',
    outline: 'none',
  },
};

const symbolsArr = ['e', 'E', '+', '-'];

export function TextWrapper({ className, value, bg, textC }: { value: string; bg?: string; textC?: string; className?: string }) {
  return <span className={`${className} px-1.5  py-0.5 rounded-md ${bg || 'bg-primary '} bg-opacity-10 ${textC || 'text-white'} `}>{value}</span>;
}

function UserBoard() {
  const { symbol, setSymbol, orders, tokenInfo, ticker, marketTrade, markPrices, balances, handlePendingOrderRefreshing } = useOrderlyContext();

  const { accountId, modal, selector } = useWalletSelector();

  const [showLimitAdvance, setShowLimitAdvance] = useState<boolean>(false);

  const [advanceLimitMode, setAdvanceLimitMode] = useState<'IOC' | 'FOK' | 'POST_ONLY'>();

  const [operationType, setOperationType] = useState<'deposit' | 'withdraw'>();

  const { symbolFrom, symbolTo } = parseSymbol(symbol);

  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy');

  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Limit');

  const [holdings, setHoldings] = useState<Holding[]>();

  const idFrom = tokenInfo && tokenInfo.find((t) => t.token === symbolFrom)?.token_account_id;

  const idTo = tokenInfo && tokenInfo.find((t) => t.token === symbolTo)?.token_account_id;

  const [operationId, setOperationId] = useState<string>(idFrom || '');

  const [iconIn, setIconIn] = useState<string>();

  const [iconOut, setIconOut] = useState<string>();

  const [inputValue, setInputValue] = useState<string>('1');

  const [limitPrice, setLimitPrice] = useState<string>(marketTrade ? marketTrade?.price?.toString() || '' : '');

  const [userInfo, setUserInfo] = useState<ClientInfo>();

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    return wallet.signOut();
  };

  const submitDisable = !inputValue || Number(inputValue) === 0 || (orderType === 'Limit' && Number(limitPrice) <= 0) || !userInfo;

  const inputLimitPriceRef = useRef<HTMLInputElement>(null);

  const inputAmountRef = useRef<HTMLInputElement>(null);

  const [tokenIn, setTokenIn] = useState<TokenMetadata>();

  const tokenFromBalance = useTokenBalance(idFrom);

  const tokenToBalance = useTokenBalance(idTo);

  useEffect(() => {
    if (!accountId) return;

    getAccountInformation({ accountId }).then((res) => {
      console.log('res: ', res);
      setUserInfo(res);
    });

    getCurrentHolding({ accountId }).then((res) => {
      setHoldings(res?.data?.holding);
    });
  }, [accountId]);

  useEffect(() => {
    if (!idFrom) return;

    if (idFrom === 'near') {
      setIconIn(nearMetadata.icon);
    } else {
      getFTmetadata(idFrom).then((res) => {
        setTokenIn(res);
        setIconIn(res.icon);
      });
    }
  }, [idFrom, symbol]);

  useEffect(() => {
    if (!idTo) return;

    if (idTo === 'near') {
      setIconOut(nearMetadata.icon);
    } else {
      getFTmetadata(idTo).then((res) => {
        setIconOut(res.icon);
      });
    }
  }, [idTo, symbol]);

  const tokenInHolding = (balances && balances[symbolFrom]?.holding) || (holdings && holdings.find((h) => h.token === symbolFrom)?.holding);

  const tokenOutHolding = (balances && balances[symbolTo]?.holding) || (holdings && holdings.find((h) => h.token === symbolTo)?.holding);

  const markPriceSymbol = markPrices && markPrices.find((m) => m.symbol === symbol);

  const fee =
    orderType === 'Limit'
      ? !userInfo || !limitPrice
        ? '-'
        : (userInfo.maker_fee_rate / 10000) * Number(limitPrice || 0) * Number(inputValue || 0)
      : !userInfo || !orders || !(side === 'Buy' ? orders.asks?.[0]?.[0] : orders?.bids?.[0]?.[0])
      ? '-'
      : (userInfo.taker_fee_rate / 10000) * Number(side === 'Buy' ? orders.asks?.[0]?.[0] : orders?.bids?.[0]?.[0] || 0) * Number(inputValue || 0);

  const total =
    orderType === 'Limit'
      ? !limitPrice || !userInfo || fee === '-'
        ? '-'
        : Number(inputValue || 0) * Number(limitPrice || 0) - Number(fee)
      : !orders || !userInfo || fee === '-' || !(side === 'Buy' ? orders.asks?.[0]?.[0] : orders?.bids?.[0]?.[0])
      ? '-'
      : Number(inputValue || 0) * Number((side === 'Buy' ? orders.asks?.[0]?.[0] : orders?.bids?.[0]?.[0]) || 0) - Number(fee);

  const handleSubmit = () => {
    if (!accountId) return;
    if (orderType === 'Market') {
      createOrder({
        accountId,
        orderlyProps: {
          side: side === 'Buy' ? 'BUY' : 'SELL',
          symbol: symbol,
          order_type: 'MARKET',
          order_quantity: inputValue,
          broker_id: 'ref_dex',
        },
      }).then(async (res) => {
        if (res.success === false) return;

        handlePendingOrderRefreshing();

        return orderPopUp({
          orderType: 'Market',
          symbolName: symbol,
          side: side,
          size: inputValue,
          tokenIn: tokenIn,
          price: markPriceSymbol?.price?.toString() || '',
        });
      });
    } else if (orderType === 'Limit') {
      createOrder({
        accountId,
        orderlyProps: {
          side: side === 'Buy' ? 'BUY' : 'SELL',
          symbol: symbol,
          order_price: limitPrice,
          order_type: typeof advanceLimitMode !== 'undefined' ? advanceLimitMode : 'LIMIT',
          order_quantity: inputValue,
          broker_id: 'ref_dex',
        },
      }).then((res) => {
        if (res.success === false) return;

        handlePendingOrderRefreshing();

        return orderPopUp({
          orderType: 'Limit',
          symbolName: symbol,
          side: side,
          size: inputValue,
          tokenIn: tokenIn,
          price: limitPrice || '',
        });
      });
    }
  };

  const isInsufficientBalance =
    side === 'Buy'
      ? new Big(total === '-' ? '0' : total).gt(tokenOutHolding || '0') || new Big(tokenOutHolding || 0).eq(0)
      : new Big(inputValue || '0').gt(tokenInHolding || '0');
  return (
    <div className='w-full p-6 relative flex flex-col  border-t border-l border-b h-screen border-boxBorder  bg-black bg-opacity-10'>
      {/* not signed in wrapper */}
      {!accountId && (
        <div
          className='absolute  flex flex-col items-center h-full w-full top-0 left-0 z-50 '
          style={{
            background: 'rgba(0, 19, 32, 0.8)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <ConnectWallet
            onClick={() => {
              modal.show();
            }}
          ></ConnectWallet>
        </div>
      )}

      <button
        onClick={() => {
          return accountId ? handleSignOut() : modal.show();
        }}
        className='text-center text-white'
      >
        {!!accountId ? accountId : 'Connect Wallet'}
      </button>

      <button
        onClick={async () => {
          if (!accountId) return;
          return await storageDeposit(accountId);
        }}
        type='button'
        className='ml-2 text-white'
      >
        storage deposit
      </button>

      <button
        onClick={async () => {
          if (!accountId) return;
          return await registerOrderly(accountId);
        }}
        type='button'
        className='ml-2 text-white'
      >
        register orderly
      </button>

      <div className='text-sm text-white font-bold mb-4 text-left flex items-center justify-between'>
        <span>Balances</span>

        <div className='flex items-center'>
          <DepositButton
            onClick={() => {
              setOperationType('deposit');
              setOperationId(idFrom || '');
            }}
          ></DepositButton>

          <WithdrawButton
            onClick={() => {
              setOperationType('withdraw');
              setOperationId(idFrom || '');
            }}
          ></WithdrawButton>
        </div>
      </div>

      <div className='grid grid-cols-4 text-sm text-primary mb-2'>
        <span className='col-span-2  justify-self-start'>Asset</span>

        <span className='justify-self-start'>Wallet</span>

        <span className='justify-self-end'>Account</span>
      </div>

      <div className='grid grid-cols-4 items-center mb-5 text-white text-sm justify-between'>
        <div className='flex items-center justify-self-start col-span-2'>
          <img src={iconIn} className='rounded-full w-6 h-6 mr-2' alt='' />
          <span>{symbolFrom}</span>
        </div>

        <div className='justify-self-start'>{!!tokenFromBalance ? digitWrapper(tokenFromBalance, 2) : '-'}</div>

        <div className='flex items-center justify-self-end'>
          <span>{tokenInHolding ? tokenInHolding.toFixed(2) : 0}</span>
        </div>
      </div>

      <div className=' items-center text-white text-sm justify-between grid grid-cols-4'>
        <div className='flex items-center justify-self-start col-span-2'>
          <img src={iconOut} className='rounded-full w-6 h-6 mr-2' alt='' />
          <span>{symbolTo}</span>
        </div>

        <div className='justify-self-start'>{!!tokenToBalance ? digitWrapper(tokenToBalance, 2) : ''}</div>

        <div className='flex items-center justify-self-end'>
          <span>{tokenOutHolding ? tokenOutHolding.toFixed(2) : 0}</span>
        </div>
      </div>

      <div className='inline-flex text-primary justify-end border-b border-white border-opacity-10 mt-3'>
        <span className='text-sm py-1.5  mb-3 px-3 rounded-lg bg-symbolHover cursor-pointer'>Sell all</span>
      </div>

      {/* sell and buy button  */}
      <div className='flex items-center justify-center mt-7'>
        <BuyButton
          onClick={() => {
            setSide('Buy');
          }}
          select={side === 'Buy'}
        />

        <SellButton
          onClick={() => {
            setSide('Sell');
          }}
          select={side === 'Sell'}
        />
      </div>

      {/*  order type  */}
      <div className='flex items-center justify-between mt-6'>
        <span className='text-sm text-primary'>Order Type</span>

        <div className='flex items-center'>
          <button
            className={`flex px-4 py-2 mr-2 rounded-lg items-center justify-center ${
              orderType === 'Limit' ? 'bg-buyGradientGreen' : 'bg-orderTypeBg'
            }`}
            onClick={() => {
              setOrderType('Limit');
            }}
            style={{
              width: '80px',
            }}
          >
            <span className={`text-sm ${orderType === 'Limit' ? 'text-white' : 'text-boxBorder'} font-bold`}>Limit</span>
          </button>

          <button
            className={`flex px-4 py-2 items-center rounded-lg justify-center ${orderType === 'Market' ? 'bg-buyGradientGreen' : 'bg-orderTypeBg'}`}
            onClick={() => {
              setOrderType('Market');
            }}
            style={{
              width: '80px',
            }}
          >
            <span className={`text-sm ${orderType === 'Market' ? 'text-white' : 'text-boxBorder'} font-bold`}>Market</span>
          </button>
        </div>
      </div>

      {/* input box */}
      <div className='w-full text-primary mt-6 bg-black text-sm bg-opacity-10 rounded-xl border border-boxBorder p-3'>
        <div className='mb-2 text-left'>{side === 'Buy' ? 'Size(Amount to buy)' : 'Size(Amount to sell)'}</div>

        <div className='flex items-center mt-2'>
          <input
            autoFocus
            inputMode='decimal'
            ref={inputAmountRef}
            onWheel={(e) => (inputAmountRef.current ? inputAmountRef.current.blur() : null)}
            className='text-white text-xl w-full'
            value={inputValue}
            type='number'
            step='any'
            min={0}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={(e) => symbolsArr.includes(e.key) && e.preventDefault()}
          />

          <span className=''>{symbolFrom}</span>
        </div>
      </div>

      {orderType === 'Limit' && (
        <div className='w-full text-primary mt-3 text-sm bg-black bg-opacity-10 rounded-xl border border-boxBorder p-3'>
          <div className='flex items-center justify-between'>
            <span>{side === 'Buy' ? 'Buy Price' : 'Sell Price'}</span>

            <span>{symbolTo}</span>
          </div>

          <div className='flex items-center mt-3'>
            <span
              className='cursor-pointer'
              onClick={() => {
                setLimitPrice(Number(limitPrice) >= 1 ? (Number(limitPrice) - 1).toString() : limitPrice);
              }}
            >
              <FaMinus></FaMinus>
            </span>
            <input
              type='number'
              step='any'
              ref={inputLimitPriceRef}
              onWheel={(e) => (inputLimitPriceRef.current ? inputLimitPriceRef.current?.blur() : null)}
              min={0}
              className='text-white text-center text-xl w-full'
              value={limitPrice}
              onChange={(e) => {
                setLimitPrice(e.target.value);
              }}
              inputMode='decimal'
              onKeyDown={(e) => symbolsArr.includes(e.key) && e.preventDefault()}
            />
            <span
              className='cursor-pointer'
              onClick={() => {
                setLimitPrice((Number(limitPrice) + 1).toString());
              }}
            >
              <FaPlus></FaPlus>
            </span>
          </div>
        </div>
      )}
      {orderType === 'Market' && (
        <div className='w-full rounded-xl border border-boxBorder p-3 mt-3 text-sm flex items-center justify-between'>
          <span className='text-primary'>{side === 'Buy' ? 'Buy Price' : 'Sell Price'}</span>

          <span className='text-white'>Market price</span>
        </div>
      )}

      {/* limit order advance mode */}

      {orderType === 'Limit' && (
        <div className='text-white text-sm mt-2'>
          <div className='flex items-center justify-between'>
            <span className='text-primary'>Advance</span>

            <span
              className={`${showLimitAdvance ? 'text-white' : 'text-primary'} cursor-pointer `}
              onClick={() => {
                setShowLimitAdvance(!showLimitAdvance);
              }}
            >
              {showLimitAdvance ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </span>
          </div>

          <div className={`flex mt-2 items-center justify-between ${showLimitAdvance ? '' : 'hidden'}`}>
            <div className='flex items-center'>
              <CheckBox
                check={advanceLimitMode === 'IOC'}
                setCheck={() => {
                  if (advanceLimitMode === 'IOC') {
                    setAdvanceLimitMode(undefined);
                  } else {
                    setAdvanceLimitMode('IOC');
                  }
                }}
              ></CheckBox>
              <span
                className='mx-2 cursor-pointer'
                onClick={() => {
                  if (advanceLimitMode === 'IOC') {
                    setAdvanceLimitMode(undefined);
                  } else {
                    setAdvanceLimitMode('IOC');
                  }
                }}
              >
                IOC
              </span>

              <TipWrapper
                id='user_board_ioc'
                tipText='Immediate-Or-Cancel is an order to buy or sell that must be filled immediately. Any portion of an IOC order that cannot be filled will be cancelled.'
              />
            </div>
            <div className='flex items-center'>
              <CheckBox
                check={advanceLimitMode === 'FOK'}
                setCheck={() => {
                  if (advanceLimitMode === 'FOK') {
                    setAdvanceLimitMode(undefined);
                  } else {
                    setAdvanceLimitMode('FOK');
                  }
                }}
              ></CheckBox>
              <span
                className='cursor-pointer mx-2'
                onClick={() => {
                  if (advanceLimitMode === 'FOK') {
                    setAdvanceLimitMode(undefined);
                  } else {
                    setAdvanceLimitMode('FOK');
                  }
                }}
              >
                FOK
              </span>

              <TipWrapper
                id='user_board_folk'
                tipText='Fill-Or-Kill is an order to buy or sell that must be executed immediately in its entirety; otherwise, the entire order will be cancelled.'
              />
            </div>
            <div className='flex items-center'>
              <CheckBox
                check={advanceLimitMode === 'POST_ONLY'}
                setCheck={() => {
                  if (advanceLimitMode === 'POST_ONLY') {
                    setAdvanceLimitMode(undefined);
                  } else {
                    setAdvanceLimitMode('POST_ONLY');
                  }
                }}
              ></CheckBox>
              <span
                className='mx-2 cursor-pointer'
                onClick={() => {
                  if (advanceLimitMode === 'POST_ONLY') {
                    setAdvanceLimitMode(undefined);
                  } else {
                    setAdvanceLimitMode('POST_ONLY');
                  }
                }}
              >
                Post-only
              </span>

              <TipWrapper
                id='user_board_post_only'
                tipText='Post Only ensures that traders can only place an order if it would be posted to the orderbook as a Maker order. An order which would be posted as a Taker order will be cancelled.'
              />
            </div>
          </div>
        </div>
      )}

      <div className='mt-6 bg-feeColor rounded-lg text-sm px-2 pt-3 relative z-10 pb-6'>
        <div className='flex items-center justify-between'>
          <span className='text-primary'>Fee </span>
          <span className='text-white'>
            {fee !== '-' ? '~' : ''} {fee === '-' ? '-' : fee.toFixed(3)} {` ${symbolTo}`}
          </span>
        </div>

        <div className='flex items-center mt-2 justify-between'>
          <span className='text-primary'>Total </span>
          <span className='text-white'>
            {total === '-' ? '-' : total.toFixed(4)} {` ${symbolTo}`}
          </span>
        </div>
      </div>

      <button
        className={`rounded-lg ${isInsufficientBalance ? 'bg-borderC' : side === 'Buy' ? 'bg-buyGradientGreen' : 'bg-sellGradientRed'} ${
          isInsufficientBalance ? 'text-primary cursor-not-allowed' : 'text-white'
        }  py-2.5 relative bottom-3  flex z-20 items-center justify-center text-base ${submitDisable ? 'opacity-60 cursor-not-allowed' : ''} `}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // handleSubmit();
          setConfirmModalOpen(true);
        }}
        disabled={submitDisable || isInsufficientBalance}
        type='button'
      >
        {isInsufficientBalance ? 'Insufficient Balance' : side}
        {` ${isInsufficientBalance ? '' : symbolFrom}`}
      </button>

      <AssetManagerModal
        isOpen={operationType === 'deposit'}
        onRequestClose={() => {
          setOperationType(undefined);
        }}
        type={operationType}
        onClick={(amount: string) => {
          if (!operationId) return;
          return depositOrderly(operationId, amount);
        }}
        tokenId={operationId}
        accountBalance={tokenInHolding || 0}
      />

      <AssetManagerModal
        isOpen={operationType === 'withdraw'}
        onRequestClose={() => {
          setOperationType(undefined);
        }}
        type={operationType}
        onClick={(amount: string) => {
          if (!operationId) return;
          return withdrawOrderly(operationId, amount);
        }}
        tokenId={operationId}
        accountBalance={tokenInHolding || 0}
      />

      <ConfirmOrderModal
        isOpen={confirmModalOpen}
        onRequestClose={() => {
          setConfirmModalOpen(false);
        }}
        symbolFrom={symbolFrom}
        symbolTo={symbolTo}
        side={side}
        quantity={inputValue}
        price={orderType === 'Limit' ? limitPrice : markPriceSymbol?.price?.toString() || '0'}
        fee={fee}
        totalCost={total}
        onClick={handleSubmit}
      ></ConfirmOrderModal>
    </div>
  );
}

function AssetManagerModal(
  props: Modal.Props & {
    type: 'deposit' | 'withdraw' | undefined;
    onClick: (amount: string) => void;
    tokenId: string | undefined;
    accountBalance: number;
    standAlone?: boolean;
  }
) {
  const { onClick, isOpen, onRequestClose, type, tokenId, accountBalance } = props;

  const [walletBalance, setWalletBalance] = useState<string>('');

  const [tokenMeta, setTokenMeta] = useState<any>();

  const [percentage, setPercentage] = useState<string>('0');

  const progressBarIndex = [0, 25, 50, 75, 100];

  useEffect(() => {
    if (!tokenId) return;
    if (tokenId === 'near') {
      setTokenMeta(nearMetadata);
    } else
      getFTmetadata(tokenId).then((meta) => {
        setTokenMeta(meta);
      });
  }, [tokenId]);

  useEffect(() => {
    if (!tokenId || !tokenMeta) return;
    ftGetBalance(tokenId).then((balance) => {
      setWalletBalance(toReadableNumber(tokenMeta.decimals, balance));
    });
  }, [tokenId, tokenMeta]);

  const [inputValue, setInputValue] = useState<string>();
  const ref = useRef<HTMLInputElement>(null);

  const rangeRef = useRef<HTMLInputElement>(null);

  const setAmountByShareFromBar = (sharePercent: string) => {
    setPercentage(sharePercent);

    const sharePercentOfValue = percentOfBigNumber(
      Number(sharePercent),
      type === 'deposit' ? walletBalance : accountBalance.toString(),
      tokenMeta.decimals
    );

    setInputValue(sharePercentOfValue);
  };

  useEffect(() => {
    if (rangeRef.current) {
      rangeRef.current.style.backgroundSize = `${percentage}% 100%`;
    }
  }, [percentage, rangeRef.current]);

  if (!tokenId || !tokenMeta) return null;

  function validation() {
    if (type === 'deposit') {
      if (tokenId === 'near' && new Big(walletBalance || 0).minus(new Big(inputValue || '0')).lt(0.25) && walletBalance !== '') {
        return false;
      }

      if (tokenId !== 'near' && new Big(walletBalance || 0).minus(new Big(inputValue || '0')).lt(0)) {
        return false;
      }
    }

    if (type === 'withdraw') {
      if (new Big(accountBalance || 0).minus(new Big(inputValue || '0')).lt(0)) {
        return false;
      }
    }

    return true;
  }

  return (
    <Modal {...props}>
      <div className=' rounded-2xl lg:w-96 xs:w-95vw gradientBorderWrapperNoShadow bg-boxBorder text-sm text-primary border '>
        <div className='px-5 py-6 flex flex-col '>
          <div className='flex items-center pb-6 justify-between'>
            <span className='text-white text-lg font-bold'>{props.type === 'deposit' ? 'Deposit' : props.type === 'withdraw' ? 'Withdraw' : ''}</span>

            <span
              className='cursor-pointer '
              onClick={(e: any) => {
                onRequestClose && onRequestClose(e);
              }}
            >
              <IoClose size={20} />
            </span>
          </div>

          <div className='flex items-center pb-3 justify-between'>
            <span>Wallet Balance</span>

            <span>{!walletBalance ? '-' : toPrecision(walletBalance || '0', 3)}</span>
          </div>

          <div className='flex items-center pb-4 justify-between'>
            <span>Account Balance</span>

            <span>{accountBalance.toFixed(3)}</span>
          </div>

          <div className='flex mb-5 items-center border border-border2 w-full bg-black bg-opacity-10 rounded-2xl px-3 py-3'>
            <input
              inputMode='decimal'
              ref={ref}
              onWheel={(e) => (ref.current ? ref.current.blur() : null)}
              className='text-white text-xl w-full'
              value={inputValue}
              type='number'
              step='any'
              min={0}
              onChange={(e) => {
                const value = e.target.value;
                setInputValue(e.target.value);

                const percentage =
                  Number(type === 'deposit' ? walletBalance : accountBalance) > 0
                    ? percent(value || '0', type === 'deposit' ? walletBalance : accountBalance.toString()).toString()
                    : '0';
                setPercentage(scientificNotationToString(percentage));
              }}
              onKeyDown={(e) => symbolsArr.includes(e.key) && e.preventDefault()}
            />

            <div
              className='rounded-3xl p-1 flex flex-shrink-0 pr-2 items-center'
              style={{
                background: 'rgba(126, 138, 147, 0.1)',
              }}
            >
              <img src={tokenMeta.icon} className='rounded-full w-6 h-6 mr-2' alt='' />
              <span className='text-white font-bold text-base'>{tokenMeta.symbol}</span>
            </div>
          </div>

          <div className='pb-8'>
            <div className='flex items-center justify-between  px-1.5 '>
              {progressBarIndex.map((index, i) => {
                return (
                  <div
                    className='flex flex-col items-center text-xs cursor-pointer w-4'
                    key={i}
                    onClick={() => {
                      setAmountByShareFromBar(index.toString());
                    }}
                  >
                    <span>{index}%</span>
                    <span>∣</span>
                  </div>
                );
              })}
            </div>

            <div className='py-1 px-1 relative'>
              <input
                ref={rangeRef}
                onChange={(e) => {
                  setAmountByShareFromBar(e.target.value);
                }}
                value={percentage}
                type='range'
                className={`w-full cursor-pointer ${type + '-bar'} remove-by-share-bar`}
                min='0'
                max='100'
                step='any'
                inputMode='decimal'
                style={{
                  backgroundSize: `${percentage}% 100%`,
                }}
              />

              <div
                className={`rangeText rounded-lg absolute py-0.5 text-xs ${
                  type === 'withdraw' ? 'text-white' : 'text-black'
                }  font-bold text-center w-10`}
                style={{
                  background: type === 'withdraw' ? '#4627FF' : '#00C6A2',
                  left: `calc(${percentage}% - 40px * ${percentage} / 100)`,
                  //   transform: `translateX(-${Number(percentage)}%)`,
                  position: 'absolute',
                  top: '20px',
                }}
              >
                {Math.floor(Number(percentage))}%
              </div>
            </div>
          </div>
          {type === 'deposit' && !validation() && <div className='text-warn mb-2'>0.25 NEAR locked in wallet for covering transaction fee</div>}

          <button
            className={`flex ${
              !validation() ? 'opacity-70 cursor-not-allowed' : ''
            } items-center justify-center  font-bold text-base text-white py-2.5 rounded-lg ${
              type === 'deposit' ? 'bg-primaryGradient' : 'bg-withdrawPurple'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!inputValue) return;
              onClick(inputValue);
            }}
            disabled={!validation()}
          >
            {type === 'deposit' ? 'Deposit' : type === 'withdraw' ? 'Withdraw' : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmOrderModal(
  props: Modal.Props & {
    symbolFrom: string;
    symbolTo: string;
    side: 'Buy' | 'Sell';
    quantity: string;
    price: string;
    fee: '-' | number;
    totalCost: number | '-';
    onClick: () => void;
  }
) {
  const { onRequestClose, symbolFrom, symbolTo, side, quantity, price, fee, totalCost, onClick } = props;

  return (
    <Modal {...props}>
      <div className=' rounded-2xl lg:w-80 xs:w-95vw gradientBorderWrapperNoShadow bg-boxBorder text-sm text-primary border '>
        <div className='px-5 py-6 flex flex-col '>
          <div className='flex items-center pb-6 justify-between'>
            <span className='text-white text-lg font-bold'>Confirm Order</span>

            <span
              className='cursor-pointer '
              onClick={(e: any) => {
                onRequestClose && onRequestClose(e);
              }}
            >
              <IoClose size={20} />
            </span>
          </div>

          <div className='flex items-center mb-5 justify-between'>
            <span>Limit Order</span>

            <span className='flex'>
              <TextWrapper
                textC={side === 'Buy' ? 'text-buyGreen' : 'text-sellRed'}
                bg={side === 'Buy' ? 'bg-buyGreen' : 'bg-sellRed'}
                value={side}
              ></TextWrapper>
            </span>
          </div>

          <div className='flex items-center mb-5 justify-between'>
            <span>Qty.</span>

            <span className='flex items-center'>
              <span className='text-white mr-2'>{quantity}</span>

              <TextWrapper value={symbolFrom}></TextWrapper>
            </span>
          </div>

          <div className='flex items-center mb-5 justify-between'>
            <span>Price</span>

            <span className='flex items-center'>
              <span className='text-white mr-2'>{price}</span>
              <TextWrapper value={`${symbolTo}/${symbolFrom}`}></TextWrapper>
            </span>
          </div>

          <div className='flex items-center mb-5 justify-between'>
            <span>Fee</span>

            <span className='flex items-center'>
              <span className='text-white mr-2'>{fee === '-' ? '-' : digitWrapper(fee.toString(), 3)}</span>
              <TextWrapper value={`${symbolTo}`}></TextWrapper>
            </span>
          </div>

          <div className='flex items-center mb-5 justify-between'>
            <span className=''>Total cost</span>

            <span className='flex '>
              <span className='text-white mr-2'>{totalCost === '-' ? '-' : digitWrapper(totalCost.toString(), 3)}</span>
              <TextWrapper value={`${symbolTo}`}></TextWrapper>
            </span>
          </div>

          <button
            className='rounded-lg flex items-center justify-center py-3 bg-greenPurpleGradient text-base text-white font-bold'
            onClick={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
              onClick();
              onRequestClose && onRequestClose(e);
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default UserBoard;
