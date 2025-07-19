// backend/index.js
const express = require("express");
const cors = require("cors");
const db = require("./db");
const dotenv = require("dotenv");
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔒 Absolute Excel file path (Windows-style escaped)
const EXCEL_FILE_PATH = "C:\\Users\\dell\\OneDrive\\Desktop\\Pranav\\BBA\\Projects\\Final Project\\Backend\\survey_data.xlsx";

// 👉 Save to DB + Excel
app.post("/submit", (req, res) => {
  const {
    name, email,
    q1, q2, q3, q4, q5, q6, q7,
    comments,
  } = req.body;

  const insertQuery = `
    INSERT INTO responses 
    (name, email, q1, q2, q3, q4, q5, q6, q7, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [name, email, q1, q2, q3, q4, q5, q6, q7, comments];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Error saving data" });
    }

    const newRow = [name, email, q1, q2, q3, q4, q5, q6, q7, comments];

    let wb, ws;
    if (fs.existsSync(EXCEL_FILE_PATH)) {
      wb = xlsx.readFile(EXCEL_FILE_PATH);
      ws = wb.Sheets["Responses"];
      const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
      data.push(newRow);
      const updatedSheet = xlsx.utils.aoa_to_sheet(data);
      wb.Sheets["Responses"] = updatedSheet;
    } else {
      const ws_data = [["Name", "Email", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Comments"], newRow];
      ws = xlsx.utils.aoa_to_sheet(ws_data);
      wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Responses");
    }

    xlsx.writeFile(wb, EXCEL_FILE_PATH);
    res.status(200).json({ message: "Survey submitted successfully!" });
  });
});

// 📥 Download Excel File
app.get("/download-excel", (req, res) => {
  console.log("Attempting to download:", EXCEL_FILE_PATH);

  if (fs.existsSync(EXCEL_FILE_PATH)) {
    res.download(EXCEL_FILE_PATH, "survey_data.xlsx", (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Error downloading file.");
      }
    });
  } else {
    res.status(404).json({ error: "Excel file not found." });
  }
});

// 📊 Chart Data for Q1 Only
app.get("/chart-data", (req, res) => {
  const query = `
    SELECT q1 AS answer, COUNT(*) AS count
    FROM responses
    GROUP BY q1
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching chart data:", err);
      return res.status(500).json({ error: "Failed to fetch chart data" });
    }

    const labels = results.map(row => row.answer);
    const data = results.map(row => row.count);

    res.json({ labels, data });
  });
});

// 🔍 Get All Survey Responses
app.get("/responses", (req, res) => {
  const query = "SELECT * FROM responses ORDER BY id DESC";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching responses:", err);
      return res.status(500).json({ error: "Failed to fetch responses" });
    }
    res.json(results);
  });
});

// 📊 Chart Data for Q1 to Q7
app.get("/all-chart-data", async (req, res) => {
  const questions = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];
  const results = {};

  try {
    const promises = questions.map((q) => {
      return new Promise((resolve) => {
        const query = `SELECT ${q} AS answer, COUNT(*) AS count FROM responses GROUP BY ${q}`;
        db.query(query, (err, rows) => {
          if (err) {
            console.error(`Error fetching data for ${q}:`, err);
            resolve({ [q]: [] });
          } else {
            resolve({ [q]: rows });
          }
        });
      });
    });

    const data = await Promise.all(promises);
    data.forEach((item) => {
      const key = Object.keys(item)[0];
      results[key] = item[key];
    });

    res.json(results);
  } catch (error) {
    console.error("Error fetching all chart data:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});



// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
