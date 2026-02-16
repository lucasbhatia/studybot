// Simple icon generator
const fs = require('fs');

// Create a simple PNG header + data for a 16x16 blue square
function createSimplePNG(size) {
  // This is a minimal 1x1 blue pixel PNG encoded as base64
  // For now we'll use a data URL and convert it
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3B82F6';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'white';
  ctx.font = `${Math.floor(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size / 2, size / 2);
  
  const dataUrl = canvas.toDataURL('image/png');
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

// Create placeholder files
['16', '48', '128'].forEach(size => {
  const buf = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, size, 0, 0, 0, size, 8, 2, 0, 0, 0, 144, 145, 34, 232,
    0, 0, 0, 30, 73, 68, 65, 84, 8, 29, 1, 19, 0, 236, 255, 0, 255,
    0, 0, 59, 130, 246, 59, 130, 246, 59, 130, 246, 59, 130, 246, 59,
    130, 246, 59, 130, 246, 59, 130, 246, 59, 130, 246, 0, 0, 0, 0,
    73, 69, 78, 68, 174, 66, 96, 130
  ]);
  fs.writeFileSync(`icon${size}.png`, buf);
  console.log(`Created icon${size}.png`);
});
