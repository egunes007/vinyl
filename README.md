# VINYL ARCHIVE

Türkçe, mobil uyumlu kişisel plak arşivi ön yüz prototipi. Koyu tema, kırmızı vurgular, CSS ile çizilmiş pikap ve özgün örnek albüm kapakları içerir.

## Kurulum yapmadan ön izleme

GitHub üzerinde **Code → Download ZIP** ile projeyi indirin. ZIP dosyasını çıkartın ve **ONIZLEME.html** dosyasına çift tıklayın. Bu dosya tüm stil ve JavaScript kodunu içerir; sunucu veya Node.js gerekmez. Kaynak dosyalar değişirse bu bağımsız ön izleme kopyasının da yeniden üretilmesi gerekir.

## Çalıştırma

Node.js 22 veya üstü gerekir. Harici bağımlılık ve kurulum gerektirmez.

```sh
cd /workspace/vinyl
npm start
```

Sunucu varsayılan olarak 3000 portunda çalışır. `PORT=3001 npm start` ile değiştirilebilir. Ortamınız port ön izlemesini destekliyorsa 3000 portunu açın; yerel bilgisayarda tarayıcıdan localhost:3000 adresine gidin.

`npm test`: örnek veriler üzerinde arama ve filtreleme kontrolleri.

## Kapsam

Ana sayfa, örnek istatistikler, öne çıkan ve son eklenen plaklar, sanatçı/albüm araması, tür filtresi, sanatçı ve tür bağlantıları, klavyeyle kapanabilen albüm detay penceresi ve mobil menü çalışır. Koleksiyonun tamamı sekiz örnek kayıttan oluşur; gerçek koleksiyon veya diskografi doğrulaması değildir. Albüm görselleri resmî kapaklar değildir; CSS ile üretilmiş grafik yer tutuculardır. Hakkımda metni örnektir.

Bu aşamada WordPress, CasaOS, NocoDB, Discogs ve gerçek verilerle entegrasyon yoktur. Token gerekmez. Hiçbir harici ağ isteği yapılmaz; kişisel veya yönetim alanları tutulmaz. Baskı bilgileri örnektir, ilk yayın yılı baskı yılı olarak kullanılmaz.

## Dosyalar

- `index.html`: semantik sayfa bölümleri
- `src/style.css`: tasarım ve responsive düzen
- `src/data.js`: örnek veri ve arama fonksiyonu
- `src/app.js`: kartlar, filtreler, menü ve detay etkileşimleri
- `server.mjs`: yalnızca ön yüz dosyalarını sunan geliştirme sunucusu

Tasarım onayından sonra gerçek veriye ait sunucu tarafı entegrasyon ve WordPress uyarlaması ayrı aşamalarda hazırlanacaktır.
