const express = require('express');
const router = express.Router();
const { stripe, publishableKey } = require('../config/stripe');

// Get publishable key
router.get('/config', (req, res) => {
    res.json({
        publishableKey: publishableKey
    });
});

// Test endpoint to verify Stripe connection and list charges
router.get('/test-connection', async (req, res) => {
    try {
        const charges = await stripe.charges.list({
            limit: 10,
        });
        
        res.json({
            success: true,
            message: 'Stripe connection successful',
            charges: charges.data
        });
    } catch (error) {
        console.error('Error testing Stripe connection:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            type: error.type,
            code: error.code
        });
    }
});

// Create a payment intent
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle successful payment
router.post('/payment-success', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            // Handle successful payment (e.g., update database, send confirmation email)
            res.json({ success: true, message: 'Payment successful' });
        } else {
            res.status(400).json({ success: false, message: 'Payment not successful' });
        }
    } catch (error) {
        console.error('Error handling payment success:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 