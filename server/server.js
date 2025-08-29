const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.SECRET_KEY;
let lastProcessedFilePath = null;

const app = express();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 22 * 1024 * 1024 } });
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const removeBg = async (fileBuffer) => {
  const formData = new FormData();
  formData.append('file', fileBuffer, 'image.png');  // key 'file' matches Flask route expectation

  const response = await axios.post('http://localhost:3030/remove-bg', formData, {
    headers: {
      ...formData.getHeaders(),
    },
    responseType: 'arraybuffer',  // important to get image binary back
  });

  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};

app.post('/api/remove-bg', upload.single('file'), async (req, res) => {
  let filePath;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    filePath = req.file.path;
    const originalName = req.file.originalname;
    const ext = path.extname(originalName) || '.png';

    // Rename to keep extension
    fs.renameSync(filePath, filePath + ext);
    filePath += ext;

    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Send to local python API to remove background
    const rbgResultData = await removeBg(fileBuffer);

    // Save result image locally
    const resultFilePath = path.join(__dirname, path.parse(originalName).name + '-bg-remove.png');
    fs.writeFileSync(resultFilePath, Buffer.from(rbgResultData));

    lastProcessedFilePath = resultFilePath;

    // Send processed image back to client
    res.sendFile(resultFilePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});


app.get('/download', (req, res) => {
  if (!lastProcessedFilePath) {
    return res.status(400).json({ error: "No file to download" });
  }
  res.download(lastProcessedFilePath, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      console.log(`File downloaded successfully.`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
