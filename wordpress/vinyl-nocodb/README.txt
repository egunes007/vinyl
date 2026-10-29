VINYL ARCHIVE — NocoDB bağlantısı 1.2.0
WordPress 6.5+ / PHP 8.1+

KURULUM
1. Güncel vinyl-archive-theme.zip temasını Görünüm > Temalar > Yeni tema > Tema yükle yolundan yükleyin. Eski sürüm varsa yeni sürümle değiştirin. Etkinleştirin.
2. vinyl-nocodb-plugin.zip dosyasını Eklentiler > Yeni eklenti > Eklenti yükle yolundan yükleyin ve etkinleştirin.
3. Ayarlar > Vinyl NocoDB sayfasını açın.
4. Adres: http://192.168.1.13:8080
   Tablo: m4z9hmr4f6ylz8m
   API token: NocoDB üzerinden aldığınız salt okunur yetkili token.
5. Kaydet ve bağlantıyı test et düğmesine basın.
6. Başarılı kayıt sayısı görüntülendikten sonra siteyi açın. Tema eklentiyi algılar ve örnek verileri gerçek verilerle değiştirir.

Token'ı sohbete veya GitHub'a yazmayın. Yalnızca kendi WordPress yönetim panelinizde tanımlayın. Token HTML'ye, tarayıcı JavaScript'ine veya halka açık REST uç noktasına aktarılmaz. Ayarlardan kaydedilen token WordPress veritabanında şifrelenmemiş ve autoload kapalı olarak saklanır; veritabanı erişimi/yedekleri de korunmalıdır. Panel erişiminde HTTPS kullanın. Alternatif olarak wp-config.php içinde VINYL_NOCODB_TOKEN sabiti güvenli biçimde tanımlanabilir; bu sabit varsa ayarlardaki token girişi devre dışı kalır. wp-config.php dosyasını depoya yüklemeyin.

YEREL AĞ
Bu adrese WordPress konteyneri erişebilmelidir; tarayıcıdan erişilebilmesi tek başına yeterli değildir. Bağlantı başarısızsa IP, NocoDB'nin yayımlanan portu ve konteyner ağlarını kontrol edin. Ortak Docker ağında konteyner adı ve NocoDB'nin iç portu da kullanılabilir. localhost WordPress konteynerinin kendisidir. Eklenti ev ağınıza erişim sağlamak için port açmaz veya Docker ayarı değiştirmez. HTTP token'ı ağda şifrelemez; sadece güvenilir yerel ağda kullanın, mümkünse HTTPS tercih edin. NocoDB'yi internete açmayın.

GİZLİLİK VE VERİ
Salt okunur GET /api/v2/tables/{table}/records kullanılır. NocoDB kayıtları veya şeması değiştirilmez. Yalnızca Artist, Album, Release_Date, Pressing_Date, Pressing_Country, Label, Genre, Style ve Format bilgileri ve imzalı/öne çıkan işaretleri siteye aktarılır.
Notes sadece PHP içinde imza belirlemek için değerlendirilir ve aktarılmaz. Price, Purchase_Date, Record_Condition, Sleeve_Condition ve diğer tanımlanmamış alanlar aktarılmaz. Discogs_ID alanıyla isteğe bağlı kapak eşleştirmesi aşağıda anlatılmıştır. Cover_Image kullanılmaz; kapaksız plaklar yer tutucu ile gösterilir.

Is_Public alanı mevcutsa yalnızca true, 1, "1", "true", "TRUE" değerleri yayımlanır; false/boş/null değerler gizlenir. Alan yoksa tüm kayıtların izin verilen bilgileri yayımlanır. Eklenti bu alanı otomatik oluşturmaz. Koleksiyonunuzda özel tutmak istediğiniz albümler varsa yayından önce erişim düzeninizi gözden geçirin.

Notes içinde bağımsız kelime olarak "imzalı" veya "imzali" aranır. "imzasız", "imzalı değil", "imzali degil" ve "imza yok" ifadeleri imzalı sayılmaz. Notes metniniz başka bir biçim kullanıyorsa ayrıştırıcı ayrıca uyarlanmalıdır. Gerçek notlar bu geliştirme ortamında görülmedi.

ÖNBELLEK
Yalnızca izin verilen halka açık alanlar 5 dakika önbelleğe alınır. NocoDB'deki değişiklikler en geç önbellek yenilendiğinde görünür. Acil güncelleme/gizleme için ayarlarda Kaydet veya Kaydet ve bağlantıyı test et düğmesine basarak önbelleği temizleyin; varsa WordPress/CDN sayfa önbelleğini de temizleyin. Sunucu tarafındaki gizleme, önceden ziyaretçilere gönderilmiş içeriği geri alamaz.
100 kayıtlık sayfalarla en fazla 10.000 kayıt okunur; hata veya sınır durumunda eksik liste yayımlanmaz. API hatasının ham içeriği ziyaretçilere gösterilmez. Eklenti etkinken bağlantı başarısızsa örnek veriye geçilmez. Eklenti kapatılırsa tema prototip/örnek moduna döner ve örnek içerik uyarısı görünür.

DOĞRULAMA
PHP sözdizimi kontrolleri; gizlilik, imza, sayfalama, önbellek ve hata senaryoları için WordPress HTTP işlevlerini taklit eden PHP testleri; gerçek veri biçimiyle DOM etkileşim testleri çalıştırıldı. Tam WordPress kurulumu ve evdeki gerçek NocoDB bağlantısı bu bulut ortamından test edilmedi. Son doğrulamayı kendi panelinizde yapın; ilk yüklemede albüm/sanatçı alanları ve imzalı sayısını NocoDB ile karşılaştırın.

1.0.1: Artist ve Album alanları ikisi de boş satırlar sayılmaz. Aynı API birincil kimliği (Id/id) tekrar gelirse bir kez sayılır. Aynı sanatçı/albüme ait farklı kimlikli baskılar korunur. Güncellemede önbellek anahtarı yenilenir. NocoDB kayıtları silinmez veya değiştirilmez.

DISCOGS KAPAKLARI — 1.1.0
Bu özellik güncel Vinyl Archive 0.4.0 temasıyla çalışır. Önce hem temayı hem eklentiyi yeni ZIP'lerle güncelleyin. Dosyaları CasaOS üzerinden kopyalıyorsanız klasörlerin tamamını güncelleyin: temada functions.php, assets/app.js ve assets/wordpress.css; eklentide yeni discogs.php dahil bütün dosyalar gereklidir. NocoDB ayarları ve token güncellemede korunur.

1. Discogs hesabınızda https://www.discogs.com/settings/developers adresinden kişisel API token oluşturun.
2. WordPress > Ayarlar > Vinyl Discogs bölümüne girin.
3. Discogs kapak eşleştirmesini etkinleştir kutusunu işaretleyin, Discogs token'ını girip Ayarları kaydet düğmesine basın. Bu token NocoDB token'ından farklıdır. Sohbette veya GitHub'da paylaşmayın. Token, WordPress veritabanında autoload kapalı olarak saklanır. Alternatif olarak wp-config.php içinde VINYL_DISCOGS_TOKEN sabiti kullanılabilir. Yönetim paneline erişimde HTTPS önerilir; yerel HTTP şifreleme sağlamaz.
4. Kapakları eşleştir / devam et düğmesine basın. Sayfayı açık tutun. Her iki saniyede en fazla bir API isteği yapılır; birkaç yüz ID için ilk eşleştirme birkaç dakika sürebilir. Sonucu ekrandan takip edin. Sayfayı kapatır veya duraklatırsanız tamamlanan eşleşmeler korunur. Devam ederek eksikleri tamamlayabilirsiniz.
5. Siteyi Ctrl+Shift+R ile yenileyin. Önbellek eklentisi/CDN kullanıyorsanız sayfa önbelleğini de temizleyin. Kartlarda kapak ve Discogs kaynak bağlantısı, detayda büyük kapak görünür.

Yalnızca pozitif sayısal Discogs release ID değerleri desteklenir. 0, boş, master ID'si veya URL biçimi eşleştirilmez. NocoDB tablo yapısı ve kayıtları değiştirilmez. Aynı release ID için bir istek yapılır; farklı fiziksel baskı kayıtları tek albüme indirgenmez. Başka bir baskıya ait ID yanlış kapak getirebilir; eşleşmeleri özellikle kontrol edin.

İstek sabit HTTPS api.discogs.com/releases/{id} uç noktasına sunucudan gider; Authorization başlığında yalnızca Discogs token'ı kullanılır. NocoDB token'ı Discogs'a gönderilmez. Yönlendirmeler izlenmez, TLS doğrulaması kapatılmaz. Token veya ham API yanıtı ziyaretçilere aktarılmaz. Kapak URL'si ve release ID halka açıktır.

Görsel adresleri i.discogs.com/img.discogs.com HTTPS alanlarıyla sınırlandırılır. Görseller WordPress'e kopyalanmaz veya NocoDB Cover_Image alanına yazılmaz. Ziyaretçi tarayıcısı görseli Discogs'tan yüklediği için bu servise IP gibi normal bağlantı bilgilerini iletir. Referrer gönderilmez. İlgili gizlilik açıklamanızı buna göre düzenleyin.

Kapak URL önbelleği en fazla 6 saat kullanılır, 1 saat sonra yenilenmeye aday olur. WordPress'in kendi WP-Cron zamanlayıcısı dakikada en fazla iki kaydı sıra ile işler; işlem NocoDB üzerinde yazma yapmaz. WP-Cron ziyaretlere bağlıdır ve sayfanız az ziyaret alıyorsa yenileme gecikebilir. Bu durumda panelde Kapakları eşleştir düğmesiyle yenileyin veya sunucunuzun WordPress cron çalıştırma düzenini ayrıca yapılandırın. Süresi geçen URL gösterilmez; yenilenene kadar yer tutucu görünür. Eklenti devre dışı bırakılırsa zamanlayıcı temizlenir. Kapak eşleştirmesi kapatılırsa görseller gösterilmez.

404 ve kapaksız yanıtlar bir saat sonra yeniden denenir. 429 ve Retry-After hız sınırları dikkate alınır. 401/403 durumunda işlem durur, arka plan istekleri bir saat bekletilir; yeni token kaydetmek beklemeyi temizler. Hata yanıtının özel içeriği yayımlanmaz. WordPress sunucusu internette api.discogs.com:443 adresine erişebilmelidir; ziyaretçinin tarayıcısı da Discogs görsel sunucularına erişmelidir. WordPress.org erişiminizin daha önce başarısız olması Discogs'un da başarısız olacağını kanıtlamaz; gerçek sonucu bu panelden kontrol edin.

KULLANIM HAKLARI
Resmî API belgeleri: https://www.discogs.com/developers
Resmî API koşulları: https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use
Kapakların telif hakları hak sahiplerine aittir; API token'ı görsel lisansı sağlamaz. Özelliği açmadan önce kullanımınıza uygun güncel koşulları ve gerekli izinleri inceleyin. Kaynak bağlantısı gösterilmesi tek başına izin yerine geçmez. Ticari olmayan kişisel arşiv görünümü korunur; e-ticaret özelliği eklenmez.

DOĞRULAMA SINIRI
PHP sözdizimi, API taklitleri ile kimlik doğrulama izolasyonu/önbellek/hız sınırı/kapaksız yanıt testleri ve DOM üzerinde kapak/kaynak bağlantısı/bozuk görsel testleri geçti. Bu bulut ortamında Discogs token'ı yoktur; ağ politikası resmî Discogs web belgelerine erişimi de engellediğinden güncel koşul metni burada doğrulanamadı. Canlı API ve gerçek WordPress zamanlayıcısı evdeki WordPress üzerinde ayrıca doğrulanmalıdır. Token'ı buraya göndermeyin; panelin hata/sonuç mesajını paylaşabilirsiniz.

1.1.1: Discogs HTTP bekleme süresi 8 saniyeden 20 saniyeye yükseltildi. Ev sunucusunda gözlenen 10,3 saniyelik başarılı yanıt desteklenir. Yavaş bağlantıda arka plan görevi bir istekte durur; iki uzun isteğin PHP süre sınırını aşması önlenir. Elle eşleştirme, hâlâ geçerli kapakları yeniden sıraya almaz; böylece uzun eşleştirme turu tamamlanabilir. Her istek yaklaşık 10 saniye sürerse 316 kayıt yaklaşık bir saat alabilir. Duraklatıp devam etmek mümkündür. Tema değişikliği gerekmez.

MANUEL NOCODB KAPAKLARI — 1.2.0 / TEMA 0.5.0
NocoDB'deki mevcut Cover_Image alanına yüklenen görsel dosyaları desteklenir. Yeni alan oluşturulmaz; mevcut veriler değiştirilmez ve Discogs görselleri NocoDB'ye otomatik yazılmaz. Kapakları NocoDB arayüzünden yükleyebilirsiniz. Öncelik: Cover_Image > Discogs > yer tutucu. Discogs token'ı manuel kapaklar için gerekmez.

Eklenti 1.2.0 ve tema 0.5.0 paketlerinin bütün dosyalarını birlikte güncelleyin. Eklentide yeni manual-covers.php dosyası da olmalıdır. Ardından Ayarlar > Vinyl NocoDB > Kaydet ve bağlantıyı test et düğmesine basın ve siteyi Ctrl+Shift+R ile yenileyin.

Standart NocoDB attachment listesi/nesnesi ve JSON metni içinde signedUrl, url veya path alanları, /download/ yollarıyla desteklenir. Uzak sunucudaki URL'nin yolu yapılandırılmış NocoDB sunucusuna uyarlanır; token başka bir hosta gönderilmez. Farklı API depolama/attachment biçimleri varsa gerçek yanıt biçimine göre ayrıca uyarlama gerekebilir. Ev sunucunuzun gerçek attachment yanıtı bu geliştirme ortamında görülmedi.

Ham attachment URL'leri ve imzalı sorgu parametreleri tarayıcıya aktarılmaz. Halka açık albümün kapağı WordPress'in /wp-json/vinyl-archive/v1/cover/{anahtar} uç noktasından sunulur. Görsel adresinin bilinmesi tek başına yeterli değildir: güncel halka açık koleksiyon içindeki eşleşme kontrol edilir. Yalnızca NocoDB'nin /download/ yolları alınır; yönlendirmeler izlenmez. Fiyat ve özel notlar aktarılmaz.

JPEG, PNG, WebP, GIF kabul edilir; SVG/HTML kabul edilmez. Boyut sınırı 8 MB ve 40 megapikseldir. Görseller WordPress diskine kopyalanmaz, gerektiğinde yerel NocoDB'den alınır. Ön yüzden tembel yükleme kullanılır, tarayıcı 5 dakika önbellek tutabilir. Cover_Image değişiklikleri 5 dakikalık koleksiyon önbelleği yenilendiğinde görünür; panelde bağlantı testi önbelleği hemen yeniler. Albüm gizlenirse önceden tarayıcıya ulaşmış görseli geri çekmek mümkün değildir.

Discogs devre dışı olsa veya internet DNS'i çalışmasa da, WordPress'in yerel NocoDB bağlantısı çalışıyorsa manuel kapaklar gösterilebilir. Dosya okunamazsa Discogs'a, o da yoksa yer tutucuya dönülür. PHP API taklitleri ile attachment ayrıştırma, hedef host sınırlaması, özel URL gizliliği, gerçek PNG doğrulaması ve gizli kayıtlar; DOM testleriyle kapak önceliği ve hata geri dönüşü doğrulandı. Canlı attachment denemesi kullanıcı sunucusunda yapılmalıdır.


Dashboard — eklenti 1.3.0 / tema 0.6.0
--------------------------------------
İki ZIP paketini birlikte güncelleyin. İlk istek yeni önbellek anahtarıyla koleksiyonu tekrar okur.
NocoDB Format değerleri LP, 2LP, Boxset, 10″, Single, 78 RPM ve Flex olarak ayrı sınıflanır.
LP yalnızca tekli LP'dir; 2LP ve Boxset dahil her açık koleksiyon kaydı toplamda bir sayılır.
Bilinmeyen formatlar toplamda sayılır, belirli bir format grubuna tahminle eklenmez.
Sanatçı ülkesi Artist_Country alanından gelir; Pressing_Country ile karıştırılmaz.
Boş sanatçı/ülke/türler ayrı bir değer olarak sayılmaz. Çoklu ülke ve türler ayrı sayılır.
Purchase_Date sadece PHP içinde doğrulanır ve yıl/ay bazında toplamlara dönüştürülür.
Tarayıcıya tekil alım tarihi, Notes, Price, token veya özel attachment adresi gönderilmez.
ISO YYYY-MM-DD ve ISO zaman damgaları desteklenir. Eksik/geçersiz tarihler tabloda sayılmaz;
adetleri ayrı notta gösterilir. Aylık Toplam tüm formatları içerir, dört format sütunuyla sınırlı değildir.
Geçmiş seçilen yıldan önceki bütün tarihli açık kayıtları kapsar. Gizli/boş ve yinelenen API ID'leri sayılmaz.
WordPress yerel önbelleği ve toplu dashboard verisi güncellenir; NocoDB'ye yazma veya şema değişikliği yapılmaz.


Güncelleme 1.4.0 (tema 0.7.0 ile birlikte)
---------------------------------------
Gerçek DB değerleri: LP, LP (2), Boxset, 10″, Single, 78 ve Flaxy.
Purchase_Date artık September 25 gibi İngilizce ay/iki haneli yıl değerlerini okur.
25 -> 2025; iki haneli yıllar 2000–2099'dur. Dört haneli yıl ve ISO biçimi de desteklenir.
Sunucu aylık toplamları ve kayıtlara göreli ay sıralaması (purchaseOrder) ekler.
Bu sıra tarih/ay kodu değildir; aynı ay aynı sıra değerini alır, bilinmeyen ay null'dır.
Tekil Purchase_Date, Notes, fiyat ve özel attachment adresleri ziyaretçiye aktarılmaz.
Koleksiyon ekranı bu sıralamayla yeni/eski sırası sağlar; aynı ay sanatçı/albüm sırasına döner.
