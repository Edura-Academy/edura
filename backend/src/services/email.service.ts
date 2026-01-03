import { Resend } from 'resend';
import dotenv from 'dotenv';

// Ensure env variables are loaded
dotenv.config();

// Resend API Key - .env dosyasından alınır
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Varsayılan gönderen e-posta (Resend'de doğrulanmış domain gerekir)
// Test için onboarding@resend.dev kullanılabilir
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Edura <onboarding@resend.dev>';

// E-posta şablonları
interface EmailTemplate {
  subject: string;
  html: string;
}

// Yeni ödev bildirimi şablonu
const newHomeworkTemplate = (data: {
  ogrenciAd: string;
  dersAd: string;
  odevBaslik: string;
  sonTeslimTarihi: string;
  ogretmenAd: string;
}): EmailTemplate => ({
  subject: `📝 Yeni Ödev: ${data.odevBaslik}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Yeni Ödev</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📝 Yeni Ödev</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 16px;">Merhaba <strong>${data.ogrenciAd}</strong>,</p>
        <p style="font-size: 16px;"><strong>${data.dersAd}</strong> dersi için yeni bir ödev verildi.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 10px 0; color: #667eea;">${data.odevBaslik}</h3>
          <p style="margin: 5px 0; color: #666;">
            <strong>📅 Son Teslim:</strong> ${data.sonTeslimTarihi}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>👨‍🏫 Öğretmen:</strong> ${data.ogretmenAd}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">Ödevinizi zamanında teslim etmeyi unutmayın!</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tr/ogrenci/odevler" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            Ödevleri Görüntüle
          </a>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
        Bu e-posta Edura Kurs Takip Sistemi tarafından gönderilmiştir.
      </p>
    </body>
    </html>
  `
});

// Ödev değerlendirme bildirimi şablonu
const homeworkGradedTemplate = (data: {
  ogrenciAd: string;
  odevBaslik: string;
  puan: number;
  maxPuan: number;
  ogretmenYorumu?: string;
}): EmailTemplate => ({
  subject: `📊 Ödeviniz Değerlendirildi: ${data.odevBaslik}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ödev Değerlendirildi</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📊 Ödev Değerlendirildi</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 16px;">Merhaba <strong>${data.ogrenciAd}</strong>,</p>
        <p style="font-size: 16px;"><strong>"${data.odevBaslik}"</strong> ödeviniz değerlendirildi.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <div style="font-size: 48px; font-weight: bold; color: ${data.puan >= data.maxPuan * 0.7 ? '#11998e' : data.puan >= data.maxPuan * 0.5 ? '#f39c12' : '#e74c3c'};">
            ${data.puan}
          </div>
          <div style="font-size: 18px; color: #666;">/ ${data.maxPuan}</div>
          <div style="margin-top: 10px; padding: 8px 16px; border-radius: 20px; display: inline-block; background: ${data.puan >= data.maxPuan * 0.7 ? '#d4edda' : data.puan >= data.maxPuan * 0.5 ? '#fff3cd' : '#f8d7da'}; color: ${data.puan >= data.maxPuan * 0.7 ? '#155724' : data.puan >= data.maxPuan * 0.5 ? '#856404' : '#721c24'};">
            ${data.puan >= data.maxPuan * 0.7 ? '🎉 Başarılı!' : data.puan >= data.maxPuan * 0.5 ? '📈 Geçer' : '📚 Daha çok çalışmalısın'}
          </div>
        </div>
        
        ${data.ogretmenYorumu ? `
        <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #11998e;">
          <p style="margin: 0; font-style: italic; color: #666;">"${data.ogretmenYorumu}"</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">— Öğretmen Yorumu</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tr/ogrenci/odevler" 
             style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            Tüm Ödevleri Görüntüle
          </a>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
        Bu e-posta Edura Kurs Takip Sistemi tarafından gönderilmiştir.
      </p>
    </body>
    </html>
  `
});

// Son teslim hatırlatma şablonu
const deadlineReminderTemplate = (data: {
  ogrenciAd: string;
  odevBaslik: string;
  dersAd: string;
  kalanSure: string;
}): EmailTemplate => ({
  subject: `⏰ Ödev Hatırlatma: ${data.odevBaslik}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ödev Hatırlatma</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Ödev Hatırlatma</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 16px;">Merhaba <strong>${data.ogrenciAd}</strong>,</p>
        <p style="font-size: 16px;">Henüz teslim etmediğiniz bir ödeviniz var!</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f5576c;">
          <h3 style="margin: 0 0 10px 0; color: #f5576c;">${data.odevBaslik}</h3>
          <p style="margin: 5px 0; color: #666;">
            <strong>📚 Ders:</strong> ${data.dersAd}
          </p>
          <p style="margin: 5px 0; color: #e74c3c; font-weight: bold;">
            <strong>⏰ Kalan Süre:</strong> ${data.kalanSure}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tr/ogrenci/odevler" 
             style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            Ödevi Teslim Et
          </a>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
        Bu e-posta Edura Kurs Takip Sistemi tarafından gönderilmiştir.
      </p>
    </body>
    </html>
  `
});

// Email servis sınıfı
class EmailService {
  private enabled: boolean;

  constructor() {
    this.enabled = !!process.env.RESEND_API_KEY;
    if (!this.enabled) {
      console.warn('⚠️ RESEND_API_KEY tanımlı değil - E-posta servisi devre dışı');
    } else {
      console.log('✅ E-posta servisi aktif');
    }
  }

  // Genel e-posta gönderme
  async send(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.enabled || !resend) {
      console.log(`📧 [MOCK] E-posta gönderildi: ${to} - ${template.subject}`);
      return true;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject: template.subject,
        html: template.html,
      });

      if (error) {
        console.error('E-posta gönderme hatası:', error);
        return false;
      }

      console.log(`✅ E-posta gönderildi: ${to} - ID: ${data?.id}`);
      return true;
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
      return false;
    }
  }

  // Toplu e-posta gönderme
  async sendBulk(recipients: string[], template: EmailTemplate): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const to of recipients) {
      const result = await this.send(to, template);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  // Yeni ödev bildirimi
  async sendNewHomeworkNotification(
    ogrenciEmail: string,
    data: {
      ogrenciAd: string;
      dersAd: string;
      odevBaslik: string;
      sonTeslimTarihi: string;
      ogretmenAd: string;
    }
  ): Promise<boolean> {
    const template = newHomeworkTemplate(data);
    return this.send(ogrenciEmail, template);
  }

  // Ödev değerlendirme bildirimi
  async sendHomeworkGradedNotification(
    ogrenciEmail: string,
    data: {
      ogrenciAd: string;
      odevBaslik: string;
      puan: number;
      maxPuan: number;
      ogretmenYorumu?: string;
    }
  ): Promise<boolean> {
    const template = homeworkGradedTemplate(data);
    return this.send(ogrenciEmail, template);
  }

  // Son teslim hatırlatması
  async sendDeadlineReminder(
    ogrenciEmail: string,
    data: {
      ogrenciAd: string;
      odevBaslik: string;
      dersAd: string;
      kalanSure: string;
    }
  ): Promise<boolean> {
    const template = deadlineReminderTemplate(data);
    return this.send(ogrenciEmail, template);
  }
}

// Singleton instance
export const emailService = new EmailService();
export default emailService;

