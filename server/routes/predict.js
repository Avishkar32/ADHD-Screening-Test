const express = require('express');
const router = express.Router(); // Router to handle routes
const model = require('../model'); // Import your ML model (adjust if using a different method for your model)

router.post('/', (req, res) => {
    try {
        // Assuming 'req.body' contains the data for prediction
        const data = req.body;

        // Logic to predict (this will depend on your model)
        const prediction = model.predict(data); // Example: Adjust for your model

        // Send the prediction back to the client
        res.json({ prediction });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Something went wrong with prediction' });
    }
});

module.exports = router; // Export the router to use in server.js
