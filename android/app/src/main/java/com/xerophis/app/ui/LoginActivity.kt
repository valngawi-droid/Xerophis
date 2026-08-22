package com.xerophis.app.ui

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.xerophis.app.R
import com.xerophis.app.data.ApiClient
import com.xerophis.app.data.LoginRequest
import com.xerophis.app.data.Session
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var identifier: EditText
    private lateinit var password: EditText
    private lateinit var button: Button
    private lateinit var progress: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Auto-skip if already logged in.
        if (Session.isLoggedIn()) {
            startActivity(Intent(this, ChatListActivity::class.java))
            finish()
            return
        }
        setContentView(buildLayout())
    }

    private fun buildLayout(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(28), dp(64), dp(28), dp(28))
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(getColor(R.color.x_bg))
        }

        val logo = TextView(this).apply {
            text = "Xerophis"
            textSize = 32f
            setTextColor(Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        val subtitle = TextView(this).apply {
            text = "Welcome back\nMasuk ke akun Xerophis Anda."
            textSize = 14f
            setTextColor(getColor(R.color.x_muted))
            gravity = Gravity.CENTER
            setPadding(0, dp(8), 0, dp(24))
        }

        identifier = EditText(this).apply {
            hint = "Email / Username"
            setTextColor(Color.WHITE)
            setHintTextColor(getColor(R.color.x_muted2))
            setBackgroundColor(getColor(R.color.x_surface))
            setPadding(dp(16), dp(14), dp(16), dp(14))
            textSize = 15f
            setText("xerophis")
        }
        password = EditText(this).apply {
            hint = "Password"
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
            setTextColor(Color.WHITE)
            setHintTextColor(getColor(R.color.x_muted2))
            setBackgroundColor(getColor(R.color.x_surface))
            setPadding(dp(16), dp(14), dp(16), dp(14))
            textSize = 15f
            setText("Xerophis#2025")
        }

        button = Button(this).apply {
            text = "Log In"
            setTextColor(Color.WHITE)
            setBackgroundColor(getColor(R.color.x_red))
            setPadding(0, dp(14), 0, dp(14))
            textSize = 15f
            setOnClickListener { login() }
        }

        progress = ProgressBar(this).apply { visibility = View.GONE }

        val hint = TextView(this).apply {
            text = getString(R.string.demo_hint)
            textSize = 12f
            setTextColor(getColor(R.color.x_muted2))
            gravity = Gravity.CENTER
            setPadding(0, dp(16), 0, 0)
        }

        root.addView(logo)
        root.addView(subtitle)
        root.addView(identifier, LinearLayout.LayoutParams.MATCH_PARENT, dp(52))
        val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52))
        lp.topMargin = dp(12)
        root.addView(password, lp)
        val bLp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52))
        bLp.topMargin = dp(24)
        root.addView(button, bLp)
        val pLp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        pLp.topMargin = dp(16)
        pLp.gravity = Gravity.CENTER_HORIZONTAL
        root.addView(progress, pLp)
        root.addView(hint)
        return root
    }

    private fun login() {
        val ident = identifier.text.toString().trim()
        val pass = password.text.toString()
        if (ident.isEmpty() || pass.isEmpty()) {
            Toast.makeText(this, "Masukkan email/username dan password.", Toast.LENGTH_SHORT).show()
            return
        }
        button.isEnabled = false
        progress.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val resp = ApiClient.api.login(LoginRequest(ident, pass))
                Session.saveProfile(resp.user.username, resp.user.displayName)
                Toast.makeText(this@LoginActivity, "Berhasil masuk", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this@LoginActivity, ChatListActivity::class.java))
                finish()
            } catch (e: Exception) {
                Toast.makeText(this@LoginActivity, ApiClient.errorMessage(e), Toast.LENGTH_LONG).show()
            } finally {
                button.isEnabled = true
                progress.visibility = View.GONE
            }
        }
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
}
