const { db } = require('./database');
const bcrypt = require('bcryptjs');

const User = {
    create: (username, password) => {
        const hashedPassword = bcrypt.hashSync(password, 8);
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    },

    findByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    },

    updateBalance: (userId, amount) => {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, userId], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    },

    getBalance: (userId) => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT balance FROM users WHERE id = ?`, [userId], (err, row) => {
                if (err) return reject(err);
                resolve(row.balance);
            });
        });
    },

    delete: (userId) => {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    },

    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT id, username FROM users`, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
};

const Transaction = {
    create: (userId, amount, type) => {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)`, [userId, amount, type], function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    },

    getAll: (userId) => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC`, [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
};

const Product = {
    create: (name, price, description) => {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO products (name, price, description) VALUES (?, ?, ?)`, [name, price, description], function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    },

    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM products`, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    },

    findById: (id) => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }
};

module.exports = { User, Transaction, Product };
