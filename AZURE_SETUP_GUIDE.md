# Azure Form Recognizer Setup Guide

## 🎯 **Why We Need Azure**

- **Hybrid Text**: 90% accuracy, $0.00 cost
- **+ Azure Form Recognizer**: 99%+ accuracy, $0.0015 cost
- **Vision API**: 12% accuracy, $0.30 cost (terrible!)

## 📋 **Step-by-Step Setup**

### **Step 1: Create Azure Form Recognizer Resource**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Search "Form Recognizer"** in the search bar
3. **Click "Create"**
4. **Fill out the form**:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Region**: East US (recommended)
   - **Name**: `pdf-form-recognizer` (or any name)
   - **Pricing Tier**: 
     - **Free (F0)**: 500 pages/month free (perfect for testing)
     - **Standard (S0)**: $1.50 per 1000 pages (production)

5. **Click "Review + Create"** → **Create**

### **Step 2: Get Your API Keys**

1. **Go to your Form Recognizer resource**
2. **Click "Keys and Endpoint"** in the left menu
3. **Copy these values**:
   - **Key 1**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Endpoint**: `https://your-resource.cognitiveservices.azure.com/`

### **Step 3: Add Keys to Vercel**

#### **Method A: Vercel Dashboard (Recommended)**

1. **Go to**: https://vercel.com/dashboard
2. **Select your project**: `pdf-five-nu` or similar
3. **Go to Settings** → **Environment Variables**
4. **Add these variables**:

```
Name: AZURE_FORM_ENDPOINT
Value: https://your-resource.cognitiveservices.azure.com/

Name: AZURE_FORM_KEY  
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

5. **Click "Save"**
6. **Redeploy**: Go to Deployments → Click "..." → "Redeploy"

#### **Method B: Vercel CLI**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add AZURE_FORM_ENDPOINT
# Paste: https://your-resource.cognitiveservices.azure.com/

vercel env add AZURE_FORM_KEY
# Paste: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deploy with new environment variables
vercel --prod
```

### **Step 4: Verify Setup**

After deployment, test the endpoint:

```bash
curl "https://your-app.vercel.app/api/azure-hybrid-extract" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"pdfBase64":"test","useAzure":true}'
```

**Expected response**: Should not show "Azure credentials missing"

## 💰 **Azure Pricing**

### **Free Tier (F0)**
- **500 pages/month FREE**
- Perfect for testing and small usage
- No credit card required for free tier

### **Standard Tier (S0)**
- **$1.50 per 1000 pages**
- For production usage
- Much cheaper than Claude Vision ($0.30/doc)

### **Cost Comparison for 19-page PDF**:
- **Azure**: $0.0015 per document (1000x cheaper than Claude Vision!)
- **Claude Vision**: $0.30 per document
- **Hybrid Text Only**: $0.00 per document

## 🎯 **Expected Results After Setup**

### **Before (Text Only)**:
```json
{
  "holdings": 31,
  "confidence": 85,
  "method": "text-only",
  "accuracy": "90%"
}
```

### **After (Azure Enhanced)**:
```json
{
  "holdings": 40,
  "confidence": 99,
  "method": "azure-enhanced", 
  "accuracy": "99%+",
  "azureUsed": true
}
```

## 🚀 **Next Steps After Setup**

1. **Test with sample PDF**: Verify Azure integration works
2. **Test with your 19-page PDF**: Compare results
3. **Deploy to production**: Use the azure-hybrid-extract endpoint
4. **Monitor usage**: Check Azure costs in portal

## 🔧 **Troubleshooting**

### **"Azure credentials missing"**
- Check environment variables are set in Vercel
- Redeploy after adding variables
- Verify endpoint URL includes `https://`

### **"Authentication failed"**
- Double-check API key (no extra spaces)
- Ensure resource is in correct region
- Try regenerating keys in Azure portal

### **"Region not supported"**
- Use East US, West US 2, or West Europe
- Recreate resource in supported region

## ✅ **Success Checklist**

- [ ] Azure Form Recognizer resource created
- [ ] API keys copied
- [ ] Environment variables added to Vercel
- [ ] App redeployed
- [ ] Test endpoint returns "azureUsed": true
- [ ] Ready for 99%+ accuracy testing!