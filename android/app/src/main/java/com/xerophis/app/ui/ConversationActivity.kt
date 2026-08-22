package com.xerophis.app.ui

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.xerophis.app.R
import com.xerophis.app.data.ApiClient
import com.xerophis.app.data.MessageDto
import com.xerophis.app.data.SendMessageRequest
import kotlinx.coroutines.launch

class ConversationActivity : AppCompatActivity() {
    private lateinit var convId: String
    private lateinit var stream: LinearLayout
    private lateinit var scroll: ScrollView
    private lateinit var input: EditText
    private val messages = mutableListOf<MessageDto>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        convId = intent.getStringExtra("id") ?: return finish()
        val name = intent.getStringExtra("name") ?: "Chat"
        buildLayout(name)
        load()
    }

    private fun buildLayout(name: String) {
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(getColor(R.color.x_bg)) }

        val toolbar = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(dp(12), dp(14), dp(16), dp(12)) }
        val back = Button(this).apply { text = "←"; setTextColor(Color.WHITE); setBackgroundColor(getColor(R.color.x_surface2)); setOnClickListener { finish() } }
        val title = TextView(this).apply { text = name; textSize = 17f; setTextColor(Color.WHITE); setTypeface(null, android.graphics.Typeface.BOLD); setPadding(dp(12), 0, 0, 0) }
        val tLp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        toolbar.addView(back); toolbar.addView(title, tLp)
        root.addView(toolbar)

        scroll = ScrollView(this)
        stream = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(12), dp(8), dp(12), dp(8)) }
        scroll.addView(stream, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        root.addView(scroll, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))

        val composer = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(dp(12), dp(8), dp(12), dp(12)) }
        input = EditText(this).apply {
            hint = "Ketik pesan"; setTextColor(Color.WHITE); setHintTextColor(getColor(R.color.x_muted2))
            setBackgroundColor(getColor(R.color.x_surface2)); setPadding(dp(16), dp(12), dp(16), dp(12)); textSize = 16f
        }
        val send = Button(this).apply {
            text = "➤"; setTextColor(Color.WHITE); setBackgroundColor(getColor(R.color.x_red)); textSize = 18f
            setPadding(dp(16), dp(12), dp(16), dp(12))
            setOnClickListener { send() }
        }
        composer.addView(input, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        composer.addView(send)
        root.addView(composer)

        setContentView(root)
    }

    private fun load() {
        lifecycleScope.launch {
            try {
                val resp = ApiClient.api.messages(convId)
                messages.clear(); messages.addAll(resp.messages); render()
            } catch (e: Exception) {
                Toast.makeText(this@ConversationActivity, ApiClient.errorMessage(e), Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun send() {
        val text = input.text.toString().trim()
        if (text.isEmpty()) return
        // optimistic append
        val tmp = MessageDto("tmp-${System.currentTimeMillis()}", convId, "me", text, "", "sent", emptyList())
        messages.add(tmp); render(); input.setText("")
        lifecycleScope.launch {
            try {
                val resp = ApiClient.api.sendMessage(convId, SendMessageRequest(text))
                // replace tmp with server message
                val idx = messages.indexOfFirst { it.id == tmp.id }
                if (idx >= 0) messages[idx] = resp.message
                render()
            } catch (e: Exception) {
                messages.removeIf { it.id == tmp.id }; render()
                Toast.makeText(this@ConversationActivity, ApiClient.errorMessage(e), Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun render() {
        stream.removeAllViews()
        for (m in messages) {
            val mine = m.from == "me"
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = if (mine) Gravity.END else Gravity.START }
            val bubble = TextView(this).apply {
                text = m.text
                textSize = 15f
                setTextColor(Color.WHITE)
                setPadding(dp(12), dp(10), dp(12), dp(10))
                background = android.graphics.drawable.GradientDrawable().apply {
                    cornerRadius = 18f * resources.displayMetrics.density
                    setColor(if (mine) getColor(R.color.x_red_dark) else getColor(R.color.x_surface2))
                }
                maxWidth = (resources.displayMetrics.widthPixels * 0.72f).toInt()
            }
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            lp.topMargin = dp(4)
            row.addView(bubble, lp)
            stream.addView(row)
        }
        scroll.post { scroll.fullScroll(android.view.View.FOCUS_DOWN) }
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
}
