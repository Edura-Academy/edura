import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { ConversationType } from '@prisma/client';
import { pushService } from '../services/push.service';
import { socketService, SocketEvents } from '../services/socket.service';

// Kullanıcının tüm konuşmalarını getir
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // Kullanıcının üye olduğu tüm konuşmaları getir
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
              select: {
                id: true,
                ad: true,
                soyad: true,
                role: true,
                brans: true,
              }
            }
          }
        },
        mesajlar: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            gonderen: {
              select: {
                id: true,
                ad: true,
                soyad: true,
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Her konuşma için okunmamış mesaj sayısını hesapla
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const member = conv.uyeler.find(u => u.userId === userId);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            gonderenId: { not: userId },
            okuyanlar: {
              none: { userId }
            },
            silindi: false
          }
        });

        return {
          id: conv.id,
          tip: conv.tip,
          ad: conv.ad || (conv.tip === 'OZEL' 
            ? conv.uyeler.find(u => u.userId !== userId)?.user.ad + ' ' + conv.uyeler.find(u => u.userId !== userId)?.user.soyad
            : 'Konuşma'),
          resimUrl: conv.resimUrl,
          sonMesaj: conv.mesajlar[0] ? {
            icerik: conv.mesajlar[0].icerik,
            gonderenAd: conv.mesajlar[0].gonderen.ad,
            tarih: conv.mesajlar[0].createdAt
          } : null,
          okunmamis: unreadCount,
          uyeler: conv.uyeler.map(u => ({
            id: u.user.id,
            ad: u.user.ad + ' ' + u.user.soyad,
            rol: u.user.role,
            brans: u.user.brans,
            grupRol: u.rolAd,
            online: socketService.isUserOnline(u.user.id) // 🔌 Real-time online durumu
          })),
          sabitle: member?.sabitle || false,
          seslesiz: member?.seslesiz || false,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithUnread
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Konuşmalar alınamadı' });
  }
};

// Konuşmanın mesajlarını getir
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // Kullanıcının bu konuşmaya üye olduğunu kontrol et
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Bu konuşmaya erişim yetkiniz yok' });
      return;
    }

    // Konuşmanın toplam üye sayısını al
    const memberCount = await prisma.conversationMember.count({
      where: { conversationId }
    });

    // Mesajları getir
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        silindi: false,
        ...(before ? { createdAt: { lt: new Date(before as string) } } : {})
      },
      include: {
        gonderen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            role: true,
          }
        },
        okuyanlar: {
          select: {
            userId: true,
            okunmaTarihi: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: Number(limit)
    });

    // Mesajları okundu olarak işaretle
    const unreadMessageIds = messages
      .filter(m => m.gonderenId !== userId && !m.okuyanlar.some(o => o.userId === userId))
      .map(m => m.id);

    if (unreadMessageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessageIds.map(mesajId => ({
          mesajId,
          userId,
        })),
        skipDuplicates: true
      });
    }

    res.json({
      success: true,
      data: messages.map(m => {
        // Gönderen hariç diğer üyelerin tamamı okudu mu?
        // Okuyanlar sayısı >= (toplam üye - 1 gönderen) ise herkes okumuş demektir
        const okuyanlarSayisi = m.okuyanlar.length;
        const gerekliOkumaSayisi = memberCount - 1; // gönderen hariç
        const tumuyelerOkudu = okuyanlarSayisi >= gerekliOkumaSayisi;
        
        return {
          id: m.id,
          gonderenId: m.gonderenId,
          gonderenAd: m.gonderen.ad + ' ' + m.gonderen.soyad,
          gonderenRol: m.gonderen.role,
          icerik: m.icerik,
          dosyaUrl: m.dosyaUrl,
          dosyaTip: m.dosyaTip,
          tarih: m.createdAt,
          okundu: tumuyelerOkudu, // Tüm üyeler okuduysa true
          okuyanlarSayisi,
          toplamUyeSayisi: memberCount,
          duzenlendi: m.duzenlendi,
        };
      })
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Mesajlar alınamadı' });
  }
};

// Mesaj gönder
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { icerik, dosyaUrl, dosyaTip, yanitladigiMesajId } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    if (!icerik?.trim()) {
      res.status(400).json({ success: false, error: 'Mesaj içeriği gerekli' });
      return;
    }

    // Kullanıcının bu konuşmaya üye olduğunu kontrol et
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Bu konuşmaya erişim yetkiniz yok' });
      return;
    }

    // Mesajı oluştur
    const message = await prisma.message.create({
      data: {
        conversationId,
        gonderenId: userId,
        icerik: icerik.trim(),
        dosyaUrl,
        dosyaTip,
        yanitladigiMesajId,
      },
      include: {
        gonderen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            role: true,
          }
        }
      }
    });

    // Konuşmanın updatedAt'ini güncelle
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Gönderen otomatik olarak mesajı okumuş sayılsın
    await prisma.messageRead.create({
      data: {
        mesajId: message.id,
        userId,
      }
    });

    // Konuşmanın toplam üye sayısını al ve diğer üyelere push notification gönder
    const allMembers = await prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true }
    });
    const memberCount = allMembers.length;

    // Gönderen hariç diğer üyelere push notification (arka planda)
    const otherMemberIds = allMembers
      .map(m => m.userId)
      .filter(id => id !== userId);

    if (otherMemberIds.length > 0) {
      pushService.sendToUsers(otherMemberIds, {
        title: `💬 ${message.gonderen.ad} ${message.gonderen.soyad}`,
        body: icerik.length > 50 ? icerik.substring(0, 50) + '...' : icerik,
        click_action: `/tr/${message.gonderen.role === 'ogrenci' ? 'ogrenci' : 'personel'}/mesajlar`,
        data: {
          type: 'NEW_MESSAGE',
          conversationId
        }
      }).catch(err => console.error('Push notification hatası:', err));
    }

    // 🔌 WebSocket: Real-time mesaj gönder
    socketService.sendNewMessage(conversationId, {
      id: message.id,
      gonderenId: message.gonderenId,
      gonderenAd: message.gonderen.ad + ' ' + message.gonderen.soyad,
      icerik: message.icerik,
      createdAt: message.createdAt,
    });

    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        gonderenId: message.gonderenId,
        gonderenAd: message.gonderen.ad + ' ' + message.gonderen.soyad,
        gonderenRol: message.gonderen.role,
        icerik: message.icerik,
        dosyaUrl: message.dosyaUrl,
        dosyaTip: message.dosyaTip,
        tarih: message.createdAt,
        okundu: memberCount <= 2, // 1-1 konuşmada veya 2 kişilik grupta otomatik okundu, yoksa false
        okuyanlarSayisi: 1, // Sadece gönderen okumuş
        toplamUyeSayisi: memberCount,
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Mesaj gönderilemedi' });
  }
};

// Yeni konuşma oluştur (1-1)
export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { targetUserId, tip, ad, uyeIds } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // 1-1 konuşma için
    if (tip === 'OZEL' || !tip) {
      if (!targetUserId) {
        res.status(400).json({ success: false, error: 'Hedef kullanıcı ID gerekli' });
        return;
      }

      // Mevcut konuşma var mı kontrol et
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          tip: 'OZEL',
          AND: [
            { uyeler: { some: { userId } } },
            { uyeler: { some: { userId: targetUserId } } }
          ]
        },
        include: {
          uyeler: {
            include: {
              user: {
                select: {
                  id: true,
                  ad: true,
                  soyad: true,
                  role: true,
                }
              }
            }
          }
        }
      });

      if (existingConversation) {
        res.json({
          success: true,
          data: {
            id: existingConversation.id,
            tip: existingConversation.tip,
            ad: existingConversation.uyeler.find(u => u.userId !== userId)?.user.ad + ' ' + existingConversation.uyeler.find(u => u.userId !== userId)?.user.soyad,
            uyeler: existingConversation.uyeler.map(u => ({
              id: u.user.id,
              ad: u.user.ad + ' ' + u.user.soyad,
              rol: u.user.role,
            })),
            existing: true
          }
        });
        return;
      }

      // Yeni konuşma oluştur
      const conversation = await prisma.conversation.create({
        data: {
          tip: 'OZEL',
          olusturanId: userId,
          uyeler: {
            create: [
              { userId },
              { userId: targetUserId }
            ]
          }
        },
        include: {
          uyeler: {
            include: {
              user: {
                select: {
                  id: true,
                  ad: true,
                  soyad: true,
                  role: true,
                }
              }
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: {
          id: conversation.id,
          tip: conversation.tip,
          ad: conversation.uyeler.find(u => u.userId !== userId)?.user.ad + ' ' + conversation.uyeler.find(u => u.userId !== userId)?.user.soyad,
          uyeler: conversation.uyeler.map(u => ({
            id: u.user.id,
            ad: u.user.ad + ' ' + u.user.soyad,
            rol: u.user.role,
          })),
          existing: false
        }
      });
      return;
    }

    // Grup konuşması oluştur
    if (!ad?.trim()) {
      res.status(400).json({ success: false, error: 'Grup adı gerekli' });
      return;
    }

    if (!uyeIds || uyeIds.length === 0) {
      res.status(400).json({ success: false, error: 'En az bir üye seçmelisiniz' });
      return;
    }

    const allMemberIds = [userId, ...uyeIds];

    const conversation = await prisma.conversation.create({
      data: {
        tip: tip as ConversationType,
        ad: ad.trim(),
        olusturanId: userId,
        uyeler: {
          create: allMemberIds.map((id, index) => ({
            userId: id,
            rolAd: id === userId ? 'admin' : 'uye'
          }))
        }
      },
      include: {
        uyeler: {
          include: {
            user: {
              select: {
                id: true,
                ad: true,
                soyad: true,
                role: true,
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: conversation.id,
        tip: conversation.tip,
        ad: conversation.ad,
        uyeler: conversation.uyeler.map(u => ({
          id: u.user.id,
          ad: u.user.ad + ' ' + u.user.soyad,
          rol: u.user.role,
          grupRol: u.rolAd,
        })),
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, error: 'Konuşma oluşturulamadı' });
  }
};

// Konuşmadaki kullanıcıları getir (yeni mesaj için arama)
export const getAvailableUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const kursId = req.user?.kursId;
    const userSinifId = req.user?.sinifId;
    const { search, type, grouped, limit } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    let whereClause: any = {
      id: { not: userId },
      aktif: true,
    };

    // Kurs bazlı filtreleme
    if (kursId) {
      whereClause.kursId = kursId;
    }

    // Tip bazlı filtreleme
    if (type === 'personel') {
      whereClause.role = { in: ['mudur', 'ogretmen', 'sekreter'] };
    } else if (type === 'ogrenci') {
      whereClause.role = 'ogrenci';
    }

    // Arama
    if (search) {
      whereClause.OR = [
        { ad: { contains: search as string } },
        { soyad: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    // Limit varsa kullan, yoksa tüm kullanıcıları getir (max 200)
    const takeLimit = limit ? Math.min(parseInt(limit as string), 200) : 200;

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        ad: true,
        soyad: true,
        role: true,
        brans: true,
        sinifId: true,
        sinif: {
          select: {
            id: true,
            ad: true,
            seviye: true
          }
        },
        dersKayitlari: {
          select: {
            course: {
              select: {
                ad: true
              }
            }
          },
          take: 5
        }
      },
      take: takeLimit,
      orderBy: [
        { sinifId: 'asc' },
        { ad: 'asc' }
      ]
    });

    // Gruplanmış sonuç isteniyorsa
    if (grouped === 'true') {
      // Sınıf bazlı gruplama
      const groupedData: Record<string, any[]> = {
        'Sınıf Arkadaşlarım': [],
        'Diğer Sınıflar': [],
        'Öğretmenler': [],
        'Personel': []
      };

      users.forEach(u => {
        const userData = {
          id: u.id,
          ad: u.ad,
          soyad: u.soyad,
          rol: u.role,
          brans: u.brans,
          sinif: u.sinif?.ad,
          sinifId: u.sinifId,
          sinifSeviye: u.sinif?.seviye,
          dersler: u.dersKayitlari?.map(dk => dk.course.ad) || []
        };

        if (u.role === 'ogretmen') {
          groupedData['Öğretmenler'].push(userData);
        } else if (u.role === 'mudur' || u.role === 'sekreter') {
          groupedData['Personel'].push(userData);
        } else if (u.sinifId === userSinifId) {
          groupedData['Sınıf Arkadaşlarım'].push(userData);
        } else {
          groupedData['Diğer Sınıflar'].push(userData);
        }
      });

      // Boş grupları filtrele
      const filteredGroups = Object.fromEntries(
        Object.entries(groupedData).filter(([_, arr]) => arr.length > 0)
      );

      res.json({
        success: true,
        grouped: true,
        data: filteredGroups,
        total: users.length
      });
      return;
    }

    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        ad: u.ad,
        soyad: u.soyad,
        rol: u.role,
        brans: u.brans,
        sinif: u.sinif?.ad,
        sinifId: u.sinifId,
        sinifSeviye: u.sinif?.seviye,
        dersler: u.dersKayitlari?.map(dk => dk.course.ad) || []
      })),
      total: users.length
    });
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({ success: false, error: 'Kullanıcılar alınamadı' });
  }
};

// Sınıf arkadaşlarını getir (tümünü - limit yok)
export const getClassmates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const kursId = req.user?.kursId;
    const userSinifId = req.user?.sinifId;
    const { search, sinifId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // Hangi sınıfın arkadaşlarını getireceğimizi belirle
    const targetSinifId = sinifId || userSinifId;

    let whereClause: any = {
      id: { not: userId },
      aktif: true,
      role: 'ogrenci',
    };

    // Kurs bazlı filtreleme
    if (kursId) {
      whereClause.kursId = kursId;
    }

    // Sınıf bazlı filtreleme (opsiyonel)
    if (targetSinifId) {
      whereClause.sinifId = targetSinifId;
    }

    // Arama
    if (search) {
      whereClause.OR = [
        { ad: { contains: search as string } },
        { soyad: { contains: search as string } },
      ];
    }

    const classmates = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        ad: true,
        soyad: true,
        role: true,
        sinifId: true,
        sinif: {
          select: {
            id: true,
            ad: true,
            seviye: true
          }
        },
        dersKayitlari: {
          select: {
            course: {
              select: {
                id: true,
                ad: true
              }
            }
          }
        }
      },
      orderBy: [
        { ad: 'asc' },
        { soyad: 'asc' }
      ]
    });

    // Sınıf bazlı gruplama
    const groupedByClass: Record<string, any[]> = {};
    
    classmates.forEach(student => {
      const className = student.sinif?.ad || 'Sınıfsız';
      if (!groupedByClass[className]) {
        groupedByClass[className] = [];
      }
      
      groupedByClass[className].push({
        id: student.id,
        ad: student.ad,
        soyad: student.soyad,
        sinif: student.sinif?.ad,
        sinifId: student.sinifId,
        sinifSeviye: student.sinif?.seviye,
        dersler: student.dersKayitlari?.map(dk => ({
          id: dk.course.id,
          ad: dk.course.ad
        })) || []
      });
    });

    // Aynı sınıftaki arkadaşları öne al
    const sortedGroups: Record<string, any[]> = {};
    
    // Önce kullanıcının kendi sınıfı
    if (userSinifId) {
      const userClass = await prisma.sinif.findUnique({
        where: { id: userSinifId },
        select: { ad: true }
      });
      if (userClass && groupedByClass[userClass.ad]) {
        sortedGroups[userClass.ad] = groupedByClass[userClass.ad];
      }
    }
    
    // Sonra diğer sınıflar
    Object.keys(groupedByClass)
      .sort()
      .forEach(className => {
        if (!sortedGroups[className]) {
          sortedGroups[className] = groupedByClass[className];
        }
      });

    res.json({
      success: true,
      data: sortedGroups,
      total: classmates.length,
      userSinifId
    });
  } catch (error) {
    console.error('Get classmates error:', error);
    res.status(500).json({ success: false, error: 'Sınıf arkadaşları alınamadı' });
  }
};

// Son mesajları getir (polling için)
export const getNewMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { after } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // Kullanıcının bu konuşmaya üye olduğunu kontrol et
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Bu konuşmaya erişim yetkiniz yok' });
      return;
    }

    // Konuşmanın toplam üye sayısını al
    const memberCount = await prisma.conversationMember.count({
      where: { conversationId }
    });

    // Belirli bir tarihten sonraki mesajları getir
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        silindi: false,
        createdAt: { gt: new Date(after as string) }
      },
      include: {
        gonderen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            role: true,
          }
        },
        okuyanlar: {
          select: {
            userId: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Yeni mesajları okundu olarak işaretle
    const unreadMessageIds = messages
      .filter(m => m.gonderenId !== userId && !m.okuyanlar.some(o => o.userId === userId))
      .map(m => m.id);

    if (unreadMessageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessageIds.map(mesajId => ({
          mesajId,
          userId,
        })),
        skipDuplicates: true
      });
    }

    res.json({
      success: true,
      data: messages.map(m => {
        const okuyanlarSayisi = m.okuyanlar.length;
        const gerekliOkumaSayisi = memberCount - 1;
        const tumuyelerOkudu = okuyanlarSayisi >= gerekliOkumaSayisi;
        
        return {
          id: m.id,
          gonderenId: m.gonderenId,
          gonderenAd: m.gonderen.ad + ' ' + m.gonderen.soyad,
          gonderenRol: m.gonderen.role,
          icerik: m.icerik,
          dosyaUrl: m.dosyaUrl,
          dosyaTip: m.dosyaTip,
          tarih: m.createdAt,
          okundu: tumuyelerOkudu,
          okuyanlarSayisi,
          toplamUyeSayisi: memberCount,
        };
      })
    });
  } catch (error) {
    console.error('Get new messages error:', error);
    res.status(500).json({ success: false, error: 'Yeni mesajlar alınamadı' });
  }
};

// Grup adını güncelle
export const updateConversationName = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { ad } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    if (!ad || !ad.trim()) {
      res.status(400).json({ success: false, error: 'Grup adı boş olamaz' });
      return;
    }

    // Kullanıcının bu konuşmada yönetici olup olmadığını kontrol et
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        rolAd: 'admin'
      }
    });

    if (!member) {
      res.status(403).json({ success: false, error: 'Bu işlem için yönetici yetkisi gerekli' });
      return;
    }

    // Grup adını güncelle
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { ad: ad.trim() }
    });

    res.json({
      success: true,
      message: 'Grup adı güncellendi',
      data: { ad: updated.ad }
    });
  } catch (error) {
    console.error('Update conversation name error:', error);
    res.status(500).json({ success: false, error: 'Grup adı güncellenemedi' });
  }
};

// Üyeyi yönetici yap veya yöneticilikten düşür
export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId, memberId } = req.params;
    const { role } = req.body; // 'admin' veya 'uye'

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // İşlemi yapan kişinin yönetici olup olmadığını kontrol et
    const requester = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        rolAd: 'admin'
      }
    });

    if (!requester) {
      res.status(403).json({ success: false, error: 'Bu işlem için yönetici yetkisi gerekli' });
      return;
    }

    // Hedef üyeyi bul
    const targetMember = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: memberId
      }
    });

    if (!targetMember) {
      res.status(404).json({ success: false, error: 'Üye bulunamadı' });
      return;
    }

    // Üyenin rolünü güncelle
    await prisma.conversationMember.update({
      where: { id: targetMember.id },
      data: { rolAd: role }
    });

    res.json({
      success: true,
      message: role === 'admin' ? 'Üye yönetici yapıldı' : 'Üye yöneticilikten düşürüldü'
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ success: false, error: 'Üye rolü güncellenemedi' });
  }
};

// Üyeyi gruptan çıkar
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { conversationId, memberId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // Kendi kendini çıkarma (gruptan ayrılma) her zaman izinli
    const isSelfRemove = userId === memberId;

    if (!isSelfRemove) {
      // Başkasını çıkarmak için yönetici olmalı
      const requester = await prisma.conversationMember.findFirst({
        where: {
          conversationId,
          userId,
          rolAd: 'admin'
        }
      });

      if (!requester) {
        res.status(403).json({ success: false, error: 'Bu işlem için yönetici yetkisi gerekli' });
        return;
      }
    }

    // Hedef üyeyi bul ve sil
    const targetMember = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: memberId
      }
    });

    if (!targetMember) {
      res.status(404).json({ success: false, error: 'Üye bulunamadı' });
      return;
    }

    await prisma.conversationMember.delete({
      where: { id: targetMember.id }
    });

    res.json({
      success: true,
      message: isSelfRemove ? 'Gruptan ayrıldınız' : 'Üye gruptan çıkarıldı'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, error: 'Üye çıkarılamadı' });
  }
};

// Gruba üye ekle
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const { conversationId } = req.params;
    const { userId, userIds } = req.body; // Tek userId veya array userIds

    if (!currentUserId) {
      res.status(401).json({ success: false, error: 'Yetkilendirme gerekli' });
      return;
    }

    // İşlemi yapan kişinin yönetici olup olmadığını kontrol et
    const requester = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: currentUserId,
        rolAd: 'admin'
      }
    });

    if (!requester) {
      res.status(403).json({ success: false, error: 'Bu işlem için yönetici yetkisi gerekli' });
      return;
    }

    // userId veya userIds'i normalize et
    const idsToAdd = userIds ? userIds : (userId ? [userId] : []);
    
    if (idsToAdd.length === 0) {
      res.status(400).json({ success: false, error: 'En az bir kullanıcı ID gerekli' });
      return;
    }

    // Yeni üyeleri ekle
    const newMembers = await prisma.conversationMember.createMany({
      data: idsToAdd.map((uid: string) => ({
        conversationId,
        userId: uid,
        rolAd: 'uye'
      })),
      skipDuplicates: true
    });

    res.json({
      success: true,
      message: `${newMembers.count} üye eklendi`
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, error: 'Üye eklenemedi' });
  }
};
