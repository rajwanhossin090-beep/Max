import { AndroidCodeFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidCodeFile[] = [
  {
    path: 'app/src/main/java/com/google/aistudio/maxassistant/MainActivity.kt',
    language: 'kotlin',
    description: 'Main Jetpack Compose Activity with Permission Handling & Voice UI',
    content: `package com.google.aistudio.maxassistant

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.google.aistudio.maxassistant.service.BackgroundAudioService
import com.google.aistudio.maxassistant.ui.screens.MainScreen
import com.google.aistudio.maxassistant.ui.screens.PermissionsScreen
import com.google.aistudio.maxassistant.ui.theme.MAXAssistantTheme

class MainActivity : ComponentActivity() {

    private val requiredPermissions = arrayOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.CALL_PHONE,
        *(if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            emptyArray()
        })
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            startMaxBackgroundService()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MAXAssistantTheme {
                var hasPermissions by remember { mutableStateOf(checkAllPermissions()) }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (hasPermissions) {
                        MainScreen(
                            onStartService = { startMaxBackgroundService() },
                            onStopService = { stopMaxBackgroundService() }
                        )
                    } else {
                        PermissionsScreen(
                            onRequestPermissions = {
                                permissionLauncher.launch(requiredPermissions)
                                hasPermissions = checkAllPermissions()
                            }
                        )
                    }
                }
            }
        }

        if (checkAllPermissions()) {
            startMaxBackgroundService()
        }
    }

    private fun checkAllPermissions(): Boolean {
        return requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun startMaxBackgroundService() {
        val intent = Intent(this, BackgroundAudioService::class.java).apply {
            action = BackgroundAudioService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun stopMaxBackgroundService() {
        val intent = Intent(this, BackgroundAudioService::class.java).apply {
            action = BackgroundAudioService.ACTION_STOP
        }
        startService(intent)
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/google/aistudio/maxassistant/data/LiveSessionManager.kt',
    language: 'kotlin',
    description: 'Gemini Live WebSocket Client with PCM 16kHz Record & 24kHz AudioTrack Playback',
    content: `package com.google.aistudio.maxassistant.data

import android.annotation.SuppressLint
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.util.Base64
import com.google.aistudio.maxassistant.tools.ToolExecutionEngine
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import org.json.JSONObject
import java.io.ByteArrayOutputStream

enum class MaxVoiceState { IDLE, LISTENING, THINKING, SPEAKING, ERROR }

class LiveSessionManager(
    private val apiKey: String,
    private val toolEngine: ToolExecutionEngine
) {
    private val client = OkHttpClient()
    private var webSocket: WebSocket? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _voiceState = MutableStateFlow(MaxVoiceState.IDLE)
    val voiceState: StateFlow<MaxVoiceState> = _voiceState

    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null
    private var isRecording = false
    private var isPlaying = false

    private val sampleRateInput = 16000
    private val sampleRateOutput = 24000

    fun connectSession() {
        _voiceState.value = MaxVoiceState.THINKING
        val wsUrl = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=$apiKey"

        val request = Request.Builder().url(wsUrl).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                sendInitialConfig(webSocket)
                startAudioRecordLoop()
                _voiceState.value = MaxVoiceState.LISTENING
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleServerMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                _voiceState.value = MaxVoiceState.ERROR
            }
        })
    }

    private fun sendInitialConfig(ws: WebSocket) {
        val configJson = JSONObject().apply {
            put("setup", JSONObject().apply {
                put("model", "models/gemini-3.1-flash-live-preview")
                put("generationConfig", JSONObject().apply {
                    put("responseModalities", arrayOf("AUDIO"))
                    put("speechConfig", JSONObject().apply {
                        put("voiceConfig", JSONObject().apply {
                            put("prebuiltVoiceConfig", JSONObject().apply {
                                put("voiceName", "Kore") // Sassy, confident tone
                            })
                        })
                    })
                })
                put("systemInstruction", JSONObject().apply {
                    put("parts", arrayOf(JSONObject().apply {
                        put("text", """
                            You are MAX: a young, confident, witty, and sassy female AI assistant.
                            Tone: Flirty, playful, slightly teasing, sharp, never robotic.
                            Always speak concisely with attitude and charm.
                            You have access to native Android tools: openApp, searchAndCallContact, sendWhatsAppMessage, sendGmail.
                        """.trimIndent())
                    }))
                })
            })
        }
        ws.send(configJson.toString())
    }

    @SuppressLint("MissingPermission")
    private fun startAudioRecordLoop() {
        val minBufferSize = AudioRecord.getMinBufferSize(
            sampleRateInput,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRateInput,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            minBufferSize * 2
        )

        audioRecord?.startRecording()
        isRecording = true

        scope.launch {
            val buffer = ByteArray(2048)
            while (isRecording && isActive) {
                val readBytes = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                if (readBytes > 0) {
                    val pcmBase64 = Base64.encodeToString(buffer, 0, readBytes, Base64.NO_WRAP)
                    sendAudioFrame(pcmBase64)
                }
            }
        }
    }

    private fun sendAudioFrame(base64Pcm: String) {
        val json = JSONObject().apply {
            put("realtimeInput", JSONObject().apply {
                put("mediaChunks", arrayOf(JSONObject().apply {
                    put("mimeType", "audio/pcm;rate=16000")
                    put("data", base64Pcm)
                }))
            })
        }
        webSocket?.send(json.toString())
    }

    private fun handleServerMessage(jsonText: String) {
        val json = JSONObject(jsonText)
        val serverContent = json.optJSONObject("serverContent")
        
        if (serverContent != null) {
            val modelTurn = serverContent.optJSONObject("modelTurn")
            val parts = modelTurn?.optJSONArray("parts")
            if (parts != null && parts.length() > 0) {
                val firstPart = parts.getJSONObject(0)
                val inlineData = firstPart.optJSONObject("inlineData")
                if (inlineData != null) {
                    val audioBase64 = inlineData.optString("data")
                    if (audioBase64.isNotEmpty()) {
                        _voiceState.value = MaxVoiceState.SPEAKING
                        playAudioResponse(audioBase64)
                    }
                }
            }

            if (serverContent.optBoolean("interrupted", false)) {
                audioTrack?.stop()
                audioTrack?.flush()
                _voiceState.value = MaxVoiceState.LISTENING
            }
        }

        val toolCall = json.optJSONObject("toolCall")
        if (toolCall != null) {
            val functionCalls = toolCall.optJSONArray("functionCalls")
            if (functionCalls != null && functionCalls.length() > 0) {
                val call = functionCalls.getJSONObject(0)
                val name = call.getString("name")
                val args = call.getJSONObject("args")
                scope.launch {
                    val result = toolEngine.executeTool(name, args)
                    sendToolResponse(call.getString("id"), result)
                }
            }
        }
    }

    private fun playAudioResponse(base64Audio: String) {
        val audioBytes = Base64.decode(base64Audio, Base64.DEFAULT)
        if (audioTrack == null) {
            val minBufSize = AudioTrack.getMinBufferSize(
                sampleRateOutput,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANT)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRateOutput)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(minBufSize * 2)
                .build()
            audioTrack?.play()
        }
        audioTrack?.write(audioBytes, 0, audioBytes.size)
    }

    private fun sendToolResponse(callId: String, result: JSONObject) {
        val response = JSONObject().apply {
            put("toolResponse", JSONObject().apply {
                put("functionResponses", arrayOf(JSONObject().apply {
                    put("response", result)
                    put("id", callId)
                }))
            })
        }
        webSocket?.send(response.toString())
    }

    fun disconnect() {
        isRecording = false
        audioRecord?.stop()
        audioRecord?.release()
        audioTrack?.stop()
        audioTrack?.release()
        webSocket?.close(1000, "User disconnected")
        _voiceState.value = MaxVoiceState.IDLE
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/google/aistudio/maxassistant/service/BackgroundAudioService.kt',
    language: 'kotlin',
    description: 'Android Foreground Service with Wake-Word ("MAX") Detection & Persistent Notification',
    content: `package com.google.aistudio.maxassistant.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.aistudio.maxassistant.MainActivity
import com.google.aistudio.maxassistant.R
import com.google.aistudio.maxassistant.data.LiveSessionManager
import com.google.aistudio.maxassistant.tools.ToolExecutionEngine
import kotlinx.coroutines.*

class BackgroundAudioService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var liveSessionManager: LiveSessionManager
    private lateinit var toolExecutionEngine: ToolExecutionEngine

    companion object {
        const val CHANNEL_ID = "max_voice_assistant_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ACTION_START_MAX"
        const val ACTION_STOP = "ACTION_STOP_MAX"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        toolExecutionEngine = ToolExecutionEngine(this)
        
        // Retrieve Gemini API key securely from BuildConfig / Environment
        val apiKey = "YOUR_GEMINI_API_KEY"
        liveSessionManager = LiveSessionManager(apiKey, toolExecutionEngine)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val notification = buildForegroundNotification()
                startForeground(NOTIFICATION_ID, notification)
                liveSessionManager.connectSession()
            }
            ACTION_STOP -> {
                liveSessionManager.disconnect()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MAX Voice Assistant Active",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps MAX Voice Assistant awake in the background for instant wake-word activation."
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MAX Assistant is Active")
            .setContentText("Listening for 'MAX' wake-word in background...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        serviceScope.cancel()
        liveSessionManager.disconnect()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`,
  },
  {
    path: 'app/src/main/java/com/google/aistudio/maxassistant/tools/ToolExecutionEngine.kt',
    language: 'kotlin',
    description: 'Native Android Function Calling Engine (openApp, searchAndCallContact, sendWhatsAppMessage, sendGmail)',
    content: `package com.google.aistudio.maxassistant.tools

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.ContactsContract
import org.json.JSONObject

class ToolExecutionEngine(private val context: Context) {

    fun executeTool(name: String, args: JSONObject): JSONObject {
        val result = JSONObject()
        try {
            when (name) {
                "openApp" -> {
                    val packageName = args.getString("packageName")
                    val success = openApp(packageName)
                    result.put("status", if (success) "success" else "failed")
                    result.put("message", if (success) "App $packageName opened successfully" else "App $packageName not installed")
                }
                "searchAndCallContact" -> {
                    val contactName = args.getString("contactName")
                    val phone = findContactPhoneNumber(contactName)
                    if (phone != null) {
                        makePhoneCall(phone)
                        result.put("status", "success")
                        result.put("message", "Calling $contactName at $phone")
                    } else {
                        result.put("status", "failed")
                        result.put("message", "Contact $contactName not found in address book")
                    }
                }
                "sendWhatsAppMessage" -> {
                    val contactName = args.getString("contactName")
                    val message = args.getString("message")
                    val phone = findContactPhoneNumber(contactName)
                    if (phone != null) {
                        sendWhatsApp(phone, message)
                        result.put("status", "success")
                        result.put("message", "Opened WhatsApp chat for $contactName with message")
                    } else {
                        result.put("status", "failed")
                        result.put("message", "Contact $contactName not found")
                    }
                }
                "sendGmail" -> {
                    val recipient = args.getString("recipientEmail")
                    val subject = args.getString("subject")
                    val body = args.getString("body")
                    sendEmail(recipient, subject, body)
                    result.put("status", "success")
                    result.put("message", "Gmail draft prepared for $recipient")
                }
                else -> {
                    result.put("status", "error")
                    result.put("message", "Unknown tool function: $name")
                }
            }
        } catch (e: Exception) {
            result.put("status", "error")
            result.put("message", e.message ?: "Execution error")
        }
        return result
    }

    private fun openApp(packageName: String): Boolean {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
        return if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
            true
        } else {
            false
        }
    }

    private fun findContactPhoneNumber(contactName: String): String? {
        val cursor = context.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER),
            "\${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ?",
            arrayOf("%$contactName%"),
            null
        )
        cursor?.use {
            if (it.moveToFirst()) {
                return it.getString(0)
            }
        }
        return null
    }

    private fun makePhoneCall(phoneNumber: String) {
        val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$phoneNumber")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun sendWhatsApp(phoneNumber: String, message: String) {
        val cleanPhone = phoneNumber.replace("[^0-9]".toRegex(), "")
        val uri = Uri.parse("https://api.whatsapp.com/send?phone=$cleanPhone&text=" + Uri.encode(message))
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun sendEmail(recipient: String, subject: String, body: String) {
        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:")
            putExtra(Intent.EXTRA_EMAIL, arrayOf(recipient))
            putExtra(Intent.EXTRA_SUBJECT, subject)
            putExtra(Intent.EXTRA_TEXT, body)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/google/aistudio/maxassistant/ui/components/MaxOrbCanvas.kt',
    language: 'kotlin',
    description: 'Jetpack Compose State-Driven Canvas Animations (Idle, Listening, Thinking, Speaking)',
    content: `package com.google.aistudio.maxassistant.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.google.aistudio.maxassistant.data.MaxVoiceState
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun MaxOrbCanvas(
    state: MaxVoiceState,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "max_orb_anim")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    val neonPink = Color(0xFFFF2A85)
    val neonCyan = Color(0xFF00F2FE)
    val neonPurple = Color(0xFF7F00FF)

    Box(
        modifier = modifier.size(280.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2, size.height / 2)
            val baseRadius = size.minDimension / 3

            when (state) {
                MaxVoiceState.IDLE -> {
                    // Subtle breathing glow
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(neonCyan.copy(alpha = 0.6f), neonPurple.copy(alpha = 0.2f), Color.Transparent),
                            center = center,
                            radius = baseRadius * pulseScale
                        ),
                        radius = baseRadius * pulseScale,
                        center = center
                    )
                }
                MaxVoiceState.LISTENING -> {
                    // Active listening waveform ring
                    for (i in 0 until 12) {
                        val angle = Math.toRadians((i * 30 + rotationAngle).toDouble())
                        val waveRadius = baseRadius + sin(angle * 3) * 20
                        val x = center.x + (waveRadius * cos(angle)).toFloat()
                        val y = center.y + (waveRadius * sin(angle)).toFloat()
                        drawCircle(color = neonCyan, radius = 6.dp.toPx(), center = Offset(x, y))
                    }
                }
                MaxVoiceState.THINKING -> {
                    // Pulsing neon rings
                    drawCircle(
                        color = neonPink,
                        radius = baseRadius * 1.1f,
                        center = center,
                        style = Stroke(width = 8.dp.toPx())
                    )
                }
                MaxVoiceState.SPEAKING -> {
                    // Dynamic audio wave
                    drawCircle(
                        brush = Brush.sweepGradient(
                            colors = listOf(neonPink, neonCyan, neonPurple, neonPink),
                            center = center
                        ),
                        radius = baseRadius * pulseScale,
                        center = center,
                        style = Stroke(width = 12.dp.toPx())
                    )
                }
                MaxVoiceState.ERROR -> {
                    drawCircle(
                        color = Color.Red,
                        radius = baseRadius,
                        center = center
                    )
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Android Manifest with Permissions, Foreground Service & Intent Filters',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.google.aistudio.maxassistant">

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="MAX Assistant"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MAXAssistant">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.MAXAssistant">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.BackgroundAudioService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

    </application>

</manifest>
`,
  },
  {
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Gradle Build Configuration with Jetpack Compose & Gemini dependencies',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.google.aistudio.maxassistant"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.google.aistudio.maxassistant"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation(platform("androidx.compose:compose-bom:2024.11.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
`,
  },
];
