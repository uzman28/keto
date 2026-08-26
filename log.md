# Keto Uygulaması — Çalışma Günlüğü

Son güncelleme: 18 Ağustos 2026

Bu dosya projede yapılan işlerin, alınan kararların ve karşılaşılan sorunların kaydıdır. Amaç: aylar sonra "bunu neden böyle yapmıştık?" sorusuna cevap verebilmek.

---

## 1. Proje künyesi

| | |
|---|---|
| Depo | https://github.com/uzman28/keto (private) |
| Ana dal | `main` |
| Framework | Expo SDK 57 / React Native 0.86.2 / React 19.2.3 |
| Yönlendirme | expo-router 57 (typed routes açık) |
| Depolama | AsyncStorage (cihaz dışına hiçbir veri gitmiyor) |
| Dil | TypeScript 6 |

Kural: kod yazmadan önce **sürümlenmiş** Expo dokümanlarına bakılacak — https://docs.expo.dev/versions/v57.0.0/ (bkz. `AGENTS.md`).

---

## 2. Git ve GitHub kurulumu

Başlangıçta git kuruluydu (2.55.0) ve klasörde depo başlatılmıştı ama **hiç commit yoktu**, kullanıcı kimliği de tanımlı değildi.

Yapılanlar:

- Global kimlik: `uzman28` / `sinanogluharun539@gmail.com`
- `init.defaultBranch` → `main`
- İlk commit `32c4bb4` (55 dosya)
- Dal adı `master` → `main` (GitHub standardı; boş depoya push ederken uyumsuzluk çıkmasın diye)
- `origin` eklendi ve push edildi

Depo GitHub'da **elle** oluşturuldu (boş; README/gitignore/lisans işaretlenmeden), çünkü `gh` CLI kurulu değil.

> **Not:** `gh` hâlâ kurulu değil. Bu yüzden PR'lar komut satırından açılamıyor, tarayıcıdan açılması gerekiyor. Kurmak için: `winget install --id GitHub.cli -e` ardından `gh auth login` — bu ikinci adımı kullanıcının kendisi yapmalı.

---

## 3. Telefonda çalıştırma — yaşanan sorunlar

En çok zaman kaybettiren kısım buydu; tekrar yaşanırsa diye ayrıntılı yazıldı.

### 3.1 Expo Go sürümü

SDK 57 için Android'de Expo Go **Play Store'dan gelmiyor**, doğrudan APK olarak dağıtılıyor (sürüm 57.0.3):

https://expo.dev/go?sdkVersion=57&platform=android&device=true

Play Store'daki Expo Go daha eski bir SDK'yı destekliyorsa proje hiç açılmaz.

### 3.2 `Failed to download remote update`

Telefonda alınan hata:

```
Uncaught Error: java.io.IOException: Failed to download remote update
```

Bu hata **ağ kaynaklı**; APK sürümüyle ilgisi yok. Telefon, bilgisayardaki Metro sunucusundan JS paketini indiremiyor demek.

Tespit edilen sebep: **Mullvad VPN açıktı** (Belçika sunucusuna bağlı). Mullvad varsayılan olarak yerel ağ paylaşımını engelliyor; telefon `192.168.1.15`'teki bilgisayara hiç ulaşamıyordu.

İkinci risk: bilgisayarda iki ağ arayüzü vardı (Wi-Fi `192.168.1.15`, Mullvad `10.133.37.100`). Expo yanlış arayüzü seçip QR'a ulaşılamaz bir adres yazabiliyor.

**Kontrol listesi** (sorun tekrarlarsa sırayla):

1. VPN kapalı mı? Açıksa Mullvad → Settings → VPN settings → **Local network sharing** açık mı?
2. Telefon ve bilgisayar aynı Wi-Fi'da mı? (Telefon mobil veriye düşmüş olabilir.)
3. QR'daki adres LAN IP'sini mi gösteriyor? Değilse: `EXPO_PACKAGER_HOSTNAME=192.168.1.15 npx expo start --clear`
4. Hiçbiri olmazsa yerel ağı hiç kullanmayan tünel: `npx expo start --tunnel`

> Sorun VPN kapatıldıktan sonra çözüldü, ancak hangi adımın belirleyici olduğu kesin olarak doğrulanmadı. Kalıcı çözüm Expo Go yerine **development build** (EAS Build) kullanmaktır — o zaman SDK / Expo Go sürüm uyumu derdi tamamen ortadan kalkar.

### 3.3 Bağımlılık sürümleri

`npx expo-doctor` 21 kontrolden 20'sini geçti. Kalan uyarı 4 paketin patch sürümünün geride olmasıydı; `npx expo install --check` ile düzeltildi (`expo`, `expo-linking`, `expo-router` güncellendi).

---

## 4. Yapılan geliştirmeler

### Commit `93552ef` — Safe area, tarif detay, rehber ve ayarlar

**Sorun:** İçerik durum çubuğunun ve Android gesture çubuğunun altında kalıyordu. `react-native-safe-area-context` yüklüydü ama projede **hiç kullanılmamıştı**. Uygulamayı en çok "amatör" gösteren şey buydu.

- `SafeAreaProvider` root layout'a eklendi
- Ortak `src/components/Screen.tsx` bileşeni üst/alt sistem boşluklarını yönetiyor
- Tab bar yüksekliği ve alt boşluğu cihazın insets değerine göre hesaplanıyor
- Onboarding ekranına da insets uygulandı

**Sorun:** 12 tarifin malzeme, yapılış ve püf noktası verisi yazılmıştı ama **hiçbir ekrandan erişilemiyordu** — kart tıklanabilir değildi, detay ekranı yoktu. İçeriğin büyük kısmı boşuna bundle'a gidiyordu.

- `app/recipe/[id].tsx` oluşturuldu
- `RecipeCard` tıklanabilir yapıldı
- Kart görsellerine koyu perde eklendi (açık renkli fotoğraflarda beyaz yazı okunmuyordu)
- Favori listesi `useFocusEffect` ile tazeleniyor — detayda eklenen favori aksi halde listede görünmüyordu

**Sorun:** Dört sekmenin ikisi (Rehber, Ayarlar) tamamen boştu.

- Rehber: 8 makale, 5 kategorili yatay filtreyle
- Ayarlar: profil özeti, hesaplanan hedefler, profil güncelleme, onaylı veri sıfırlama
- Yazılmış ama hiçbir yerden çağrılmayan `clearProfile()` bağlandı

Ufak düzeltme: `recipes.tsx` içinde iki dalı da aynı olan ölü bir ternary vardı, "Diğer tarifler" olarak düzeltildi.

### Commit `b137c03` — Günlük makro takibi

**Sorun:** Uygulama hedefi hesaplıyor ama hiçbir şey hatırlamıyordu; bir hesap makinesiydi.

Kullanıcıyla netleştirilen kapsam:

| Karar | Seçim |
|---|---|
| Takip nerede dursun | Ana sayfa dashboard'a dönüşsün (5. sekme açılmasın) |
| Nasıl ekleneceği | Şimdilik sadece tariflerden (elle makro girişi yok) |
| Geçmiş günler | Arayüzde sadece bugün (veri yine tarihe göre saklanıyor) |

- `LogEntry` / `DayLog` tipleri, ortak `FoodMacros` tipi
- `src/date.ts`: yerel tarihten `YYYY-MM-DD` anahtarı
- `storage.ts`: `getEntriesForDate` / `addLogEntry` / `removeLogEntry`
- `macros.ts`: `scaleMacros` (porsiyon çarpanı), `sumMacros` (gün toplamı)
- Tarif detayında porsiyon seçici (0.5 / 1 / 1.5 / 2) ve "Güne ekle" kartı
- Ana sayfa: kalan kalori, dolum çubuğu, üç makro çubuğu, silinebilir kayıt listesi, boş durum yönlendirmesi
- `MacroBar` eklendi, kullanılmayan `MacroCard` kaldırıldı

### Elle giriş, su takibi, geçmiş günler, kilo takibi (henüz commit'lenmedi)

Dördü birden istendi, sırayla yapıldı.

**Elle makro girişi** — takip yalnızca 12 tarifle çalışıyordu, dışarıda yenen bir öğün kaydedilemiyordu. `app/add-entry.tsx` eklendi; ad + kcal/yağ/protein/net karb alınıyor, boş bırakılan makrolar 0 sayılıyor. `LogEntry`'de `recipeId` / `mealType` / `servings` opsiyonel yapıldı.

Bu sırada bir hata yakalandı: `NumberInput` metin alanı için kullanılınca ad alanına sayı klavyesi çıkıyordu — harf yazılamazdı. Bileşen `LabeledInput` olarak genelleştirildi (`keyboardType` opsiyonel, `placeholder` eklendi).

**Su takibi** — `@keto/water` altında tarihe göre bardak sayısı. Ana sayfada artır/azalt kartı, 8 bardaklık görsel gösterge. 8 rehber değer, katı hedef değil.

**Geçmiş günler** — ana sayfaya ileri-geri tarih gezintisi eklendi. Gelecek günler kapalı, geçmiş güne bakarken "Bugüne dön" düğmesi çıkıyor. Kayıtlar ve su seçili güne göre okunuyor. Veri zaten tarihe göre saklandığı için altyapı değişikliği gerekmedi.

**Kilo takibi** — `react-native-svg` kuruldu (Expo Go'da hazır geliyor, ek kurulum yok). `app/weight.tsx`: başlangıç/şu an/değişim özeti, çizgi grafik, geçmiş ölçüm listesi (silmek için basılı tut). Gün başına tek ölçüm; aynı güne yeniden girilirse güncelleniyor. Ayarlardan erişiliyor.

---

## 4b. Besin veritabanı planı (Aşama 1 tamamlandı)

Hedef: elle makro girmek yerine yiyecek adını yazıp değerlerini seçmek — FatSecret'ın
yaptığı gibi.

### Kaynak araştırması

| Kaynak | Sonuç |
|---|---|
| Open Food Facts | Barkodla doğru çalışıyor ama **paketli ürün** odaklı. "yumurta" araması Ülker kraker, Coca-Cola gibi alakasız sonuç verdi. Genel yiyecek için uygun değil. |
| USDA FoodData Central | Kamu malı (CC0), saatte 1000 istek, önbelleğe alma ve dağıtma serbest. Ama İngilizce/Amerikan besinleri. |
| FatSecret | Türkçe destekli, lif alanı var (net karb hesaplanabilir), porsiyon bilgisi var. Seçilen kaynak. |

### FatSecret koşulları

- Ücretsiz **Basic** katman: **5.000 çağrı/gün**, kullanılmayan hak devretmiyor
- Veri saklama: **çoğu veri en fazla 24 saat**; bazı ID'ler süresiz
- OAuth 2.0'da IP kısıtı dokümanda zorunlu değil, ama `Invalid IP address detected` hata kodu var → belirsiz
- Anahtar mobil uygulamaya konulamaz, proxy şart

**Türkçe yerelleştirme** ücretli katman gerektirebiliyordu; uygulama zaten İngilizceye
geçeceği için bu sorun ortadan kalktı, ücretsiz katmanın varsayılan US/İngilizce'si yeterli.

### 24 saat kuralının senkrona etkisi

Kullanıcının günlüğü buluta taşınırken FatSecret türevi makroları sunucumuzda süresiz
saklayamayız. Çözüm, kaydı kaynağına göre ayırmak:

- `source: 'recipe' | 'manual'` → makrolar saklanır, FatSecret'la ilgisi yok
- `source: 'fatsecret'` → sunucuda yalnızca `externalId` ve `grams` durur; makro cihazda
  kalır, yeni cihazda ID'den bir kez yeniden çekilir

### Ücretsiz katmanda neyin açık olduğu (canlı test edildi)

`server/probe-scopes.ts` ile tarandı. Sonuçlar:

| Uç | Basic | Not |
|---|---|---|
| `foods/search/v3`, `foods.search.v3` | ❌ | `hata 14: Missing scope 'premier'` |
| `foods.search` (v1, `server.api`) | ✅ | id, ad, marka + tek satır özet metin. **Lif yok** |
| `food.get.v5`, `v4`, `v2` | ✅ | Tam değerler, **lif dahil**, tüm porsiyonlar |

`scope=premier` istenince token bile alınamıyor (`invalid_scope`).

**Sonuç: akış iki adımlı.** Önce `foods.search` ile listele, kullanıcı bir sonuca
dokununca `food.get.v5` ile detayını çek. Yan faydası, 5.000/gün kotasının 50
sonucun tamamı için detay çekilerek harcanmaması.

Arama ucu makroları yapısal alan yerine tek satır metinde veriyor:
`"Per 100g - Calories: 147kcal | Fat: 9.94g | Carbs: 0.77g | Protein: 12.58g"`.
`parseFoodDescription` bunu çözüyor. Listede gösterilen değer **toplam**
karbonhidrattır, net değil — net karbonhidrat ancak detay çağrısında hesaplanabiliyor.

Canlı test ("egg"): 8 sonuç, 8'inin de özeti çözümlendi. Detayda 6 porsiyon geldi —
aralarında **"1 medium (44 g)"**, yani örnek alınan uygulamadaki "1 orta boy • 44g"
satırının kaynağı bu.

### IP kısıtı (doğrulandı)

FatSecret OAuth 2.0'da da IP whitelist uyguluyor: `hata 21 Invalid IP address detected`.
Panelde **Generate / View API Keys → IP Restrictions**'tan ekleniyor, ücretsiz katmanda
**15 tekil IP**; aralık (`0.0.0.0/0`) yalnızca Premier'da.

Bu, aracı sunucuyu zorunlu kılıyor — anahtar güvenliğinden bağımsız ikinci bir sebep:
her kullanıcının telefonu farklı IP'den çıkar, 15 IP ile bu karşılanamaz.
**Supabase Edge Function ve Cloudflare Workers elendi** (sabit çıkış IP'leri yok).
Yayına alırken Fly.io ayrılmış IPv4 (~2$/ay) veya küçük bir VPS gerekecek.

### API uçları (doğrulandı)

```
POST https://oauth.fatsecret.com/connect/token
     Basic auth (client id:secret), grant_type=client_credentials&scope=basic
     Token 24 saat geçerli

GET  https://platform.fatsecret.com/rest/foods/search/v3
     ?search_expression=...&max_results=50&format=json
     Authorization: Bearer <token>
     Porsiyon başına TAM besin değeri döner — lif dahil, yani net karb hesaplanabilir

GET  https://platform.fatsecret.com/rest/food/v5?food_id=...&format=json
     Tek besin; Aşama 3'te ID'den yeniden canlandırma için
```

Eski tek uçlu `POST /rest/server.api` (`method=food.get.v5`) da aynı işi görüyor;
kaynak bazlı yeni uçlar tercih edildi.

### Aracı sunucu (`server/`)

```
server/fatsecret.ts   FatSecret istemcisi — token, arama, detay, normalleştirme
server/cache.ts       12 saatlik TTL önbellek + IP başına hız sınırı
server/api.ts         Uç noktalar; platformdan bağımsız (düz nesne al, düz nesne dön)
server/server.ts      Node girişi (node:http adaptörü)
server/smoke.js       Canlı yoklama betiği
server/probe-scopes.ts Hangi uçların Basic'te açık olduğunu tarar
```

Uygulamanın gördüğü uçlar:

```
GET /health
GET /api/foods/search?q=egg&limit=20   → { results: [...], cached: bool }
GET /api/foods/3092                     → { food: {...}, cached: bool }
```

Çalıştırma:

```
FATSECRET_CLIENT_ID=... FATSECRET_CLIENT_SECRET=... node server/server.ts
```

**Node sıyırma modu kısıtı:** `server/` dosyaları `node file.ts` ile doğrudan
çalışıyor. Bu mod TypeScript'in parametre özelliği (`constructor(private x)`),
enum ve namespace sözdizimini desteklemiyor — `cache.ts` bu yüzden alanları
açıkça tanımlıyor. Sunucunun kendi `tsconfig.json`'ı var, uygulamanınkinden
hariç tutuldu (farklı çalışma zamanı, farklı `lib`).

### Arama neden tek katmana indirildi

İlk kurguda arama iki katmanlıydı: üstte yerel 55 besinlik liste, altında FatSecret.
Kullanıcı kararıyla **yerel katman aramadan kaldırıldı** — tüm sonuçlar internetten
gelecek. `src/food-search.ts` ve `src/components/FoodSearchRow.tsx` silindi.

Kaldırmadan önce yerel sıralamada iki kusur tespit edilmişti (canlı demoda çıktı):

- `"kola"` araması "Bitter çikolata"yı öne alıyordu — katlanmış "cikolata" içinde "kola"
  geçiyor ve kelime-ortası eşleşme (40 puan) takma addan (30 puan) yüksekti
- `"et"` araması "Ketçap"ı getiriyordu — iki harflik sorgular kelime ortasında eşleşince
  gürültü üretiyor

Katman kaldırıldığı için bu kusurlar da ortadan kalktı; düzeltmeye gerek kalmadı.

**Korunanlar:** `src/data/foods.ts` duruyor, çünkü ana sayfadaki "Ketoya uygun mu?"
vitrini ve `app/foods.tsx` trafik ışığı ekranı ondan besleniyor. Onlar arama değil,
eğitim özelliği.

**Bedeli:** İnternet yokken yiyecek araması hiç çalışmıyor. Çevrimdışı tek yol
"Elle gir" sekmesi; arama sekmesi bu durumda açık bir "Bağlanılamadı" kartı gösteriyor
ve kullanıcıyı oraya yönlendiriyor.

### Uygulamanın aracıya nasıl bağlandığı

`src/food-remote.ts` adresi şöyle çözüyor:

1. `EXPO_PUBLIC_FOOD_API_URL` tanımlıysa onu kullanır (üretim)
2. Yoksa Metro'nun `Constants.expoConfig.hostUri` bilgisinden türetir —
   telefon zaten bilgisayara o adresten bağlanıyor, aracı aynı makinede 8787'de
3. İkisi de yoksa uzak arama **sessizce kapanır**, uygulama yerel listeyle çalışır

`hostUri` Expo tarafından dokümante edilmediği için savunmacı okunuyor.

### Aşama planı

| | İş | Sunucu | Durum |
|---|---|---|---|
| 1 | Food modeli + yerel arama ekranı | hayır | ✅ bitti |
| 2 | FatSecret istemcisi (`server/`) | — | ✅ yazıldı, anahtar bekliyor |
| 2b | Aracı sunucu + uygulama entegrasyonu | — | ✅ yerelde çalışıyor |
| 2c | Sabit IP'li barındırmaya alma | evet | yayına alırken |
| 3 | Günlük senkronu | evet | bekliyor |
| 4 | İngilizce çeviri | hayır | bekliyor |

Aracı platformdan bağımsız yazılacak: önce Supabase Edge Function, IP kısıtına takılırsak
aynı kod sabit IP'li bir yere (Fly.io ayrılmış IPv4) taşınır.

### Aşama 1'de yapılanlar

`Food` tipi kayıt tutabilir hale geldi: `netCarbPer100g` + serbest metin `portionNote`
yerine tam `per100g` makroları ve yapısal `portions` dizisi. 55 besinin tamamına kalori,
yağ, protein ve gerçek ev ölçüleri eklendi; `aliases` alanıyla "tavuk", "kola", "peynir"
gibi yaygın aramalar karşılanıyor.

Yerel liste 200'e çıkarılmadı — uzun kuyruğu FatSecret karşılayacak. Liste iki iş için
duruyor: trafik ışığı eğitimi (API'de yok) ve çevrimdışı alt katman. Küçük kalması
İngilizce göçünü de ucuzlatıyor.

## 5. Tasarım ve mimari kararlar

**Neden `toISOString()` kullanılmadı?** UTC'ye çevirdiği için gece yarısı civarında günü bir gün kaydırıyordu. `src/date.ts` yerel saate göre anahtar üretiyor.

**Neden `Intl.DateTimeFormat` kullanılmadı?** Hermes'te Intl desteği platforma göre değişebiliyor. Gün etiketi elle biçimlendiriliyor (`18 Ağustos, Salı`).

**Neden tek AsyncStorage anahtarı?** Kayıtlar `@keto/log` altında tarihe göre gruplanıyor. Tek okuma/yazma, birkaç KB. Sınırsız büyümesin diye her yazmada **son 90 gün** tutulup gerisi budanıyor.

**Neden net karbonhidrat farklı davranıyor?** Keto'da net karb bir **tavan**, diğerleri **hedef**. 25 g'ı aşmak kötü, 136 g proteine ulaşmak iyi. `MacroBar` bunu `isCeiling` prop'uyla ayırıyor: aşılınca çubuk kırmızıya dönüyor.

**Neden kalori için halka değil çubuk?** Başta `react-native-svg` bağımlılığı istenmediği için çubuk yapıldı. Kilo grafiği için bu paket sonradan kuruldu, dolayısıyla halkanın önündeki engel kalktı — istenirse artık kolayca geçilebilir.

**Neden grafik genişliği `onLayout` ile ölçülüyor?** SVG piksel koordinatlarıyla çalışıyor; nokta konumları yüzdeyle verilemiyor. Genişlik ölçülene kadar grafik render edilmiyor.

**Neden gün başına tek kilo ölçümü?** Gün içinde kilo su/sindirim yüzünden dalgalanıyor; birden fazla ölçüm grafiği gürültüye boğardı. Aynı güne ikinci giriş öncekini güncelliyor.

**Neden `toLowerCase()` yetmiyor, elle katlama var?** Ölçtüm: `'İ'.toLowerCase()` iki kod
noktası üretiyor (`i` + birleşen nokta), `'I'` ile `'ı'` birbirine eşitlenmiyor. Sonuç:
`'Kaşarlı Menemen'.toLowerCase().includes('kasarli')` → **false**. Yani kullanıcı şapkasız
yazınca hiçbir şey bulamıyordu. `foldTurkish` önce harfleri elle çeviriyor, küçültmeyi
ondan sonra yapıyor — sıra değişirse arama yine bozulur.

**Neden arama puanlı?** Düz `includes()` "yumurta" aramasında "Sucuklu Yumurta"yı
"Yumurta"nın üstüne koyabiliyordu. Tam eşleşme > baştan başlayan > kelime başı > içinde
geçen > takma ad sıralaması bunu düzeltiyor. Eşit puanlılar `localeCompare(…, 'tr')` ile
sıralanıyor ki ç, ğ, ı, ö, ş, ü doğru yere otursun.

**Neden aramada debounce yok?** Arama tamamen yerel ve senkron; her tuşta anında sonuç
veriyor. Debounce ancak Aşama 2'de ağ isteği girince gerekecek.

**Neden besinlerde trafik ışığı?** Yeni başlayan biri için en değerli bilgi "şunu yiyebilir miyim" sorusunun net cevabı. Gram değeri tek başına soyut kalıyor; `verdict` alanı (serbest / ölçülü / kaçın) bunu tek bakışta okunur hale getiriyor. Rozetler renge ek olarak ikon da taşıyor, renk körlüğünde ayırt edilebilsin diye.

Değerlendirme saf bir net karbonhidrat eşiği **değil**: brokoli 4 g ile serbest, bira 3.6 g ile kaçın grubunda. Biranın sebebi karbonhidrat değil alkolün öncelikli işlenmesi — bu yüzden her besinin `why` alanı var, sayı tek başına hikâyeyi anlatmıyor.

**Neden 100 g yanında porsiyon notu?** "Karpuz 100 g'da 7.5 g" düşük görünür ama kimse 100 gram karpuz yemez; bir dilim 300 g ve 22.5 g net karb. `portionNote` alanı gerçek hayattaki ölçüyü veriyor. Gram başına değere bakmanın neden yanıltıcı olduğu, veri setinin öğretmek istediği şeylerden biri.

**Neden seçili gün için ayrı bir context var?** Geçmiş gün gezintisi eklendiğinde tarih ana sayfada yerel state'ti. Tarif detayı bu tarihi bilmediği için hep bugüne yazıyordu: geçmiş bir güne bakarken tariften ekleme yaptığında kayıt yanlış güne düşüyordu. Elle ekleme ekranına tarih parametreyle geçiriliyordu, tarif ekranına geçirilmiyordu — yani aynı sorunun iki farklı çözümü vardı.

Kök sebep, seçili günün paylaşılan bir durum olması gerekirken tek ekrana ait olmasıydı. `src/day-context.tsx` bunu tek kaynağa çekti; ekleme yapan her ekran aynı günü okuyor ve butonlarda hangi güne yazacağını söylüyor ("Bugüne ekle" / "17 Ağustos, Pazartesi gününe ekle"). Parametre geçirme tamamen kalktı.

İstisna: kilo ekranı hâlâ doğrudan bugüne yazıyor. Orası gün gezintisinin parçası değil, Ayarlar'dan açılıyor ve etiketi "Bugünkü ölçüm" diyor — kendi içinde tutarlı.

**Neden "Verileri sıfırla" → "Profili sıfırla"?** Düğme yalnızca profili siliyordu; favoriler, günlük kayıtlar, su ve kilo ölçümleri duruyordu. Etiket yaptığı işten fazlasını vaat ediyordu.

**Neden su hedefi 8 bardak ve sabit?** Yaygın bir pratik, ama kişiye göre değişir. Bu yüzden aşılması sorun olmayan bir rehber olarak gösteriliyor (8'i geçince `+2` gibi ek sayaç çıkıyor), hedef çubuğu gibi davranmıyor.

**Neden context yerine `useFocusEffect`?** Ana sayfa ve tarif detayı aynı veriye dokunuyor ama aralarında canlı senkron gerekmiyor. Odaklanınca yeniden okumak yeterli ve daha az makine demek.

---

## 6. Doğrulama yöntemi

Her değişiklikten sonra çalıştırılanlar:

```bash
npx tsc --noEmit
```

```bash
npx expo export --platform android --output-dir ./tmp-export
```

İkincisi "gerçekten paketleniyor mu, tüm import'lar çözülüyor mu" sorusunu cevaplıyor; tip kontrolünün yakalamadığı hataları yakalıyor.

Günlük takip için ayrıca saf fonksiyonlara 9 kontrol yazıldı (porsiyon çarpanı, gün toplamı, boş gün, tarih anahtarı, sıfır dolgusu) — hepsi geçti. Mevcut makro hesabının bozulmadığı da aynı kontrolle teyit edildi.

> Cihazda görsel doğrulama **henüz yapılmadı**. Kod derleniyor ve paketleniyor, ancak yeni ekranların telefonda nasıl durduğu gözle kontrol edilmedi.

---

## 7. Açık işler

- [x] `b137c03` push edildi (DNS sorunu kendiliğinden düzeldikten sonra)
- [ ] PR açılmadı: https://github.com/uzman28/keto/pull/new/feature/tarif-detay-ve-safe-area
- [ ] Değişiklikler gerçek cihazda görsel olarak kontrol edilmedi
- [ ] `src/macros.test.ts` çalıştırılamıyor: `package.json`'da test script'i ve test framework'ü yok; dosya uzantısız import kullandığı için Node doğrudan çalıştıramıyor. Çözüm: `jest-expo` kurulumu.
- [ ] Tasarım cilası: özel font (`SpaceMono` projede duruyor ama yüklenmiyor), reanimated ile geçiş animasyonları (paket yüklü, hiç kullanılmıyor), kalori halkası
- [x] Tarif detayının her zaman bugüne yazması düzeltildi (bkz. aşağıdaki karar)
- [ ] Sonraki özellik adayları: alışveriş listesi, öğün planlayıcı, haftalık özet, tarif arama

### Geçmiş makine sorunu: DNS (çözüldü)

> **Durum:** Bu sorun kendiliğinden düzeldi ve `b137c03` push edildi. Kayıt, tekrar
> yaşanırsa teşhis yolu hazır olsun diye bırakıldı.

Push sırasında `Failed to connect to github.com:443` alınıyordu. Sorun projede değildi:

| Test | Sonuç |
|---|---|
| `curl https://github.com` | zaman aşımı |
| `curl --resolve github.com:443:140.82.121.4 https://github.com` | **200 OK** |
| `Resolve-DnsName github.com` (Wi-Fi DNS'ine doğrudan) | doğru cevap |

Sistem çözümleyicisi DNS sunucusu olarak yanıt vermeyen bir IPv6 link-local adresi (`fe80::1`) kullanıyor; muhtemelen Mullvad kapatılırken kalan artık. `hosts` dosyası temiz, lockdown modu kapalı, DNS önbelleği temizlendi — düzelmedi.

Denenecekler (en basitten): Wi-Fi'yı kapat aç → Mullvad'ı bağlayıp düzgünce kapat → adaptörde IPv6'yı kapat (`Disable-NetAdapterBinding -Name "Wi-Fi" -ComponentID ms_tcpip6`) → yeniden başlat.

---

## 8. Sık kullanılan komutlar

```bash
npx expo start
```

```bash
npx expo start --tunnel
```

```bash
npx expo start --clear
```

```bash
npx expo-doctor
```

```bash
npx expo install --check
```

Commit akışı:

```bash
git add . && git commit -m "ne değiştiğini yaz" && git push
```
