package com.necmkimya.uretimtakip

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.widget.Toast
import org.json.JSONObject

class WebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun isNativeAndroid(): Boolean {
        return true
    }

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun vibrate(milliseconds: Long) {
        try {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(
                        VibrationEffect.createOneShot(
                            milliseconds.coerceAtLeast(10),
                            VibrationEffect.DEFAULT_AMPLITUDE
                        )
                    )
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(milliseconds.coerceAtLeast(10))
                }
            }
        } catch (_: Exception) {
            // Ignore vibration permission failures on some devices
        }
    }

    @JavascriptInterface
    fun shareText(title: String, text: String) {
        try {
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, text)
                putExtra(Intent.EXTRA_TITLE, title)
                type = "text/plain"
            }
            val shareIntent = Intent.createChooser(sendIntent, title)
            shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(shareIntent)
        } catch (e: Exception) {
            Toast.makeText(context, "Paylaşım açılamadı: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun getDeviceInfo(): String {
        val info = JSONObject()
        info.put("manufacturer", Build.MANUFACTURER)
        info.put("model", Build.MODEL)
        info.put("sdkInt", Build.VERSION.SDK_INT)
        info.put("release", Build.VERSION.RELEASE)
        info.put("appVersion", "1.0.0")
        info.put("isNativeApk", true)
        return info.toString()
    }
}
