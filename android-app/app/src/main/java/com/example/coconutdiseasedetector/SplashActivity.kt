package com.example.coconutdiseasedetector

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AlphaAnimation
import android.view.animation.ScaleAnimation
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.progressindicator.LinearProgressIndicator

class SplashActivity : AppCompatActivity() {

    private lateinit var slsuLogo: ImageView
    private lateinit var titleText: TextView
    private lateinit var progressBar: LinearProgressIndicator
    private lateinit var loadingText: TextView
    private lateinit var progressText: TextView
    private lateinit var dot1: View
    private lateinit var dot2: View
    private lateinit var dot3: View
    
    private val handler = Handler(Looper.getMainLooper())
    private var progressValue = 0
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)
        
        // Hide system UI for full immersive experience
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
        
        initViews()
        startModernAnimations()
        startProgressSimulation()
    }
    
    private fun initViews() {
        slsuLogo = findViewById(R.id.slsuLogo)
        titleText = findViewById(R.id.titleText)
        progressBar = findViewById(R.id.progressBar)
        loadingText = findViewById(R.id.loadingText)
        progressText = findViewById(R.id.progressText)
        dot1 = findViewById(R.id.dot1)
        dot2 = findViewById(R.id.dot2)
        dot3 = findViewById(R.id.dot3)
        
        // Set initial progress
        progressBar.progress = 0
        progressText.text = "0%"
    }
    
    private fun startModernAnimations() {
        // Logo scale and fade in animation
        val logoScale = ScaleAnimation(0.0f, 1.0f, 0.0f, 1.0f, 
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f, 
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f).apply {
            duration = 1200
            startOffset = 300
        }
        
        val logoAlpha = AlphaAnimation(0f, 1f).apply {
            duration = 1200
            startOffset = 300
        }
        
        slsuLogo.startAnimation(logoScale)
        slsuLogo.startAnimation(logoAlpha)
        
        // Title slide in from bottom
        titleText.translationY = 100f
        titleText.alpha = 0f
        titleText.animate()
            .translationY(0f)
            .alpha(1f)
            .setDuration(1000)
            .setStartDelay(800)
            .start()
        
        // Start modern dot animations
        startModernDotAnimations()
    }
    
    private fun startModernDotAnimations() {
        handler.post(object : Runnable {
            override fun run() {
                animateModernDots()
                handler.postDelayed(this, 800)
            }
        })
    }
    
    private fun animateModernDots() {
        // Scale and fade animation for dots
        val scaleUp = ScaleAnimation(1.0f, 1.3f, 1.0f, 1.3f,
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f,
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f).apply {
            duration = 300
        }
        
        val scaleDown = ScaleAnimation(1.3f, 1.0f, 1.3f, 1.0f,
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f,
            ScaleAnimation.RELATIVE_TO_SELF, 0.5f).apply {
            duration = 300
            startOffset = 300
        }
        
        handler.postDelayed({
            dot1.startAnimation(scaleUp)
            dot1.startAnimation(scaleDown)
            dot1.alpha = 1.0f
            dot2.alpha = 0.5f
            dot3.alpha = 0.3f
        }, 0)
        
        handler.postDelayed({
            dot2.startAnimation(scaleUp)
            dot2.startAnimation(scaleDown)
            dot1.alpha = 0.5f
            dot2.alpha = 1.0f
            dot3.alpha = 0.3f
        }, 250)
        
        handler.postDelayed({
            dot3.startAnimation(scaleUp)
            dot3.startAnimation(scaleDown)
            dot1.alpha = 0.3f
            dot2.alpha = 0.5f
            dot3.alpha = 1.0f
        }, 500)
    }
    
    private fun startProgressSimulation() {
        val loadingMessages = arrayOf(
            "Initializing AI Engine...",
            "Loading Neural Networks...",
            "Preparing Disease Database...",
            "Configuring Camera Systems...",
            "Optimizing Performance...",
            "Finalizing Setup..."
        )
        
        val progressRunnable = object : Runnable {
            override fun run() {
                if (progressValue < 100) {
                    progressValue += 1 // Slower progress for better UX
                    progressBar.progress = progressValue
                    progressText.text = "$progressValue%"
                    
                    // Update loading message based on progress
                    when (progressValue) {
                        in 0..15 -> loadingText.text = loadingMessages[0]
                        in 16..30 -> loadingText.text = loadingMessages[1]
                        in 31..50 -> loadingText.text = loadingMessages[2]
                        in 51..70 -> loadingText.text = loadingMessages[3]
                        in 71..90 -> loadingText.text = loadingMessages[4]
                        in 91..99 -> loadingText.text = loadingMessages[5]
                        100 -> {
                            loadingText.text = "Ready to Launch!"
                            progressText.text = "100%"
                            // Proceed to Welcome Activity after a short delay
                            handler.postDelayed({
                                startWelcomeActivity()
                            }, 800)
                            return
                        }
                    }
                    
                    handler.postDelayed(this, 80) // Update every 80ms for smooth animation
                } else {
                    startWelcomeActivity()
                }
            }
        }
        
        // Start progress after initial animations
        handler.postDelayed(progressRunnable, 2000)
    }
    
    private fun startWelcomeActivity() {
        val intent = Intent(this, WelcomeActivity::class.java)
        startActivity(intent)
        
        // Modern transition animation
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }
    
    override fun onBackPressed() {
        // Disable back button during splash
        super.onBackPressed()
    }
}
