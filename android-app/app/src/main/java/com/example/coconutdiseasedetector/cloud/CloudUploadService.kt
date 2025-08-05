package com.example.coconutdiseasedetector.cloud

import android.content.Context
import android.graphics.Bitmap
import android.os.Build
import android.util.Log
import android.util.Base64
import com.example.coconutdiseasedetector.data.*
import com.example.coconutdiseasedetector.network.ApiClient
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

class CloudUploadService(private val context: Context) {
    
    companion object {
        private const val TAG = "CloudUploadService"
    }
    
    suspend fun uploadScanToCloud(
        bitmap: Bitmap?,
        diseaseDetected: String,
        confidence: Float,
        allPredictions: Map<String, Float>,
        location: LocationData? = null,
        userNotes: String = ""
    ): Result<CloudResponse> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Starting cloud upload...")
                
                // Convert bitmap to base64 if image is provided
                val imageBase64 = if (bitmap != null) {
                    bitmapToBase64(bitmap).also { 
                        Log.d(TAG, "Image converted to base64, size: ${it.length} characters")
                    }
                } else {
                    Log.d(TAG, "No image provided, uploading results only")
                    ""
                }
                
                // Create scan record with or without image
                val scanRecord = createScanRecord(
                    diseaseDetected, confidence, allPredictions, location, userNotes, imageBase64
                )
                
                Log.d(TAG, "ScanRecord created with imageBase64 length: ${scanRecord.imageBase64.length}")
                if (scanRecord.imageBase64.isNotEmpty()) {
                    Log.d(TAG, "ScanRecord imageBase64 preview: ${scanRecord.imageBase64.take(50)}...")
                }
                
                // Choose the right endpoint based on whether image is provided
                val response = if (bitmap != null && imageBase64.isNotEmpty()) {
                    Log.d(TAG, "Using image upload endpoint with base64 data")
                    Log.d(TAG, "Base64 preview: ${imageBase64.take(50)}...")
                    ApiClient.cloudApiService.uploadScanSimple(scanRecord)
                } else {
                    Log.d(TAG, "Using simple upload endpoint (no image)")
                    ApiClient.cloudApiService.uploadScanSimple(scanRecord)
                }
                
                if (response.isSuccessful && response.body() != null) {
                    Log.d(TAG, "Cloud upload successful!")
                    Result.success(response.body()!!)
                } else {
                    val error = "Upload failed: ${response.code()} - ${response.message()}"
                    Log.e(TAG, error)
                    Result.failure(Exception(error))
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Cloud upload error", e)
                Result.failure(e)
            }
        }
    }
    
    private fun createScanRecord(
        diseaseDetected: String,
        confidence: Float,
        allPredictions: Map<String, Float>,
        location: LocationData?,
        userNotes: String,
        imageBase64: String
    ): ScanRecord {
        val scanId = "scan_${System.currentTimeMillis()}"
        val severityLevel = getSeverityLevel(diseaseDetected)
        val recommendation = getRecommendation(diseaseDetected)
        
        val detectionResult = DetectionResult(
            primaryDisease = diseaseDetected,
            confidence = confidence,
            allPredictions = allPredictions,
            severityLevel = severityLevel,
            riskLevel = severityLevel,
            recommendation = recommendation,
            processingTimeMs = 100L
        )
        
        val deviceInfo = ScanDeviceInfo(
            deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}",
            androidVersion = Build.VERSION.RELEASE,
            appVersion = "1.0",
            modelVersion = "enhanced_v1.0",
            imageResolution = "224x224"
        )
        
        val locationInfo = location?.let { loc ->
            LocationInfo(
                latitude = loc.latitude ?: 0.0,
                longitude = loc.longitude ?: 0.0,
                accuracy = loc.accuracy ?: 0.0f,
                address = loc.address
            )
        }
        
        return ScanRecord(
            id = scanId,
            userId = "mobile_user_${System.currentTimeMillis()}",
            timestamp = System.currentTimeMillis(),
            imageBase64 = imageBase64,
            imageName = "$scanId.jpg",
            imageSize = imageBase64.length.toLong(),
            detectionResult = detectionResult,
            deviceInfo = deviceInfo,
            locationInfo = locationInfo,
            notes = userNotes.ifEmpty { null }
        )
    }
    
    private fun saveBitmapToFile(bitmap: Bitmap, scanId: String): File {
        val file = File(context.cacheDir, "$scanId.jpg")
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
        }
        return file
    }
    
    private fun getSeverityLevel(diseaseDetected: String): String {
        return when (diseaseDetected.lowercase()) {
            "healthy", "healthy_leaves" -> "🟢 Low Risk"
            "cci_caterpillars", "cci_leaflets", "leaf_spot" -> "🟡 Medium Risk"
            "wclwd_dryingofleaflets", "wclwd_flaccidity", "wclwd_yellowing" -> "🟠 High Risk"
            "bud_rot", "lethal_yellowing" -> "🔴 Critical Risk"
            else -> "⚪ Unknown"
        }
    }
    
    private fun getRecommendation(diseaseDetected: String): String {
        return when (diseaseDetected.lowercase()) {
            "healthy", "healthy_leaves" -> "Your dwarf coconut tree looks healthy! Continue regular care and monitoring."
            "bud_rot" -> "URGENT: Apply fungicide immediately and improve drainage. Remove affected parts."
            "leaf_spot" -> "Remove affected leaves and apply copper-based fungicide. Monitor closely."
            "lethal_yellowing" -> "CRITICAL: Contact agricultural extension service immediately. This requires professional treatment."
            "cci_caterpillars" -> "Apply appropriate insecticide for caterpillar control. Check for eggs."
            "cci_leaflets" -> "Monitor leaf health and apply targeted treatment for leaflet issues."
            "wclwd_dryingofleaflets" -> "Address water stress and nutrient deficiency. Improve irrigation."
            "wclwd_flaccidity" -> "Check soil moisture and drainage. May need improved water management."
            "wclwd_yellowing" -> "Monitor for water and nutrient stress. Consider soil testing."
            else -> "Consult with agricultural experts for proper diagnosis and treatment."
        }
    }
    
    private fun bitmapToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
        val byteArray = outputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.DEFAULT)
    }
}
