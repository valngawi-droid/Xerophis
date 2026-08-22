package com.xerophis.app.data

import com.google.gson.annotations.SerializedName

// ---- Auth ----
data class LoginRequest(val identifier: String, val password: String)
data class UserDto(
    val id: String,
    val username: String,
    val displayName: String,
    val email: String?,
    val isVerified: Boolean
)
data class LoginResponse(val user: UserDto)
data class RegisterRequest(
    val displayName: String,
    val username: String,
    val email: String?,
    val password: String
)

// ---- Me ----
data class MeResponse(val user: UserDto)

// ---- Conversations ----
data class ChatItemDto(
    val id: String,
    val type: String,
    val name: String,
    val avatar: String,
    val avatarColor: String,
    val description: String,
    val lastMessage: String,
    val lastTime: String,
    val unread: Long,
    val muted: Boolean,
    val pinned: Boolean,
    val online: Boolean,
    val verified: Boolean
)
data class ConversationsResponse(val conversations: List<ChatItemDto>)

// ---- Messages ----
data class MessageDto(
    val id: String,
    val conversationId: String,
    val from: String,
    val text: String,
    val time: String,
    val status: String,
    val reactions: List<String>
)
data class MessagesResponse(val messages: List<MessageDto>)
data class SendMessageRequest(val text: String)
data class SendMessageResponse(val message: MessageDto)

// ---- Devices / link ----
data class DeviceDto(
    val id: String,
    val device: String,
    val browser: String,
    val location: String,
    val lastActive: Long
)
data class DevicesResponse(val devices: List<DeviceDto>)
data class LinkConfirmRequest(val code: String)
data class LinkConfirmResponse(val ok: Boolean, val device: String)
data class LinkInitResponse(val token: String, val code: String, val expiry: Long, val label: String)

// ---- Generic error ----
data class ApiErrorBody(val error: ErrorInfo?)
data class ErrorInfo(val code: String, val message: String)
