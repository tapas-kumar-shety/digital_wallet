const express = require('express');
const bodyParser = require('body-parser');
const { User, Transaction, Product } = require('./models');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const router = express.Router();
router.use(bodyParser.json());

// Basic Auth Middleware
const basicAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401);

    const [scheme, credentials] = authHeader.split(' ');
    if (scheme !== 'Basic' || !credentials) return res.sendStatus(401);

    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
    if (!username || !password) return res.sendStatus(401);

    User.findByUsername(username).then(user => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.sendStatus(401);
        }
        req.user = user;
        next();
    }).catch(err => res.status(500).json({ error: err.message }));
};

// Register User
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    User.create(username, password)
        .then(userId => res.status(201).json({ id: userId }))
        .catch(err => res.status(400).json({ error: err.message }));
});

// Fund Account
router.post('/fund', basicAuth, (req, res) => {
    const { amt } = req.body;
    User.updateBalance(req.user.id, amt)
        .then(() => Transaction.create(req.user.id, amt, 'credit'))
        .then(() => User.getBalance(req.user.id))
        .then(balance => res.json({ balance }))
        .catch(err => res.status(400).json({ error: err.message }));
});

// Pay Another User
router.post('/pay', basicAuth, (req, res) => {
    const { to, amt } = req.body;
    User.findByUsername(to).then(recipient => {
        if (!recipient) return res.status(400).json({ error: "Recipient doesn't exist" });

        return User.getBalance(req.user.id).then(balance => {
            if (balance < amt) return res.status(400).json({ error: 'Insufficient funds' });

            return User.updateBalance(req.user.id, -amt)
                .then(() => User.updateBalance(recipient.id, amt))
                .then(() => Transaction.create(req.user.id, amt, 'debit'))
                .then(() => User.getBalance(req.user.id))
                .then(balance => res.json({ balance }));
        });
    }).catch(err => res.status(400).json({ error: err.message }));
});

// Check Balance
router.get('/bal', basicAuth, (req, res) => {
    const currency = req.query.currency || 'INR';
    User.getBalance(req.user.id).then(balance => {
        if (currency === 'INR') {
            return res.json({ balance, currency });
        }

        axios.get(`https://api.currencyapi.com/v3/latest?apikey=YOUR_API_KEY&base=INR`)
            .then(response => {
                const rate = response.data.data[currency].value;
                const convertedBalance = balance * rate;
                res.json({ balance: convertedBalance, currency });
            })
            .catch(err => res.status(500).json({ error: 'Currency conversion failed' }));
    }).catch(err => res.status(400).json({ error: err.message }));
});

// View Transaction History
router.get('/stmt', basicAuth, (req, res) => {
    Transaction.getAll(req.user.id)
        .then(transactions => res.json(transactions))
        .catch(err => res.status(400).json({ error: err.message }));
});

// Add Product
router.post('/product', basicAuth, (req, res) => {
    const { name, price, description } = req.body;
    Product.create(name, price, description)
        .then(productId => res.status(201).json({ id: productId, message: 'Product added' }))
        .catch(err => res.status(400).json({ error: err.message }));
});

// List All Products
router.get('/product', (req, res) => {
    Product.getAll()
        .then(products => res.json(products))
        .catch(err => res.status(400).json({ error: err.message }));
});

// Buy a Product
router.post('/buy', basicAuth, (req, res) => {
    const { product_id } = req.body;
    Product.findById(product_id).then(product => {
        if (!product) return res.status(400).json({ error: 'Invalid product' });

        return User.getBalance(req.user.id).then(balance => {
            if (balance < product.price) return res.status(400).json({ error: 'Insufficient balance' });

            return User.updateBalance(req.user.id, -product.price)
                .then(() => Transaction.create(req.user.id, product.price, 'debit'))
                .then(() => res.json({ message: 'Product purchased', balance: balance - product.price }));
        });
    }).catch(err => res.status(400).json({ error: err.message }));
});



// Delete User
router.delete('/delete', basicAuth, (req, res) => {
    const userId = req.user.id;
    User.delete(userId)
        .then(() => res.json({ message: 'User deleted successfully' }))
        .catch(err => res.status(400).json({ error: err.message }));
});

// Get All Users
router.get('/users', (req, res) => {
    User.getAll()
        .then(users => res.json(users))
        .catch(err => res.status(500).json({ error: err.message }));
});


// Welcome message
router.get('/msg', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

module.exports = router;
