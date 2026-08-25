.class Lxerophis/MainActivity$1;
.super Landroid/webkit/WebViewClient;

.field final synthetic this$0:Lxerophis/MainActivity;

.method constructor <init>(Lxerophis/MainActivity;)V
    .registers 2
    iput-object p1, p0, Lxerophis/MainActivity$1;->this$0:Lxerophis/MainActivity;
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V
    return-void
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .registers 5

    invoke-virtual {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    invoke-virtual {v0}, Landroid/net/Uri;->toString()Ljava/lang/String;
    move-result-object v0
    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    const/4 v1, 0x1
    return v1
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z
    .registers 4

    invoke-virtual {p1, p2}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    const/4 v0, 0x1
    return v0
.end method
