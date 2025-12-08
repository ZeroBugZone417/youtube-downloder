const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/ytdl', async (req, res) => {
  const { url, fileType } = req.query;
  if (!url) return res.status(400).send('Missing URL');
  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, '-');
    
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${fileType}"`);
    if (fileType === 'mp3') {
      // Convert to MP3 using ffmpeg (optional)
      const ffmpeg = require('fluent-ffmpeg');
      const stream = ytdl(url, { filter: 'audioonly' });
      ffmpeg(stream)
        .format('mp3')
        .audioBitrate(128)
        .pipe(res, { end: true });
    } else {
      ytdl(url, { format: 'mp4' }).pipe(res);
    }
  } catch (e) {
    res.status(500).send('Download failed');
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
