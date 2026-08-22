package com.xerophis.app.data

import android.content.Context
import android.content.SharedPreferences

/**
 * Stores the Xerophis session cookie token (and a bit of profile) on-device.
 * The token is sent as a `Cookie` header on every request via ApiClient.
 */
object Session {
    private const val PREFS = "xerophis_session"
    private const val KEY_TOKEN = "token"
    private const val KEY_USERNAME = "username"
    private const val KEY_DISPLAY = "displayName"

    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    }

    fun saveToken(token: String?) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun token(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveProfile(username: String?, displayName: String?) {
        prefs.edit().putString(KEY_USERNAME, username).putString(KEY_DISPLAY, displayName).apply()
    }

    fun username(): String? = prefs.getString(KEY_USERNAME, null)
    fun displayName(): String? = prefs.getString(KEY_DISPLAY, null)

    fun isLoggedIn(): Boolean = !token().isNullOrEmpty()

    fun clear() {
        prefs.edit().clear().apply()
    }
}
