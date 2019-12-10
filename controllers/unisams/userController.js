const express = require('express');
const router = express.Router();
const userService = require('../../services/userService');

// routes
router.post('/register', async (req, res, next) => {
    try {
        await userService.create(req.body);
        res.send({});
    } catch(e) {
        res.status(500).send();
    }
});

router.get('/', async (req, res, next) => {
    try {
        await userService.getAll();
        res.send({});
    } catch(e) {
        res.status(500).send();
    }
});

router.get('/current', async (req, res, next) => {
    try {
        const user = await userService.getById(req.user.sub);
        if (user == null) {
            res.sendStatus(404);
        } else {
            res.send(user);
        }
    } catch(e) {
        res.status(500).send();
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const user = await userService.getById(req.params.id);
        if (user == null) {
            res.sendStatus(404);
        } else {
            res.send(user);
        }
    } catch(e) {
        res.status(500).send();
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        await userService.update(req.params.id, req.body);
        res.send(req.body);
    } catch(e) {
        res.status(500).send();
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        await userService.delete(req.params.id);
        res.send();
    } catch(e) {
        res.status(500).send();
    }
});