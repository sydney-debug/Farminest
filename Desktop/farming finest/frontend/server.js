const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

const port = 5000;
app.listen(port, () => console.log(`Frontend running on http://localhost:${port}`));