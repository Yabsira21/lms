#!/usr/bin/env node

/**
 * Script to download face-api.js models required for FaceNet embeddings
 * 
 * Run: node scripts/download-face-api-models.mjs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '../public/models');
const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Models required for FaceNet (128-dimensional embeddings)
const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('Downloading face-api.js models for FaceNet...\n');

  for (const model of models) {
    const url = `${baseUrl}/${model}`;
    const dest = path.join(modelsDir, model);
    
    // Skip if file already exists
    if (fs.existsSync(dest)) {
      console.log(`✓ ${model} already exists, skipping...`);
      continue;
    }

    try {
      console.log(`Downloading ${model}...`);
      await downloadFile(url, dest);
      console.log(`✓ Downloaded ${model}`);
    } catch (error) {
      console.error(`✗ Failed to download ${model}:`, error.message);
    }
  }

  console.log('\n✓ All models downloaded successfully!');
  console.log(`Models are located in: ${modelsDir}`);
}

downloadModels().catch(console.error);
