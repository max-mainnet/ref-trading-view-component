import { ec } from 'elliptic';
import { near, config, orderlyViewFunction, keyStore } from '../near';
import getConfig from '../config';
import bs58 from 'bs58';
import { base_decode, base_encode } from 'near-api-js/lib/utils/serialize';
import keccak256 from 'keccak256';
import { Buffer } from 'buffer';
import { KeyPair, keyStores } from 'near-api-js';
import { NotSignInError } from './error';

export const get_orderly_private_key_path = (accountId: string) => `orderly-trading-key-private:${accountId}${getConfig().networkId}`;

export const get_orderly_public_key_path = (accountId: string) => `orderly-trading-key-public:${accountId}${getConfig().networkId}`;

export const STORAGE_TO_REGISTER_WITH_MFT = '0.1';

export type OFF_CHAIN_METHOD = 'POST' | 'GET' | 'DELETE' | 'PUT';

export const generateTradingKeyPair = () => {
  const EC = new ec('secp256k1');
  const keyPair = EC.genKeyPair();

  const accountId = window.selector.store.getState().accounts?.[0]?.accountId;

  if (!accountId) throw NotSignInError;

  localStorage.setItem(get_orderly_private_key_path(accountId), keyPair.getPrivate().toString('hex'));

  localStorage.setItem(get_orderly_public_key_path(accountId), keyPair.getPublic().encode('hex', false).replace('04', ''));

  return {
    privateKey: keyPair.getPrivate().toString('hex'),
    publicKey: keyPair.getPublic().encode('hex', false),
    keyPair,
  };
};

export const getNormalizeTradingKey = () => {
  const tradingKeyPair = generateTradingKeyPair();

  const pubKeyAsHex = tradingKeyPair.publicKey.replace('04', '');
  const normalizeTradingKey = window.btoa(keccak256(pubKeyAsHex).toString('hex'));

  return normalizeTradingKey;
};

// call to set trading_key
// await contract.user_request_set_trading_key({ key: normalizeTradingKey });

export const find_orderly_functionCall_key = async (accountId: string) => {
  const nearConnection = await near.account(accountId);

  const allKeys = await nearConnection.getAccessKeys();

  const orderlyKey = allKeys.find(
    (key) => key.access_key.permission !== 'FullAccess' && key.access_key.permission.FunctionCall.receiver_id === config.ORDERLY_ASSET_MANAGER
  );

  return orderlyKey;
};

export const getPublicKey = async (accountId: string) => {
  const publicKey = (await keyStore.getKey(getConfig().networkId, accountId)).getPublicKey().toString();

  return publicKey;
};

export const getLocalPrivateKey = (accountId: string, prefix: string = 'near-api-js') => {
  return localStorage.getItem(`${prefix}:keystore:${accountId}:${getConfig().networkId}`);
};

// get signature function

export const generateMessage = (time_stamp: number, method: OFF_CHAIN_METHOD | undefined, url: string | null, body: object | null) => {
  return !!body ? `${time_stamp}${method || ''}${url || ''}${JSON.stringify(body)}` : `${time_stamp}${method || ''}${url || ''}`;
};

export const generateRequestSignatureHeader = async ({
  accountId,
  time_stamp,
  url,
  body,
  method,
}: {
  accountId: string;
  time_stamp: number;
  url: string | null;
  body: object | null;
  method?: OFF_CHAIN_METHOD;
}) => {
  const message = generateMessage(time_stamp, method, url, body);

  console.log({
    message,
  });

  const keyStore = new keyStores.BrowserLocalStorageKeyStore();

  const keyPair = await keyStore.getKey(getConfig().networkId, accountId);

  // const publicKeyBytes = bs58.decode(publicKey.replace('ed25519:', ''));

  // const privateKeyBytes = bs58.decode(privateKey.replace('ed25519:', ''));

  const signature = keyPair.sign(Buffer.from(message)).signature;

  // return atob(signature.toString());

  return new Buffer(signature).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
};

export const generateOrderSignature = (accountId: string, message: string) => {
  const msgHash = new Buffer(keccak256(message)).toString('hex');
  console.log('msgHash: ', msgHash);

  const priKey = localStorage.getItem(get_orderly_private_key_path(accountId));

  if (!priKey) {
    alert('Please generate trading key first');
    return;
  }

  const EC = new ec('secp256k1');

  const keyPair = EC.keyFromPrivate(priKey, 'hex');

  // console.log(pubKey, keyPair.getPublic().encode('hex', false));

  const signature = keyPair.sign(msgHash, 'hex', { canonical: true });
  console.log(
    'signature: ',
    signature.r.toString('hex'),
    signature.r.toString('hex').length,

    signature.s.toString('hex'),
    signature.s.toString('hex').length,
    signature.recoveryParam
  );

  const finalSignature = signature.r.toString('hex', 64) + signature.s.toString('hex', 64) + '0' + signature.recoveryParam;

  return finalSignature;
};

export const formateParams = (props: object) => {
  const message = Object.entries(props)
    .filter(([k, v], i) => {
      return v !== undefined && v !== null;
    })
    .map(([k, v], i) => {
      if (typeof v === 'number') {
        return `${k}=${parseFloat(v.toString())}`;
      }
      return `${k}=${v}`;
    })
    .sort()
    .join('&');

  return message;
};

export const formateParamsNoSorting = (props: object) => {
  const message = Object.entries(props)
    .filter(([k, v], i) => {
      return v !== undefined && v !== null;
    })
    .map(([k, v], i) => {
      if (typeof v === 'number') {
        return `${k}=${parseFloat(v.toString())}`;
      }
      return `${k}=${v}`;
    })
    .join('&');

  return message;
};

export const toReadableNumber = (decimals: number, number: string = '0'): string => {
  if (!decimals) return number;

  const wholeStr = number.substring(0, number.length - decimals) || '0';
  const fractionStr = number
    .substring(number.length - decimals)
    .padStart(decimals, '0')
    .substring(0, decimals);

  return `${wholeStr}.${fractionStr}`.replace(/\.?0+$/, '');
};

export const toNonDivisibleNumber = (decimals: number, number: string): string => {
  if (decimals === null || decimals === undefined) return number;
  const [wholePart, fracPart = ''] = number.split('.');

  return `${wholePart}${fracPart.padEnd(decimals, '0').slice(0, decimals)}`.replace(/^0+/, '').padStart(1, '0');
};
