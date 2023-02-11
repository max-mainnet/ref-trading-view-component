import React, { useCallback, useEffect, useState } from 'react';

export function NearIcon() {
  return (
    <svg width='18' height='16' viewBox='0 0 18 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        fill-rule='evenodd'
        clip-rule='evenodd'
        d='M2.84211 3.21939V12.483L7.57895 8.94375L8.05263 9.35915L4.08047 14.954C2.6046 16.308 0 15.3919 0 13.5188V2.08119C0 0.143856 2.75709 -0.738591 4.18005 0.743292L15.1579 12.1757V3.29212L10.8947 6.4513L10.4211 6.03589L13.7996 0.813295C15.2097 -0.696027 18 0.178427 18 2.12967V13.3139C18 15.2512 15.2429 16.1336 13.8199 14.6518L2.84211 3.21939Z'
        fill='white'
      />
    </svg>
  );
}

export function OrderStateOutline() {
  return (
    <svg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <circle cx='7' cy='7' r='6' stroke='#62C440' stroke-width='1.4' stroke-dasharray='1.4 1.4' />
    </svg>
  );
}

export function GrayBgBox(props: any) {
  return (
    <svg width='90' height='26' viewBox='0 0 90 26' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M0 6C0 2.68629 2.68629 0 6 0H85.8366C88.7333 0 90.6696 2.98345 89.4898 5.6291L81.463 23.6291C80.8199 25.0711 79.3887 26 77.8097 26H5.99999C2.68629 26 0 23.3137 0 20V6Z'
        fill='#213A4D'
      />
    </svg>
  );
}

export function ArrowCurve() {
  return (
    <svg width='8' height='10' viewBox='0 0 8 10' fill='none' className='ml-1' xmlns='http://www.w3.org/2000/svg'>
      <path d='M1 9C1.33333 7.16667 3 3 7 1M7 1H2.5M7 1V5.25' stroke='white' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' />
    </svg>
  );
}

export function OrderSmile(props: any) {
  return (
    <svg className='relative z-10' width='16' height='14' viewBox='0 0 16 14' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        fill-rule='evenodd'
        clip-rule='evenodd'
        d='M7.05882 14C3.16034 14 0 10.866 0 7C0 3.13401 3.16034 0 7.05882 0C10.0621 0 12.6273 1.85996 13.6471 4.48168C13.951 5.26313 16 7 16 7C16 7 13.951 8.73687 13.6471 9.51832C12.6273 12.14 10.0621 14 7.05882 14ZM8.38964 8.56407C8.6304 8.22701 9.09881 8.14894 9.43587 8.3897C9.77293 8.63045 9.851 9.09887 9.61024 9.43593C9.22385 9.97688 8.1575 10.75 6.49994 10.75C4.84238 10.75 3.77603 9.97688 3.38964 9.43593C3.14888 9.09887 3.22695 8.63045 3.56401 8.3897C3.90107 8.14894 4.36948 8.22701 4.61024 8.56407C4.70004 8.68979 5.30036 9.25 6.49994 9.25C7.69952 9.25 8.29984 8.68979 8.38964 8.56407ZM10 5C10 4.44772 9.55228 4 9 4C8.44772 4 8 4.44772 8 5V6C8 6.55228 8.44772 7 9 7C9.55228 7 10 6.55228 10 6V5ZM4 4C4.55228 4 5 4.44772 5 5V6C5 6.55228 4.55228 7 4 7C3.44772 7 3 6.55228 3 6V5C3 4.44772 3.44772 4 4 4Z'
        fill='#00C6A2'
      />
    </svg>
  );
}
