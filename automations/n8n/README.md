# VINYL — Discogs kapaklarını NocoDB’ye aktarma (1.0.1)

İçe aktarılabilir dosya: [vinyl-discogs-covers-1.0.1.json](vinyl-discogs-covers-1.0.1.json).
Akış elle başlatılır, varsayılan olarak **önizlemedir** (`dryRun: true`) ve en fazla **5 kayıt** işler.
`Cover_Image` boş ve `Discogs_ID` geçerli olan kayıtları seçer. Sanatçı/albüm adıyla otomatik eşleştirme yapmaz.
Şemayı değiştirmez. Yazma modu açıldığında yalnızca seçilen kaydın `Cover_Image` alanını günceller.

## n8n’e kurulum

1. n8n’de yeni workflow açın, **Import from File** ile JSON dosyasını içe aktarın.
2. **Configuration** Code düğümünde `baseUrl` ve `tableId` değerlerini kontrol edin.
   Mevcut depodaki değerler `http://192.168.1.13:8080` ve `m4z9hmr4f6ylz8m` olarak önceden yazılıdır.
   Bu adres n8n konteynerinden erişilebilir olmalı. `localhost` n8n’in kendisidir.
3. İki **Header Auth** credential oluşturun; değerleri workflow koduna yazmayın:

   | Credential adı | Header Name | Header Value |
   |---|---|---|
   | NocoDB | `xc-token` | NocoDB API token’ınız |
   | Discogs | `Authorization` | `Discogs token=KENDI_TOKENINIZ` |

   **Read collection**, **Upload image to NocoDB**, **Recheck empty cover** ve **Attach cover**
   düğümlerinde NocoDB credential’ını; **Discogs release** düğümünde Discogs credential’ını seçin.
   NocoDB token’ı bu tabloyu okuyabilmeli, attachment yükleyebilmeli ve kayıt güncelleyebilmelidir.
   WordPress’in salt okunur token’ından ayrı bir otomasyon token’ı kullanın.
4. `dryRun: true`, `maxRecords: 5` ile **Execute Workflow** çalıştırın. **Completed** çıktısındaki
   `preview` kayıtları kapağı bulunanları, `skipped` kayıtları atlananları gösterir.
   Bu modda yükleme ve PATCH yapılmaz; Discogs ve NocoDB’ye okuma istekleri yapılır.
5. Eşleşmeleri kontrol ettikten ve tabloyu yedekledikten sonra `dryRun: false`, `maxRecords: 1`
   ile ilk gerçek kaydı işleyin. NocoDB’de kapak dosyasının yüklendiğini ve WordPress’te göründüğünü doğrulayın.
6. Sonra `maxRecords` değerini artırın (en fazla 1000). Tekrar çalıştırıldığında dolu kapaklar atlanır.
   Hiç uygun kayıt yoksa akış Select candidates düğümünde çıktısız tamamlanır; bu da yazma yapılmadığı anlamına gelir.
  Kapağı bulunamayan ilk kayıtlar sonraki çalışmalarda tekrar kontrol edilir; kalıcı bir kuyruk yoktur.

## İşleyiş ve sınırlar

- API v2 kayıtları 100’er alınır; 100 sayfa sınırında eksik tarama varsa akış yazmadan durur.
- Her kayıt tek tek işlenir, Discogs istekleri arasında 2 saniye beklenir.
- Discogs ana görseli, yoksa ilk görseli seçilir. Yalnız HTTPS `i.discogs.com` / `img.discogs.com` kabul edilir.
- `POST /api/v2/storage/upload-by-url` ile NocoDB dosyayı indirir. Bu nedenle **NocoDB konteynerinin de**
  Discogs görsel sunucusuna erişebilmesi gerekir. NocoDB dosyayı kendi attachment deposunda saklar;
  `Cover_Image` alanına geçici Discogs URL’si doğrudan yazılmaz.
- Yüklemeden sonra kayıt tekrar okunur. Kapak dolmuşsa veya Discogs ID değişmişse PATCH yapılmaz.
  Bu bir veritabanı kilidi değildir; akışı paralel çalıştırmayın ve çalışırken aynı alanı elle düzenlemeyin.
- Upload başarılı, recheck/PATCH başarısız olursa veya kayıt bu arada değişirse sahipsiz dosya kalabilir.
  Hatalarda tekrar koşmadan önce son kaydı kontrol edin; otomatik silme yapılmaz.
- 401/403/429 geldiğinde durur. Token/yetkiyi veya Discogs’un bekleme süresini kontrol edip sonra tekrar çalıştırın.
  Diğer ağ/HTTP hataları da yazmayı durdurur; TLS doğrulaması kapatılmaz, token’lı istekler yönlendirme takip etmez.
- Yükleme metaverisinde boyut/MIME varsa 8 MB sınırı ve JPEG/PNG/WebP/GIF türleri doğrulanır; beklenmeyen yükleme yanıtında kayıt değiştirilmez.
- Token’lar credential deposundadır; otomatik/manuel execution verilerinin kalıcı kaydı kapalıdır.
  Çalışma sırasında n8n editöründe kayıt başlıkları ve attachment metaverileri görülebilir.
- Discogs görsellerinin kullanım koşulları ve kapak telifleri geçerlidir; token görsel URL’sine eklenmez.
- WordPress eklentisi 1.4.0 mevcut NocoDB kapaklarını gösterir. Önbellek nedeniyle görünmesi 5 dakikayı bulabilir;
  gerekirse Vinyl NocoDB bağlantı testini çalıştırarak önbelleği yenileyin.

## Doğrulama durumu

Hedef NocoDB sürümü kullanıcı tarafından **0.301.5** olarak doğrulanmıştır; bu sürümde upload-by-url yolu ve istek gövdesi kaynak kodundan kontrol edilmiştir. n8n sürümü henüz belirtilmemiştir.

Workflow bağlantıları, varsayılan önizleme, seçim, alan koruma, tekrar kontrol ve Discogs URL izin listesi
`node --test tests/n8n-covers.test.mjs` ile yerel olarak test edilmiştir. Upload API yolu ve gövdesi
[resmi NocoDB kaynak koduyla](https://github.com/nocodb/nocodb/blob/0.301.5/packages/nocodb/src/controllers/attachments.controller.ts)
karşılaştırılmıştır. Bu ortamdan n8n/CasaOS’a bağlantı yok; **n8n’de import/çalıştırma ve gerçek NocoDB’ye
attachment yükleme henüz doğrulanmadı**. n8n ve NocoDB sürümlerine bağlı olarak düğüm/API uyarlaması gerekebilir.
Düğümler HTTP Request 4.2, Code 2, Loop Over Items 3, If 2.2 ve Wait 1.1 sürümlerini kullanır.
`python3 automations/n8n/build-workflow.py` workflow JSON dosyasını yeniden üretir; n8n yalnız JSON’u içe aktarır.


## 1.0.1 düzeltmesi

n8n Code sandbox'ında bulunmayan global `URL` bağımlılığı kaldırıldı. Hem Validate configuration
hem Choose image düğümleri artık harici modül veya özel n8n ayarı gerektirmeyen sıkı adres
kontrolleri kullanır. Testler de `URL` globali olmadan çalıştırılır. Önceki workflow'u durdurup
1.0.1 JSON dosyasını yeni workflow olarak içe aktarın, credential seçimlerini yeniden yapın.
`dryRun: true` ile başlatın; önizleme hâlâ varsayılandır.
