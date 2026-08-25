.class Lxerophis/MainActivity$2;
.super Landroid/webkit/WebChromeClient;

.field final synthetic this$0:Lxerophis/MainActivity;

.method constructor <init>(Lxerophis/MainActivity;)V
    .registers 2
    iput-object p1, p0, Lxerophis/MainActivity$2;->this$0:Lxerophis/MainActivity;
    invoke-direct {p0}, Landroid/webkit/WebChromeClient;-><init>()V
    return-void
.end method

# WebRTC: izinkan kamera/mik otomatis saat diminta halaman
.method public onPermissionRequest(Landroid/webkit/PermissionRequest;)V
    .registers 3

    invoke-virtual {p1}, Landroid/webkit/PermissionRequest;->getResources()[Ljava/lang/String;
    move-result-object v0
    invoke-virtual {p1, v0}, Landroid/webkit/PermissionRequest;->grant([Ljava/lang/String;)V
    return-void
.end method

.method public onGeolocationPermissionsShowPrompt(Ljava/lang/String;Landroid/webkit/GeolocationPermissions$Callback;)V
    .registers 5

    const/4 v0, 0x1
    const/4 v1, 0x0
    invoke-interface {p2, p1, v0, v1}, Landroid/webkit/GeolocationPermissions$Callback;->invoke(Ljava/lang/String;ZZ)V
    return-void
.end method
