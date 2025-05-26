import fs from 'fs';
import path from 'path';

export default async function openaiImgen({ text, filename, images, quality, size }, ctx) {
  const key = await ctx.read('OPENAI_KEY');
  let body;
  let headers = {
    'Authorization': `Bearer ${key}`
  };
  let apiUrl;
  switch(size) {
    case "square":
      size = "1024x1024";
      break;
    case "landscape":
      size = "1536x1024";
      break;
    case "portrait":
      size = "1024x1536";
      break;
  }

  // If images exist and length > 0, use FormData and the edits endpoint
  if (images && images.length > 0) {
    apiUrl = 'https://api.openai.com/v1/images/edits';
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', text);
    formData.append('quality', quality || "auto");


    // For each image, read its contents and attach it to the form
    for (let i = 0; i < images.length; i++) {
      const imageContent = await ctx.read(images[i]);
      // Attach image content with the filename
      const ext = path.extname(images[i])
      let mimeType = 'application/octet-stream'
      switch (ext) {
        case ".png":
          mimeType = "image/png";
          break;
        case ".jpg":
          mimeType = "image/jpeg";
          break
        case ".webp":
          mimeType = "image/webp";
          break

      }
      formData.append('image', new Blob([imageContent], { type: mimeType }), images[i]);
    }
    body = formData;
    // Note: Do not manually set the Content-Type header. FormData will handle it.
  } else {
    // No images provided: use JSON payload and the generations endpoint
    apiUrl = 'https://api.openai.com/v1/images/generations';
    body = JSON.stringify({
      model: 'gpt-image-1',
      prompt: text,
      quality: quality || "auto",
      size: size || "auto"
    });
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(`Error: ${response.status} ${response.statusText}\n${error.message}`);
  }

  const res = await response.json();

  // Assuming the API returns the image data in a b64_json field
  const data = res.data[0].b64_json;
  await ctx.write(filename, Buffer.from(data, 'base64'));
  return 'image generated';
}
