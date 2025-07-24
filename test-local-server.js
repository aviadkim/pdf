// Test if the server works locally to isolate the issue
const express = require("express");

const app = express();
const PORT = 3001;

app.get("/", (req, res) => {
    res.send("Local test server running");
});

app.listen(PORT, () => {
    console.log(`🧪 Local test server running on port ${PORT}`);
});
