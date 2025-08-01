# 🥥 Coconut Disease Cloud Dashboard

A comprehensive web dashboard for monitoring coconut tree health using AI-powered disease detection. View all scanned images, analyze disease patterns, and track tree health over time.

## 🌟 Features

- **📊 Real-time Dashboard**: View all scanned coconut trees with disease detection results
- **📈 Analytics**: Comprehensive charts and statistics on disease distribution  
- **🔬 AI-Powered**: Advanced machine learning for accurate disease classification
- **☁️ Cloud Storage**: Secure storage of scan images and results
- **📱 Mobile Integration**: Seamless data sync from Android mobile app
- **🆓 Free Hosting**: Deployed on Vercel with free tier cloud services

## 🏗️ Architecture

### Frontend (Next.js)
- **Dashboard Page**: Overview of all scans with key statistics
- **Analytics Page**: Detailed charts and trend analysis
- **Responsive Design**: Works on desktop and mobile browsers

### Backend (Vercel Serverless)
- **Upload API**: Receives scan data from mobile app
- **Scans API**: Provides data for dashboard display
- **Database**: Local JSON files (completely free!)
- **Image Storage**: Cloudinary for scan image hosting

### Mobile App Integration
- **Android App**: Captures images and detects diseases
- **Cloud Upload**: Automatic sync of scan results
- **Offline Support**: Works without internet, syncs when connected

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- Free accounts on:
  - [Vercel](https://vercel.com) (hosting)
  - [Cloudinary](https://cloudinary.com) (image storage)

### 1. No Database Setup Needed!

This version uses local JSON files - completely free with no external database required!

### 2. Environment Variables

Create a `.env.local` file:

```env
# Cloudinary (only 3 variables needed!)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

No DATABASE_URL needed - uses local files!

### 3. Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use CLI:
vercel env add DATABASE_URL
vercel env add CLOUDINARY_CLOUD_NAME
# ... add all environment variables
```

## 📱 Mobile App Setup

The Android app automatically uploads scan results to this dashboard. Make sure to:

1. Update the API endpoint in `CloudApiService.kt`:
```kotlin
private const val BASE_URL = "https://your-dashboard.vercel.app/"
```

2. Build and install the Android app
3. Start scanning coconut trees!

## 🔧 Configuration

### Disease Classes
The system detects these coconut diseases:
- ✅ Healthy leaves
- 🟤 Leaf Spot disease  
- 🔴 Bud Rot disease
- 🟡 Lethal Yellowing
- 🐛 CCI Caterpillars
- 🟠 WCLWD (various symptoms)

### Severity Levels
- 🟢 Mild: Early stage, monitoring recommended
- 🟡 Moderate: Treatment advised  
- 🟠 Severe: Immediate attention needed
- 🔴 Critical: Emergency intervention required

## 📊 Dashboard Features

### Main Dashboard
- **Statistics Cards**: Total scans, healthy vs diseased trees
- **Recent Scans**: Latest detections with images and details
- **Quick Actions**: View details, export data

### Analytics Page  
- **Disease Distribution**: Pie charts and percentages
- **Trend Analysis**: Performance metrics over time
- **AI Recommendations**: Automated insights and advice

## 🔒 Security

- **CORS Protection**: API endpoints secured with proper headers
- **Input Validation**: All uploaded data is validated
- **Rate Limiting**: Prevents abuse of API endpoints
- **Environment Variables**: Sensitive data stored securely

## 🌍 Global Impact

This dashboard helps:
- **🌾 Farmers**: Monitor coconut tree health efficiently
- **🔬 Researchers**: Analyze disease patterns and trends  
- **🏛️ Agriculture Departments**: Track regional tree health
- **🌱 Conservationists**: Protect coconut biodiversity

## 📈 Scaling

The architecture supports scaling:
- **Serverless Functions**: Auto-scaling based on usage
- **CDN Distribution**: Fast global content delivery
- **Database Optimization**: Indexed queries for performance
- **Image Optimization**: Cloudinary automatic optimization

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in environment variables
   - Verify database is accessible from Vercel

2. **Images Not Loading**
   - Confirm Cloudinary credentials
   - Check image URLs in database

3. **No Data Showing**
   - Verify mobile app is uploading data
   - Check API endpoint configuration
   - Review CORS settings

### Debug Mode

Enable debug logging by adding:
```env
DEBUG_MODE=true
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TensorFlow**: Machine learning framework
- **Vercel**: Serverless hosting platform
- **Cloudinary**: Image storage and optimization
- **Next.js**: React framework for web development
- **Material Design**: UI/UX design principles

---

**🌴 Built with ❤️ for coconut farmers worldwide**

For support: [Create an issue](https://github.com/your-repo/issues) or contact the development team.
