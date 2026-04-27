import localFont from 'next/font/local';

export const kalpurush = localFont({
  src: [
    {
      path: '../public/fonts/kalpurush.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-kalpurush',
});