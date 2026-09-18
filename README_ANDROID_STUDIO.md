# Necm Kimya - Native Android Studio APK Projesi

Bu proje, Android Studio tarafından **tamamen Native bir Android Projesi** (Gradle + Kotlin + Android SDK) olarak tanınacak şekilde yapılandırılmıştır.

---

## 🚀 Android Studio ile APK Oluşturma (Adım Adım)

### 1. Projeyi Açın
1. **Android Studio**'yu başlatın.
2. Karşılama ekranında veya üst menüde: **File > Open** seçeneğine tıklayın.
3. Bu projenin **ana klasörünü** (veya içindeki `android/` klasörünü) seçip **OK** deyin.
4. Android Studio projeyi açtığında alt kısımda **"Gradle Build Running / Syncing"** yazacaktır.
   - Projede `settings.gradle`, `build.gradle` ve `app/build.gradle` mevcut olduğu için Android Studio bunu doğrudan bir **Android Uygulaması** olarak açar (asla web uygulaması olarak görmez).

---

### 2. Tek Tıkla APK Derleme
1. Gradle senkronizasyonu tamamlandıktan sonra üst menüden:
   👉 **Build > Build Bundle(s) / APK(s) > Build APK(s)** seçeneğine tıklayın.
2. Derleme bittiğinde sağ altta bir bildirim açılır:
   👉 **"APK(s) generated successfully for module 'app' with 1 build variant"**
3. Bildirimdeki mavi **"locate"** yazısına tıklayın.
4. Açılan klasörde APK dosyanız hazırdır:
   📁 `app/build/outputs/apk/debug/app-debug.apk`

---

### 3. Telefonunuzda veya Emülatörde Çalıştırma
- Android telefonunuzu USB kablosuyla bilgisayara bağlayın (USB Hata Ayıklama açık olsun) veya bir Emülatör açın.
- Android Studio üst çubuğundaki yeşil **Oynat (▶ Run)** butonuna basın.
- Uygulama telefonunuza otomatik yüklenip açılacaktır.

---

## 📁 Android Proje Mimarisi

- `settings.gradle` : Root Gradle ayarları (`rootProject.name = "NecmKimyaUretimTakip"`, `:app` modülü).
- `build.gradle` : Android Gradle Plugin (AGP 8.2.2) ve Kotlin (1.9.22) tanımları.
- `gradle/wrapper/` : Gradle 8.4 Wrapper dosyaları.
- `app/build.gradle` :
  - `namespace 'com.necmkimya.uretimtakip'`
  - `compileSdk 34`, `minSdk 24`, `targetSdk 34`
  - Release derlemeleri için debug anahtarı otomatik atanmıştır (Keystore derdi olmadan doğrudan APK çıkar).
- `app/src/main/AndroidManifest.xml` :
  - İnternet, Kamera (Barkod/Lot tarama), Titreşim (Barkod okutma haptik geri bildirim), Ağ izinleri.
  - Açılış aktivitesi `MainActivity`.
- `app/src/main/java/com/necmkimya/uretimtakip/` :
  - `MainActivity.kt` : Donanım hızlandırmalı modern native Android WebKit aktivitesi, geri tuşu yönetimi, dosya yükleme yöneticisi.
  - `WebAppInterface.kt` : Native Android Javascript köprüsü (`Toast`, `Vibrator`, `Share`, `DeviceInfo`).
- `app/src/main/assets/dist/` :
  - Tüm kimyasal formüller, reçete hesaplama motoru, günlük üretim kayıtları ve stok takip arayüzü APK'nın içine gömülüdür.
  - **Uygulama internet olmasa dahi fabrikada/depoda %100 offline çalışır!**
  - İnternet olduğunda ise uzaktaki VPS sunucusuyla (`62.171.177.210`) otomatik senkronize olur.

---

## 🛠️ Komut Satırından APK Derleme (Terminal)
Eğer Android Studio açmadan doğrudan terminalden derlemek isterseniz:

```bash
# Windows için:
gradlew.bat assembleDebug

# Mac / Linux için:
./gradlew assembleDebug
```

Çıktı dosyası: `app/build/outputs/apk/debug/app-debug.apk`
