# Razorpay Setup Guide for NextRound

This guide explains how to configure your Razorpay account to work with the application.

## 1. Get API Keys
1.  Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  Navigate to **Account & Settings** -> **API Keys**.
3.  Generate a new **Key ID** and **Key Secret**.
4.  Copy these values.

## 2. Configure Environment Variables
Open your `.env.local` file and update the following lines with the keys you just generated:

```bash
# RAZORPAY CONFIG
RAZORPAY_KEY_ID=rzp_test_...        # Paste your Key ID here
RAZORPAY_KEY_SECRET=...             # Paste your Key Secret here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_... # Paste the SAME Key ID here (for frontend)
```

## 3. Webhook Integration (Optional but Recommended)
For high-reliability payment syncing (handling cases where a user closes the browser before redirection):
1.  In Razorpay Dashboard, go to **Account & Settings** -> **Webhooks**.
2.  Click **Add New Webhook**.
3.  Set **Webhook URL** to: `https://your-domain.ai/api/razorpay/webhook`
4.  Create a **Secret** (any secure string) and add it to your `.env.local`:
    ```bash
    RAZORPAY_WEBHOOK_SECRET=your_custom_secret
    ```
5.  Select **Active Events**: `payment.captured`.

## 4. Test Transaction
1.  Ensure you are in **Test Mode** on Razorpay.
2.  Go to the **Subscription** tab in your NextRound Dashboard.
3.  Click **Upgrade**.
4.  Use a [Razorpay Test Card](https://razorpay.com/docs/payments/payments/test-card-details/) to complete the flow.
5.  Verify that your account is automatically upgraded to **PRO**.

---
**Note:** When moving to production, remember to swap these keys with your **Live Mode** keys.
