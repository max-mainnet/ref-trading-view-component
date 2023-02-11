import { getOrderlyConfig } from '../config';

// export const getOrderlyWss = () =>
//   `${getOrderlyConfig().ORDERLY_WS_ENDPOINT}/${
//     !!window.selector && window.selector.isSignedIn() ? window.selector.accountId : 'OqdphuyCtYWxwzhxyLLjOWNdFP7sQt8RPWzmb5xY'
//   }`;

export const getOrderlyWss = () =>
  `${getOrderlyConfig().ORDERLY_WS_ENDPOINT}/${
    !!window.selector && window.selector.isSignedIn() && !!window.selector.accountId
      ? window.selector.accountId
      : 'OqdphuyCtYWxwzhxyLLjOWNdFP7sQt8RPWzmb5xY'
  }`;
