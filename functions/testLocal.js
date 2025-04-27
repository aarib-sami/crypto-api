const express = require('express');
const router = require('./api'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/.netlify/functions/api', router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
