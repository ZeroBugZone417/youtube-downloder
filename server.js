const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ytsr = require('ytsr');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Direct download endpoint
app.get('/api/ytdl', async (req, res) => {
  const { url, fileType } = req.query;
  if (!url) return res.status(400).send('Missing URL');

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, '-');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${fileType}"`);

    if (fileType === 'mp3') {
      const stream = ytdl(url, { filter: 'audioonly' });
      ffmpeg(stream).format('mp3').audioBitrate(128).pipe(res, { end: true });
    } else {
      ytdl(url, { format: 'mp4' }).pipe(res);
    }
  } catch (err) {
    res.status(500).send('Download failed');
  }
});

// Optional: Search endpoint if you want full search feature
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const searchResults = await ytsr(query, { limit: 10 });
    const results = searchResults.items
      .filter(item => item.type === 'video')
      .map(video => ({
        title: video.title,
        url: video.url,
        thumbnail: video.bestThumbnail?.url || '',
        duration: video.duration || 'Unknown',
        views: video.views || 'N/A',
        published: video.uploadedAt || ''
      }));
    res.json({ result: results });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
