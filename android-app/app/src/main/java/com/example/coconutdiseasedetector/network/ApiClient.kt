package com.example.coconutdiseasedetector.network

import com.google.gson.GsonBuilder
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

object ApiClient {
    
    // 🔒 SECURE DEPLOYMENT - UPDATED CREDENTIALS
    // Dashboard: https://dwarf-cocos.vercel.app
    // API Endpoints: /api/upload-mobile, /api/scans, /api/health
    // Database: Supabase PostgreSQL (New Secure Account)
    // Images: Cloudinary (New Secure Account)
    
    private const val BASE_URL = "https://dwarf-cocos.vercel.app/"
    
    private val gson = GsonBuilder()
        .setLenient()
        .create()
    
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()
    
    val cloudApiService: CloudApiService = retrofit.create(CloudApiService::class.java)
}
