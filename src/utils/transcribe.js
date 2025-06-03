import { AssemblyAI } from 'assemblyai';
import axios from 'axios';

const client = new AssemblyAI({
  apiKey: '8ab01a9496234811bcd7b26be2a02bf5',
});

const transcribeAudio = async (fileUrl) => {
  try {
    console.log("Downloading from:", fileUrl);

    // Stream the file from Cloudinary directly
    const response = await axios.get(fileUrl, { responseType: 'stream' });

    const audioUrl = await client.files.upload(response.data); // direct stream
    console.log("Uploaded to AssemblyAI:", audioUrl);

    const transcript = await client.transcripts.transcribe({ audio_url: audioUrl });

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
