package com.xerophis.app.ui

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.xerophis.app.R
import com.xerophis.app.data.ApiClient
import com.xerophis.app.data.DeviceDto
import com.xerophis.app.data.LinkConfirmRequest
import kotlinx.coroutines.launch

/**
 * "Perangkat Tertaut" — the primary account's device list. Lets you link a new
 * device by entering the 8-digit code shown on that device's Xerophis screen.
 */
class LinkActivity : AppCompatActivity() {
    private lateinit var adapter: DeviceAdapter
    private val devices = mutableListOf<DeviceDto>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildLayout()
        load()
    }

    private fun buildLayout() {
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(getColor(R.color.x_bg)) }

        val toolbar = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(dp(12), dp(14), dp(16), dp(12)) }
        val back = Button(this).apply { text = "←"; setTextColor(Color.WHITE); setBackgroundColor(getColor(R.color.x_surface2)); setOnClickListener { finish() } }
        val title = TextView(this).apply { text = "Tautkan perangkat"; textSize = 17f; setTextColor(Color.WHITE); setTypeface(null, android.graphics.Typeface.BOLD); setPadding(dp(12), 0, 0, 0) }
        val tLp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        toolbar.addView(back); toolbar.addView(title, tLp)
        root.addView(toolbar)

        // Link panel
        val linkPanel = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(16), dp(8), dp(16), dp(8)) }
        val label = TextView(this).apply { text = "Masukkan kode 8 digit dari perangkat baru"; textSize = 14f; setTextColor(Color.WHITE) }
        val codeRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val codeInput = EditText(this).apply {
            hint = "KODE 8 DIGIT"; setTextColor(Color.WHITE); setHintTextColor(getColor(R.color.x_muted2))
            setBackgroundColor(getColor(R.color.x_surface2)); setPadding(dp(16), dp(12), dp(16), dp(12)); textSize = 18f
        }
        val confirm = Button(this).apply {
            text = "Tautkan"; setTextColor(Color.WHITE); setBackgroundColor(getColor(R.color.x_red))
            setOnClickListener {
                val code = codeInput.text.toString().trim()
                if (code.length < 8) { Toast.makeText(this@LinkActivity, "Masukkan kode lengkap.", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
                confirmCode(code)
            }
        }
        codeRow.addView(codeInput, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        codeRow.addView(confirm)
        linkPanel.addView(label)
        val crLp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        crLp.topMargin = dp(12)
        linkPanel.addView(codeRow, crLp)
        root.addView(linkPanel)

        val rv = RecyclerView(this).apply { layoutManager = LinearLayoutManager(this@LinkActivity) }
        adapter = DeviceAdapter(devices)
        rv.adapter = adapter
        root.addView(rv, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))

        setContentView(root)
    }

    private fun load() {
        lifecycleScope.launch {
            try {
                val resp = ApiClient.api.devices()
                devices.clear(); devices.addAll(resp.devices); adapter.notifyDataSetChanged()
            } catch (e: Exception) {
                Toast.makeText(this@LinkActivity, ApiClient.errorMessage(e), Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun confirmCode(code: String) {
        lifecycleScope.launch {
            try {
                val resp = ApiClient.api.confirmLink(LinkConfirmRequest(code))
                Toast.makeText(this@LinkActivity, "Perangkat \"${resp.device}\" tertaut", Toast.LENGTH_SHORT).show()
                load()
            } catch (e: Exception) {
                Toast.makeText(this@LinkActivity, ApiClient.errorMessage(e), Toast.LENGTH_LONG).show()
            }
        }
    }

    class DeviceAdapter(private val items: List<DeviceDto>) : RecyclerView.Adapter<DeviceAdapter.VH>() {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
            val tv = TextView(parent.context).apply { textSize = 15f; setTextColor(Color.WHITE); setPadding(28, 24, 16, 24) }
            return VH(tv)
        }
        override fun onBindViewHolder(h: VH, pos: Int) {
            val d = items[pos]
            h.tv.text = "${d.device}\n${d.location}"
        }
        override fun getItemCount() = items.size
        class VH(val tv: TextView) : RecyclerView.ViewHolder(tv)
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
}
