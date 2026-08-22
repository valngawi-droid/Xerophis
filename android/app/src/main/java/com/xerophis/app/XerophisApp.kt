package com.xerophis.app

import android.app.Application
import com.xerophis.app.data.ApiClient
import com.xerophis.app.data.Session

class XerophisApp : Application() {
    override fun onCreate() {
        super.onCreate()
        ApiClient.init(this)
        Session.init(this)
    }
}
