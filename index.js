const express = require('express');
const axios = require('axios');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all origins

app.post('/download', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    if (ytdl.validateURL(url)) {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, '-');
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
      ytdl(url, { quality: 'highestvideo' }).pipe(res);
    } else {
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      });

      let filename = 'downloaded_file';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?(.+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      } else {
        filename = new URL(url).pathname.split('/').pop();
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.data.pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error processing download', details: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
