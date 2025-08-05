package com.example.coconutdiseasedetector

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.Button
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class WelcomeActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_welcome)
        
        // Hide system bars for fullscreen experience  
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).let { controller ->
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        
        val logoCard = findViewById<View>(R.id.logoCard)
        val appTitle = findViewById<View>(R.id.appTitle)
        val featuresRow = findViewById<View>(R.id.featuresRow)
        val actionButtons = findViewById<View>(R.id.actionButtons)
        val startButton = findViewById<Button>(R.id.startButton)
        val learnMoreButton = findViewById<Button>(R.id.learnMoreButton)
        
        startAnimations(logoCard, appTitle, featuresRow, actionButtons)
        
        // Set up start button click listener
        startButton.setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
        
        // Set up learn more button click listener
        learnMoreButton.setOnClickListener {
            showLearnMoreDialog()
        }
    }
    
    private fun startAnimations(logoCard: View, appTitle: View, featuresRow: View, actionButtons: View) {
        // Logo appears with scale animation
        Handler(Looper.getMainLooper()).postDelayed({
            animateScaleIn(logoCard)
        }, 200)
        
        // Title fades in
        Handler(Looper.getMainLooper()).postDelayed({
            animateFadeIn(appTitle)
        }, 600)
        
        // Features slide up
        Handler(Looper.getMainLooper()).postDelayed({
            animateSlideUp(featuresRow)
        }, 800)
        
        // Action buttons appear with bounce
        Handler(Looper.getMainLooper()).postDelayed({
            animateSlideUpBounce(actionButtons)
        }, 1000)
    }
    
    private fun animateFadeIn(view: View) {
        view.alpha = 0f
        view.animate()
            .alpha(1f)
            .setDuration(600)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
    }
    
    private fun animateScaleIn(view: View) {
        view.alpha = 0f
        view.scaleX = 0.5f
        view.scaleY = 0.5f
        view.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(500)
            .setInterpolator(OvershootInterpolator(1.2f))
            .start()
    }
    
    private fun animateSlideUp(view: View) {
        view.alpha = 0f
        view.translationY = 100f
        view.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(600)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
    }
    
    private fun animateSlideUpBounce(view: View) {
        view.alpha = 0f
        view.translationY = 150f
        view.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(800)
            .setInterpolator(OvershootInterpolator(1.1f))
            .start()
    }
    
    private fun showLearnMoreDialog() {
        val dialogMessage = """
            🌴 Dwarf Coconut Disease Detector
            
            📱 How to Use:
            • Tap "Start Detecting" to begin
            • Take a clear photo of coconut leaves
            • AI will analyze and identify diseases
            • Get instant health assessment
            
            🤖 AI Features:
            • Advanced machine learning detection
            • Multiple disease classification
            • Real-time image analysis
            • Accuracy-focused results
            
            🎯 Disease Types Detected:
            • Leaf spot diseases
            • Nutrient deficiencies
            • Pest damage indicators
            • Overall plant health status
            
            🏫 Developed by SLSU Tayabas Students
            For research and educational purposes
        """.trimIndent()
        
        AlertDialog.Builder(this)
            .setTitle("📖 Learn More")
            .setMessage(dialogMessage)
            .setPositiveButton("Got it! 👍") { dialog, _ ->
                dialog.dismiss()
            }
            .setNeutralButton("Start Detecting 🚀") { dialog, _ ->
                dialog.dismiss()
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            }
            .setCancelable(true)
            .show()
    }
    
    override fun onBackPressed() {
        // Allow back button to exit the app
        super.onBackPressed()
    }
}
