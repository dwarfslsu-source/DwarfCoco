package com.example.coconutdiseasedetector.network

import com.example.coconutdiseasedetector.data.CloudResponse
import com.example.coconutdiseasedetector.data.ScanRecord
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface CloudApiService {
    
    // Note: upload-scan endpoint removed - use upload-mobile instead
    @Multipart
    @POST("api/upload-mobile")
    suspend fun uploadScan(
        @Part image: MultipartBody.Part,
        @Part("scan_data") scanData: RequestBody
    ): Response<CloudResponse>
    
    @GET("api/scans")
    suspend fun getAllScans(): Response<List<ScanRecord>>
    
    @GET("api/scans/{id}")
    suspend fun getScanById(@Path("id") scanId: String): Response<ScanRecord>
    
    @POST("api/scans")
    suspend fun saveScanData(@Body scanRecord: ScanRecord): Response<CloudResponse>
    
    @GET("api/health")
    suspend fun healthCheck(): Response<CloudResponse>
    
    // Simple upload method that doesn't use multipart
    @POST("api/upload-scan-free")
    @Headers("Content-Type: application/json")
    suspend fun uploadScanSimple(@Body scanData: ScanRecord): Response<CloudResponse>
    
    // Real mobile upload with image
    @Multipart
    @POST("api/upload-mobile")
    suspend fun uploadMobileWithImage(
        @Part image: MultipartBody.Part,
        @Part("diseaseDetected") diseaseDetected: RequestBody,
        @Part("confidence") confidence: RequestBody
    ): Response<CloudResponse>
}
