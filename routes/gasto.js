const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sendEmail = require('../utils/sendEmail');
const { v4: uuidv4 } = require('uuid');

const gastosFilePath = path.join(__dirname, '../data/gastos.json');
const roommatesFilePath = path.join(__dirname, '../data/roommates.json');

const actualizarSaldoRoommate = (roommates, roommateNombre, monto, operacion, tipo) => {
    const roommateIndex = roommates.findIndex(r => r.nombre === roommateNombre);
    if (roommateIndex !== -1) {
        if (operacion === 'agregar') {
            if (tipo === 'debe') {
                roommates[roommateIndex].debe = (roommates[roommateIndex].debe || 0) + monto;
            } else if (tipo === 'recibe') {
                roommates[roommateIndex].recibe = (roommates[roommateIndex].recibe || 0) + monto;
            }
        } else if (operacion === 'restar') {
            if (tipo === 'debe') {
                roommates[roommateIndex].debe = (roommates[roommateIndex].debe || 0) - monto;
            } else if (tipo === 'recibe') {
                roommates[roommateIndex].recibe = (roommates[roommateIndex].recibe || 0) - monto;
            }
        }
        fs.writeFileSync(roommatesFilePath, JSON.stringify(roommates, null, 2));
    }
};

router.get('/', (req, res) => {
    try {
        const gastos = JSON.parse(fs.readFileSync(gastosFilePath, 'utf-8'));
        res.json({ gastos });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch gastos' });
    }
});

router.post('/', (req, res) => {
    try {
        const nuevoGasto = { id: uuidv4(), ...req.body };
        let gastos = JSON.parse(fs.readFileSync(gastosFilePath, 'utf-8'));
        let roommates = JSON.parse(fs.readFileSync(roommatesFilePath, 'utf-8'));

        
        const gastoExistente = gastos.find(g => g.descripcion === nuevoGasto.descripcion);
        
        if (gastoExistente) {
            
            actualizarSaldoRoommate(roommates, nuevoGasto.roommate, nuevoGasto.monto, 'agregar', 'debe');

            
            actualizarSaldoRoommate(roommates, gastoExistente.roommate, nuevoGasto.monto, 'agregar', 'recibe');

           
            const gastoCompartido = {
                id: uuidv4(),
                roommate: nuevoGasto.roommate,
                descripcion: nuevoGasto.descripcion,
                monto: nuevoGasto.monto,
                compartidoCon: gastoExistente.roommate
            };
            gastos.push(gastoCompartido);
            fs.writeFileSync(gastosFilePath, JSON.stringify(gastos, null, 2));
        } else {
            gastos.push(nuevoGasto);
            fs.writeFileSync(gastosFilePath, JSON.stringify(gastos, null, 2));

            
            actualizarSaldoRoommate(roommates, nuevoGasto.roommate, nuevoGasto.monto, 'agregar', 'debe');
        }

        sendEmail(roommates, nuevoGasto);

        res.status(201).json(nuevoGasto);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add gasto' });
    }
});

router.put('/', (req, res) => {
    try {
        const updatedGasto = req.body;
        let gastos = JSON.parse(fs.readFileSync(gastosFilePath, 'utf-8'));
        const index = gastos.findIndex(g => g.id === req.query.id);
        if (index !== -1) {
            let roommates = JSON.parse(fs.readFileSync(roommatesFilePath, 'utf-8'));

            
            actualizarSaldoRoommate(roommates, gastos[index].roommate, gastos[index].monto, 'restar', 'debe');
            if (gastos[index].compartidoCon) {
                actualizarSaldoRoommate(roommates, gastos[index].compartidoCon, gastos[index].monto, 'restar', 'recibe');
            }

            
            gastos[index] = { ...gastos[index], ...updatedGasto };
            fs.writeFileSync(gastosFilePath, JSON.stringify(gastos, null, 2));

            
            actualizarSaldoRoommate(roommates, updatedGasto.roommate, updatedGasto.monto, 'agregar', 'debe');
            if (updatedGasto.compartidoCon) {
                actualizarSaldoRoommate(roommates, updatedGasto.compartidoCon, updatedGasto.monto, 'agregar', 'recibe');
            }

            
            const gastosSimilares = gastos.filter(g => g.descripcion === updatedGasto.descripcion);
            const mayorGasto = gastosSimilares.reduce((prev, current) => (prev.monto > current.monto) ? prev : current);
            if (mayorGasto) {
                const roommateConMayorGasto = roommates.find(r => r.nombre === mayorGasto.roommate);
                const totalMonto = gastosSimilares.reduce((acc, g) => acc + g.monto, 0);
                const nuevoMontoRecibe = totalMonto - mayorGasto.monto;

                
                actualizarSaldoRoommate(roommates, roommateConMayorGasto.nombre, nuevoMontoRecibe, 'agregar', 'recibe');
            }

            res.json(gastos[index]);
        } else {
            res.status(404).json({ error: 'Gasto not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update gasto' });
    }
});

router.delete('/', (req, res) => {
    try {
        const { id } = req.query;
        let gastos = JSON.parse(fs.readFileSync(gastosFilePath, 'utf-8'));
        const index = gastos.findIndex(g => g.id === id);
        if (index !== -1) {
            const gastoEliminado = gastos[index];
            gastos.splice(index, 1);
            fs.writeFileSync(gastosFilePath, JSON.stringify(gastos, null, 2));

            let roommates = JSON.parse(fs.readFileSync(roommatesFilePath, 'utf-8'));
            actualizarSaldoRoommate(roommates, gastoEliminado.roommate, gastoEliminado.monto, 'restar', 'debe');

            if (gastoEliminado.compartidoCon) {
                actualizarSaldoRoommate(roommates, gastoEliminado.compartidoCon, gastoEliminado.monto, 'restar', 'recibe');
            }

            
            const gastosSimilares = gastos.filter(g => g.descripcion === gastoEliminado.descripcion);
            if (gastosSimilares.length > 0) {
                const mayorGasto = gastosSimilares.reduce((prev, current) => (prev.monto > current.monto) ? prev : current);
                const roommateConMayorGasto = roommates.find(r => r.nombre === mayorGasto.roommate);
                const totalMonto = gastosSimilares.reduce((acc, g) => acc + g.monto, 0);
                const nuevoMontoRecibe = totalMonto - mayorGasto.monto;

                
                actualizarSaldoRoommate(roommates, roommateConMayorGasto.nombre, nuevoMontoRecibe, 'agregar', 'recibe');
            }

            res.json({ message: 'Gasto deleted' });
        } else {
            res.status(404).json({ error: 'Gasto not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete gasto' });
    }
});

module.exports = router;
