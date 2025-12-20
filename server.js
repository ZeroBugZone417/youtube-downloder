const express = require('express');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
const downloads = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloads)) fs.mkdirSync(downloads);

app.get('/ytmp3', async (req, res) => {
  const { url, query } = req.query;

  let videoUrl = url;

  // If song name provided, search YouTube
  if (!url && query) {
    const result = await ytSearch(query);
    if (!result || !result.videos.length) {
      return res.status(404).json({ error: 'Song not found' });
    }
    videoUrl = result.videos[0].url;
  }

  if (!videoUrl) {
    return res.status(400).json({ error: 'Provide URL or song name' });
  }

  const filename = `audio_${Date.now()}.mp3`;
  const filePath = path.join(downloads, filename);

  try {
    const stream = ytdl(videoUrl, { filter: 'audioonly' });
    stream.pipe(fs.createWriteStream(filePath));

    stream.on('end', () => {
      res.download(filePath, filename, () => {
        fs.unlinkSync(filePath);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download MP3' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
