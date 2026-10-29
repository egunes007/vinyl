# Her 10 dakikada bir eksik kapak — 1.0.0

[Yeni, ayrı workflow JSON dosyası](vinyl-one-cover-every-10-minutes-1.0.0.json).
Hedef: NocoDB **0.301.5**, `http://192.168.1.13:8080`, tablo `m4z9hmr4f6ylz8m`.

Akış: **10 dakika → kayıtları tara → ilk boş kapağı seç → Discogs release → binary indir → NocoDB’ye dosya yükle → alanı tekrar kontrol et → tek görseli kaydet.**

Döngü, batch veya dryRun seçeneği yoktur. **Elle çalıştırma da gerçek veri yazar.**
Her çalışmada en fazla bir kayıt güncellenir. İlk kayıt, sayısal `Id` sırasına göre kapağı boş ve
geçerli `Discogs_ID` içeren ilk kayıttır. Dolmuş kapaklar tekrar işlenmez; zamanla sonraki kayıtlara geçer.

## Kurulum

1. Önceki kapak otomasyonunu kapatın; aynı tabloyu iki otomasyon paralel işlemesin.
2. Yeni JSON'u **Import from File** ile içe aktarın.
3. Önceden oluşturduğunuz **NocoDB Header Auth** credential'ını Read collection, Upload image to NocoDB,
   Recheck empty cover ve Attach cover düğümlerinde seçin. Header `xc-token`, değer yazma/yükleme yetkili token'dır.
4. **Discogs release** düğümünde Discogs Header Auth credential'ını seçin.
   Header `Authorization`, değer `Discogs token=TOKENINIZ`. **Download cover** credential istemez.
5. **Configuration** düğümünde adres/tabloyu kontrol edin; eski adres ve tablo hazırdır.
6. **Execute Workflow** ile bir kez elle deneyin. Son düğümde `status: updated` çıkarsa
   NocoDB kaydının `Cover_Image` alanında tek görsel bulunduğunu kontrol edin.
7. Workflow'u **Save → Publish / Active** ile etkinleştirin (n8n sürümünüzdeki düğmeye göre).
   Schedule Trigger her 10 dakikada çalışır; editörün açık kalması gerekmez, n8n çalışıyor olmalıdır.

## Davranış

- Boş alan: null, boş metin, boş dizi veya `[]`. Dolu/bilinmeyen metaveri üzerine yazılmaz.
- Discogs'un ana kapağı seçilir; yoksa ilk görsel alınır. HTTPS Discogs görsel hostları doğrulanır.
- Görsel **binary data** olarak n8n'e indirilir, multipart `files` ile NocoDB'ye yüklenir.
- Yüklemenin tek dosya döndürmesi şarttır. PATCH yalnızca `Id` ve tek elemanlı `Cover_Image` dizisini içerir.
- Yazmadan hemen önce alan yeniden okunur. Kapak dolmuşsa veya release numarası değişmişse işlem durur.
  Bu atomik bir kilit değildir; elle alanı düzenlerken otomasyonu durdurun, paralel çalıştırmayın.
- Kapağı olmayan/404 dönen release 24 saat bekletilir; sonraki zamanlanmış çalışmada diğer kayıtlar seçilir.
  Bekletme n8n workflow static data'sında tutulur, NocoDB'ye takip alanı eklenmez.
  Static data yalnızca etkin workflow'un başarılı otomatik çalışmasında kalıcıdır; elle denemelerde kalıcı olmayabilir.
- 401/403/429, indirme/yükleme ve diğer sunucu hatalarında akış durur; sonraki zamanlama yeniden dener.
  İlk kayıt sürekli sunucu hatası verirse hata giderilene kadar ilerleme durabilir; execution durumunu kontrol edin.
- Eksik kapak kalmadığında akış First missing cover düğümünde yazmadan biter.
- En fazla 10.000 satır taranır; eksik tarama varsa yazma yapılmaz. Tek kayıt işlenir ama tarama birden fazla
  okuma isteği yapabilir. NocoDB şeması değişmez, API token'ları JSON'a yazılmaz.
- Önce dosya yükleme başarılı olup sonra yazma başarısız olursa NocoDB'de sahipsiz dosya kalabilir.
- WordPress kapak önbelleği 5 dakikada yenilenir. Canlı sitede sonuç hemen görünmeyebilir.

Yerel kontroller: `node tests/n8n-simple-covers.test.mjs`. JSON'u yeniden üretme:
`python3 automations/n8n/build-simple-workflow.py` (önceki 1.0.3 JSON'u kaynak şablon olarak kullanır).
Gerçek n8n'e erişimimiz yok; schedule, import ve canlı dosya aktarımı burada çalıştırılmadı.
