const express = require('express');
const app = express();
const path = require('path');
const roommateRoutes = require('./routes/roommate');
const gastoRoutes = require('./routes/gasto');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/roommate', roommateRoutes);
app.use('/gasto', gastoRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
