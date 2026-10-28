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
