declare module 'iyzipay' {
  export interface IyzipayConfig {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface Iyzipay {
    payment: {
      create: (request: any, callback: (err: Error | null, result: any) => void) => void;
      retrieve: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    threedsInitialize: {
      create: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    threedsPayment: {
      create: (request: any, callback: (err: Error | null, result: any) => void) => void;
      retrieve: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    refund: {
      create: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    cancel: {
      create: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    installmentInfo: {
      retrieve: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    checkoutFormInitialize: {
      create: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    checkoutForm: {
      retrieve: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
    binNumber: {
      retrieve: (request: any, callback: (err: Error | null, result: any) => void) => void;
    };
  }

  interface IyzipayStatic {
    new(config: IyzipayConfig): Iyzipay;
    LOCALE: {
      TR: string;
      EN: string;
    };
    CURRENCY: {
      TRY: string;
      EUR: string;
      USD: string;
      GBP: string;
    };
    PAYMENT_CHANNEL: {
      WEB: string;
      MOBILE: string;
      MOBILE_WEB: string;
      MOBILE_IOS: string;
      MOBILE_ANDROID: string;
      MOBILE_WINDOWS: string;
      MOBILE_TABLET: string;
      MOBILE_PHONE: string;
    };
    PAYMENT_GROUP: {
      PRODUCT: string;
      LISTING: string;
      SUBSCRIPTION: string;
    };
    BASKET_ITEM_TYPE: {
      PHYSICAL: string;
      VIRTUAL: string;
    };
  }

  const Iyzipay: IyzipayStatic;
  export default Iyzipay;
  export = Iyzipay;
}
