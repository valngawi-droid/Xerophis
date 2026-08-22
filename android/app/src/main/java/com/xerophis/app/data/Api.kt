package com.xerophis.app.data

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface XerophisApi {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): LoginResponse

    @POST("api/auth/logout")
    suspend fun logout()

    @GET("api/me")
    suspend fun me(): MeResponse

    @GET("api/conversations")
    suspend fun conversations(): ConversationsResponse

    @GET("api/conversations/{id}/messages")
    suspend fun messages(@Path("id") id: String, @Query("cursor") cursor: String? = null, @Query("limit") limit: Int = 40): MessagesResponse

    @POST("api/conversations/{id}/messages")
    suspend fun sendMessage(@Path("id") id: String, @Body body: SendMessageRequest): SendMessageResponse

    @GET("api/devices")
    suspend fun devices(): DevicesResponse

    @POST("api/link/confirm")
    suspend fun confirmLink(@Body body: LinkConfirmRequest): LinkConfirmResponse
}

object ApiClient {
    private const val PREFS = "xerophis_netcookie"
    private lateinit var sessionPrefs: android.content.SharedPreferences
    private var baseUrl: String = ""

    fun init(context: Context) {
        sessionPrefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        baseUrl = com.xerophis.app.BuildConfig.API_BASE_URL
    }

    fun setBaseUrl(url: String) {
        baseUrl = url
    }

    private val gson: Gson = GsonBuilder().create()

    private val okHttp = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val token = Session.token()
            val req = if (token != null) {
                chain.request().newBuilder().header("Cookie", "xerophis_session=$token").build()
            } else {
                chain.request()
            }
            val resp = chain.proceed(req)
            // Capture Set-Cookie from login/register/adopt responses.
            resp.headers("Set-Cookie").forEach { cookie ->
                if (cookie.startsWith("xerophis_session=")) {
                    val v = cookie.substringAfter("xerophis_session=").substringBefore(";")
                    if (v.isNotEmpty()) Session.saveToken(v)
                }
            }
            resp
        }
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()

    val api: XerophisApi = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttp)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()
        .create(XerophisApi::class.java)

    fun errorMessage(t: Throwable): String = when (t) {
        is retrofit2.HttpException -> {
            val raw = t.response()?.errorBody()?.string()
            val parsed = try { gson.fromJson(raw, ApiErrorBody::class.java) } catch (e: Exception) { null }
            parsed?.error?.message ?: "Server error (${t.code()})"
        }
        is java.net.UnknownHostException -> "Tidak dapat terhubung ke server. Periksa URL API."
        is java.net.ConnectException -> "Tidak dapat terhubung ke server."
        else -> t.message ?: "Terjadi kesalahan."
    }
}
