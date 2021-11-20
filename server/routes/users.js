const express = require('express');
const router = express.Router();
const { userModel } = require("../models/users");

router.post('/post', (req, res) => {
    console.log(req.body);
    if (!req.body) res.status(404).json('missing req body');
    else res.status(200).json('ok');
});

router.post('/post/db', async (req, res) => {
    if (!req.body) res.status(404).json('missing req body');
    else {
        console.log(req.body);
        try {
            //push something to db 
            let data = await userModel.insertMany([req.body]);
            console.log(data);
            res.status(200).json(data);
        }
        catch (err) {
            res.status(500).json({
                status: 500,
                message: err.message,
            })
        }
    }
});

module.exports = router;