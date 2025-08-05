package com.example.coconutdiseasedetector

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.example.coconutdiseasedetector.databinding.ActivityWelcomeBinding

class WelcomeActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityWelcomeBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Hide system bars for fullscreen experience
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).let { controller ->
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        
        binding = ActivityWelcomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        startAnimations()
        
        // Set up start button click listener
        binding.startButton.setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
    }
    
    private fun startAnimations() {
        // Start animations sequentially with proper timing
        Handler(Looper.getMainLooper()).postDelayed({
            animateView(binding.slsuLogo)
        }, 300)
        
        Handler(Looper.getMainLooper()).postDelayed({
            animateView(binding.coconutLogo)
        }, 800)
        
        Handler(Looper.getMainLooper()).postDelayed({
            animateView(binding.appTitle)
        }, 1300)
        
        Handler(Looper.getMainLooper()).postDelayed({
            animateView(binding.appSubtitle)
        }, 1600)
        
        Handler(Looper.getMainLooper()).postDelayed({
            animateView(binding.developersContainer)
        }, 1900)
        
        // Show start button last
        Handler(Looper.getMainLooper()).postDelayed({
            animateView(binding.startButton)
        }, 2400)
    }
    
    private fun animateView(view: View) {
        view.alpha = 0f
        view.visibility = View.VISIBLE
        view.animate()
            .alpha(1f)
            .setDuration(600)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
    }
    
    override fun onBackPressed() {
        // Allow back button to exit the app
        super.onBackPressed()
    }
}
