package com.example.coconutdiseasedetector.data

import java.util.Date

/**
 * Data class representing a complete scan record to be sent to server
 */
data class ScanRecord(
    val id: String? = null, // Server-generated ID
    val userId: String, // User identifier
    val timestamp: Long = System.currentTimeMillis(),
    val imageBase64: String, // Base64 encoded image
    val imageName: String,
    val imageSize: Long, // Image size in bytes
    val detectionResult: DetectionResult,
    val deviceInfo: ScanDeviceInfo,
    val locationInfo: LocationInfo? = null,
    val farmInfo: FarmInfo? = null,
    val notes: String? = null
)

data class DetectionResult(
    val primaryDisease: String,
    val confidence: Float,
    val allPredictions: Map<String, Float>,
    val severityLevel: String,
    val riskLevel: String,
    val recommendation: String,
    val processingTimeMs: Long
)

data class ScanDeviceInfo(
    val deviceModel: String,
    val androidVersion: String,
    val appVersion: String,
    val modelVersion: String, // AI model version
    val imageResolution: String
)

data class LocationInfo(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val address: String? = null,
    val farmZone: String? = null
)

data class FarmInfo(
    val farmId: String? = null,
    val farmName: String? = null,
    val treeAge: Int? = null, // Age in years
    val treeVariety: String? = null,
    val soilType: String? = null,
    val irrigationType: String? = null
)

/**
 * Server response data classes
 */
data class ServerResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class ScanUploadResponse(
    val scanId: String,
    val uploadedAt: Long,
    val imageUrl: String? = null,
    val analysisId: String? = null
)

data class HistoryResponse(
    val scans: List<ScanRecord>,
    val totalCount: Int,
    val page: Int,
    val pageSize: Int
)
