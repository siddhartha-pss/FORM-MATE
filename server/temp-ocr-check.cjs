const axios = require('axios');
const FormData = require('form-data');
const OCR_SPACE_API_KEY = 'K85450272388957';

(async () => {
  const imageRes = await axios.get('https://httpbin.org/image/png', { responseType: 'arraybuffer' });
  const base64 = Buffer.from(imageRes.data).toString('base64');
  const formData = new FormData();
  formData.append('base64Image', `data:image/png;base64,${base64}`);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');
  formData.append('apikey', OCR_SPACE_API_KEY);

  try {
    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: { apikey: OCR_SPACE_API_KEY, ...formData.getHeaders() },
      timeout: 30000,
    });
    console.log('STATUS', response.status);
    console.log('BODY', JSON.stringify(response.data, null, 2).slice(0, 4000));
  } catch (err) {
    console.log('ERROR STATUS', err.response && err.response.status);
    console.log('ERROR DATA', JSON.stringify(err.response && err.response.data, null, 2));
    console.log('ERROR MESSAGE', err.message);
  }
})();