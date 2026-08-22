# XEROPHIS — FULL-STACK MASTER BUILD PROMPT
## +++++ 99999999 ULTRA COMPLETE PRODUCTION BUILD

Build a complete **full-stack messaging application** named **Xerophis** based on the attached visual reference image.

The reference image is the primary visual direction for the application.

Do NOT build only a static frontend mockup.

Build a complete, functional, persistent, responsive application with:

- frontend
- backend
- REST/API layer
- WebSocket/realtime layer
- authentication
- database
- persistent storage
- media handling
- user profiles
- conversations
- groups
- communities
- channels
- status/updates
- calls UI
- settings
- privacy
- notifications
- search
- admin functionality
- CRUD operations
- validation
- loading states
- empty states
- error states
- optimistic updates
- demo seed data
- VPS deployment
- Docker support
- production-ready architecture

The final result should feel like a **real premium messaging platform**, not a generic dashboard template and not a simple frontend prototype.

---

# ============================================================
# 01 — BRAND IDENTITY
# ============================================================

Application name:

**Xerophis**

Developer:

**Pall**

Brand:

**Xerophis**

Developer branding:

**Xerophis Team Dev**

Footer:

**Developed with ♥ by Pall**

**All rights reserved.**

IMPORTANT:

Never use the names:

- Zex
- Zex Team
- Zex Dev
- Zex Studio
- Zex Developer

Do not accidentally generate those names anywhere in:

- UI
- database seed
- metadata
- comments visible to users
- logo
- footer
- notifications
- placeholder text
- demo accounts

Everything must use **Xerophis**.

---

# ============================================================
# 02 — VISUAL REFERENCE
# ============================================================

Use the attached image as the primary UI reference.

Analyze the reference for:

- layout
- spacing
- typography
- card hierarchy
- navigation
- bottom tab bar
- settings structure
- chat layout
- profile layout
- group information
- status page
- icon placement
- red accent usage
- black background
- avatar style
- section grouping

Do NOT blindly copy another company's branding.

Create an original Xerophis identity while maintaining the same general usability and visual language shown in the reference.

The final UI should be:

**premium + dark + red + clean + futuristic + minimal + professional + polished**

Avoid:

- generic AI dashboard appearance
- excessive gradients
- excessive glassmorphism
- excessive neon
- gaming UI
- cartoon style
- unnecessary 3D
- oversized icons
- random decorative elements

---

# ============================================================
# 03 — CORE VISUAL SYSTEM
# ============================================================

Primary background:

#050707

Secondary background:

#080A0B

Card:

#111415

Elevated card:

#151718

Input:

#181A1B

Divider:

#262829

Primary red:

#FF1111

Dark red:

#D90000

Soft red:

rgba(255,17,17,0.12)

Primary text:

#FFFFFF

Secondary text:

#B8B8B8

Muted text:

#777777

Disabled:

#555555

Success:

#31D158

Warning:

#FFB020

Danger:

#FF1E1E

Use red primarily for:

- active navigation
- primary buttons
- unread badges
- destructive actions
- active icons
- notification indicators
- selected states
- branding
- focus states

Do not make every element red.

---

# ============================================================
# 04 — TYPOGRAPHY
# ============================================================

Use:

- SF Pro Display
- SF Pro Text
- Inter
- system sans-serif

Prefer system-native typography when available.

Typography hierarchy:

Large title:
28–32px / bold

Page title:
22–24px / semibold

Section title:
14–16px / semibold

Body:
14–16px

Secondary:
12–14px

Caption:
11–12px

Use appropriate font weights.

Maintain consistent line-height.

Never allow text clipping.

---

# ============================================================
# 05 — RESPONSIVE APPLICATION
# ============================================================

The application must be fully responsive.

Support:

- 320px
- 360px
- 375px
- 390px
- 412px
- 430px
- iPhone SE
- iPhone 12/13/14
- iPhone 15/16
- Pro Max
- Android phones
- tablets
- desktop browser

On mobile:

Use bottom navigation.

On larger screens:

Use an adaptive layout.

Desktop can use:

left sidebar + content panel + optional details panel.

Do not simply stretch the mobile layout.

---

# ============================================================
# 06 — APPLICATION ARCHITECTURE
# ============================================================

Use a clean full-stack architecture.

Recommended:

Frontend:

React / Next.js

TypeScript

Tailwind CSS or equivalent modern styling system

Component-based architecture

Backend:

Node.js

TypeScript

REST API

WebSocket / Socket.IO or equivalent realtime technology

Database:

PostgreSQL

ORM:

Prisma or equivalent

Authentication:

secure session/JWT architecture

Password hashing:

Argon2 or bcrypt

Storage:

VPS filesystem or S3-compatible object storage

Reverse proxy:

Nginx

Deployment:

Docker + Docker Compose

Server:

Linux VPS

The architecture must be modular and maintainable.

---

# ============================================================
# 07 — VPS ARCHITECTURE
# ============================================================

The application must support deployment on a VPS.

Recommended architecture:

Internet

↓

Nginx

↓

Frontend / Web Server

↓

Backend API

↓

WebSocket server

↓

PostgreSQL

↓

Media Storage

Use Docker containers where practical.

Example services:

- xerophis-web
- xerophis-api
- xerophis-db
- xerophis-realtime
- xerophis-nginx

Optional:

- Redis
- object storage
- background worker

If Redis is used, use it for:

- sessions
- presence
- rate limiting
- queues
- realtime state

Do not store important permanent data only in memory.

---

# ============================================================
# 08 — DATABASE
# ============================================================

Use PostgreSQL.

Database must be persistent.

Never rely on local browser storage as the primary database.

Create proper relational schema.

Core entities:

User

Profile

Session

Conversation

ConversationMember

Message

MessageReaction

MessageAttachment

Group

GroupMember

Community

CommunityMember

Channel

ChannelSubscriber

Status

StatusViewer

Notification

Contact

BlockedUser

PrivacySetting

ChatSetting

NotificationSetting

Call

StarredMessage

PinnedMessage

Report

Media

Device

SecurityEvent

Invite

AdminUser

AuditLog

---

# ============================================================
# 09 — USER TABLE
# ============================================================

User:

- id
- email
- phone
- username
- passwordHash
- displayName
- avatarUrl
- bio
- status
- isVerified
- isOnline
- lastSeen
- createdAt
- updatedAt

Never store plaintext passwords.

---

# ============================================================
# 10 — AUTHENTICATION
# ============================================================

Implement complete authentication.

Pages:

/login

/register

/forgot-password

/reset-password

/verify

/logout

Authentication must support:

- email
- password
- username
- optional phone
- persistent sessions
- logout
- logout all devices
- password reset
- account verification
- secure session handling

Add:

- rate limiting
- brute force protection
- validation
- secure cookies
- CSRF protection where applicable
- secure password hashing

Do not expose authentication secrets in frontend code.

---

# ============================================================
# 11 — AUTH UI
# ============================================================

Login:

Logo:

**Xerophis**

Title:

**Welcome back**

Inputs:

Email / Username

Password

Actions:

**Log In**

**Forgot password?**

Register:

**Create your Xerophis account**

Fields:

- display name
- username
- email
- password
- confirm password

Button:

**Create Account**

Keep UI consistent with black/red theme.

---

# ============================================================
# 12 — SESSION MANAGEMENT
# ============================================================

Users can view:

**Active Sessions**

Each session:

- device
- browser
- approximate location
- last active
- created date

Actions:

**Log out**

**Log out all other devices**

Do not expose sensitive technical information unnecessarily.

---

# ============================================================
# 13 — HOME / CHATS
# ============================================================

Main navigation:

- Chats
- Updates
- Communities
- Calls
- Settings

Header:

**Xerophis**

Actions:

- camera
- search
- more

Search:

**Cari atau mulai chat**

Filters:

- Semua
- Belum dibaca
- Grup
- Favorit

Chat list must come from database.

Each chat:

- avatar
- display name
- last message
- timestamp
- unread count
- muted state
- pinned state
- online state

---

# ============================================================
# 14 — CHAT CRUD
# ============================================================

Implement actual CRUD.

Create:

- direct chat
- group
- channel

Read:

- messages
- members
- media
- metadata

Update:

- group name
- group description
- message
- wallpaper
- notification settings

Delete:

- message
- conversation
- attachment
- group where permitted

Apply permissions.

Users cannot modify messages they do not own unless authorized.

---

# ============================================================
# 15 — REALTIME CHAT
# ============================================================

Implement realtime messaging.

When user sends message:

1. optimistic UI update
2. temporary message ID
3. server validation
4. database persistence
5. realtime broadcast
6. delivery confirmation
7. replace temporary ID with server ID

Support:

- sent
- delivered
- read

Realtime events:

message:new

message:update

message:delete

message:reaction

message:read

typing:start

typing:stop

presence:update

conversation:update

notification:new

---

# ============================================================
# 16 — TYPING INDICATOR
# ============================================================

Implement:

**Xerophis User is typing...**

Use realtime events.

Debounce typing events.

Do not send excessive network requests.

---

# ============================================================
# 17 — MESSAGE FEATURES
# ============================================================

Support:

- text
- emoji
- stickers
- image
- video
- audio
- voice message
- document
- links
- replies
- reactions
- forwarding
- starring
- pinning
- editing
- deleting

Message menu:

**Balas**

**Salin**

**Beri Bintang**

**Sematkan**

**Teruskan**

**Edit**

**Hapus**

**Lainnya**

Danger actions must use red.

---

# ============================================================
# 18 — MESSAGE SEARCH
# ============================================================

Global message search.

Search:

**Cari di Xerophis**

Search database for:

- message text
- sender
- conversation
- group
- channel

Add filters:

- media
- links
- documents
- date
- sender

---

# ============================================================
# 19 — MEDIA SYSTEM
# ============================================================

Implement attachment uploads.

Supported:

- JPG
- PNG
- WEBP
- GIF
- MP4
- MOV
- MP3
- M4A
- PDF
- DOC
- DOCX
- ZIP

Validate:

- MIME type
- extension
- size
- filename

Never trust client-side validation alone.

Store media securely.

Generate thumbnails for images/video where practical.

---

# ============================================================
# 20 — GROUP SYSTEM
# ============================================================

Group CRUD.

Create group:

- name
- description
- avatar
- members

Group roles:

- owner
- admin
- member

Admin permissions:

- add members
- remove members
- change group info
- pin messages
- delete messages
- manage permissions

Group info page:

**garis keras Xerophis**

**Group · 2 peserta**

Actions:

Audio

Video

Cari

**Tambah peserta**

Options:

- Media, Link, & Dok
- Pesan berbintang
- Bisukan notifikasi
- Wallpaper grup
- Enkripsi
- Pesan sementara

Danger:

**Keluar dari grup**

**Laporkan grup**

---

# ============================================================
# 21 — COMMUNITIES
# ============================================================

Implement Communities.

Community:

- id
- name
- description
- avatar
- owner
- members
- createdAt

Features:

- create
- edit
- delete
- join
- leave
- invite
- announcements
- linked groups

Example:

**Xerophis Community**

**X Studio**

**Ngabers Project**

---

# ============================================================
# 22 — CHANNELS
# ============================================================

Implement channels.

Channel:

- name
- username
- description
- avatar
- owner
- subscriberCount

Features:

- create
- edit
- delete
- subscribe
- unsubscribe
- publish
- delete post
- pin post

Example:

**X Studio Channel**

**X Official**

---

# ============================================================
# 23 — UPDATES / STATUS
# ============================================================

Create status system.

Status supports:

- image
- video
- text

Status expires after configurable time.

Default:

24 hours.

Features:

- create status
- view status
- status viewer list
- delete status
- privacy controls

UI:

**Updates**

Section:

**Status**

**Status saya**

**Ketuk untuk membuat update**

Recent:

Rehan Qurohman

Husni Jauhar

Noval Rizki

---

# ============================================================
# 24 — NOTIFICATIONS
# ============================================================

Create notification system.

Notifications:

- new message
- mention
- group invite
- community invite
- channel update
- call
- security event

Database persistence.

Unread count.

Mark as read.

Mark all as read.

Realtime notification delivery.

---

# ============================================================
# 25 — CALLS
# ============================================================

Create calls module.

UI must support:

- incoming
- outgoing
- missed
- audio
- video

Database model:

Call:

- id
- caller
- receiver
- conversation
- type
- status
- startedAt
- endedAt

If actual WebRTC is implemented, use proper signaling.

If WebRTC is not configured yet, build a fully functional call-history system and clearly isolate the future WebRTC integration layer.

Do not fake a real connection as if it were actually connected.

---

# ============================================================
# 26 — PROFILE
# ============================================================

Profile page:

**Profil**

Avatar

Name:

**Xerophis User**

About:

**Hey there! I am using Xerophis.**

Username:

**@xerophisuser**

Button:

**Edit Profil**

Allow editing:

- avatar
- name
- username
- bio
- phone where permitted

---

# ============================================================
# 27 — ACCOUNT SETTINGS
# ============================================================

Page:

**Akun**

Options:

- Notifikasi keamanan
- Verifikasi dua langkah
- Ganti nomor
- Minta info akun
- Hapus akun saya
- Active Sessions

Implement actual backend behavior.

---

# ============================================================
# 28 — PRIVACY SETTINGS
# ============================================================

Page:

**Privasi**

Settings:

Last seen

Online status

Profile photo

About

Status

Read receipts

Groups

Live location

Blocked contacts

Disappearing messages

Privacy levels:

- Everyone
- Contacts
- Nobody

Persist settings in database.

---

# ============================================================
# 29 — TWO-STEP VERIFICATION
# ============================================================

Implement optional two-step verification.

Allow:

- enable
- disable
- change PIN/password
- recovery method

Store sensitive credentials securely.

Never display secret values after creation.

---

# ============================================================
# 30 — AVATAR SYSTEM
# ============================================================

Avatar page:

**Avatar**

Actions:

- Buat avatar
- Edit avatar
- Foto profil
- Hapus avatar

Default fallback:

Circular red border.

Center:

**99**

or user initials.

Avatar URLs must be persisted.

---

# ============================================================
# 31 — CHAT SETTINGS
# ============================================================

Page:

**Chat**

Sections:

### Tampilan

Tema

Wallpaper

### Pengaturan chat

Enter untuk mengirim

Visibilitas media

Ukuran font

### Backup

Cadangan chat

### Riwayat

Riwayat chat

All settings must persist.

---

# ============================================================
# 32 — NOTIFICATION SETTINGS
# ============================================================

Page:

**Notifikasi**

Message settings:

- notification sound
- vibration
- popup
- light
- priority

Group settings:

- notification sound
- vibration

Call settings:

- ringtone
- vibration

Persist all settings.

---

# ============================================================
# 33 — STORAGE AND DATA
# ============================================================

Page:

**Penyimpanan dan Data**

Show real or calculated data:

Storage used

Media used

Network usage

Download settings

Cellular

Wi-Fi

Roaming

Upload quality:

- Standard
- High quality

Create storage management:

- clear cached media
- delete selected media
- storage breakdown

---

# ============================================================
# 34 — HELP
# ============================================================

Page:

**Bantuan**

Options:

- Pusat bantuan
- Hubungi kami
- Kebijakan privasi
- Syarat dan ketentuan
- Info aplikasi

Footer:

**Xerophis**

**Xerophis Team Dev**

**Developed with ♥ by Pall**

**All rights reserved.**

---

# ============================================================
# 35 — SEARCH
# ============================================================

Global search.

Search categories:

- users
- chats
- messages
- groups
- communities
- channels
- media

Use debounced search.

Display:

- loading state
- empty state
- results
- error state

---

# ============================================================
# 36 — CONTACT SYSTEM
# ============================================================

Implement contacts.

Contact fields:

- user
- nickname
- favorite
- blocked
- createdAt

Actions:

- add
- edit nickname
- remove
- block
- unblock
- favorite

---

# ============================================================
# 37 — BLOCK SYSTEM
# ============================================================

Users can block another user.

Blocked user:

- cannot send messages
- cannot initiate calls
- cannot interact where restricted

Allow:

**Unblock**

Store in database.

---

# ============================================================
# 38 — REPORT SYSTEM
# ============================================================

Allow users to report:

- user
- message
- group
- channel
- community

Report reasons:

- spam
- harassment
- inappropriate content
- scam
- other

Store reports in database.

---

# ============================================================
# 39 — ADMIN DASHBOARD
# ============================================================

Create a separate protected admin dashboard.

Desktop layout:

Sidebar:

Dashboard

Users

Messages

Groups

Communities

Channels

Reports

Media

Notifications

Security

System

Audit Logs

Settings

Use the same Xerophis visual identity.

---

# ============================================================
# 40 — ADMIN DASHBOARD HOME
# ============================================================

Dashboard cards:

Total users

Active users

Online users

Total messages

Total groups

Total communities

Total channels

Reports

Storage used

Show charts:

- registrations
- messages per day
- active users
- storage growth

Use clean dark charts.

Do not overdecorate.

---

# ============================================================
# 41 — ADMIN USER CRUD
# ============================================================

Admin can:

Create user

Read user

Update user

Disable user

Delete user

Search user

Filter user

View:

- account status
- registration date
- last active
- reports
- sessions

Danger actions require confirmation.

---

# ============================================================
# 42 — ADMIN MODERATION
# ============================================================

Reports page.

Show:

- reporter
- target
- reason
- createdAt
- status

Statuses:

- pending
- reviewing
- resolved
- dismissed

Actions:

- inspect
- resolve
- dismiss
- suspend
- ban where appropriate

Create audit log for administrative actions.

---

# ============================================================
# 43 — AUDIT LOG
# ============================================================

Every important admin action should generate:

- admin ID
- action
- target
- timestamp
- metadata

Examples:

USER_SUSPENDED

MESSAGE_REMOVED

REPORT_RESOLVED

GROUP_DELETED

SETTINGS_CHANGED

---

# ============================================================
# 44 — SECURITY
# ============================================================

Implement:

- HTTPS
- password hashing
- secure cookies
- CSRF protection
- XSS protection
- SQL injection prevention
- input validation
- rate limiting
- request size limits
- upload validation
- authentication middleware
- authorization middleware
- admin middleware
- security headers

Use environment variables.

Never expose:

- database password
- JWT secret
- API secret
- encryption secret
- VPS credentials

in client-side code.

---

# ============================================================
# 45 — API STRUCTURE
# ============================================================

Use clean API structure.

Examples:

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

GET /api/me

GET /api/users

GET /api/conversations

POST /api/conversations

GET /api/conversations/:id/messages

POST /api/conversations/:id/messages

PATCH /api/messages/:id

DELETE /api/messages/:id

GET /api/groups

POST /api/groups

PATCH /api/groups/:id

DELETE /api/groups/:id

GET /api/communities

POST /api/communities

GET /api/channels

POST /api/channels

GET /api/status

POST /api/status

GET /api/notifications

PATCH /api/notifications/:id/read

GET /api/settings

PATCH /api/settings

Use proper HTTP status codes.

---

# ============================================================
# 46 — DATABASE MIGRATIONS
# ============================================================

Use migrations.

Provide:

- initial migration
- schema
- seed script
- development database
- production migration workflow

Never silently destroy production data.

---

# ============================================================
# 47 — REALISTIC DEMO DATA
# ============================================================

Seed the database.

Create realistic users:

**Xerophis User**

**garis keras Xerophis**

**Rehan Qurohman**

**Husni Jauhar**

**Noval Rizki**

**Moch. Rifki Pratama**

**Ngabers Project**

**Xerophis Team Dev**

Create realistic:

- chats
- groups
- channels
- messages
- notifications
- statuses
- communities
- calls

Use varied timestamps.

Make first load feel alive.

Do not use lorem ipsum.

---

# ============================================================
# 48 — DEMO CHAT DATA
# ============================================================

Example:

garis keras Xerophis

Last message:

**intro nya red dark gila 🔥**

Unread:

2

Another:

Xerophis Team Dev

Last message:

**Welcome to Xerophis Studio**

Another:

Ngabers Project

Last message:

**Oke siap boss**

Another:

Random Group

Last message:

**wkwkwkwk**

Make timestamps realistic.

---

# ============================================================
# 49 — EMPTY STATES
# ============================================================

Every resource needs an empty state.

Example:

**Belum ada percakapan**

**Mulai percakapan baru di Xerophis.**

Button:

**Mulai Chat**

Communities:

**Belum ada community**

Channels:

**Belum ada channel**

Calls:

**Belum ada panggilan**

Notifications:

**Tidak ada notifikasi baru**

---

# ============================================================
# 50 — LOADING STATES
# ============================================================

Use skeleton loaders.

Do not show blank screens.

Components:

- ChatSkeleton
- MessageSkeleton
- ProfileSkeleton
- SettingsSkeleton
- DashboardSkeleton

Use smooth transitions.

---

# ============================================================
# 51 — ERROR STATES
# ============================================================

Every network request must handle failure.

Example:

**Terjadi kesalahan**

**Coba lagi beberapa saat lagi.**

Button:

**Coba Lagi**

Never leave the user with a broken blank screen.

---

# ============================================================
# 52 — OPTIMISTIC UI
# ============================================================

Implement optimistic updates where safe.

Examples:

- sending message
- reaction
- starring
- read receipt
- notification read
- favorite chat
- mute chat

If server fails:

rollback state

show error

Never leave inconsistent UI.

---

# ============================================================
# 53 — OFFLINE HANDLING
# ============================================================

Detect network state.

Offline banner:

**Anda sedang offline**

Queue safe operations where appropriate.

When connection returns:

sync data.

Do not duplicate messages during reconnection.

---

# ============================================================
# 54 — PERFORMANCE
# ============================================================

Optimize:

- lazy loading
- code splitting
- image compression
- pagination
- virtualized message lists
- database indexes
- debounced search
- caching
- connection reuse

Messages should use cursor pagination.

Do not load thousands of messages at once.

---

# ============================================================
# 55 — DATABASE INDEXING
# ============================================================

Add indexes for:

- username
- email
- phone
- conversationId
- senderId
- createdAt
- unread state
- status
- group membership
- channel subscription

Optimize frequent queries.

---

# ============================================================
# 56 — ACCESSIBILITY
# ============================================================

Support:

- semantic buttons
- keyboard navigation
- screen reader labels
- sufficient contrast
- focus states
- readable text
- touch targets at least approximately 44px where appropriate

Do not sacrifice usability for aesthetics.

---

# ============================================================
# 57 — NAVIGATION
# ============================================================

Mobile navigation:

Chats

Updates

Communities

Calls

Settings

Desktop:

Sidebar.

Nested routes should work correctly.

Browser back button must work.

Deep links should work where appropriate.

---

# ============================================================
# 58 — SETTINGS ROUTES
# ============================================================

Create routes/pages:

/settings

/settings/profile

/settings/account

/settings/privacy

/settings/avatar

/settings/chat

/settings/notifications

/settings/storage

/settings/help

/settings/sessions

/settings/security

Each page must be functional.

---

# ============================================================
# 59 — UI COMPONENT LIBRARY
# ============================================================

Create reusable components:

XerophisLogo

Avatar

Header

BottomNavigation

Sidebar

SearchBar

ChatListItem

MessageBubble

MessageMenu

SettingsRow

SettingsSection

Toggle

Badge

Button

IconButton

Card

Modal

BottomSheet

Dialog

Toast

Skeleton

EmptyState

ErrorState

LoadingState

FileUpload

MediaPreview

UserCard

GroupCard

ChannelCard

NotificationItem

---

# ============================================================
# 60 — DESIGN DETAILS
# ============================================================

Use:

12–18px radius.

Thin borders.

Subtle shadows.

Consistent padding.

Clean alignment.

Avoid excessive red.

Active state:

red.

Inactive:

gray.

Destructive:

red.

Primary CTA:

red.

Secondary:

dark card / outline.

---

# ============================================================
# 61 — BOTTOM NAVIGATION
# ============================================================

Icons:

Chats

Updates

Communities

Calls

Settings

Active icon:

red.

Active label:

red.

Inactive:

gray.

Add subtle animated active indicator.

Bottom bar should respect safe area.

---

# ============================================================
# 62 — SPLASH SCREEN
# ============================================================

Black background.

Center Xerophis logo.

Text:

**Xerophis**

Small:

**Pall**

Subtle loading animation.

Transition smoothly into authentication or home.

---

# ============================================================
# 63 — ONBOARDING
# ============================================================

Create three onboarding screens.

1.

**Welcome to Xerophis**

A private and modern way to stay connected.

2.

**Chat freely**

Send messages, photos, files and more.

3.

**Your space. Your control.**

Privacy and personalization designed around you.

CTA:

**Get Started**

---

# ============================================================
# 64 — LOGO GENERATION
# ============================================================

Create a complete Xerophis branding asset system.

Assets:

- primary logo
- secondary logo
- app icon
- favicon
- profile avatar
- group icon
- channel icon
- loading logo
- monochrome logo

Logo concept:

A distinctive geometric X.

Style:

- sharp
- premium
- futuristic
- minimal
- cybersecurity-inspired
- professional
- scalable

Avoid:

- skull
- monster
- flames
- excessive chrome
- excessive 3D
- childish gaming aesthetics

---

# ============================================================
# 65 — IMAGE GENERATION PROMPT
# ============================================================

Use this prompt for Xerophis branding:

"Create a premium minimalist visual identity for a modern messaging platform called Xerophis. Design a distinctive geometric X emblem with sharp architectural lines, futuristic cybersecurity-inspired character, elegant black and intense red palette, clean vector construction, strong negative space, highly recognizable silhouette, premium technology company branding, minimal and sophisticated, perfectly centered, symmetrical, scalable, no skull, no monster, no flames, no mascot, no 3D, no chrome, no watermark, no random text, no mockup."

---

# ============================================================
# 66 — APP ICON PROMPT
# ============================================================

"Create a premium mobile application icon for Xerophis messenger. Deep black square background, centered geometric red X emblem, extremely clean edges, subtle sophisticated red illumination, modern iOS-inspired visual language, premium communication technology brand, minimalist vector aesthetic, strong contrast, symmetrical, instantly recognizable at small sizes, no text, no people, no mascot, no 3D, no watermark."

---

# ============================================================
# 67 — GROUP ICON PROMPT
# ============================================================

"Create a premium circular group avatar for Xerophis. Black background, sharp geometric red X emblem, subtle red rim glow, futuristic communication platform aesthetic, clean vector construction, strong contrast, centered composition, professional, minimal, no text, no watermark, no 3D."

---

# ============================================================
# 68 — PROFILE AVATAR PROMPT
# ============================================================

"Create a premium abstract profile avatar compatible with Xerophis messenger, dark black background, red geometric details, futuristic minimalist cybersecurity aesthetic, elegant high contrast, clean circular composition, professional technology aesthetic, no text, no watermark, no excessive glow."

---

# ============================================================
# 69 — IMAGE RULES
# ============================================================

All generated assets must:

- be high resolution
- have clean edges
- have no watermark
- have no random letters
- have no random logos
- have no malformed text
- have no AI artifacts
- preserve brand consistency
- use black/red palette
- work at small sizes

Logo:

1:1

Avatar:

1:1

App icon:

1:1

Splash artwork:

9:16 if required

Marketing banner:

16:9

---

# ============================================================
# 70 — ADMIN BRANDING
# ============================================================

Admin dashboard must also use:

**Xerophis**

**Pall**

black/red design.

Do not create a completely unrelated admin theme.

---

# ============================================================
# 71 — ENVIRONMENT VARIABLES
# ============================================================

Create:

.env.example

Never commit real secrets.

Possible variables:

DATABASE_URL

AUTH_SECRET

JWT_SECRET if applicable

REDIS_URL

STORAGE_PATH

PUBLIC_URL

UPLOAD_MAX_SIZE

SMTP_HOST

SMTP_PORT

SMTP_USER

SMTP_PASSWORD

TURN_SERVER

TURN_USERNAME

TURN_PASSWORD

All secrets must remain server-side.

---

# ============================================================
# 72 — DOCKER
# ============================================================

Provide:

Dockerfile

docker-compose.yml

production configuration

services:

web

api

database

nginx

optional redis

Use persistent PostgreSQL volume.

Use persistent media volume.

Do not lose database data when containers restart.

---

# ============================================================
# 73 — VPS DEPLOYMENT
# ============================================================

The project must be structured for VPS deployment.

Deployment flow:

1. Install Docker
2. Configure environment
3. Start database
4. Run migrations
5. Run seed
6. Start backend
7. Start frontend
8. Configure Nginx
9. Configure HTTPS
10. Verify health endpoints

Provide:

/health

/api/health

The health endpoint must verify application availability.

---

# ============================================================
# 74 — BACKUPS
# ============================================================

Create a backup strategy.

Database backups:

daily

Retain multiple backup copies.

Media backup should also be considered.

Never implement destructive cleanup without confirmation.

---

# ============================================================
# 75 — LOGGING
# ============================================================

Server logs should contain:

- request ID
- timestamp
- method
- route
- response status
- duration

Do not log:

- passwords
- tokens
- private messages unnecessarily
- secrets

---

# ============================================================
# 76 — RATE LIMITING
# ============================================================

Rate limit:

login

register

password reset

message sending

file upload

search

admin endpoints

Prevent abuse.

---

# ============================================================
# 77 — VALIDATION
# ============================================================

Validate all input server-side.

Examples:

username length

email format

password strength

message length

file size

file type

group name

channel name

community name

Never trust frontend validation.

---

# ============================================================
# 78 — SECURITY PERMISSIONS
# ============================================================

Every protected endpoint must verify:

authentication

ownership

membership

role

permission

Examples:

Only group admins can modify group settings.

Only message owner or authorized moderator can delete message.

Only channel owner/admin can publish channel posts.

Only admin can access admin dashboard.

---

# ============================================================
# 79 — DEMO MODE
# ============================================================

On first installation:

Automatically seed realistic data.

Demo environment should feel alive.

Do NOT use fake statistics that look like actual production metrics without clearly treating them as demo data.

Admin dashboard may show:

**Demo Environment**

where appropriate.

---

# ============================================================
# 80 — FIRST LOAD EXPERIENCE
# ============================================================

First load should never feel empty.

After authentication:

show:

- populated chats
- recent messages
- statuses
- communities
- channels
- notifications
- demo calls

Use realistic timestamps.

---

# ============================================================
# 81 — TOAST SYSTEM
# ============================================================

Create global toast notifications.

Examples:

**Pesan terkirim**

**Profil diperbarui**

**Perubahan disimpan**

**Pesan dihapus**

**Berhasil keluar dari grup**

**Terjadi kesalahan**

Use subtle animation.

---

# ============================================================
# 82 — CONFIRMATION DIALOGS
# ============================================================

Destructive actions require confirmation.

Example:

**Hapus pesan?**

**Pesan ini akan dihapus dari percakapan.**

Buttons:

**Batal**

**Hapus**

Do not accidentally delete data with a single tap.

---

# ============================================================
# 83 — SETTINGS PROFILE CARD
# ============================================================

Settings top card must closely follow the reference.

Avatar:

red outline

Name:

**Xerophis User**

Bio:

**Hey there! I am using Xerophis.**

QR button.

Clean dark card.

---

# ============================================================
# 84 — VISUAL POLISH
# ============================================================

Before finalizing:

Inspect every page visually.

Fix:

- inconsistent margins
- inconsistent radius
- icon misalignment
- text clipping
- oversized buttons
- awkward spacing
- empty areas
- inconsistent red shades
- inconsistent typography
- navigation height
- safe area issues

Every page should feel intentionally designed.

---

# ============================================================
# 85 — MOBILE-FIRST QUALITY
# ============================================================

Do not design desktop first and squeeze it into mobile.

Mobile must be first-class.

Use:

- safe area
- thumb-friendly actions
- bottom sheets
- swipe gestures where appropriate
- keyboard-aware layouts
- mobile file picker
- mobile camera access where supported

---

# ============================================================
# 86 — CHAT KEYBOARD EXPERIENCE
# ============================================================

When keyboard opens:

message composer moves above keyboard.

Input remains visible.

Support:

emoji button

attachment button

camera button

voice button

send button

When text exists:

replace microphone with send button.

---

# ============================================================
# 87 — CHAT COMPOSER
# ============================================================

Modern dark composer.

Placeholder:

**Ketik pesan**

Buttons:

emoji

attachment

camera

voice/send

Rounded input.

Do not allow composer to overlap navigation or keyboard.

---

# ============================================================
# 88 — MESSAGE BUBBLES
# ============================================================

Incoming:

dark card.

Outgoing:

dark red / red-accented bubble.

Do not use bright red for entire message bubbles.

Text remains highly readable.

Timestamp small.

Read status:

✓

✓✓

---

# ============================================================
# 89 — MESSAGE REACTIONS
# ============================================================

Support:

❤️

😂

😮

😢

🙏

🔥

Allow custom reaction architecture.

Store reactions in database.

Realtime update reactions.

---

# ============================================================
# 90 — PROFILE PRIVACY
# ============================================================

Users can configure:

Who can see profile photo

Who can see last seen

Who can see online status

Who can add to groups

Who can see status

Persist all preferences.

---

# ============================================================
# 91 — ACCOUNT DELETION
# ============================================================

Account deletion must require confirmation.

Explain consequence.

Require authentication confirmation where appropriate.

Do not immediately destroy critical records without following the application's data-retention policy.

---

# ============================================================
# 92 — ADMIN SECURITY
# ============================================================

Admin routes must be isolated.

Require:

authentication

admin role

optional 2FA

audit logs

session management

Do not rely on hiding admin links.

Server must enforce permissions.

---

# ============================================================
# 93 — SEO / METADATA
# ============================================================

Set application metadata:

Title:

**Xerophis**

Description:

**Xerophis — modern private messaging platform.**

Developer:

**Pall**

Use Xerophis branding in favicon and metadata.

---

# ============================================================
# 94 — PWA
# ============================================================

If supported, configure PWA:

manifest

icons

theme color

offline shell

install support

App name:

**Xerophis**

Theme:

black

Accent:

red

---

# ============================================================
# 95 — TESTING
# ============================================================

Include tests for:

authentication

authorization

user CRUD

chat CRUD

message CRUD

group CRUD

community CRUD

channel CRUD

notifications

privacy

settings

file uploads

admin permissions

database operations

Important API routes should have integration tests.

---

# ============================================================
# 96 — ERROR HANDLING
# ============================================================

Create centralized error handling.

Frontend:

friendly messages.

Backend:

structured error responses.

Never expose stack traces in production.

---

# ============================================================
# 97 — API DOCUMENTATION
# ============================================================

Document API endpoints.

Include:

method

path

authentication

request body

response

error responses

permissions

---

# ============================================================
# 98 — CODE QUALITY
# ============================================================

Use:

TypeScript strict mode.

Reusable components.

Typed API responses.

Centralized validation.

Centralized error handling.

No unnecessary duplication.

No giant monolithic components.

No hardcoded production secrets.

No fake backend calls pretending to persist data.

---

# ============================================================
# 99 — FINAL ACCEPTANCE TEST
# ============================================================

Before declaring the project complete, verify:

[ ] Xerophis branding everywhere

[ ] Developer is Pall

[ ] No Zex branding anywhere

[ ] Authentication works

[ ] Registration works

[ ] Login works

[ ] Logout works

[ ] Password reset architecture exists

[ ] Database persists after restart

[ ] User CRUD works

[ ] Chat CRUD works

[ ] Message CRUD works

[ ] Group CRUD works

[ ] Community CRUD works

[ ] Channel CRUD works

[ ] Status works

[ ] Notifications work

[ ] Settings persist

[ ] Privacy settings persist

[ ] Profile editing works

[ ] Avatar upload works

[ ] Media upload works

[ ] Search works

[ ] Realtime messages work

[ ] Typing indicator works

[ ] Read status works

[ ] Reactions work

[ ] Optimistic updates work

[ ] Rollback works

[ ] Loading states exist

[ ] Empty states exist

[ ] Error states exist

[ ] Offline handling exists

[ ] Admin dashboard works

[ ] Admin permissions work

[ ] Audit logs work

[ ] Rate limiting exists

[ ] Server-side validation exists

[ ] Secure password storage exists

[ ] Environment variables are used

[ ] Docker configuration exists

[ ] PostgreSQL persistence exists

[ ] VPS deployment structure exists

[ ] Nginx configuration exists

[ ] HTTPS-ready

[ ] Backup strategy documented

[ ] Responsive on mobile

[ ] Responsive on desktop

[ ] Safe area works

[ ] No UI overflow

[ ] No broken routes

[ ] No dead buttons

[ ] No placeholder lorem ipsum

[ ] No fake persistence

[ ] No exposed secrets

[ ] No random branding

[ ] No inconsistent colors

[ ] No inconsistent icons

[ ] No visual layout errors

---

# ============================================================
# 100 — FINAL COMMAND TO THE AI BUILDER
# ============================================================

Do not stop after generating the first UI.

Do not generate only a static mockup.

Do not create fake buttons that do nothing.

Do not store the application's primary data only in localStorage.

Do not use temporary in-memory arrays as the permanent backend.

Do not hardcode the demo chat data into the frontend.

Seed demo data into PostgreSQL.

Build the frontend, backend, API, realtime layer, database schema, authentication, storage system, permissions, settings and admin dashboard as connected systems.

Every important UI action must communicate with the backend where appropriate.

Every persistent resource must be stored in PostgreSQL.

Every authenticated route must be protected.

Every admin route must be authorized server-side.

Every uploaded file must be validated.

Every important mutation must handle:

loading

success

failure

rollback where necessary

The application must remain usable even when there is no data.

Use empty states.

Use skeleton loading.

Use error recovery.

Use optimistic updates where appropriate.

Use realtime events for messaging and notifications.

Make the architecture easy to extend later.

---

# ============================================================
# 101 — VISUAL FINAL TARGET
# ============================================================

The finished product should visually communicate:

**XEROPHIS**

**Premium Dark Messenger**

Black background.

Red accent.

Minimal.

Sharp.

Professional.

Futuristic.

Clean.

High-end.

Responsive.

Production-quality.

The attached reference image should guide the overall UI composition, but the final result must have an original Xerophis identity.

The application should look like it was designed by a professional product design team, not automatically assembled from generic components.

---

# ============================================================
# 102 — BRAND FOOTER
# ============================================================

Use this exact branding where appropriate:

**Xerophis**

**Xerophis Team Dev**

**Developed with ♥ by Pall**

**All rights reserved.**

---

# ============================================================
# 103 — ABSOLUTE FINAL INSTRUCTION
# ============================================================

BUILD THE COMPLETE XEROPHIS FULL-STACK APPLICATION.

Do not merely explain how to build it.

Do not return a design concept only.

Do not return a static HTML screenshot.

Generate the actual application structure and implementation.

Start by establishing the architecture and database schema, then authentication, backend/API, realtime layer, storage, frontend design system, navigation, core messaging flows, settings, communities, channels, updates, calls, admin dashboard, seed data, testing and deployment configuration.

Maintain the Xerophis black/red design system throughout every screen.

Prioritize correctness, persistence, security, responsiveness, performance and visual polish.

If a feature requires external infrastructure that cannot be fully configured automatically, implement the correct integration architecture and provide the required environment variables/configuration rather than replacing it with a fake feature.

The final application must be ready to run locally and structured for deployment to a Linux VPS using Docker.

**PROJECT NAME: XEROPHIS**

**DEVELOPER: PALL**

**PRODUCT: FULL-STACK MESSAGING PLATFORM**

**DESIGN: BLACK + RED PREMIUM UI**

**TARGET: MOBILE-FIRST + RESPONSIVE WEB**

**DATABASE: POSTGRESQL**

**DEPLOYMENT: VPS + DOCKER + NGINX**

**REALTIME: WEBSOCKET**

**AUTHENTICATION: SECURE**

**STORAGE: PERSISTENT**

**QUALITY TARGET: PRODUCTION-READY**

+++++++ 99999999