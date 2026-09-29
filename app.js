const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

/*
    Install required packages:
    npm init -y
    npm install express mysql2
*/

// Allow JSON data
app.use(express.json());

// Serve your HTML, CSS, and frontend JavaScript files
app.use(express.static(__dirname));


// ========================================
// Connect to MySQL
// ========================================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "savings_db"
});


// Test database connection
db.connect((err) => {

    if (err) {
        console.error("Database connection failed:", err);
        return;
    }

    console.log("Connected to savings_db");

});


// ========================================
// SAVINGS API
// ========================================


// ----------------------------------------
// GET - Retrieve all savings entries
// ----------------------------------------

app.get("/api/savings", (req, res) => {

    const sql = `
        SELECT *
        FROM savings
        ORDER BY date DESC, id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json(results);

    });

});


// ----------------------------------------
// GET - Retrieve one savings entry
// ----------------------------------------

app.get("/api/savings/:id", (req, res) => {

    const id = req.params.id;

    const sql = `
        SELECT *
        FROM savings
        WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {

            return res.status(404).json({
                message: "Savings entry not found"
            });

        }

        res.json(results[0]);

    });

});


// ----------------------------------------
// POST - Add savings entry
// ----------------------------------------

app.post("/api/savings", (req, res) => {

    const { date, amount, note } = req.body;


    // Validate required fields
    if (!date || amount === undefined || amount === "") {

        return res.status(400).json({
            message: "Date and amount are required"
        });

    }


    const sql = `
        INSERT INTO savings
        (date, amount, note)
        VALUES (?, ?, ?)
    `;


    db.query(
        sql,
        [date, amount, note || null],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }


            res.status(201).json({
                message: "Savings entry added successfully",
                id: result.insertId
            });

        }
    );

});


// ----------------------------------------
// PUT - Update savings entry
// ----------------------------------------

app.put("/api/savings/:id", (req, res) => {

    const id = req.params.id;
    const { date, amount, note } = req.body;


    // Validate required fields
    if (!date || amount === undefined || amount === "") {

        return res.status(400).json({
            message: "Date and amount are required"
        });

    }


    const sql = `
        UPDATE savings
        SET date = ?, amount = ?, note = ?
        WHERE id = ?
    `;


    db.query(
        sql,
        [date, amount, note || null, id],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Savings entry not found"
                });

            }


            res.json({
                message: "Savings entry updated successfully"
            });

        }
    );

});


// ----------------------------------------
// DELETE - Delete savings entry
// ----------------------------------------

app.delete("/api/savings/:id", (req, res) => {

    const id = req.params.id;


    const sql = `
        DELETE FROM savings
        WHERE id = ?
    `;


    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });

        }


        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Savings entry not found"
            });

        }


        res.json({
            message: "Savings entry deleted successfully"
        });

    });

});


// ========================================
// GOAL API
// ========================================


// ----------------------------------------
// GET - Retrieve savings goal
// ----------------------------------------

app.get("/api/goals", (req, res) => {

    const sql = `
        SELECT *
        FROM goals
        ORDER BY id DESC
        LIMIT 1
    `;


    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });

        }


        if (results.length === 0) {

            return res.json({
                id: null,
                target_amount: 0
            });

        }


        res.json(results[0]);

    });

});


// ----------------------------------------
// POST - Save / update savings goal
// ----------------------------------------

app.post("/api/goals", (req, res) => {

    const { target_amount } = req.body;


    // Validate target amount
    if (
        target_amount === undefined ||
        target_amount === "" ||
        Number(target_amount) < 0
    ) {

        return res.status(400).json({
            message: "A valid target amount is required"
        });

    }


    // Check whether a goal already exists
    const checkSql = `
        SELECT *
        FROM goals
        ORDER BY id DESC
        LIMIT 1
    `;


    db.query(checkSql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });

        }


        // ------------------------------------
        // Update existing goal
        // ------------------------------------

        if (results.length > 0) {

            const goalId = results[0].id;


            const updateSql = `
                UPDATE goals
                SET target_amount = ?
                WHERE id = ?
            `;


            db.query(
                updateSql,
                [target_amount, goalId],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            message: "Database error"
                        });

                    }


                    res.json({
                        message: "Savings goal updated successfully",
                        id: goalId
                    });

                }
            );

        }

        // ------------------------------------
        // Create first goal
        // ------------------------------------

        else {

            const insertSql = `
                INSERT INTO goals
                (target_amount)
                VALUES (?)
            `;


            db.query(
                insertSql,
                [target_amount],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            message: "Database error"
                        });

                    }


                    res.status(201).json({
                        message: "Savings goal saved successfully",
                        id: result.insertId
                    });

                }
            );

        }

    });

});


// ========================================
// DASHBOARD API
// ========================================


// ----------------------------------------
// GET - Dashboard summary
// ----------------------------------------

app.get("/api/dashboard", (req, res) => {

    const totalSql = `
        SELECT COALESCE(SUM(amount), 0) AS totalSaved
        FROM savings
    `;


    const goalSql = `
        SELECT target_amount
        FROM goals
        ORDER BY id DESC
        LIMIT 1
    `;


    db.query(totalSql, (err, totalResults) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });

        }


        db.query(goalSql, (err, goalResults) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });

            }


            const totalSaved =
                Number(totalResults[0].totalSaved) || 0;


            const savingsGoal =
                goalResults.length > 0
                    ? Number(goalResults[0].target_amount)
                    : 0;


            const remainingToGoal =
                Math.max(savingsGoal - totalSaved, 0);


            const progress =
                savingsGoal > 0
                    ? Math.min((totalSaved / savingsGoal) * 100, 100)
                    : 0;


            res.json({
                totalSaved: totalSaved,
                savingsGoal: savingsGoal,
                remainingToGoal: remainingToGoal,
                progress: progress
            });

        });

    });

});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});
