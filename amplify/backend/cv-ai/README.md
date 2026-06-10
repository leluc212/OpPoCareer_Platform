# CV AI Lambda

This Lambda keeps API Gateway and Cognito, but performs CV analysis with the
Gemini API. It does not use AWS Bedrock or another AWS AI service.

The default model is `gemini-3.1-flash-lite`, which has a Gemini API free tier.
Free-tier availability and quotas depend on the Google AI Studio account and
region.

## Test

```powershell
cd amplify/backend/cv-ai
python -m unittest -v
```

## Create a Gemini API key

Create a key in Google AI Studio:

https://aistudio.google.com/app/apikey

Store it in Secrets Manager:

```powershell
.\configure-gemini.ps1
```

The script prompts for the key without displaying it, creates or updates the
`opporeview/gemini` secret, and redeploys the Lambda.

## Deploy

```powershell
.\deploy-cv-ai-lambda.ps1 `
  -ApiId sd7ds72m8g `
  -JwtAuthorizerId 46klga `
  -StageName prod `
  -AllowedOrigins "http://localhost:3000,https://opporeview.github.io"
```

Frontend production configuration:

```env
VITE_CV_AI_API_URL=https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod
```
