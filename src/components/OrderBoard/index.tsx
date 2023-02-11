import React, { useCallback, useEffect, useState } from 'react';
import { useOrderlyContext } from '../../orderly/OrderlyContext';
import { FlexRow, FlexRowBetween } from '../Common';
import { parseSymbol } from '../RecentTrade';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import { MyOrder, EditOrderlyOrder, orderStatus, OrderTrade } from '../../orderly/type';
import { OrderStateOutline } from '../Common/Icons';
import { useAllOrders } from '../../orderly/state';
import { TextWrapper } from '../UserBoard';
import Big from 'big.js';

import moment from 'moment';

import { AiOutlineClose, AiOutlineCheck } from 'react-icons/ai';
import { FlexRowStart } from '../Common/index';
import { cancelOrder, cancelOrders, editOrder, getOrderTrades } from '../../orderly/off-chain-api';
import { useWalletSelector } from '../../WalletSelectorContext';

function CancelButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      className='px-1.5 rounded-lg py-1 flex items-center border border-warn justify-center cursor-pointer text-warn border-warn'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {text}
    </button>
  );
}

function formatTimeDate(ts: number) {
  return moment(ts).format('YYYY-MM-DD HH:mm:ss');
}

function Selector({
  list,
  selected,
  setSelect,
}: {
  list: { text: JSX.Element | string; textId: string; className?: string }[];
  selected: string;
  setSelect: (value: any) => void;
}) {
  return (
    <div className='absolute top-6 z-50'>
      <div className='flex flex-col min-w-p90  items-start py-2 px-2 rounded-lg border border-borderC text-sm  bg-darkBg'>
        {list.map((item, index) => {
          return (
            <div
              className={`whitespace-nowrap cursor-pointer min-w-fit my-0.5 text-left pl-2 py-1 w-full rounded-md ${item.className} ${
                selected === item.textId ? 'bg-symbolHover2' : ''
              } hover:bg-symbolHover2 `}
              key={item.textId + index}
              onClick={() => {
                setSelect(item.textId);
              }}
            >
              {item.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderLine({ order }: { order: MyOrder }) {
  const [quantity, setQuantity] = useState<string>(order.quantity.toString());

  const { accountId } = useWalletSelector();

  const { handlePendingOrderRefreshing } = useOrderlyContext();

  const [price, setPrice] = useState<string>(order.price.toString());

  const [openEditQuantity, setOpenEditQuantity] = useState<boolean>(false);

  const [openEditPrice, setOpenEditPrice] = useState<boolean>(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const inputRefPrice = React.useRef<HTMLInputElement>(null);

  function handleEditOrder() {
    if (!accountId) return;

    if (new Big(order.price).eq(new Big(price)) && new Big(order.quantity).eq(new Big(quantity))) return;

    return editOrder({
      accountId,
      orderlyProps: {
        order_id: order.order_id,
        order_price: price,
        symbol: order.symbol,
        side: order.side,
        order_quantity: quantity,
        order_type: order.type,
      },
    }).then((res) => {
      if (!!res.success) {
        handlePendingOrderRefreshing();
      }
    });
  }

  return (
    <div key={order.order_id} className='grid hover:bg-orderLineHover grid-cols-12 pl-5 pr-4 py-2 border-t border-white border-opacity-10'>
      <FlexRow className='relative col-span-1'>
        <span>Limit</span>

        <div
          className='flex items-center relative ml-1.5 justify-center'
          style={{
            height: '14px',
            width: '14px',
          }}
        >
          <div className='absolute top-0 left-0  '>
            <OrderStateOutline />
          </div>

          <div
            className=''
            style={{
              height: '9px',
              width: '9px',
            }}
          >
            {order.status === 'PARTIAL_FILLED' && (
              <CircularProgressbar
                styles={buildStyles({
                  pathColor: '#62C340',
                  strokeLinecap: 'butt',
                  trailColor: 'transparent',
                })}
                background={false}
                strokeWidth={50}
                value={order.executed}
                maxValue={order.quantity}
              />
            )}
          </div>
        </div>
      </FlexRow>

      <FlexRow className='col-span-1'>
        <TextWrapper
          className='px-2 text-sm'
          value={order.side === 'BUY' ? 'Buy' : 'Sell'}
          bg={order.side === 'BUY' ? 'bg-buyGreen' : 'bg-sellRed'}
          textC={order.side === 'BUY' ? 'text-buyGreen' : 'text-sellRed'}
        ></TextWrapper>
      </FlexRow>

      <FlexRowStart className='col-span-2 items-start'>
        <div className='flex flex-col overflow-hidden bg-dark2 rounded-lg border border-border2 text-sm  w-14 text-white'>
          <input
            ref={inputRef}
            inputMode='decimal'
            type={'number'}
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
            }}
            onFocus={() => {
              setOpenEditQuantity(true);
            }}
            className='px-2 py-1 text-center'
          />

          <div className={`relative pb-2 top-2 w-full flex items-center border-t border-border2 text-primary ${openEditQuantity ? '' : 'hidden'} `}>
            <div
              className='w-1/2 border-r border-border2 flex items-center py-1 justify-center cursor-pointer'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenEditQuantity(false);
              }}
            >
              <AiOutlineClose></AiOutlineClose>
            </div>

            <div
              className='w-1/2 flex items-center justify-center cursor-pointer py-1'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditOrder();
                setOpenEditQuantity(false);
              }}
            >
              <AiOutlineCheck></AiOutlineCheck>
            </div>
          </div>
        </div>

        <span className='mx-1 relative top-1.5'>/</span>

        <span className='relative top-1.5'>{order.executed}</span>
      </FlexRowStart>

      <FlexRowStart className='col-span-2 items-start'>
        <div className='flex flex-col overflow-hidden bg-dark2 rounded-lg border border-border2 text-sm  w-14 text-white'>
          <input
            ref={inputRefPrice}
            inputMode='decimal'
            type={'number'}
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
            }}
            onFocus={() => {
              setOpenEditPrice(true);
            }}
            className='px-2 py-1 text-center'
          />

          <div className={`relative pb-2 top-2 w-full flex items-center border-t border-border2 text-primary ${openEditPrice ? '' : 'hidden'} `}>
            <div
              className='w-1/2 border-r border-border2 flex items-center py-1 justify-center cursor-pointer'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenEditPrice(false);
              }}
            >
              <AiOutlineClose></AiOutlineClose>
            </div>

            <div
              className='w-1/2 relative z-50 flex items-center justify-center cursor-pointer py-1'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditOrder();
                setOpenEditPrice(false);
              }}
            >
              <AiOutlineCheck></AiOutlineCheck>
            </div>
          </div>
        </div>
      </FlexRowStart>

      <FlexRow className='col-span-2 text-white ml-6'>
        <span>{order.status === 'PARTIAL_FILLED' ? order.average_executed_price.toFixed(2) : order.price.toFixed(2)}</span>
      </FlexRow>

      <FlexRow className='col-span-1 text-white ml-4'>
        {new Big(quantity || '0').times(new Big(order.status === 'PARTIAL_FILLED' ? order.average_executed_price : order.price)).toFixed(2)}
      </FlexRow>

      <FlexRow className='col-span-2 text-primary'>{formatTimeDate(order.created_time)}</FlexRow>

      <FlexRow className='col-span-1 '>
        <CancelButton
          text='Cancel'
          onClick={() => {
            if (!accountId) return;
            cancelOrder({
              accountId,
              DeleteParams: {
                order_id: order.order_id,
                symbol: order.symbol,
              },
            }).then((res) => {
              if (res.success === true) {
                handlePendingOrderRefreshing();
              }
            });
          }}
        />
      </FlexRow>
    </div>
  );
}

function HistoryOrderLine({ order, symbol }: { order: MyOrder; symbol: string }) {
  const [openFilledDetail, setOpenFilledDetail] = useState<boolean>(false);

  const [orderTradesHistory, setOrderTradesHistory] = useState<OrderTrade[]>();

  const { accountId } = useWalletSelector();

  const { symbolFrom, symbolTo } = parseSymbol(symbol);

  async function handleSubmit() {
    if (!!orderTradesHistory) {
      setOpenFilledDetail(!openFilledDetail);
      return;
    }
    if (!accountId) return;

    const res = await getOrderTrades({
      accountId,
      order_id: order.order_id,
    });
    if (!res.success) {
      return;
    }

    setOrderTradesHistory(res.data.rows);
    setOpenFilledDetail(!openFilledDetail);
  }

  return (
    <div className='hover:bg-orderLineHover'>
      <div key={order.order_id} className='grid  grid-cols-12 pl-5 pr-4 py-2 border-t border-white border-opacity-10'>
        <FlexRow className='relative col-span-1'>
          <span>{order.type === 'MARKET' ? 'Market' : 'Limit'}</span>
        </FlexRow>

        <FlexRow className='col-span-1'>
          <TextWrapper
            className='px-2 text-sm'
            value={order.side === 'BUY' ? 'Buy' : 'Sell'}
            bg={order.side === 'BUY' ? 'bg-buyGreen' : 'bg-sellRed'}
            textC={order.side === 'BUY' ? 'text-buyGreen' : 'text-sellRed'}
          ></TextWrapper>
        </FlexRow>

        <FlexRowStart className='col-span-2 ml-4 items-start'>
          <span className='text-white'>{order.quantity}</span>

          <span className='mx-1 '>/</span>

          <span className=''>{order.executed}</span>
        </FlexRowStart>

        <FlexRowStart className='col-span-2 ml-4 items-start'>
          <span>{order.type === 'MARKET' ? '-' : order.price}</span>
        </FlexRowStart>

        <FlexRow className='col-span-2 ml-6 text-white'>
          <span>{order.status !== 'FILLED' ? '-' : order.average_executed_price}</span>
        </FlexRow>

        <FlexRow className='col-span-1 ml-4 text-white'>
          {new Big(order.quantity || '0')
            .times(new Big(order.average_executed_price || '0'))
            .minus(order.total_fee)
            .toFixed(2)}
        </FlexRow>

        <FlexRow className='col-span-2 text-primary'>{formatTimeDate(order.created_time)}</FlexRow>

        <FlexRow className='col-span-1 text-white'>
          <div className='flex items-center justify-center'>
            <span className='capitalize'>{order.status.toLowerCase()}</span>
            {order.status === 'FILLED' && (
              <div
                className={`cursor-pointer  rounded-full  ml-2 ${
                  openFilledDetail ? 'bg-baseGreen' : 'bg-dark3'
                }  w-3 h-3 flex items-center justify-center`}
                onClick={() => {
                  handleSubmit();
                }}
              >
                <div className='transform scale-95'>
                  <MdArrowDropDown
                    size={22}
                    color={openFilledDetail ? '#1C272F' : '#17252E'}
                    className={`${openFilledDetail ? 'transform rotate-180' : ''} `}
                  ></MdArrowDropDown>
                </div>
              </div>
            )}
          </div>
        </FlexRow>
      </div>

      {openFilledDetail && orderTradesHistory && (
        <div className='flex flex-col items-end w-full mb-3'>
          <div className='w-10/12 border-b border-white border-opacity-10 pb-2'></div>
          <div className='grid grid-cols-11  border-white mt-2 pb-3 pt-1 border-opacity-10 w-10/12 '>
            <div className='col-span-1 text-right'>Qty{`(${symbolFrom})`}</div>
            <div className='col-span-1'></div>

            <div className='col-span-1 text-right'>
              Price
              {`(${symbolTo})`}
            </div>
            <div className='col-span-1'></div>

            <div className='col-span-1 text-right'>
              Fee
              {`(${symbolTo})`}
            </div>
            <div className='col-span-1'></div>

            <div className='col-span-1 text-right'>
              Total
              {`(${symbolTo})`}
            </div>

            <div className='col-span-1'></div>

            <div className=' col-span-2'>Time</div>

            <div className='col-span-1'></div>
          </div>
          <div className='w-10/12'>
            {orderTradesHistory.map((trade) => (
              <div
                key={order.order_id + '_' + trade.id}
                className='text-white  pb-2 grid-cols-11 grid'
                style={{
                  height: '30px',
                }}
              >
                <div className='col-span-1 text-right'>{trade.executed_quantity}</div>
                <div className='col-span-1'></div>
                <div className='col-span-1 text-right'>{trade.executed_price}</div>
                <div className='col-span-1'></div>
                <div className='col-span-1 text-right'>{trade.fee}</div>
                <div className='col-span-1'></div>
                <div className='col-span-1 text-right'>
                  {new Big(trade.executed_quantity || '0')
                    .times(new Big(trade.executed_price || '0'))
                    .minus(trade.fee)
                    .toFixed(2)}
                </div>

                <div className='col-span-1'></div>

                <div className='col-span-2 text-primary pr-6 relative right-10'>{formatTimeDate(trade.executed_timestamp)}</div>

                <div className='col-span-1'></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OpenOrders({
  orders,
  symbol,
  hidden,
  setOpenCount,
}: {
  orders: MyOrder[];
  symbol: string;
  hidden?: boolean;

  setOpenCount: (c: number) => void;
}) {
  const { symbolFrom, symbolTo } = parseSymbol(symbol);

  const [showSideSelector, setShowSideSelector] = useState<boolean>(false);

  const [chooseSide, setChooseSide] = useState<'Both' | 'Buy' | 'Sell'>('Both');

  const [timeSorting, setTimeSorting] = useState<'asc' | 'dsc'>();

  const sortingFunc = (a: MyOrder, b: MyOrder) => {
    if (timeSorting === 'asc') {
      return a.created_time - b.created_time;
    } else {
      return b.created_time - a.created_time;
    }
  };

  const filterFunc = (order: MyOrder) => {
    if (chooseSide === 'Both') return true;

    return order.side.toLowerCase() === chooseSide.toLowerCase();
  };

  useEffect(() => {
    if (showSideSelector)
      document.addEventListener('click', () => {
        setShowSideSelector(false);
      });
  }, [showSideSelector]);

  useEffect(() => {
    if (!orders) return;

    setOpenCount(orders.filter(filterFunc).length);
  }, [chooseSide, !!orders]);

  if (hidden) return null;

  return (
    <>
      {/* Header */}
      <div className='grid grid-cols-12 pl-5 pr-4 py-2 border-b   border-white border-opacity-10'>
        <FlexRow className='col-span-1'>Type</FlexRow>

        <FlexRow className='col-span-1  relative'>
          <div
            className='cursor-pointer flex items-center'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSideSelector(!showSideSelector);
            }}
          >
            <span>Side</span>

            <MdArrowDropDown size={22} color={showSideSelector ? 'white' : '#7E8A93'} />
          </div>

          {showSideSelector && (
            <Selector
              selected={chooseSide}
              setSelect={setChooseSide}
              list={[
                {
                  text: 'Both',
                  textId: 'Both',
                  className: 'text-white',
                },
                {
                  text: 'Buy',
                  textId: 'Buy',
                  className: 'text-buyGreen',
                },
                {
                  text: 'Sell',
                  textId: 'Sell',
                  className: 'text-sellRed',
                },
              ]}
            />
          )}
        </FlexRow>

        <FlexRow className='col-span-2'>
          <span>Qty/Filled</span>

          <span
            className='ml-1.5 rounded
            px-1 bg-symbolHover
          
          '
            style={{
              fontSize: '10px',
            }}
          >
            {symbolFrom}
          </span>
        </FlexRow>

        <FlexRow className='col-span-2'>
          <span>Price</span>

          <span
            className='ml-1.5 rounded
            px-1 bg-symbolHover
          
          '
            style={{
              fontSize: '10px',
            }}
          >
            {symbolTo}
          </span>
        </FlexRow>

        <FlexRow className='col-span-2'>
          <span>Avg. Price</span>

          <span
            className='ml-1.5 rounded
            px-1 bg-symbolHover
          
          '
            style={{
              fontSize: '10px',
            }}
          >
            {symbolTo}
          </span>
        </FlexRow>
        <FlexRow className='col-span-1'>
          <span>Est. Total</span>
        </FlexRow>

        <FlexRow className=' flex items-center justify-center col-span-2 '>
          <div
            className='cursor-pointer flex'
            onClick={() => {
              setTimeSorting(timeSorting === 'asc' ? 'dsc' : 'asc');
            }}
          >
            <span>Time</span>
            {
              <MdArrowDropDown
                className={timeSorting === 'asc' ? 'transform rotate-180' : ''}
                size={22}
                color={timeSorting === undefined ? '#7e8a93' : 'white'}
              />
            }
          </div>
        </FlexRow>

        <FlexRow className='col-span-1'>
          <span>Actions</span>
        </FlexRow>
      </div>
      <div
        className='flex flex-col overflow-auto'
        style={{
          height: 'calc(100vh - 750px)',
        }}
      >
        {orders
          .sort(sortingFunc)
          .filter(filterFunc)
          .map((order) => {
            return <OrderLine order={order} key={order.order_id} />;
          })}
      </div>
    </>
  );
}

function HistoryOrders({
  orders,
  symbol,
  hidden,
  setHistoryCount,
}: {
  orders: MyOrder[];
  symbol: string;
  hidden?: boolean;

  setHistoryCount: (c: number) => void;
}) {
  const { symbolFrom, symbolTo } = parseSymbol(symbol);

  const [showSideSelector, setShowSideSelector] = useState<boolean>(false);

  const [showStatuesSelector, setShowStatuesSelector] = useState<boolean>(false);

  const [chooseSide, setChooseSide] = useState<'Both' | 'Buy' | 'Sell'>('Both');

  const [chooseType, setChooseType] = useState<'All Type' | 'Limit Order' | 'Market Order'>('All Type');

  const [chooseStatus, setChooseStatus] = useState<'All Status' | 'Cancelled' | 'Filled' | 'Rejected'>('All Status');

  const [showTypeSelector, setShowTypeSelector] = useState<boolean>(false);

  const [timeSorting, setTimeSorting] = useState<'asc' | 'dsc'>();

  const sortingFunc = (a: MyOrder, b: MyOrder) => {
    if (timeSorting === 'asc') {
      return a.created_time - b.created_time;
    } else {
      return b.created_time - a.created_time;
    }
  };

  const filterFunc = (order: MyOrder) => {
    const side = chooseSide === 'Both' || order.side.toLowerCase() === chooseSide.toLowerCase();

    const type =
      chooseType === 'All Type' ||
      (order.type === 'MARKET' && chooseType === 'Market Order') ||
      (order.type === 'LIMIT' && chooseType === 'Limit Order');

    const status = chooseStatus === 'All Status' || order.status.toLowerCase() === chooseStatus.toLowerCase();

    return side && type && status;
  };

  useEffect(() => {
    if (!orders) return;

    setHistoryCount(orders.filter(filterFunc).length);
  }, [chooseSide, chooseType, chooseStatus, !!orders]);

  useEffect(() => {
    if (showSideSelector || showTypeSelector || showStatuesSelector)
      document.addEventListener('click', () => {
        setShowSideSelector(false);
        setShowTypeSelector(false);

        setShowStatuesSelector(false);
      });
  }, [showSideSelector, showTypeSelector, showStatuesSelector]);

  if (hidden) return null;

  return (
    <>
      {/* Header */}
      <div className='grid grid-cols-12 pl-5 pr-4 py-2 border-b   border-white border-opacity-10'>
        <FlexRow className='col-span-1 relative'>
          <div
            className='cursor-pointer flex items-center'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTypeSelector(!showTypeSelector);
            }}
          >
            <span>Type</span>

            <MdArrowDropDown size={22} color={showTypeSelector ? 'white' : '#7E8A93'} />
          </div>
          {showTypeSelector && (
            <Selector
              selected={chooseType}
              setSelect={setChooseType}
              list={[
                {
                  text: 'All Type',
                  textId: 'All Type',
                  className: 'text-white',
                },
                {
                  text: 'Limit Order',
                  textId: 'Limit Order',
                  className: 'text-white',
                },
                {
                  text: 'Market Order',
                  textId: 'Market Order',
                  className: 'text-white',
                },
              ]}
            />
          )}
        </FlexRow>

        <FlexRow className='col-span-1  relative'>
          <div
            className='cursor-pointer flex items-center'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSideSelector(!showSideSelector);
            }}
          >
            <span>Side</span>

            <MdArrowDropDown size={22} color={showSideSelector ? 'white' : '#7E8A93'} />
          </div>

          {showSideSelector && (
            <Selector
              selected={chooseSide}
              setSelect={setChooseSide}
              list={[
                {
                  text: 'Both',
                  textId: 'Both',
                  className: 'text-white',
                },
                {
                  text: 'Buy',
                  textId: 'Buy',
                  className: 'text-buyGreen',
                },
                {
                  text: 'Sell',
                  textId: 'Sell',
                  className: 'text-sellRed',
                },
              ]}
            />
          )}
        </FlexRow>

        <FlexRow className='col-span-2'>
          <span>Qty/Filled</span>

          <span
            className='ml-1.5 rounded
            px-1 bg-symbolHover
          '
            style={{
              fontSize: '10px',
            }}
          >
            {symbolFrom}
          </span>
        </FlexRow>

        <FlexRow className='col-span-2'>
          <span>Price</span>

          <span
            className='ml-1.5 rounded
            px-1 bg-symbolHover
          
          '
            style={{
              fontSize: '10px',
            }}
          >
            {symbolTo}
          </span>
        </FlexRow>

        <FlexRow className='col-span-2'>
          <span>Avg. Price</span>

          <span
            className='ml-1.5 rounded
            px-1 bg-symbolHover
          
          '
            style={{
              fontSize: '10px',
            }}
          >
            {symbolTo}
          </span>
        </FlexRow>
        <FlexRow className='col-span-1'>
          <span>Est. Total</span>
        </FlexRow>

        <FlexRow className='justify-center col-span-2 '>
          <div
            className='cursor-pointer flex'
            onClick={() => {
              setTimeSorting(timeSorting === 'asc' ? 'dsc' : 'asc');
            }}
          >
            <span>Time</span>
            {
              <MdArrowDropDown
                className={timeSorting === 'asc' ? 'transform rotate-180' : ''}
                size={22}
                color={timeSorting === undefined ? '#7e8a93' : 'white'}
              />
            }
          </div>
        </FlexRow>

        <FlexRow className='col-span-1 relative'>
          <div
            className='cursor-pointer flex items-center'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowStatuesSelector(!showStatuesSelector);
            }}
          >
            <span>Status</span>

            <MdArrowDropDown size={22} color={showStatuesSelector ? 'white' : '#7E8A93'} />
          </div>

          {showStatuesSelector && (
            <Selector
              selected={chooseStatus}
              setSelect={setChooseStatus}
              list={[
                {
                  text: 'All Status',
                  textId: 'All Status',
                  className: 'text-white',
                },
                {
                  text: 'Filled',
                  textId: 'Filled',
                  className: 'text-white',
                },
                {
                  text: 'Cancelled',
                  textId: 'Cancelled',
                  className: 'text-white',
                },
                {
                  text: 'Rejected',
                  textId: 'Rejected',
                  className: 'text-white',
                },
              ]}
            />
          )}
        </FlexRow>
      </div>
      <div
        className='flex flex-col overflow-auto'
        style={{
          height: 'calc(100vh - 750px)',
        }}
      >
        {orders
          .sort(sortingFunc)
          .filter(filterFunc)
          .map((order) => {
            return <HistoryOrderLine symbol={symbol} order={order} key={order.order_id} />;
          })}
      </div>
    </>
  );
}

function OrderBoard() {
  const { symbol, allOrders, handlePendingOrderRefreshing } = useOrderlyContext();

  const { accountId } = useWalletSelector();

  //   const allOrders = useAllOrders({ symbol, refreshingTag: false });

  const [tab, setTab] = useState<'open' | 'history'>('open');

  const openOrders = allOrders.filter((o) => {
    return o.type === 'LIMIT' && (o.status === 'NEW' || o.status === 'PARTIAL_FILLED');
  });

  // get history orders, which is orders that are not open orders
  const historyOrders = allOrders.filter((o) => {
    return openOrders.map((o) => o.order_id).indexOf(o.order_id) === -1;
  });

  const [openCount, setOpenCount] = useState<number>(openOrders.length);

  const [historyCount, setHistoryCount] = useState<number>(historyOrders.length);

  useEffect(() => {
    setOpenCount(openOrders.length);

    setHistoryCount(historyOrders.length);
  }, [allOrders]);

  return (
    <div className='rounded-2xl border text-primary border-boxBorder    w-full text-sm bg-black  bg-opacity-10 py-4'>
      <FlexRowBetween className='pb-3  pl-5 pr-3 border-boxBorder'>
        <FlexRow className='min-h-8'>
          <FlexRow
            onClick={() => {
              setTab('open');
            }}
            className='justify-center cursor-pointer'
          >
            <span className={tab === 'open' ? 'text-white' : 'text-primary'}>Open Orders</span>

            <span
              className={`flex items-center justify-center h-4 px-1.5 min-w-fit text-xs rounded-md  ml-2 ${
                tab === 'open' ? 'bg-baseGreen text-black' : 'text-primary bg-symbolHover'
              } `}
            >
              {openCount === undefined ? openOrders.length : openCount}
            </span>
          </FlexRow>

          <FlexRow
            onClick={() => {
              setTab('history');
            }}
            className='justify-center ml-12 cursor-pointer'
          >
            <span className={tab === 'history' ? 'text-white' : 'text-primary'}>History</span>

            <span
              className={`flex items-center justify-center px-1.5 min-w-fit w-4 text-xs rounded-md  ml-2 ${
                tab === 'history' ? 'bg-grayBgLight text-white' : 'text-primary bg-symbolHover'
              } `}
            >
              {historyCount === undefined ? historyOrders.length : historyCount}
            </span>
          </FlexRow>
        </FlexRow>

        {tab === 'open' && !!openCount && (
          <CancelButton
            text='Cancel All'
            onClick={() => {
              if (!accountId) return;

              return cancelOrders({
                accountId,
                DeleteParams: {
                  symbol,
                },
              }).then((res) => {
                if (res.success === true) {
                  handlePendingOrderRefreshing();
                }
              });
            }}
          />
        )}
      </FlexRowBetween>
      {<OpenOrders orders={openOrders} setOpenCount={setOpenCount} symbol={symbol} hidden={tab === 'history'} />}
      {<HistoryOrders setHistoryCount={setHistoryCount} orders={historyOrders} symbol={symbol} hidden={tab === 'open'} />}
    </div>
  );
}

export default OrderBoard;
