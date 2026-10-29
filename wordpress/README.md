# WordPress kurulumu — VINYL ARCHIVE

Bu paket mevcut tasarımın klasik WordPress tema uyarlamasıdır. WordPress 6.5+ ve PHP 8.0+ gerekir. Ek sayfa oluşturucu veya eklenti gerektirmez. Bu aşamada içerik örnektir; NocoDB entegrasyonu, veritabanı aktarımı, CasaOS kurulumu ve yayın yapılmamıştır.

## Kurulum

1. GitHub'dan projenin güncel ZIP dosyasını indirin ve çıkartın.
2. Çıkarttığınız proje içindeki `wordpress/vinyl-archive-theme.zip` dosyasını bulun. GitHub'ın bütün proje ZIP'ini tema olarak yüklemeyin.
3. WordPress yönetiminde **Görünüm → Temalar → Yeni tema ekle → Tema yükle** yolundan `vinyl-archive-theme.zip` dosyasını yükleyin ve etkinleştirin.
4. **Sayfalar → Yeni sayfa** bölümünde aşağıdaki sayfaları oluşturup yayımlayın. Kalıcı bağlantı/kısa adları tam olarak aşağıdaki gibi olmalıdır. Bu özel sayfalarda içerik alanı yerine prototip arayüzü görüntülenir.

| Sayfa başlığı | Kısa ad |
| --- | --- |
| Ana Sayfa | ana-sayfa |
| Koleksiyonum | koleksiyon |
| İmzalı Plaklar | imzali-plaklar |
| Sanatçılar | sanatcilar |
| Türler | turler |
| Hakkımda | hakkimda |

5. **Ayarlar → Okuma** bölümünde ana sayfa gösterimini **Sabit bir sayfa**, ana sayfayı **Ana Sayfa** seçin.
6. **Ayarlar → Kalıcı Bağlantılar** bölümünde **Yazı ismi** seçeneğini kaydedin. Sunucunun WordPress kalıcı bağlantılarını desteklediğinden emin olun.
7. Ana sayfayı, koleksiyon aramasını, tür/sanatçı bağlantılarını, İmzalı Plaklar sayfasını ve albüm detay penceresini masaüstünde ve telefonda kontrol edin. Oturum açıkken yönetici çubuğu da görünmelidir.

Tema otomatik olarak sayfa veya koleksiyon kaydı oluşturmaz; mevcut WordPress/NocoDB verilerini değiştirmez. Menü bu özel sayfa adresleri için sabittir. Genel WordPress sayfaları ve yazıları normal içerik şablonuyla gösterilir. Hakkımda metni şu an prototipin örnek metnidir; özel sayfaların düzenleyici içeriği tasarımda kullanılmaz.

## Veri ve gizlilik

Sekiz albüm ve iki imza işareti tamamen örnektir. Detaylar açılır pencerede görüntülenir; bu sürümde albüme özel WordPress URL'leri yoktur. `assets/data.js` sadece örnek halka açık alanları içerir. NocoDB token'ı veya Notes metni yoktur. Gerçek entegrasyon sonraki aşamada ayrı bir sunucu tarafı eklenti olarak hazırlanmalıdır; imza bayrağı özel notlardan sunucuda türetilmelidir. Mevcut NocoDB tablo yapısı değişmez.

## Geliştirme

Ana prototip kaynakları kök dizinde tutulur. `node scripts/build-wordpress.mjs` HTML/CSS/JS bileşenlerini temaya aktarır; ardından `python3 scripts/package-wordpress.py` yüklenebilir ZIP'i yeniden üretir. PHP şablonları ve `assets/wordpress.css` tema içinde tutulur. `node --test scripts/wordpress.test.mjs` tema paketinin yapısını ve gerçek WordPress bağlantılarını kontrol eder.

Bu bulut ortamında PHP/WordPress çalışma zamanı olmadığı için WordPress üzerinde etkinleştirme ve tarayıcı testi yapılmamıştır. Canlıya geçmeden önce bir WordPress test kurulumunda yukarıdaki kontroller tamamlanmalıdır.


## NocoDB bağlantısı (yeni)

Güncel tema 0.3.0 ile birlikte `vinyl-nocodb-plugin.zip` dosyasını Eklentiler bölümünden yükleyin. Adım adım kurulum, token saklama, ağ ve gizlilik bilgileri [eklenti yönergelerinde](vinyl-nocodb/README.txt) bulunur. Eklenti etkinleştirildiğinde tema örnek verileri kullanmaz. Tema tek başına örnek modunu korur. Yukarıdaki ilk prototip açıklamalarından farklı olarak bu güncel sürüm NocoDB bağlantısını destekler; gerçek ev sunucusu bağlantısı kullanıcı panelinde doğrulanmalıdır.

Geliştirme kontrolleri: `php tests/nocodb.php` (WordPress HTTP/önbellek taklitleri), `node tests/live-theme.mjs` (geçici `/tmp/vinyl-browser` dizinine jsdom kurulumu gerekir). PHP 8.4 ile PHP dosyalarının sözdizimi ve bağlantı testleri çalıştırıldı; gerçek WordPress üzerinde kurulum henüz denenmedi.


## Discogs kapak eşleştirmesi

Tema **0.4.0** ve eklenti **1.1.0** paketlerini birlikte güncelleyin. Ardından **Ayarlar → Vinyl Discogs** bölümüne Discogs hesabınızdan aldığınız ayrı kişisel API token'ı girip eşleştirmeyi etkinleştirin ve **Kapakları eşleştir / devam et** düğmesine basın. Detaylı kurulum, yenileme, kullanım hakkı ve test sınırları [eklenti yönergelerinde](vinyl-nocodb/README.txt) bulunur. NocoDB verileri değişmez.

`php tests/discogs.php`: Discogs API taklitleriyle token izolasyonu, URL izin listesi, görsel seçimi, önbellek, 404/429/403 ve bozuk yanıt kontrolleri. `node tests/live-theme.mjs`: kart ve detay görselleri, kaynak bağlantıları, bozuk görsel geri dönüşü. Canlı Discogs ve WordPress cron doğrulaması kullanıcı sunucusunda yapılmalıdır.


## NocoDB'ye yüklenen kapaklar

Tema **0.5.0** ve eklenti **1.2.0**, mevcut `Cover_Image` ek dosya alanını destekler. Eklentide `manual-covers.php` dahil bütün dosyaları güncelleyin. Ardından NocoDB bağlantı testini çalıştırarak önbelleği yenileyin. Site önce manuel kapağı, yoksa Discogs'u, o da yoksa yer tutucuyu gösterir. Manuel kapakların görünmesi için Discogs bağlantısı gerekmez. NocoDB kayıtlarına yazma yapılmaz. Detaylar [eklenti yönergelerinde](vinyl-nocodb/README.txt). Test: `php tests/manual-covers.php`.


## Dashboard ve ana sayfa — tema 0.6.0 / eklenti 1.3.0

Ana sayfa tüm koleksiyonu listelemez. Pikap çizimi ve koyu/kırmızı tasarım korunur;
12 gösterge, iki Top 10 sanatçı listesi ve yıl seçilebilir aylık alım tablosundan sonra
Öne Çıkan LP’ler, Öne Çıkan Single’lar ve İmzalı Plaklar görünür. Her seçki sayfa açılışında
kendi grubundan tekrarsız en fazla beş rastgele kayıt seçer. İmzalı seçki LP/Single seçkileriyle
kesişebilir. Tam listeler mevcut `/koleksiyon/?format=lp`, `/koleksiyon/?format=single` ve
`/imzali-plaklar/` adreslerinde açılır; ek WordPress sayfası gerekmez. İmzalı dashboard
kartı imzalı tam listeye gider; albüm kartları mevcut detay penceresini açar.

Top 10 listeleri kayıt adedine göre azalan, eşitlikte Türkçe alfabetik sıralanır.
Sanatçı ülkeleri `Artist_Country`, format grupları doğrulanmış `Format` değerleri üzerinden hesaplanır.
Alım tablosundaki Geçmiş seçilen yıldan önceki kayıtları kapsar; tekil alım tarihleri sunucudan çıkmaz.
Ayrıntılar ve eksik tarih davranışı eklenti README dosyasındadır. Beş dakikalık veri önbelleği
korunur; rastgele seçkiler her sayfa yüklemesinde yeniden seçilir. Tam sayfa önbelleği kullanılıyorsa
ana sayfa JavaScript'inin çalışmasına izin verilmelidir.

Kontroller: `npm test`, `node tests/live-theme.mjs`, `php tests/dashboard.php`,
`php tests/discogs.php`, `php tests/manual-covers.php`. Paket üretimi:
`node scripts/build-wordpress.mjs` ve `python3 scripts/package-wordpress.py`.
Gerçek WordPress kurulumu ve canlı NocoDB/Discogs bağlantısı ayrıca test edilmelidir.


Sürüm numaralı kurulum paketleri: [Tema 0.6.0](vinyl-archive-theme-0.6.0.zip) ve
[NocoDB eklentisi 1.3.0](vinyl-nocodb-plugin-1.3.0.zip). Git sürüm etiketleri:
`theme-v0.6.0` ve `plugin-v1.3.0`.


## Koleksiyon filtreleri ve alım sırası — tema 0.7.0 / eklenti 1.4.0

Güncel paketler: [Tema 0.7.0](vinyl-archive-theme-0.7.0.zip) ve
[NocoDB eklentisi 1.4.0](vinyl-nocodb-plugin-1.4.0.zip). İkisini birlikte güncelleyin.

Gerçek Format değerleri tekli için `LP`, ikili için `LP (2)`, Flexi için `Flaxy`,
taş plak için `78` olarak eşlenir; Boxset, 10″ ve Single grupları korunur.
Ana sayfadaki toplam ve yedi format göstergesi `/koleksiyon/` sayfasını ilgili filtreyle açar.
Koleksiyonum sayfasında format, tür ve arama birlikte kullanılabilir. Tüm formatlar
seçildiğinde tüm halka açık plaklar listelenir. Varsayılan sıra sanatçı A–Z'dir;
Z–A ve alım ayına göre yeni/eski sıraları da seçilebilir. Temizle tüm filtreleri ve
sıralamayı sıfırlar. Aynı alım ayı içindeki sıra sanatçı, ardından albüm adına göredir;
alım ayı bilinmeyen kayıtlar her iki alım sıralamasında da sonda kalır.

`Purchase_Date` için İngilizce ay ve iki basamaklı yıl desteklenir:
`September 25` = Eylül 2025. İki basamaklı yıllar 2000–2099 olarak yorumlanır;
`December 1999` gibi dört basamaklı yıl ve önceki ISO tarih biçimi de desteklenir.
PHP bu değerlerden aylık toplamları ve göreli sıralama numarasını hesaplar; bireysel
tarih veya ay alanı tarayıcıya gönderilmez. Yeni veri önbellek anahtarı ilk istekte
eski format/tarih hesaplarını yeniler. NocoDB verileri ve şeması değiştirilmez.


## Otomatik arşiv sayfaları — tema 0.7.1

Tema etkinleştirildiğinde veya güncellemeden sonra bir yönetici WordPress panelini açtığında,
eksik `koleksiyon` (Koleksiyonum) ve `imzali-plaklar` (İmzalı Plaklar) sayfaları yayımlanarak
oluşturulur. Mevcut sayfalara, içeriklerine ve yayın durumlarına dokunulmaz. Yeni sayfa oluşturulduğunda
kalıcı bağlantı kuralları yenilenir; tekrar ziyaretlerde sayfalar çoğaltılmaz. Taslak/özel mevcut
sayfa varsa halka açmak için Sayfalar bölümünden kendiniz yayımlayın. Ana sayfa ve okuma ayarları değişmez.
Tema 0.7.1 ZIP'ini yükleyip etkinleştirin ve **Yönetim Paneli**ni bir kez açın;
ardından `/koleksiyon/` ve `/imzali-plaklar/` adreslerini ziyaret edin. Eklenti 1.4.0 ile uyumludur.
