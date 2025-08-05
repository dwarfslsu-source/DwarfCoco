package com.example.coconutdiseasedetector.data

import com.google.gson.annotations.SerializedName

data class LocationData(
    @SerializedName("latitude")
    val latitude: Double?,
    
    @SerializedName("longitude")
    val longitude: Double?,
    
    @SerializedName("address")
    val address: String? = null,
    
    @SerializedName("accuracy")
    val accuracy: Float? = null
)
