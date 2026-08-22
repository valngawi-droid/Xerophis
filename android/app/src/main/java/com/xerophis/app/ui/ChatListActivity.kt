package com.xerophis.app.ui

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.xerophis.app.R
import com.xerophis.app.data.ApiClient
import com.xerophis.app.data.ChatItemDto
import com.xerophis.app.data.Session
import kotlinx.coroutines.launch

class ChatListActivity : AppCompatActivity() {
    private lateinit var swipe: SwipeRefreshLayout
    private lateinit var adapter: ChatAdapter
    private val chats = mutableListOf<ChatItemDto>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!Session.isLoggedIn()) {
            startActivity(Intent(this, LoginActivity::class.java)); finish(); return
        }
        buildLayout()
        load()
    }

    private fun buildLayout() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(getColor(R.color.x_bg))
        }
        val toolbar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(12))
        }
        val title = TextView(this).apply {
            text = "Xerophis"
            textSize = 22f
            setTextColor(Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        val link = Button(this).apply {
            text = "Link"
            setTextColor(Color.WHITE)
            setBackgroundColor(getColor(R.color.x_red))
            textSize = 13f
            setPadding(dp(14), dp(8), dp(14), dp(8))
            isAllCaps = false
            setOnClickListener { startActivity(Intent(this@ChatListActivity, LinkActivity::class.java)) }
        }
        val logout = Button(this).apply {
            text = "Keluar"
            setTextColor(getColor(R.color.x_muted))
            setBackgroundColor(getColor(R.color.x_surface2))
            textSize = 13f
            setPadding(dp(14), dp(8), dp(14), dp(8))
            isAllCaps = false
            setOnClickListener { logout() }
        }
        val lpTitle = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        toolbar.addView(title, lpTitle)
        toolbar.addView(link)
        toolbar.addView(logout)

        swipe = SwipeRefreshLayout(this).apply { setColorSchemeColors(getColor(R.color.x_red)) }
        val rv = RecyclerView(this).apply {
            layoutManager = LinearLayoutManager(this@ChatListActivity)
        }
        adapter = ChatAdapter(onClick = { chat -> openChat(chat) })
        rv.adapter = adapter
        swipe.addView(rv)

        val progress = ProgressBar(this)
        progress.visibility = View.GONE
        val rootLp0 = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        root.addView(toolbar, rootLp0)
        root.addView(swipe, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))

        setContentView(root)
        swipe.setOnRefreshListener { load() }
    }

    private fun load() {
        swipe.isRefreshing = true
        lifecycleScope.launch {
            try {
                val resp = ApiClient.api.conversations()
                chats.clear(); chats.addAll(resp.conversations)
                adapter.submit(resp.conversations)
            } catch (e: Exception) {
                Toast.makeText(this@ChatListActivity, ApiClient.errorMessage(e), Toast.LENGTH_LONG).show()
            } finally {
                swipe.isRefreshing = false
            }
        }
    }

    private fun openChat(c: ChatItemDto) {
        startActivity(Intent(this, ConversationActivity::class.java).putExtra("id", c.id).putExtra("name", c.name))
    }

    private fun logout() {
        lifecycleScope.launch { try { ApiClient.api.logout() } catch (_: Exception) {} }
        Session.clear()
        startActivity(Intent(this, LoginActivity::class.java)); finish()
    }

    class ChatAdapter(val onClick: (ChatItemDto) -> Unit) : RecyclerView.Adapter<ChatAdapter.VH>() {
        private val items = mutableListOf<ChatItemDto>()
        fun submit(list: List<ChatItemDto>) { items.clear(); items.addAll(list); notifyDataSetChanged() }
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
            val tv = TextView(parent.context).apply {
                textSize = 15f; setTextColor(Color.WHITE); gravity = Gravity.CENTER_VERTICAL
                setPadding(dp(16), dp(16), dp(16), dp(16))
            }
            return VH(tv)
        }
        override fun onBindViewHolder(h: VH, pos: Int) {
            val c = items[pos]
            h.text.text = "${c.name}\n${c.lastMessage}"
            h.text.setOnClickListener { onClick(c) }
        }
        override fun getItemCount() = items.size
        class VH(val text: TextView) : RecyclerView.ViewHolder(text)
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
}
