import Iyzipay from 'iyzipay';

// iyzico Sandbox konfigürasyonu
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-wbwpzKIiplZxI3hh5ALI4FJyAcZKL6kq',
  uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com'
});

export interface PaymentCard {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  registerCard?: number;
}

export interface Buyer {
  id: string;
  name: string;
  surname: string;
  gsmNumber?: string;
  email: string;
  identityNumber: string;
  lastLoginDate?: string;
  registrationDate?: string;
  registrationAddress: string;
  ip: string;
  city: string;
  country: string;
  zipCode?: string;
}

export interface Address {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
}

export interface BasketItem {
  id: string;
  name: string;
  category1: string;
  category2?: string;
  itemType: 'PHYSICAL' | 'VIRTUAL';
  price: string;
}

export interface PaymentRequest {
  locale?: string;
  conversationId: string;
  price: string;
  paidPrice: string;
  currency?: string;
  installment?: number;
  basketId: string;
  paymentChannel?: string;
  paymentGroup?: string;
  paymentCard: PaymentCard;
  buyer: Buyer;
  shippingAddress: Address;
  billingAddress: Address;
  basketItems: BasketItem[];
  callbackUrl?: string;
}

export interface ThreedsInitRequest extends PaymentRequest {
  callbackUrl: string;
}

class IyzicoService {
  /**
   * Tekil ödeme (3D Secure olmadan)
   */
  async createPayment(request: PaymentRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const paymentRequest = {
        locale: request.locale || Iyzipay.LOCALE.TR,
        conversationId: request.conversationId,
        price: request.price,
        paidPrice: request.paidPrice,
        currency: request.currency || Iyzipay.CURRENCY.TRY,
        installment: request.installment || 1,
        basketId: request.basketId,
        paymentChannel: request.paymentChannel || Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: request.paymentGroup || Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: request.paymentCard,
        buyer: request.buyer,
        shippingAddress: request.shippingAddress,
        billingAddress: request.billingAddress,
        basketItems: request.basketItems
      };

      iyzipay.payment.create(paymentRequest, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 3D Secure ile ödeme başlatma
   */
  async initThreedsPayment(request: ThreedsInitRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const initRequest = {
        locale: request.locale || Iyzipay.LOCALE.TR,
        conversationId: request.conversationId,
        price: request.price,
        paidPrice: request.paidPrice,
        currency: request.currency || Iyzipay.CURRENCY.TRY,
        installment: request.installment || 1,
        basketId: request.basketId,
        paymentChannel: request.paymentChannel || Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: request.paymentGroup || Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: request.callbackUrl,
        paymentCard: request.paymentCard,
        buyer: request.buyer,
        shippingAddress: request.shippingAddress,
        billingAddress: request.billingAddress,
        basketItems: request.basketItems
      };

      iyzipay.threedsInitialize.create(initRequest, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 3D Secure ödeme tamamlama
   */
  async completeThreedsPayment(paymentId: string, conversationId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || '',
        paymentId: paymentId
      };

      iyzipay.threedsPayment.create(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Ödeme sorgulama
   */
  async retrievePayment(paymentId: string, paymentConversationId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: paymentConversationId || '',
        paymentId: paymentId
      };

      iyzipay.payment.retrieve(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * İade işlemi
   */
  async refundPayment(paymentTransactionId: string, price: string, ip: string, conversationId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || '',
        paymentTransactionId: paymentTransactionId,
        price: price,
        ip: ip
      };

      iyzipay.refund.create(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * İptal işlemi
   */
  async cancelPayment(paymentId: string, ip: string, conversationId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || '',
        paymentId: paymentId,
        ip: ip
      };

      iyzipay.cancel.create(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Taksit seçeneklerini getir
   */
  async getInstallmentInfo(binNumber: string, price: string, conversationId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || '',
        binNumber: binNumber,
        price: price
      };

      iyzipay.installmentInfo.retrieve(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * BIN kontrolü (kart ilk 6 hane)
   */
  async checkBIN(binNumber: string, conversationId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || '',
        binNumber: binNumber
      };

      iyzipay.binNumber.retrieve(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Test kartları (Sandbox)
   */
  getTestCards() {
    return {
      success: {
        cardNumber: '5528790000000008',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        cardHolderName: 'John Doe'
      },
      threeds: {
        cardNumber: '4603450000000000',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        cardHolderName: 'John Doe'
      },
      fail: {
        cardNumber: '5400360000000003',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        cardHolderName: 'John Doe'
      }
    };
  }
}

export const iyzicoService = new IyzicoService();

