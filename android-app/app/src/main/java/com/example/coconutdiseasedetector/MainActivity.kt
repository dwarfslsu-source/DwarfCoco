package com.example.coconutdiseasedetector

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import com.example.coconutdiseasedetector.cloud.CloudUploadService
import com.example.coconutdiseasedetector.data.CloudResponse
import com.google.android.material.progressindicator.CircularProgressIndicator
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "CoconutDetector"
    }
    
    // UI Components
    private lateinit var btnCamera: Button
    private lateinit var btnGallery: Button
    private lateinit var imageView: ImageView
    private lateinit var textResult: TextView
    private lateinit var progressIndicator: CircularProgressIndicator
    private lateinit var loadingLayout: LinearLayout
    private lateinit var loadingText: TextView
    private lateinit var loadingSubtext: TextView
    private lateinit var uploadHint: LinearLayout
    private lateinit var uploadButtonsLayout: LinearLayout
    private lateinit var btnUploadWithImage: Button
    private lateinit var btnUploadResultsOnly: Button
    
    // TensorFlow and Cloud Services
    private var tflite: Interpreter? = null
    private lateinit var labels: Array<String>
    private lateinit var cloudUploadService: CloudUploadService
    private var currentBitmap: Bitmap? = null
    private var currentResult: ClassificationResult? = null
    
    // Model configuration
    private val IMG_SIZE = 224
    private val NUM_CHANNELS = 3
    
    // Data class for classification results
    data class ClassificationResult(
        val className: String,
        val confidence: Float,
        val allPredictions: Map<String, Float>
    )
    
    // Activity result launchers
    private val requestCameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            takePicture()
        } else {
            showToast("Camera permission required for taking photos")
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
                showToast("Failed to capture image")
            }
        }
    }
    
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { imageUri ->
            try {
                val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    val source = ImageDecoder.createSource(contentResolver, imageUri)
                    ImageDecoder.decodeBitmap(source)
                } else {
                    @Suppress("DEPRECATION")
                    MediaStore.Images.Media.getBitmap(contentResolver, imageUri)
                }
                processImage(bitmap)
            } catch (e: Exception) {
                showToast("Error loading image: ${e.message}")
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Hide system bars for fullscreen experience  
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).let { controller ->
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        
        initializeViews()
        setupUI()
        initializeTensorFlowLite()
        cloudUploadService = CloudUploadService(this)
    }
    
    private fun initializeViews() {
        btnCamera = findViewById(R.id.btnCamera)
        btnGallery = findViewById(R.id.btnGallery)
        imageView = findViewById(R.id.imageView)
        textResult = findViewById(R.id.textResult)
        progressIndicator = findViewById(R.id.progressIndicator)
        loadingLayout = findViewById(R.id.loadingLayout)
        loadingText = findViewById(R.id.loadingText)
        loadingSubtext = findViewById(R.id.loadingSubtext)
        uploadHint = findViewById(R.id.uploadHint)
        uploadButtonsLayout = findViewById(R.id.uploadButtonsLayout)
        btnUploadWithImage = findViewById(R.id.btnUploadWithImage)
        btnUploadResultsOnly = findViewById(R.id.btnUploadResultsOnly)
    }
    
    private fun setupUI() {
        btnCamera.setOnClickListener {
            checkCameraPermissionAndTakePicture()
        }
        
        btnGallery.setOnClickListener {
            checkGalleryPermissionAndPickImage()
        }
        
        findViewById<View>(R.id.imageCard).setOnClickListener {
            checkGalleryPermissionAndPickImage()
        }
        
        // Setup upload buttons
        btnUploadWithImage.setOnClickListener {
            Log.d(TAG, "Upload with image button clicked")
            Log.d(TAG, "currentBitmap is null? ${currentBitmap == null}")
            Log.d(TAG, "currentResult is null? ${currentResult == null}")
            currentBitmap?.let { bitmap ->
                Log.d(TAG, "Bitmap available: ${bitmap.width}x${bitmap.height}")
                currentResult?.let { result ->
                    Log.d(TAG, "Result available, calling performUpload with includeImage=true")
                    performUpload(bitmap, result, includeImage = true)
                    hideUploadButtons()
                }
            } ?: Log.d(TAG, "No bitmap available for upload")
        }
        
        btnUploadResultsOnly.setOnClickListener {
            Log.d(TAG, "Upload results only button clicked")
            currentBitmap?.let { bitmap ->
                currentResult?.let { result ->
                    Log.d(TAG, "Calling performUpload with includeImage=false")
                    performUpload(bitmap, result, includeImage = false)
                    hideUploadButtons()
                }
            }
        }
    }
    
    private fun initializeTensorFlowLite() {
        try {
            Log.d(TAG, "Loading TensorFlow Lite model...")
            val modelFile = loadModelFile("enhanced_coconut_model.tflite")
            tflite = Interpreter(modelFile)
            labels = loadLabels("enhanced_labels.txt")
            Log.d(TAG, "Model loaded successfully. Labels count: ${labels.size}")
            Log.d(TAG, "Labels: ${labels.contentToString()}")
            showToast("AI model loaded successfully!")
        } catch (e: Exception) {
            Log.e(TAG, "Error loading AI model", e)
            showToast("Error loading AI model: ${e.message}")
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
            showToast("No camera app found!")
        }
    }
    
    private fun checkGalleryPermissionAndPickImage() {
        pickImageLauncher.launch("image/*")
    }
    
    private fun processImage(bitmap: Bitmap) {
        try {
            Log.d(TAG, "Processing image - original size: ${bitmap.width}x${bitmap.height}")
            
            // Validate bitmap
            if (bitmap.isRecycled) {
                Log.e(TAG, "Bitmap is recycled")
                showToast("Image is corrupted or recycled")
                return
            }
            
            showLoadingAnimation()
            uploadHint.visibility = View.GONE
            
            // Convert hardware bitmap to software bitmap if needed
            val softwareBitmap = if (bitmap.config == Bitmap.Config.HARDWARE) {
                Log.d(TAG, "Converting hardware bitmap to software bitmap")
                bitmap.copy(Bitmap.Config.ARGB_8888, false)
            } else {
                bitmap
            }
            
            // Create a scaled bitmap with proper validation
            Log.d(TAG, "Scaling image to ${IMG_SIZE}x${IMG_SIZE}")
            val processedBitmap = Bitmap.createScaledBitmap(softwareBitmap, IMG_SIZE, IMG_SIZE, true)
            
            // Validate processed bitmap
            if (processedBitmap.isRecycled || processedBitmap.width != IMG_SIZE || processedBitmap.height != IMG_SIZE) {
                Log.e(TAG, "Error scaling image - recycled: ${processedBitmap.isRecycled}, size: ${processedBitmap.width}x${processedBitmap.height}")
                showToast("Error scaling image to proper size")
                hideLoadingAnimation()
                return
            }
            
            Log.d(TAG, "Image scaled successfully, setting to ImageView")
            imageView.setImageBitmap(processedBitmap)
            currentBitmap = processedBitmap // Store for cloud upload
            
            Log.d(TAG, "Starting image classification...")
            // Start enhanced loading animation and wait for it to complete
            startEnhancedLoadingAnimation { 
                // This callback runs after loading animation completes
                lifecycleScope.launch {
                    try {
                        val result = classifyImage(processedBitmap)
                        currentResult = result // Store for upload buttons
                        hideLoadingAnimation()
                        Log.d(TAG, "Classification completed successfully")
                        displayResult(result)
                        
                        // Show upload buttons instead of automatic dialog
                        showUploadButtons()
                    } catch (e: Exception) {
                        hideLoadingAnimation()
                        Log.e(TAG, "Error in classification", e)
                        textResult.text = "❌ Error during analysis: ${e.message}"
                    }
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing image", e)
            hideLoadingAnimation()
            showToast("Error processing image: ${e.message}")
            textResult.text = "❌ Error processing image"
            e.printStackTrace()
        }
    }
    
    private fun showLoadingAnimation() {
        loadingLayout.visibility = View.VISIBLE
    }
    
    private fun hideLoadingAnimation() {
        loadingLayout.visibility = View.GONE
    }
    
    private fun startEnhancedLoadingAnimation(onComplete: () -> Unit) {
        showLoadingAnimation()
        
        // Create a sequence of loading messages to simulate AI processing stages
        val loadingStages = listOf(
            "🔍 Analyzing image..." to "Preprocessing image data...",
            "🤖 Running AI model..." to "Neural network processing...",
            "🧠 Detecting patterns..." to "Identifying leaf features...", 
            "📊 Calculating confidence..." to "Analyzing disease markers...",
            "✨ Finalizing results..." to "Generating recommendations..."
        )
        
        lifecycleScope.launch {
            for ((index, stage) in loadingStages.withIndex()) {
                loadingText.text = stage.first
                loadingSubtext.text = stage.second
                
                // Each stage takes 800ms to make it more visible
                delay(800L)
            }
            
            // Final stage - actually processing
            loadingText.text = "🎯 Processing complete!"
            loadingSubtext.text = "Preparing results..."
            delay(500L)
            
            // Call the completion callback
            onComplete()
        }
    }
    
    private fun classifyImage(bitmap: Bitmap): ClassificationResult {
        Log.d(TAG, "classifyImage called")
        
        if (tflite == null) {
            Log.e(TAG, "TensorFlow Lite model not initialized")
            throw IllegalStateException("TensorFlow Lite model not initialized")
        }
        
        // Validate bitmap before processing
        if (bitmap.isRecycled) {
            Log.e(TAG, "Bitmap is recycled in classifyImage")
            throw IllegalStateException("Bitmap is recycled")
        }
        
        if (bitmap.config == Bitmap.Config.HARDWARE) {
            Log.e(TAG, "Hardware bitmap detected in classifyImage - this should have been converted earlier")
            throw IllegalStateException("Hardware bitmap cannot be processed directly")
        }
        
        if (bitmap.width != IMG_SIZE || bitmap.height != IMG_SIZE) {
            Log.e(TAG, "Bitmap size mismatch: expected ${IMG_SIZE}x${IMG_SIZE}, got ${bitmap.width}x${bitmap.height}")
            throw IllegalStateException("Bitmap size mismatch: expected ${IMG_SIZE}x${IMG_SIZE}, got ${bitmap.width}x${bitmap.height}")
        }
        
        try {
            Log.d(TAG, "Getting input tensor info...")
            val inputTensor = tflite!!.getInputTensor(0)
            val isQuantized = inputTensor.dataType() == org.tensorflow.lite.DataType.UINT8
            
            Log.d(TAG, "Input tensor - quantized: $isQuantized, shape: ${inputTensor.shape().contentToString()}")
            
            val inputBuffer = if (isQuantized) {
                ByteBuffer.allocateDirect(IMG_SIZE * IMG_SIZE * NUM_CHANNELS)
            } else {
                ByteBuffer.allocateDirect(IMG_SIZE * IMG_SIZE * NUM_CHANNELS * 4)
            }
            inputBuffer.order(ByteOrder.nativeOrder())
            
            Log.d(TAG, "Created input buffer, extracting pixels...")
            val intValues = IntArray(IMG_SIZE * IMG_SIZE)
            
            // Safe pixel extraction with validation
            try {
                bitmap.getPixels(intValues, 0, IMG_SIZE, 0, 0, IMG_SIZE, IMG_SIZE)
                Log.d(TAG, "Successfully extracted ${intValues.size} pixels")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to extract pixels from bitmap", e)
                throw IllegalStateException("Failed to extract pixels from bitmap: ${e.message}")
            }
            
            Log.d(TAG, "Processing pixels...")
            // Process pixels
            for (pixelValue in intValues) {
                val r = ((pixelValue shr 16) and 0xFF)
                val g = ((pixelValue shr 8) and 0xFF)
                val b = (pixelValue and 0xFF)
                
                if (isQuantized) {
                    inputBuffer.put(r.toByte())
                    inputBuffer.put(g.toByte())
                    inputBuffer.put(b.toByte())
                } else {
                    inputBuffer.putFloat(r / 255.0f)
                    inputBuffer.putFloat(g / 255.0f)
                    inputBuffer.putFloat(b / 255.0f)
                }
            }
            
            Log.d(TAG, "Running inference...")
            
            // Create output tensor based on model's output type
            val outputTensor = tflite!!.getOutputTensor(0)
            val isOutputQuantized = outputTensor.dataType() == org.tensorflow.lite.DataType.UINT8
            
            Log.d(TAG, "Output tensor - quantized: $isOutputQuantized, shape: ${outputTensor.shape().contentToString()}")
            
            val probabilities = if (isOutputQuantized) {
                // For quantized output
                val output = Array(1) { ByteArray(labels.size) }
                tflite!!.run(inputBuffer, output)
                
                // Convert ByteArray to FloatArray for quantized models
                val quantizedOutput = output[0]
                FloatArray(labels.size) { i ->
                    (quantizedOutput[i].toInt() and 0xFF) / 255.0f
                }
            } else {
                // For float output
                val output = Array(1) { FloatArray(labels.size) }
                tflite!!.run(inputBuffer, output)
                output[0]
            }
            
            Log.d(TAG, "Inference completed, processing results...")
            val maxIndex = probabilities.indices.maxByOrNull { probabilities[it] } ?: 0
            val maxProbability = probabilities[maxIndex]
            val className = labels[maxIndex]
            
            Log.d(TAG, "Classification result: $className with confidence $maxProbability")
            
            val allPredictions = labels.zip(probabilities.toList()).toMap()
            
            return ClassificationResult(className, maxProbability, allPredictions)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error during image classification", e)
            throw RuntimeException("Error during image classification: ${e.message}", e)
        }
    }
    
    private fun displayResult(result: ClassificationResult) {
        val confidence = result.confidence * 100
        
        val (emoji, statusText) = when (result.className.lowercase()) {
            "healthy", "healthy_leaves" -> "✅" to "Healthy Tree"
            "bud_rot" -> "🦠" to "Bud Rot Disease"
            "leaf_spot" -> "🍃" to "Leaf Spot Disease"
            "lethal_yellowing" -> "⚠️" to "Lethal Yellowing"
            "cci_caterpillars" -> "🐛" to "CCI Caterpillars"
            "cci_leaflets" -> "🍂" to "CCI Leaflets"
            "wclwd_dryingofleaflets" -> "🥀" to "WCLWD Drying"
            "wclwd_flaccidity" -> "💧" to "WCLWD Flaccidity"
            "wclwd_yellowing" -> "🟡" to "WCLWD Yellowing"
            else -> "🔍" to result.className.replace("_", " ").replaceFirstChar { it.uppercase() }
        }
        
        // Create styled result text with improved formatting
        val mainResult = "$emoji $statusText\n" +
                "Confidence: ${confidence.toInt()}%"
        
        textResult.text = mainResult
        
        // Add detailed predictions with better formatting
        val detailedResults = result.allPredictions.entries
            .sortedByDescending { it.value }
            .take(3)
            .mapIndexed { index, entry ->
                val percentage = (entry.value * 100).toInt()
                val icon = when (index) {
                    0 -> "🥇"
                    1 -> "🥈"
                    2 -> "🥉"
                    else -> "•"
                }
                val displayName = entry.key.replace("_", " ").replaceFirstChar { it.uppercase() }
                "$icon $displayName: $percentage%"
            }
            .joinToString("\n")
        
        textResult.append("\n\n📊 Top Predictions:\n$detailedResults")
        
        // Enhanced recommendations with better styling
        val (recommendationIcon, recommendation) = when (result.className.lowercase()) {
            "healthy", "healthy_leaves" -> "🎉" to "Your dwarf coconut tree looks healthy! Continue regular care and monitoring."
            "bud_rot" -> "🚨" to "URGENT: Apply fungicide immediately and improve drainage. Remove affected parts."
            "leaf_spot" -> "🍃" to "Remove affected leaves and apply copper-based fungicide. Monitor closely."
            "lethal_yellowing" -> "⚠️" to "CRITICAL: Contact agricultural extension service immediately. This requires professional treatment."
            "cci_caterpillars" -> "🐛" to "Apply appropriate insecticide for caterpillar control. Check for eggs."
            "cci_leaflets" -> "🍂" to "Monitor leaf health and apply targeted treatment for leaflet issues."
            "wclwd_dryingofleaflets" -> "🥀" to "Address water stress and nutrient deficiency. Improve irrigation."
            "wclwd_flaccidity" -> "💧" to "Check soil moisture and drainage. May need improved water management."
            "wclwd_yellowing" -> "🟡" to "Monitor for water and nutrient stress. Consider soil testing."
            else -> "📱" to "Consult with agricultural experts for proper diagnosis and treatment."
        }
        
        textResult.append("\n\n$recommendationIcon Recommendation:\n$recommendation")
        
        // Add severity indicator
        val severityLevel = when (result.className.lowercase()) {
            "healthy", "healthy_leaves" -> "🟢 Low Risk"
            "cci_caterpillars", "cci_leaflets", "leaf_spot" -> "🟡 Medium Risk"
            "wclwd_dryingofleaflets", "wclwd_flaccidity", "wclwd_yellowing" -> "🟠 High Risk"
            "bud_rot", "lethal_yellowing" -> "🔴 Critical Risk"
            else -> "⚪ Unknown"
        }
        
        textResult.append("\n\n🚦 Severity: $severityLevel")
    }
    
    private fun showUploadButtons() {
        uploadButtonsLayout.visibility = View.VISIBLE
        textResult.append("\n\n📤 Choose upload option:")
        textResult.append("\n• With Image: Full scan record")
        textResult.append("\n• Results Only: Save bandwidth")
    }
    
    private fun hideUploadButtons() {
        uploadButtonsLayout.visibility = View.GONE
    }
    
    private fun performUpload(bitmap: Bitmap, result: ClassificationResult, includeImage: Boolean) {
        lifecycleScope.launch {
            try {
                Log.d(TAG, "=== PERFORM UPLOAD START ===")
                Log.d(TAG, "Uploading scan to cloud (includeImage: $includeImage)...")
                Log.d(TAG, "Bitmap is null? ${bitmap == null}")
                Log.d(TAG, "Bitmap size: ${bitmap?.width}x${bitmap?.height}")
                val statusMessage = if (includeImage) "📤 Uploading with image..." else "📝 Uploading results..."
                showToast(statusMessage)
                textResult.append("\n\n⏳ $statusMessage")
                
                val bitmapToPass = if (includeImage) {
                    Log.d(TAG, "Including bitmap in upload")
                    bitmap
                } else {
                    Log.d(TAG, "NOT including bitmap in upload")
                    null
                }
                
                Log.d(TAG, "Calling cloudUploadService with bitmap: ${bitmapToPass != null}")
                val uploadResult = cloudUploadService.uploadScanToCloud(
                    bitmap = bitmapToPass,
                    diseaseDetected = result.className,
                    confidence = result.confidence,
                    allPredictions = result.allPredictions,
                    location = null, // TODO: Add GPS location
                    userNotes = ""
                )
                
                uploadResult.fold(
                    onSuccess = { response: CloudResponse ->
                        Log.d(TAG, "Cloud upload successful: ${response.message}")
                        val successMessage = if (includeImage) "✅ Uploaded with image!" else "✅ Uploaded (no image)!"
                        showToast("$successMessage View at: dwarf-cocos.vercel.app")
                        
                        // Update the text result
                        val lastText = textResult.text.toString()
                        val updatedText = lastText.replace("⏳ $statusMessage", "☁️ $successMessage")
                        textResult.text = updatedText
                        textResult.append("\n🌐 View online: dwarf-cocos.vercel.app")
                    },
                    onFailure = { error: Throwable ->
                        Log.e(TAG, "Cloud upload failed: ${error.message}")
                        showToast("⚠️ Cloud upload failed (saved locally)")
                        
                        // Update the text result
                        val lastText = textResult.text.toString()
                        val updatedText = lastText.replace("⏳ $statusMessage", "⚠️ Upload failed - saved locally")
                        textResult.text = updatedText
                    }
                )
                
            } catch (e: Exception) {
                Log.e(TAG, "Error uploading to cloud", e)
                showToast("📱 Saved locally")
                val lastText = textResult.text.toString()
                val updatedText = lastText.replace("⏳ Uploading", "📱 Saved locally")
                textResult.text = updatedText
            }
        }
    }
    
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        tflite?.close()
    }
}
