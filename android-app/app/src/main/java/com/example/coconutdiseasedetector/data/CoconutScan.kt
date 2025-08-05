package com.example.coconutdiseasedetector.data

import com.google.gson.annotations.SerializedName
import java.util.Date

data class CoconutScan(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("timestamp")
    val timestamp: Date = Date(),
    
    @SerializedName("disease_detected")
    val diseaseDetected: String,
    
    @SerializedName("confidence")
    val confidence: Float,
    
    @SerializedName("image_filename")
    val imageFilename: String,
    
    @SerializedName("location")
    val location: LocationData? = null,
    
    @SerializedName("all_predictions")
    val allPredictions: List<Prediction> = emptyList(),
    
    @SerializedName("severity_level")
    val severityLevel: String = "Low",
    
    @SerializedName("recommendation")
    val recommendation: String = "",
    
    @SerializedName("user_notes")
    val userNotes: String? = null,
    
    @SerializedName("device_info")
    val deviceInfo: DeviceInfo? = null
)

data class Prediction(
    @SerializedName("class_name")
    val className: String,
    
    @SerializedName("confidence")
    val confidence: Float
)

data class DeviceInfo(
    @SerializedName("model")
    val model: String,
    
    @SerializedName("manufacturer")
    val manufacturer: String,
    
    @SerializedName("android_version")
    val androidVersion: String,
    
    @SerializedName("app_version")
    val appVersion: String
)
