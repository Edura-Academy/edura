import { Response } from 'express';
import prisma from '../lib/prisma';
import { Role, ConversationType, MessageStatus } from '@prisma/client';
import { AuthRequest } from '../types';

// ==================== KONUŞMALAR ====================

// Kullanıcının tüm konuşmalarını getir
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        uyeler: {
          some: { userId }
        }
      },
      include: {
        uyeler: {
          include: {
            user: {
              select: { id: true, ad: true, soyad: true, role: true, brans: true }
            }
          }
        },
        mesajlar: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            gonderen: {
              select: { id: true, ad: true, soyad: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Okunmamış mesaj sayısını hesapla
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            gonderenId: { not: userId },
            durum: MessageStatus.OKUNMADI,
            okuyanlar: {
              none: { userId }
            }
          }
        });

        return {
          ...conv,
          okunmamis: unreadCount,
          sonMesaj: conv.mesajlar[0] || null
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Konuşmalar alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Yeni konuşma oluştur veya mevcut olanı getir (1-1 için)
export const createOrGetConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { targetUserId, tip = 'OZEL' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Hedef kullanıcı ID gerekli' });
    }

    // 1-1 konuşma için mevcut olanı bul
    if (tip === 'OZEL') {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          tip: ConversationType.OZEL,
          AND: [
            { uyeler: { some: { userId } } },
            { uyeler: { some: { userId: targetUserId } } }
          ]
        },
        include: {
          uyeler: {
            include: {
              user: { select: { id: true, ad: true, soyad: true, role: true, brans: true } }
            }
          }
        }
      });

      if (existingConversation) {
        return res.json(existingConversation);
      }
    }

    // Yeni konuşma oluştur
    const conversation = await prisma.conversation.create({
      data: {
        tip: tip as ConversationType,
        olusturanId: userId,
        uyeler: {
          create: [
            { userId, rolAd: 'admin' },
            { userId: targetUserId, rolAd: 'uye' }
          ]
        }
      },
      include: {
        uyeler: {
          include: {
            user: { select: { id: true, ad: true, soyad: true, role: true, brans: true } }
          }
        }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Konuşma oluşturulurken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// ==================== MESAJLAR ====================

// Konuşmadaki mesajları getir
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    // Kullanıcının bu konuşmaya erişimi var mı kontrol et
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Bu konuşmaya erişim izniniz yok' });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        silindi: false,
        ...(before ? { createdAt: { lt: new Date(before as string) } } : {})
      },
      include: {
        gonderen: {
          select: { id: true, ad: true, soyad: true, role: true, brans: true }
        },
        okuyanlar: {
          select: { userId: true, okunmaTarihi: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    // Mesajları okundu olarak işaretle
    const unreadMessageIds = messages
      .filter(m => m.gonderenId !== userId && !m.okuyanlar.some(o => o.userId === userId))
      .map(m => m.id);

    if (unreadMessageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessageIds.map(mesajId => ({
          mesajId,
          userId
        })),
        skipDuplicates: true
      });
    }

    res.json(messages.reverse()); // Eski mesajlar önce
  } catch (error) {
    console.error('Mesajlar alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Mesaj gönder
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { icerik, baslik, dosyaUrl, dosyaTip, yanitladigiMesajId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    if (!icerik?.trim()) {
      return res.status(400).json({ error: 'Mesaj içeriği gerekli' });
    }

    // Kullanıcının bu konuşmaya erişimi var mı kontrol et
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Bu konuşmaya mesaj gönderme izniniz yok' });
    }

    // Mesajı oluştur
    const message = await prisma.message.create({
      data: {
        conversationId,
        gonderenId: userId,
        icerik: icerik.trim(),
        baslik,
        dosyaUrl,
        dosyaTip,
        yanitladigiMesajId
      },
      include: {
        gonderen: {
          select: { id: true, ad: true, soyad: true, role: true, brans: true }
        }
      }
    });

    // Konuşmanın updatedAt'ini güncelle
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Diğer üyelere bildirim gönder
    const otherMembers = await prisma.conversationMember.findMany({
      where: {
        conversationId,
        userId: { not: userId },
        seslesiz: false
      },
      select: { userId: true }
    });

    if (otherMembers.length > 0) {
      await prisma.notification.createMany({
        data: otherMembers.map(member => ({
          userId: member.userId,
          tip: 'BILDIRIM',
          baslik: 'Yeni Mesaj',
          mesaj: `${message.gonderen.ad} ${message.gonderen.soyad}: ${icerik.substring(0, 50)}${icerik.length > 50 ? '...' : ''}`
        }))
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Mesaj gönderilirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Mesajı okundu olarak işaretle
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    // Konuşmadaki okunmamış mesajları bul
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        gonderenId: { not: userId },
        okuyanlar: {
          none: { userId }
        }
      },
      select: { id: true }
    });

    // Tümünü okundu olarak işaretle
    if (unreadMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessages.map(m => ({
          mesajId: m.id,
          userId
        })),
        skipDuplicates: true
      });
    }

    res.json({ success: true, markedCount: unreadMessages.length });
  } catch (error) {
    console.error('Mesajlar okundu işaretlenirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// ==================== GRUP KONUŞMALARI ====================

// Sınıf grubu oluştur/getir
export const getOrCreateClassGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sinifId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    // Mevcut sınıf grubunu bul
    let classGroup = await prisma.conversation.findFirst({
      where: {
        tip: ConversationType.SINIF,
        sinifId
      },
      include: {
        uyeler: {
          include: {
            user: { select: { id: true, ad: true, soyad: true, role: true } }
          }
        }
      }
    });

    if (!classGroup) {
      // Sınıf bilgilerini al
      const sinif = await prisma.sinif.findUnique({
        where: { id: sinifId },
        include: {
          ogrenciler: { select: { id: true } },
          dersler: {
            include: { ogretmen: { select: { id: true } } }
          }
        }
      });

      if (!sinif) {
        return res.status(404).json({ error: 'Sınıf bulunamadı' });
      }

      // Sınıf grubunu oluştur
      const ogretmenIds = [...new Set(sinif.dersler.map(d => d.ogretmen.id))];
      const ogrenciIds = sinif.ogrenciler.map(o => o.id);

      classGroup = await prisma.conversation.create({
        data: {
          tip: ConversationType.SINIF,
          ad: `${sinif.ad} Sınıf Grubu`,
          sinifId,
          olusturanId: userId,
          uyeler: {
            create: [
              ...ogretmenIds.map(id => ({ userId: id, rolAd: 'ogretmen' })),
              ...ogrenciIds.map(id => ({ userId: id, rolAd: 'ogrenci' }))
            ]
          }
        },
        include: {
          uyeler: {
            include: {
              user: { select: { id: true, ad: true, soyad: true, role: true } }
            }
          }
        }
      });
    }

    res.json(classGroup);
  } catch (error) {
    console.error('Sınıf grubu oluşturulurken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};
