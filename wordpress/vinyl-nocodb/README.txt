VINYL ARCHIVE — NocoDB bağlantısı 1.0.0
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
Notes sadece PHP içinde imza belirlemek için değerlendirilir ve aktarılmaz. Price, Purchase_Date, Record_Condition, Sleeve_Condition ve diğer tanımlanmamış alanlar aktarılmaz. Cover_Image/Discogs üzerinden görsel indirme henüz yapılmaz; kapaksız plaklar yer tutucu ile gösterilir.

Is_Public alanı mevcutsa yalnızca true, 1, "1", "true", "TRUE" değerleri yayımlanır; false/boş/null değerler gizlenir. Alan yoksa tüm kayıtların izin verilen bilgileri yayımlanır. Eklenti bu alanı otomatik oluşturmaz. Koleksiyonunuzda özel tutmak istediğiniz albümler varsa yayından önce erişim düzeninizi gözden geçirin.

Notes içinde bağımsız kelime olarak "imzalı" veya "imzali" aranır. "imzasız", "imzalı değil", "imzali degil" ve "imza yok" ifadeleri imzalı sayılmaz. Notes metniniz başka bir biçim kullanıyorsa ayrıştırıcı ayrıca uyarlanmalıdır. Gerçek notlar bu geliştirme ortamında görülmedi.

ÖNBELLEK
Yalnızca izin verilen halka açık alanlar 5 dakika önbelleğe alınır. NocoDB'deki değişiklikler en geç önbellek yenilendiğinde görünür. Acil güncelleme/gizleme için ayarlarda Kaydet veya Kaydet ve bağlantıyı test et düğmesine basarak önbelleği temizleyin; varsa WordPress/CDN sayfa önbelleğini de temizleyin. Sunucu tarafındaki gizleme, önceden ziyaretçilere gönderilmiş içeriği geri alamaz.
100 kayıtlık sayfalarla en fazla 10.000 kayıt okunur; hata veya sınır durumunda eksik liste yayımlanmaz. API hatasının ham içeriği ziyaretçilere gösterilmez. Eklenti etkinken bağlantı başarısızsa örnek veriye geçilmez. Eklenti kapatılırsa tema prototip/örnek moduna döner ve örnek içerik uyarısı görünür.

DOĞRULAMA
PHP sözdizimi kontrolleri; gizlilik, imza, sayfalama, önbellek ve hata senaryoları için WordPress HTTP işlevlerini taklit eden PHP testleri; gerçek veri biçimiyle DOM etkileşim testleri çalıştırıldı. Tam WordPress kurulumu ve evdeki gerçek NocoDB bağlantısı bu bulut ortamından test edilmedi. Son doğrulamayı kendi panelinizde yapın; ilk yüklemede albüm/sanatçı alanları ve imzalı sayısını NocoDB ile karşılaştırın.
