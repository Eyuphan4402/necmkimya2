# Proguard rules for Necm Kimya Üretim & Stok
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.necmkimya.uretimtakip.WebAppInterface {
    public *;
}
