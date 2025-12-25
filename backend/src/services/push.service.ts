import { admin, firebaseEnabled } from '../config/firebase';
import prisma from '../lib/prisma';

// Push notification payload tipi
interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  click_action?: string;
  data?: Record<string, string>;
}

// Push servis sınıfı
class PushNotificationService {
  private enabled: boolean;
  private messaging: admin.messaging.Messaging | null;

  constructor() {
    this.enabled = firebaseEnabled;
    this.messaging = this.enabled ? admin.messaging() : null;
    
    if (!this.enabled) {
      console.warn('⚠️ Firebase FCM devre dışı - Push notification servisi mock modunda');
    } else {
      console.log('✅ Push notification servisi aktif');
    }
  }

  // Tek bir cihaza push gönder
  async sendToDevice(fcmToken: string, payload: PushPayload): Promise<boolean> {
    if (!this.enabled || !this.messaging) {
      console.log(`📱 [MOCK] Push gönderildi: ${payload.title} - ${payload.body}`);
      return true;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        webpush: {
          notification: {
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
          },
          fcmOptions: {
            link: payload.click_action || '/',
          },
        },
        data: payload.data,
      };

      const response = await this.messaging.send(message);
      console.log(`✅ Push gönderildi: ${response}`);
      return true;
    } catch (error: any) {
      // Token geçersizse veritabanından sil
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        await this.removeInvalidToken(fcmToken);
      }
      console.error('Push gönderme hatası:', error);
      return false;
    }
  }

  // Birden fazla cihaza push gönder
  async sendToDevices(fcmTokens: string[], payload: PushPayload): Promise<{ success: number; failed: number }> {
    if (!this.enabled || !this.messaging || fcmTokens.length === 0) {
      console.log(`📱 [MOCK] Toplu push gönderildi: ${fcmTokens.length} cihaz`);
      return { success: fcmTokens.length, failed: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        webpush: {
          notification: {
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
          },
          fcmOptions: {
            link: payload.click_action || '/',
          },
        },
        data: payload.data,
      };

      const response = await this.messaging.sendEachForMulticast(message);
      
      // Başarısız token'ları temizle
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          if (resp.error.code === 'messaging/invalid-registration-token' ||
              resp.error.code === 'messaging/registration-token-not-registered') {
            failedTokens.push(fcmTokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        await this.removeInvalidTokens(failedTokens);
      }

      console.log(`✅ Toplu push: ${response.successCount} başarılı, ${response.failureCount} başarısız`);
      return { success: response.successCount, failed: response.failureCount };
    } catch (error) {
      console.error('Toplu push gönderme hatası:', error);
      return { success: 0, failed: fcmTokens.length };
    }
  }

  // Kullanıcıya push gönder (veritabanından token'ı alır)
  async sendToUser(userId: string, payload: PushPayload): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (!user?.fcmToken) {
      console.log(`ℹ️ Kullanıcı ${userId} için FCM token bulunamadı`);
      return false;
    }

    return this.sendToDevice(user.fcmToken, payload);
  }

  // Birden fazla kullanıcıya push gönder
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<{ success: number; failed: number }> {
    const users = await prisma.user.findMany({
      where: { 
        id: { in: userIds },
        fcmToken: { not: null }
      },
      select: { fcmToken: true }
    });

    const tokens = users
      .map(u => u.fcmToken)
      .filter((token): token is string => token !== null);

    if (tokens.length === 0) {
      console.log('ℹ️ Gönderilecek FCM token bulunamadı');
      return { success: 0, failed: userIds.length };
    }

    return this.sendToDevices(tokens, payload);
  }

  // Geçersiz token'ı veritabanından sil
  private async removeInvalidToken(fcmToken: string): Promise<void> {
    try {
      await prisma.user.updateMany({
        where: { fcmToken },
        data: { fcmToken: null }
      });
      console.log(`🗑️ Geçersiz FCM token silindi`);
    } catch (error) {
      console.error('Token silme hatası:', error);
    }
  }

  // Birden fazla geçersiz token'ı sil
  private async removeInvalidTokens(fcmTokens: string[]): Promise<void> {
    try {
      await prisma.user.updateMany({
        where: { fcmToken: { in: fcmTokens } },
        data: { fcmToken: null }
      });
      console.log(`🗑️ ${fcmTokens.length} geçersiz FCM token silindi`);
    } catch (error) {
      console.error('Toplu token silme hatası:', error);
    }
  }

  // ==================== HAZIR BİLDİRİM METODLARI ====================

  // Yeni ödev bildirimi
  async notifyNewHomework(
    ogrenciIds: string[],
    data: { dersAd: string; odevBaslik: string; sonTeslimTarihi: string }
  ): Promise<{ success: number; failed: number }> {
    return this.sendToUsers(ogrenciIds, {
      title: '📝 Yeni Ödev',
      body: `${data.dersAd}: ${data.odevBaslik}`,
      click_action: '/tr/ogrenci/odevler',
      data: {
        type: 'NEW_HOMEWORK',
        dersAd: data.dersAd,
        odevBaslik: data.odevBaslik,
        sonTeslimTarihi: data.sonTeslimTarihi
      }
    });
  }

  // Ödev değerlendirme bildirimi
  async notifyHomeworkGraded(
    ogrenciId: string,
    data: { odevBaslik: string; puan: number; maxPuan: number }
  ): Promise<boolean> {
    return this.sendToUser(ogrenciId, {
      title: '📊 Ödev Değerlendirildi',
      body: `"${data.odevBaslik}" - Puanınız: ${data.puan}/${data.maxPuan}`,
      click_action: '/tr/ogrenci/odevler',
      data: {
        type: 'HOMEWORK_GRADED',
        odevBaslik: data.odevBaslik,
        puan: String(data.puan),
        maxPuan: String(data.maxPuan)
      }
    });
  }

  // Ödev teslim bildirimi (öğretmene)
  async notifyHomeworkSubmitted(
    ogretmenId: string,
    data: { ogrenciAd: string; odevBaslik: string }
  ): Promise<boolean> {
    return this.sendToUser(ogretmenId, {
      title: '📥 Yeni Ödev Teslimi',
      body: `${data.ogrenciAd} - "${data.odevBaslik}"`,
      click_action: '/tr/personel/odevler',
      data: {
        type: 'HOMEWORK_SUBMITTED',
        ogrenciAd: data.ogrenciAd,
        odevBaslik: data.odevBaslik
      }
    });
  }

  // Son teslim hatırlatması
  async notifyDeadlineReminder(
    ogrenciId: string,
    data: { odevBaslik: string; kalanSure: string }
  ): Promise<boolean> {
    return this.sendToUser(ogrenciId, {
      title: '⏰ Ödev Hatırlatma',
      body: `"${data.odevBaslik}" - ${data.kalanSure} kaldı!`,
      click_action: '/tr/ogrenci/odevler',
      data: {
        type: 'DEADLINE_REMINDER',
        odevBaslik: data.odevBaslik,
        kalanSure: data.kalanSure
      }
    });
  }
}

// Singleton instance
export const pushService = new PushNotificationService();
export default pushService;

