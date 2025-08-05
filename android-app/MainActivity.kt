package com.example.coconutdiseasedetector

import android.Manifest
import android.animation.ObjectAnimator
import android.animation.AccelerateDecelerateInterpolator
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.util.Size
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.toBitmap
import com.example.coconutdiseasedetector.databinding.ActivityMainBinding
import com.google.android.material.transition.platform.MaterialContainerTransformSharedElementCallback
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraExecutor: ExecutorService
    private var imageCapture: ImageCapture? = null
    private var tflite: Interpreter? = null
    private lateinit var labels: Array<String>
    
    // Model configuration
    private val IMG_SIZE = 224
    private val NUM_CHANNELS = 3
    private val NUM_BYTES_PER_CHANNEL = 4 // float32
    private val CONFIDENCE_THRESHOLD = 0.0f  // Show all results for debugging
    
    data class ClassificationResult(
        val className: String,
        val confidence: Float,
        val allPredictions: Map<String, Float>
    )
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Enable Material Design transitions
        window.requestFeature(android.view.Window.FEATURE_ACTIVITY_TRANSITIONS)
        setExitSharedElementCallback(MaterialContainerTransformSharedElementCallback())
        window.sharedElementsUseOverlay = false
        
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Initialize TensorFlow Lite
        initializeTensorFlowLite()
        
        // Setup click listeners with animations
        setupClickListeners()
        
        // Add entrance animations
        animateEntrance()
        
        cameraExecutor = Executors.newSingleThreadExecutor()
    }
    
    private fun setupClickListeners() {
        binding.btnCamera.setOnClickListener {
            animateButtonPress(it)
            checkCameraPermissionAndTakePicture()
        }
        
        binding.btnGallery.setOnClickListener {
            animateButtonPress(it)
            checkGalleryPermissionAndPickImage()
        }
        
        binding.imageCard.setOnClickListener {
            animateCardPress(it)
            checkGalleryPermissionAndPickImage()
        }
    }
    
    private fun animateButtonPress(view: View) {
        val scaleDown = ObjectAnimator.ofPropertyValuesHolder(
            view,
            android.animation.PropertyValuesHolder.ofFloat("scaleX", 0.95f),
            android.animation.PropertyValuesHolder.ofFloat("scaleY", 0.95f)
        )
        scaleDown.duration = 100
        scaleDown.interpolator = AccelerateDecelerateInterpolator()
        
        val scaleUp = ObjectAnimator.ofPropertyValuesHolder(
            view,
            android.animation.PropertyValuesHolder.ofFloat("scaleX", 1.0f),
            android.animation.PropertyValuesHolder.ofFloat("scaleY", 1.0f)
        )
        scaleUp.duration = 100
        scaleUp.interpolator = AccelerateDecelerateInterpolator()
        
        scaleDown.start()
        scaleDown.addListener(object : android.animation.AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
                scaleUp.start()
            }
        })
    }
    
    private fun animateCardPress(view: View) {
        val scaleDown = ObjectAnimator.ofPropertyValuesHolder(
            view,
            android.animation.PropertyValuesHolder.ofFloat("scaleX", 0.98f),
            android.animation.PropertyValuesHolder.ofFloat("scaleY", 0.98f)
        )
        scaleDown.duration = 150
        scaleDown.interpolator = AccelerateDecelerateInterpolator()
        
        val scaleUp = ObjectAnimator.ofPropertyValuesHolder(
            view,
            android.animation.PropertyValuesHolder.ofFloat("scaleX", 1.0f),
            android.animation.PropertyValuesHolder.ofFloat("scaleY", 1.0f)
        )
        scaleUp.duration = 150
        scaleUp.interpolator = AccelerateDecelerateInterpolator()
        
        scaleDown.start()
        scaleDown.addListener(object : android.animation.AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
                scaleUp.start()
            }
        })
    }
    
    private fun animateEntrance() {
        // Animate toolbar
        binding.toolbar.alpha = 0f
        binding.toolbar.translationY = -100f
        binding.toolbar.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(600)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
        
        // Animate cards with staggered entrance
        binding.imageCard.alpha = 0f
        binding.imageCard.translationY = 100f
        binding.imageCard.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(600)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .setStartDelay(200)
            .start()
        
        binding.btnCamera.alpha = 0f
        binding.btnCamera.translationX = -100f
        binding.btnCamera.animate()
            .alpha(1f)
            .translationX(0f)
            .setDuration(500)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .setStartDelay(400)
            .start()
        
        binding.btnGallery.alpha = 0f
        binding.btnGallery.translationX = 100f
        binding.btnGallery.animate()
            .alpha(1f)
            .translationX(0f)
            .setDuration(500)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .setStartDelay(450)
            .start()
        
        binding.resultsCard.alpha = 0f
        binding.resultsCard.translationY = 100f
        binding.resultsCard.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(600)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .setStartDelay(600)
            .start()
    }
    
    private fun initializeTensorFlowLite() {
        try {
            // Load enhanced model
            val modelFile = loadModelFile("enhanced_coconut_model.tflite")
            tflite = Interpreter(modelFile)
            
            // Load labels
            labels = loadLabels("enhanced_labels.txt")
            
            // Debug model info
            val inputTensor = tflite!!.getInputTensor(0)
            val outputTensor = tflite!!.getOutputTensor(0)
            
        } catch (e: Exception) {
            showToast("ERROR loading AI model: ${e.message}")
            e.printStackTrace()
        }
    }
    
    private fun loadModelFile(filename: String): MappedByteBuffer {
        val fileDescriptor = assets.openFd(filename)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }
    
    private fun loadLabels(filename: String): Array<String> {
        return assets.open(filename).bufferedReader().readLines().toTypedArray()
    }
    
    private fun checkCameraPermissionAndTakePicture() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            == PackageManager.PERMISSION_GRANTED) {
            takePicture()
        } else {
            requestCameraPermission.launch(Manifest.permission.CAMERA)
        }
    }
    
    private fun takePicture() {
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (intent.resolveActivity(packageManager) != null) {
            takePictureLauncher.launch(intent)
        } else {
            showToast("No camera app found! Using gallery instead.")
            pickImageFromGallery()
        }
    }
    
    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val imageBitmap = result.data?.extras?.get("data") as? Bitmap
            if (imageBitmap != null) {
                processImage(imageBitmap)
            } else {
                showToast("No camera image found! Using gallery instead.")
                pickImageFromGallery()
            }
        }
    }
    
    private fun checkGalleryPermissionAndPickImage() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) 
            == PackageManager.PERMISSION_GRANTED) {
            pickImageFromGallery()
        } else {
            requestGalleryPermission.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }
    
    private val requestCameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            takePicture()
        } else {
            showToast("Camera permission required for live detection")
        }
    }
    
    private val requestGalleryPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            pickImageFromGallery()
        } else {
            showToast("Storage permission required to select images")
        }
    }
    
    private fun pickImageFromGallery() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        pickImageLauncher.launch(intent)
    }
    
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            result.data?.data?.let { uri ->
                val bitmap = MediaStore.Images.Media.getBitmap(contentResolver, uri)
                processImage(bitmap)
            }
        }
    }
    
    private fun processImage(bitmap: Bitmap) {
        try {
            // Show loading animation
            showLoadingAnimation()
            
            // Hide upload hint
            binding.uploadHint.visibility = View.GONE
            
            // Improve image quality for better classification
            val processedBitmap = preprocessImage(bitmap)
            
            // Display the processed image with animation
            binding.imageView.setImageBitmap(processedBitmap)
            animateImageTransition()
            
            // Classify the processed image
            val result = classifyImage(processedBitmap)
            
            // Hide loading and show results with animation
            hideLoadingAnimation()
            displayResultWithAnimation(result)
            
        } catch (e: Exception) {
            hideLoadingAnimation()
            showToast("Error processing image: ${e.message}")
            binding.textResult.text = "❌ Error processing image: ${e.message}\n\nPlease try again with a clearer photo."
            binding.textResult.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
            e.printStackTrace()
        }
    }
    
    private fun showLoadingAnimation() {
        binding.progressIndicator.visibility = View.VISIBLE
        binding.progressIndicator.alpha = 0f
        binding.progressIndicator.animate()
            .alpha(1f)
            .setDuration(300)
            .start()
    }
    
    private fun hideLoadingAnimation() {
        binding.progressIndicator.animate()
            .alpha(0f)
            .setDuration(300)
            .withEndAction {
                binding.progressIndicator.visibility = View.GONE
            }
            .start()
    }
    
    private fun animateImageTransition() {
        binding.imageView.alpha = 0f
        binding.imageView.scaleX = 0.8f
        binding.imageView.scaleY = 0.8f
        binding.imageView.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(400)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
    }
    
    private fun displayResultWithAnimation(result: ClassificationResult) {
        // Animate results card
        binding.resultsCard.animate()
            .scaleX(1.02f)
            .scaleY(1.02f)
            .setDuration(200)
            .withEndAction {
                binding.resultsCard.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(200)
                    .start()
            }
            .start()
        
        // Update result text
        displayResult(result)
        
        // Animate text change
        binding.textResult.alpha = 0f
        binding.textResult.animate()
            .alpha(1f)
            .setDuration(500)
            .start()
    }
    
    private fun preprocessImage(bitmap: Bitmap): Bitmap {
        // Resize to model input size
        return Bitmap.createScaledBitmap(bitmap, IMG_SIZE, IMG_SIZE, true)
    }
    
    private fun classifyImage(bitmap: Bitmap): ClassificationResult {
        if (tflite == null) {
            throw IllegalStateException("TensorFlow Lite model not initialized")
        }
        
        // Check model input type
        val inputTensor = tflite!!.getInputTensor(0)
        val isQuantized = inputTensor.dataType() == org.tensorflow.lite.DataType.UINT8
        
        // Create input buffer
        val inputBuffer = if (isQuantized) {
            ByteBuffer.allocateDirect(IMG_SIZE * IMG_SIZE * NUM_CHANNELS)
        } else {
            ByteBuffer.allocateDirect(IMG_SIZE * IMG_SIZE * NUM_CHANNELS * 4) // 4 bytes for float32
        }
        inputBuffer.order(ByteOrder.nativeOrder())
        
        // Get pixel values
        val intValues = IntArray(IMG_SIZE * IMG_SIZE)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
        
        // Fill input buffer
        for (pixelValue in intValues) {
            val r = ((pixelValue shr 16) and 0xFF)
            val g = ((pixelValue shr 8) and 0xFF)
            val b = (pixelValue and 0xFF)
            
            if (isQuantized) {
                // For quantized models, just use raw pixel values (0-255)
                inputBuffer.put(r.toByte())
                inputBuffer.put(g.toByte())
                inputBuffer.put(b.toByte())
            } else {
                // For float models, normalize to 0-1
                inputBuffer.putFloat(r / 255.0f)
                inputBuffer.putFloat(g / 255.0f)
                inputBuffer.putFloat(b / 255.0f)
            }
        }
        
        // Create output buffer
        val output = Array(1) { FloatArray(labels.size) }
        
        // Run inference
        tflite!!.run(inputBuffer, output)
        
        // Process results
        val probabilities = output[0]
        
        // Find the class with highest probability
        val maxIndex = probabilities.indices.maxByOrNull { probabilities[it] } ?: 0
        val maxProbability = probabilities[maxIndex]
        val className = labels[maxIndex]
        
        // Create map of all predictions
        val allPredictions = labels.zip(probabilities.toList()).toMap()
        
        return ClassificationResult(className, maxProbability, allPredictions)
    }
    
    private fun displayResult(result: ClassificationResult) {
        val confidence = result.confidence * 100
        
        // Modern emoji and status mapping
        val (emoji, statusColor, statusText) = when (result.className.lowercase()) {
            "healthy_leaves", "healthy leaves" -> Triple("🌱", android.R.color.holo_green_dark, "HEALTHY")
            "cci_caterpillars", "caterpillars" -> Triple("🐛", android.R.color.holo_orange_dark, "PEST DETECTED")
            "cci_leaflets", "leaflets" -> Triple("�", android.R.color.holo_orange_light, "LEAF ISSUE")
            "wclwd_dryingofleaflets", "drying" -> Triple("🌿", android.R.color.holo_red_light, "DRYING")
            "wclwd_flaccidity", "flaccidity" -> Triple("💧", android.R.color.holo_blue_dark, "WATER STRESS")
            "wclwd_yellowing", "yellowing" -> Triple("🟡", android.R.color.holo_orange_dark, "YELLOWING")
            else -> Triple("🔍", android.R.color.darker_gray, "ANALYZING")
        }
        
        // Clean and format the disease name
        val cleanName = result.className
            .replace("_", " ")
            .replace("WCLWD", "")
            .replace("CCI", "")
            .trim()
            .split(" ")
            .joinToString(" ") { word -> 
                word.lowercase().replaceFirstChar { it.uppercase() }
            }
        
        // Create modern styled text with simple formatting
        val resultText = buildString {
            // Header section
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("$emoji  $cleanName")
            appendLine("$statusText")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine()
            
            // Confidence section
            appendLine("🎯 CONFIDENCE SCORE")
            appendLine("${String.format("%.1f", confidence)}%")
            
            // Visual confidence bar
            val barLength = 20
            val filledBars = (confidence / 100 * barLength).toInt()
            val confidenceBar = "█".repeat(filledBars) + "░".repeat(barLength - filledBars)
            val barIcon = when {
                confidence >= 80 -> "🟢"
                confidence >= 60 -> "🟡"
                else -> "🔴"
            }
            appendLine("$barIcon $confidenceBar")
            appendLine()
            
            // Top predictions
            appendLine("📊 DETAILED ANALYSIS")
            appendLine("─────────────────────────────")
            result.allPredictions.entries
                .sortedByDescending { it.value }
                .take(3)
                .forEachIndexed { index, (label, prob) ->
                    val cleanLabel = label.replace("_", " ").replace("WCLWD", "").replace("CCI", "").trim()
                        .split(" ").joinToString(" ") { word -> 
                            word.lowercase().replaceFirstChar { it.uppercase() }
                        }
                    val percentage = prob * 100
                    val isTop = index == 0
                    
                    val icon = if (isTop) "▶" else "•"
                    val miniBarLength = 12
                    val miniFilledBars = (percentage / 100 * miniBarLength).toInt()
                    val miniBar = "█".repeat(miniFilledBars) + "░".repeat(miniBarLength - miniFilledBars)
                    
                    appendLine("$icon $cleanLabel")
                    appendLine("   ${String.format("%.1f", percentage)}% $miniBar")
                    if (index < 2) appendLine()
                }
            
            appendLine("─────────────────────────────")
            appendLine()
            
            // Tips or success message
            if (confidence < 70) {
                appendLine("💡 IMPROVE ACCURACY")
                appendLine("┌─────────────────────────────┐")
                appendLine("│ • Use better lighting        │")
                appendLine("│ • Focus clearly on leaves    │") 
                appendLine("│ • Avoid blurry images        │")
                appendLine("│ • Fill frame with sample     │")
                appendLine("└─────────────────────────────┘")
            } else {
                appendLine("✨ HIGH CONFIDENCE DETECTION!")
                appendLine("┌─────────────────────────────┐")
                appendLine("│   Results are reliable and  │")
                appendLine("│      accurate! 🎉           │")
                appendLine("└─────────────────────────────┘")
            }
        }
        
        binding.textResult.text = resultText
        binding.textResult.setTextColor(ContextCompat.getColor(this, statusColor))
    }
    
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        tflite?.close()
    }
}
