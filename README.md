# EVA Elektromekanik - 3D İnteraktif Monoblok Beton Köşk & Modüler Hücre Satış Platformu

Bu proje, **EVA Elektromekanik** için **UI/UX Pro Max** tasarım zekası ve **Magnific "Işık Küpleri"** (Light Cubes) estetiği harmanlanarak geliştirilmiş, 3D WebGL tabanlı profesyonel bir kurumsal satış ve mühendislik platformudur.

---

## 🌟 Öne Çıkan Özellikler

### 1. Sayfa Aşağıya Kaydıkça Açılan 3D Diseksiyon & Parça Anatomisi
- **Three.js WebGL Motoru**: Monoblok Beton Köşk (EVA-MBK) ve 36 kV Metal Mahfazalı Modüler Hücre (EVA+) sistemlerinin yüksek detaylı parametrik 3D modellemesi.
- **Scroll-Driven Storytelling (Kaydırdıkça Açılan Katmanlar)**:
  - **Adım 1:** C35/45 yekpare monoblok betonarme zırh, IP23D/IP54 havalandırma panjurları, çelik emniyet kapıları ve temel kablo havuzu.
  - **Adım 2:** Beton çatı yukarı kalkar (+Y) ve kapılar 110° açılarak köşkün 3 bağımsız yangın kompartmanını açığa çıkarır: OG Şalt Odası, Trafo Odası, AG Dağıtım Odası.
  - **Adım 3:** EVA+ 36 kV Modüler Hücre grubu öne doğru çekilir; LSC2B-PM servis sürekliliği ve IAC AFLR 20kA 1s iç ark güvenliği vurgulanır.
  - **Adım 4:** Hücrenin iç anatomisi patlatılır (Bara bölmesi yukarı, vakumlu kesici arabası öne, kablo/akım trafosu bölmesi aşağı, röle kapağı yana).
  - **Adım 5:** 2500 kVA güç dağıtım trafosu dalga duvarları, buchholz rölesi ve SCADA uyumlu AG kompanzasyon panosu.
- **Çift Kontrol Modu**: Hem sayfa kaydırma ile senkronize patlatma hem de **Manuel Patlatma Slider'ı (%0 - %100)**.
- **Görünüm Modları**:
  - *Gerçekçi PBR:* Boyalı galvaniz sac RAL 7035, monoblok beton, elektrolitik bakır baralar.
  - *Işık Küpü (Hologram):* Magnific tarzı siber neon, parlayan yarı saydam cam küpler ve enerji akış hatları.
  - *Teknik CAD Çizim:* Yüksek kontrastlı tel kafes (wireframe) mühendislik şeması.
- **Hızlı Kamera Odaklama (Hotspots)**: Tek tıkla Çatı, EVA+ Hücre, Vakumlu Kesici, Bara Sistemi, Trafo veya AG Panosuna sinematik kamera geçişi.

### 2. İnteraktif 3D Köşk Konfigüratörü & Akıllı Teklif Motoru (CPQ / RFQ)
- **Köşk Tipi:** Monoblok Beton Köşk (EVA-MBK), Prefabrik Beton (EVA-PBK), Kompakt Sac Köşk (EVA-SAC).
- **Trafo Gücü:** 400 kVA, 630 kVA, 1000 kVA, 1600 kVA, 2500 kVA.
- **Hücre Kombinasyonu:** Standart Trafo Koruma (3 Hücre), Genişletilmiş Dağıtım (5 Hücre), Ring Ana Dağıtım (4 Hücre), GES/RES Santral Paketi (6 Hücre).
- **Ek Donanımlar:** Schneider Inside, SCADA/RTU Telemetri, Otomatik Aerosol Yangın Söndürme, Akıllı Analizör.
- **Anlık Mühendislik Hesabı:** TEDAŞ Tip Kodu, Tahmini Toplam Ağırlık (Ton), Dış Ölçüler (m), Teslimat Süresi.
- **Hızlı Satış Çıktıları:** Resmi Fiyat Teklifi Talep Modalı ve tek tıkla doğrudan WhatsApp mühendisine hazır teknik metin aktarma.

### 3. UI/UX Pro Max Standartları
- WCAG AA/AAA kontrast oranları (> 7:1)
- 44px minimum dokunma alanları (Touch & Interaction)
- CLS < 0.1 ve sıfır layout thrashing
- Semantik CSS değişkenleri ve tasarım tokenları
- Lucide SVG ikon disiplini (emoji kullanılmadı)
- Web Audio API ile dokunsal mikro geri bildirim sesleri

---

## 🚀 Hızlı Başlangıç

Projeyi çalıştırmak için:

### Yöntem 1: Çift Tıklama (Windows)
Klasör içerisindeki `Baslat.bat` dosyasına çift tıklayın.

### Yöntem 2: Python Terminali
```bash
cd "C:\Users\pc\.gemini\antigravity\scratch\eva-elektromekanik-3d"
python start_server.py
```
Tarayıcınız otomatik olarak `http://localhost:8080` adresinde açılacaktır.

---

## 📁 Proje Dosya Mimarisi
- `index.html`: Ana satış platformu, 3D diseksiyon sahnesi, konfigüratör, ürünler, standartlar ve RFQ formu.
- `styles.css`: UI/UX Pro Max ve Magnific Işık Küpleri temasına uygun tasarım tokenları ve responsive stil sistemi.
- `substation-3d.js`: Three.js tabanlı parametrik 3D köşk ve hücre patlatma motoru.
- `app.js`: Scroll senkronizasyonu, CPQ konfigüratör hesaplama mantığı, ses efektleri ve modal yönetimi.
- `start_server.py`: Dahili Python HTTP sunucu başlatıcı.
- `Baslat.bat`: Tek tıkla çalıştırma betiği.
