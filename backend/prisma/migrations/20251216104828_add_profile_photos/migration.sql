-- CreateTable
CREATE TABLE `admin` (
    `AdminID` INTEGER NOT NULL AUTO_INCREMENT,
    `Ad` VARCHAR(50) NOT NULL,
    `Soyad` VARCHAR(50) NOT NULL,
    `Email` VARCHAR(100) NOT NULL,
    `KullaniciAdi` VARCHAR(50) NOT NULL,
    `Sifre` VARCHAR(255) NOT NULL,
    `Telefon` VARCHAR(15) NULL,
    `ProfilFoto` VARCHAR(500) NULL,
    `AktifMi` BOOLEAN NULL DEFAULT true,
    `OlusturmaTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `Email`(`Email`),
    UNIQUE INDEX `KullaniciAdi`(`KullaniciAdi`),
    PRIMARY KEY (`AdminID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `birebirdders` (
    `BirebirdDersID` INTEGER NOT NULL AUTO_INCREMENT,
    `OgrenciID` INTEGER NOT NULL,
    `OgretmenID` INTEGER NOT NULL,
    `BransID` INTEGER NOT NULL,
    `Tarih` DATE NOT NULL,
    `BaslangicSaati` TIME(0) NOT NULL,
    `BitisSaati` TIME(0) NOT NULL,
    `Durum` ENUM('Planli', 'Tamamlandi', 'Iptal') NULL DEFAULT 'Planli',
    `Notlar` TEXT NULL,

    INDEX `BransID`(`BransID`),
    INDEX `OgrenciID`(`OgrenciID`),
    INDEX `OgretmenID`(`OgretmenID`),
    PRIMARY KEY (`BirebirdDersID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brans` (
    `BransID` INTEGER NOT NULL AUTO_INCREMENT,
    `BransAdi` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `BransAdi`(`BransAdi`),
    PRIMARY KEY (`BransID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deneme` (
    `DenemeID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursID` INTEGER NOT NULL,
    `DenemeAdi` VARCHAR(100) NOT NULL,
    `Seviye` INTEGER NOT NULL,
    `Tarih` DATE NOT NULL,
    `ToplamSoru` INTEGER NULL DEFAULT 100,
    `OlusturmaTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `KursID`(`KursID`),
    PRIMARY KEY (`DenemeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `denemesonuc` (
    `SonucID` INTEGER NOT NULL AUTO_INCREMENT,
    `DenemeID` INTEGER NOT NULL,
    `OgrenciID` INTEGER NOT NULL,
    `DogruSayisi` INTEGER NULL DEFAULT 0,
    `YanlisSayisi` INTEGER NULL DEFAULT 0,
    `BosSayisi` INTEGER NULL DEFAULT 0,
    `NetPuan` DECIMAL(5, 2) NULL,
    `Siralama` INTEGER NULL,
    `KayitTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `OgrenciID`(`OgrenciID`),
    UNIQUE INDEX `DenemeID`(`DenemeID`, `OgrenciID`),
    PRIMARY KEY (`SonucID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ders` (
    `DersID` INTEGER NOT NULL AUTO_INCREMENT,
    `BransID` INTEGER NOT NULL,
    `DersAdi` VARCHAR(100) NOT NULL,
    `Aciklama` VARCHAR(255) NULL,

    INDEX `BransID`(`BransID`),
    PRIMARY KEY (`DersID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dersprogrami` (
    `ProgramID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursID` INTEGER NOT NULL,
    `SinifID` INTEGER NOT NULL,
    `DersID` INTEGER NOT NULL,
    `OgretmenID` INTEGER NOT NULL,
    `Gun` ENUM('Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar') NOT NULL,
    `BaslangicSaati` TIME(0) NOT NULL,
    `BitisSaati` TIME(0) NOT NULL,

    INDEX `DersID`(`DersID`),
    INDEX `KursID`(`KursID`),
    INDEX `OgretmenID`(`OgretmenID`),
    INDEX `SinifID`(`SinifID`),
    PRIMARY KEY (`ProgramID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egitimkoclugu` (
    `KoclukID` INTEGER NOT NULL AUTO_INCREMENT,
    `OgrenciID` INTEGER NOT NULL,
    `KocID` INTEGER NOT NULL,
    `AylikGorusmeLimiti` INTEGER NULL DEFAULT 4,
    `KalanGorusme` INTEGER NULL DEFAULT 4,
    `Ay` INTEGER NOT NULL,
    `Yil` INTEGER NOT NULL,

    INDEX `KocID`(`KocID`),
    UNIQUE INDEX `OgrenciID`(`OgrenciID`, `KocID`, `Ay`, `Yil`),
    PRIMARY KEY (`KoclukID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `karne` (
    `KarneID` INTEGER NOT NULL AUTO_INCREMENT,
    `OgrenciID` INTEGER NOT NULL,
    `Donem` ENUM('1. Donem', '2. Donem', 'Yilsonu') NOT NULL,
    `Yil` INTEGER NOT NULL,
    `GelisimRaporu` TEXT NULL,
    `GenelOrtalama` DECIMAL(5, 2) NULL,
    `DavranisNotu` VARCHAR(20) NULL,
    `OlusturmaTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `VeliyeGonderildiMi` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `OgrenciID`(`OgrenciID`, `Donem`, `Yil`),
    PRIMARY KEY (`KarneID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `koclukgorusmesi` (
    `GorusmeID` INTEGER NOT NULL AUTO_INCREMENT,
    `KoclukID` INTEGER NOT NULL,
    `Tarih` DATETIME(0) NOT NULL,
    `Sure` INTEGER NULL,
    `Konu` VARCHAR(255) NULL,
    `Notlar` TEXT NULL,
    `Durum` ENUM('Planli', 'Tamamlandi', 'Iptal') NULL DEFAULT 'Planli',

    INDEX `KoclukID`(`KoclukID`),
    PRIMARY KEY (`GorusmeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kurs` (
    `KursID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursAdi` VARCHAR(100) NOT NULL,
    `Adres` VARCHAR(255) NULL,
    `Telefon` VARCHAR(15) NULL,
    `Email` VARCHAR(100) NULL,
    `KullaniciAdi` VARCHAR(50) NOT NULL,
    `Sifre` VARCHAR(255) NOT NULL,
    `SifreDegistirildiMi` BOOLEAN NULL DEFAULT false,
    `Logo` VARCHAR(500) NULL,
    `AktifMi` BOOLEAN NULL DEFAULT true,
    `KayitTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `KullaniciAdi`(`KullaniciAdi`),
    PRIMARY KEY (`KursID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mudur` (
    `MudurID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursID` INTEGER NOT NULL,
    `Ad` VARCHAR(50) NOT NULL,
    `Soyad` VARCHAR(50) NOT NULL,
    `Email` VARCHAR(100) NULL,
    `Telefon` VARCHAR(15) NULL,
    `KullaniciAdi` VARCHAR(50) NOT NULL,
    `Sifre` VARCHAR(255) NOT NULL,
    `SifreDegistirildiMi` BOOLEAN NULL DEFAULT false,
    `ProfilFoto` VARCHAR(500) NULL,
    `AktifMi` BOOLEAN NULL DEFAULT true,
    `KayitTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `KullaniciAdi`(`KullaniciAdi`),
    INDEX `KursID`(`KursID`),
    PRIMARY KEY (`MudurID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notlar` (
    `NotID` INTEGER NOT NULL AUTO_INCREMENT,
    `OgrenciID` INTEGER NOT NULL,
    `DersID` INTEGER NOT NULL,
    `NotTuru` ENUM('Yazili', 'Sozlu', 'Odev', 'Proje') NOT NULL,
    `NotDegeri` DECIMAL(5, 2) NOT NULL,
    `Tarih` DATE NOT NULL,
    `Aciklama` VARCHAR(255) NULL,

    INDEX `DersID`(`DersID`),
    INDEX `OgrenciID`(`OgrenciID`),
    PRIMARY KEY (`NotID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ogrenci` (
    `OgrenciID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursID` INTEGER NOT NULL,
    `SinifID` INTEGER NULL,
    `VeliID` INTEGER NULL,
    `Ad` VARCHAR(50) NOT NULL,
    `Soyad` VARCHAR(50) NOT NULL,
    `DogumTarihi` DATE NULL,
    `Telefon` VARCHAR(15) NULL,
    `OkulTuru` ENUM('ORTAOKUL', 'LISE') NOT NULL,
    `Seviye` INTEGER NOT NULL,
    `KullaniciAdi` VARCHAR(50) NULL,
    `Sifre` VARCHAR(255) NULL,
    `SifreDegistirildiMi` BOOLEAN NULL DEFAULT false,
    `ProfilFoto` VARCHAR(500) NULL,
    `AktifMi` BOOLEAN NULL DEFAULT true,
    `KayitTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `KullaniciAdi`(`KullaniciAdi`),
    INDEX `KursID`(`KursID`),
    INDEX `SinifID`(`SinifID`),
    INDEX `VeliID`(`VeliID`),
    PRIMARY KEY (`OgrenciID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ogretmen` (
    `OgretmenID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursID` INTEGER NOT NULL,
    `BransID` INTEGER NOT NULL,
    `Ad` VARCHAR(50) NOT NULL,
    `Soyad` VARCHAR(50) NOT NULL,
    `Email` VARCHAR(100) NULL,
    `Telefon` VARCHAR(15) NULL,
    `EgitimKocuMu` BOOLEAN NULL DEFAULT false,
    `AylikKoclukLimiti` INTEGER NULL DEFAULT 10,
    `KullaniciAdi` VARCHAR(50) NOT NULL,
    `Sifre` VARCHAR(255) NOT NULL,
    `SifreDegistirildiMi` BOOLEAN NULL DEFAULT false,
    `ProfilFoto` VARCHAR(500) NULL,
    `AktifMi` BOOLEAN NULL DEFAULT true,
    `KayitTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `KullaniciAdi`(`KullaniciAdi`),
    INDEX `BransID`(`BransID`),
    INDEX `KursID`(`KursID`),
    PRIMARY KEY (`OgretmenID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sekreter` (
    `SekreterID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursID` INTEGER NOT NULL,
    `Ad` VARCHAR(50) NOT NULL,
    `Soyad` VARCHAR(50) NOT NULL,
    `Email` VARCHAR(100) NULL,
    `Telefon` VARCHAR(15) NULL,
    `KullaniciAdi` VARCHAR(50) NOT NULL,
    `Sifre` VARCHAR(255) NOT NULL,
    `SifreDegistirildiMi` BOOLEAN NULL DEFAULT false,
    `ProfilFoto` VARCHAR(500) NULL,
    `AktifMi` BOOLEAN NULL DEFAULT true,
    `KayitTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `KullaniciAdi`(`KullaniciAdi`),
    INDEX `KursID`(`KursID`),
    PRIMARY KEY (`SekreterID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `silinenkayitlar` (
    `SilmeID` INTEGER NOT NULL AUTO_INCREMENT,
    `TabloAdi` VARCHAR(50) NOT NULL,
    `KayitID` INTEGER NOT NULL,
    `KayitVerisi` JSON NOT NULL,
    `BagliVeriler` JSON NULL,
    `SilenKullanici` VARCHAR(100) NULL,
    `SilenKullaniciTuru` ENUM('Admin', 'Mudur', 'Sekreter') NOT NULL,
    `SilmeTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `SonGeriYuklemeTarihi` DATETIME(0) NULL,
    `GeriYuklendi` BOOLEAN NULL DEFAULT false,
    `KaliciSilindiMi` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`SilmeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sinif` (
    `SinifID` INTEGER NOT NULL AUTO_INCREMENT,
    `KursID` INTEGER NOT NULL,
    `SinifAdi` VARCHAR(20) NOT NULL,
    `Seviye` INTEGER NOT NULL,
    `Kapasite` INTEGER NULL DEFAULT 20,
    `DanismanID` INTEGER NULL,

    INDEX `DanismanID`(`DanismanID`),
    INDEX `KursID`(`KursID`),
    PRIMARY KEY (`SinifID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `veli` (
    `VeliID` INTEGER NOT NULL AUTO_INCREMENT,
    `Ad` VARCHAR(50) NOT NULL,
    `Soyad` VARCHAR(50) NOT NULL,
    `Telefon` VARCHAR(15) NOT NULL,
    `Email` VARCHAR(100) NULL,
    `Adres` VARCHAR(255) NULL,
    `KayitTarihi` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`VeliID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `veliiletisim` (
    `IletisimID` INTEGER NOT NULL AUTO_INCREMENT,
    `VeliID` INTEGER NOT NULL,
    `SekreterID` INTEGER NOT NULL,
    `IletisimTuru` ENUM('Telefon', 'Yuz Yuze', 'Mesaj', 'Email') NOT NULL,
    `Konu` VARCHAR(255) NULL,
    `Detay` TEXT NULL,
    `Tarih` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `SekreterID`(`SekreterID`),
    INDEX `VeliID`(`VeliID`),
    PRIMARY KEY (`IletisimID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `yoklama` (
    `YoklamaID` INTEGER NOT NULL AUTO_INCREMENT,
    `OgrenciID` INTEGER NOT NULL,
    `ProgramID` INTEGER NOT NULL,
    `Tarih` DATE NOT NULL,
    `Durum` ENUM('Var', 'Yok', 'Izinli', 'Hasta') NULL DEFAULT 'Var',

    INDEX `ProgramID`(`ProgramID`),
    UNIQUE INDEX `OgrenciID`(`OgrenciID`, `ProgramID`, `Tarih`),
    PRIMARY KEY (`YoklamaID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
