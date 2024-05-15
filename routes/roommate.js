const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const fetchRandomUser = require('../utils/fetchRandomUser');

const roommatesFilePath = path.join(__dirname, '../data/roommates.json');

router.post('/', async (req, res) => {
    try {
        const newRoommate = await fetchRandomUser();
        let roommates = JSON.parse(fs.readFileSync(roommatesFilePath, 'utf-8'));
        roommates.push(newRoommate);
        fs.writeFileSync(roommatesFilePath, JSON.stringify(roommates, null, 2));
        res.status(201).json(newRoommate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add roommate' });
    }
});

router.get('/', (req, res) => {
    try {
        const roommates = JSON.parse(fs.readFileSync(roommatesFilePath, 'utf-8'));
        res.json({ roommates });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch roommates' });
    }
});

module.exports = router;
