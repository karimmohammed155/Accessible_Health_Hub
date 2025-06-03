import { AssemblyAI } from 'assemblyai';
const client = new AssemblyAI({
  apiKey: '8ab01a9496234811bcd7b26be2a02bf5',
});

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const transcribeAudio = async (fileUrl) => {
  try {
    console.log("Downloading from:", fileUrl);

    // Generate a temporary file path
    const tempFilename = `${uuidv4()}.m4a`;
    const tempPath = path.join('temp', tempFilename);

    // Ensure temp directory exists
    if (!fs.existsSync('temp')) fs.mkdirSync('temp');

    // Download the file from the URL
    const response = await axios.get(fileUrl, { responseType: 'stream' });

    // Pipe to file
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    // Wait for file to finish writing
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Now stream the downloaded file
    const fileStream = fs.createReadStream(tempPath);

    const audioUrl = await client.files.upload(fileStream);
    console.log("Uploaded to AssemblyAI:", audioUrl);

    const transcript = await client.transcripts.transcribe({ audio_url: audioUrl });

    // Clean up
    fs.unlinkSync(tempPath);

    if (transcript.status === 'error') {
      console.error("Transcription error:", transcript.error);
      return null;
    }

    return transcript.text;
  } catch (error) {
    console.error("Failed to transcribe audio:", error.message || error);
    return null;
  }
};

export default transcribeAudio;
