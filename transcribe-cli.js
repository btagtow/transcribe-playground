// WORKING IMPLENTATION USING PCM FILE

const fs = require("fs");
const {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} = require("@aws-sdk/client-transcribe-streaming");
const { PassThrough } = require("stream");

// Set up the Transcribe client and other configurations
const transcribeClient = new TranscribeStreamingClient({
  region: "us-west-2",
  // credentials: {
  //   accessKeyId: "YOUR_ACCESS_KEY_ID",
  //   secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
  // },
});
const filePath = "./transcribe-test.pcm";

// Audio chunk size (even smaller, e.g., 1 KB or 2 KB)
const CHUNK_SIZE = 1024; // 1 KB per chunk for smaller processing

async function* audioEventGenerator() {
  const fileStream = fs.createReadStream(filePath, {
    highWaterMark: CHUNK_SIZE,
  });

  for await (const chunk of fileStream) {
    yield {
      AudioEvent: { AudioChunk: chunk },
    };
    // console.log("Audio chunk read from file:", chunk);
  }
}

async function main() {
  const audioStream = audioEventGenerator();

  const command = new StartStreamTranscriptionCommand({
    LanguageCode: "en-US",
    MediaEncoding: "pcm",
    MediaSampleRateHertz: 16000,
    AudioStream: audioStream,
  });

  try {
    const response = await transcribeClient.send(command);
    for await (const event of response.TranscriptResultStream) {
      if (event.TranscriptEvent) {
        const results = event.TranscriptEvent.Transcript.Results;
        for (const result of results) {
          if (!result.IsPartial) {
            console.log("Transcript:", result.Alternatives[0].Transcript);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error streaming transcription:", error);
  }
}

main();

// END WORKING IMPLEMENTATION USING PCM FILE

// const {
//   TranscribeStreamingClient,
//   StartStreamTranscriptionCommand,
// } = require("@aws-sdk/client-transcribe-streaming");
// const record = require("node-record-lpcm16");
// const { PassThrough } = require("stream");

// // Configure AWS Transcribe client
// const transcribeClient = new TranscribeStreamingClient({ region: "us-east-1" });

// // Audio settings
// const SAMPLE_RATE = 16000; // Set the sample rate to 16000 Hz for AWS Transcribe
// const CHANNELS = 1; // Mono audio
// const BITS_PER_SAMPLE = 16; // 16-bit audio format

// // Audio chunk generator
// async function* audioEventGenerator() {
//   const micStream = record.record({
//     sampleRateHertz: SAMPLE_RATE,
//     channels: CHANNELS,
//     threshold: 0, // No silence detection
//     recordProgram: "sox", // or use 'arecord' for Linux, 'sox' for macOS
//     silence: "10.0", // Stop recording after 10 seconds of silence
//     verbose: false,
//   });
//   if (record.startRecording) {
//     record.startRecording();
//   } else {
//     console.log("startRecording method not available");
//   }

//   console.log("Recording started. micStream is of type:", typeof micStream);
//   //   console.log("micStream object:", micStream);
//   console.log("micStream is of type:", typeof micStream);
//   // Check if micStream is an instance of Readable stream
//   if (micStream && typeof micStream.on === "function") {
//     console.log("micStream is a valid stream. Listening for 'data' events...");
//   } else {
//     console.error("micStream is not a valid stream.");
//     return;
//   }

//   // Handle the audio data
//   for await (const chunk of micStream) {
//     console.log("Audio chunk received, chunk length:", chunk.length);
//     yield { AudioEvent: { AudioChunk: chunk } };
//   }
// }

// // Main function to stream live audio to AWS Transcribe
// async function main() {
//   const audioStream = audioEventGenerator(); // Generator that yields audio chunks

//   // Set up the Transcribe Streaming command
//   const command = new StartStreamTranscriptionCommand({
//     LanguageCode: "en-US",
//     MediaEncoding: "pcm",
//     MediaSampleRateHertz: SAMPLE_RATE,
//     AudioStream: audioStream,
//   });

//   try {
//     // Send the command to AWS Transcribe
//     const response = await transcribeClient.send(command);

//     // Process the transcription result stream
//     for await (const event of response.TranscriptResultStream) {
//       if (event.TranscriptEvent) {
//         const results = event.TranscriptEvent.Transcript.Results;
//         for (const result of results) {
//           if (!result.IsPartial) {
//             console.log("Transcript:", result.Alternatives[0].Transcript);
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error streaming transcription:", error);
//   }
// }

// main();
