package com.example.coconutdiseasedetector.data

import com.google.gson.annotations.SerializedName

data class CloudResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: Any? = null,
    
    @SerializedName("scan_id")
    val scanId: String? = null,
    
    @SerializedName("image_url")
    val imageUrl: String? = null,
    
    @SerializedName("timestamp")
    val timestamp: String? = null
)
