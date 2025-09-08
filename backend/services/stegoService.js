const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');

class StegoService {
  constructor() {
    this.tempPath = path.join(__dirname, '../temp');
    this.ensureTempDirectoryExists();
  }

  ensureTempDirectoryExists() {
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  /**
   * Embed data into an image using LSB steganography
   * @param {string} imagePath - Path to the original image
   * @param {Object} data - Data to embed
   * @returns {string} Path to the modified image
   */
  async embedData(imagePath, data, options = { noiseDefense: false, decoyCount: 5 }) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const image = await loadImage(imageBuffer);
      
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const pixels = imageData.data;

      // Prepare payload: support noise defense with decoys
      let payload;
      if (options.noiseDefense) {
        const decoys = [];
        for (let i = 0; i < (options.decoyCount || 5); i += 1) {
          decoys.push({
            type: 'decoy',
            fakeHash: require('crypto').randomBytes(32).toString('hex'),
            fakeSignature: require('crypto').randomBytes(32).toString('hex'),
            fakeIssuer: `decoy-${Math.random().toString(36).slice(2, 8)}`
          });
        }
        payload = {
          mode: 'noise',
          entries: [
            { type: 'real', data },
            ...decoys
          ]
        };
      } else {
        payload = { mode: 'plain', data };
      }

      // Convert data to binary string
      const dataString = JSON.stringify(payload);
      const binaryData = this.stringToBinary(dataString);
      
      // Add length prefix and end marker
      const lengthPrefix = this.numberToBinary(dataString.length, 32);
      const endMarker = '1111111111111110'; // 16-bit end marker
      const fullBinaryData = lengthPrefix + binaryData + endMarker;

      if (fullBinaryData.length > pixels.length * 3) {
        throw new Error('Data too large to embed in image');
      }

      // Embed data using LSB
      let dataIndex = 0;
      for (let i = 0; i < pixels.length && dataIndex < fullBinaryData.length; i += 4) {
        // Skip alpha channel
        for (let j = 0; j < 3 && dataIndex < fullBinaryData.length; j++) {
          pixels[i + j] = (pixels[i + j] & 0xFE) | parseInt(fullBinaryData[dataIndex]);
          dataIndex++;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Save modified image
      const outputPath = path.join(this.tempPath, `embedded_${Date.now()}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      console.log('✅ Data embedded successfully via steganography');
      return outputPath;
    } catch (error) {
      console.error('❌ Error embedding data:', error);
      throw new Error('Failed to embed data via steganography');
    }
  }

  /**
   * Extract data from an image using LSB steganography
   * @param {string} imagePath - Path to the image with embedded data
   * @returns {Object|null} Extracted data or null if not found
   */
  async extractData(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const image = await loadImage(imageBuffer);
      
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const pixels = imageData.data;

      // Extract binary data using LSB
      let binaryData = '';
      let endMarkerFound = false;
      
      for (let i = 0; i < pixels.length && !endMarkerFound; i += 4) {
        for (let j = 0; j < 3; j++) {
          binaryData += (pixels[i + j] & 1).toString();
          
          // Check for end marker
          if (binaryData.length >= 16) {
            const last16 = binaryData.slice(-16);
            if (last16 === '1111111111111110') {
              endMarkerFound = true;
              binaryData = binaryData.slice(0, -16); // Remove end marker
              break;
            }
          }
        }
      }

      if (!endMarkerFound || binaryData.length < 32) {
        return null;
      }

      // Extract length prefix
      const lengthBinary = binaryData.slice(0, 32);
      const dataLength = this.binaryToNumber(lengthBinary);
      
      // Extract actual data
      const dataBinary = binaryData.slice(32, 32 + dataLength * 8);
      const dataString = this.binaryToString(dataBinary);

      const extracted = JSON.parse(dataString);
      let result = null;
      if (extracted && extracted.mode === 'noise' && Array.isArray(extracted.entries)) {
        const real = extracted.entries.find(e => e && e.type === 'real' && e.data);
        result = real ? real.data : null;
      } else if (extracted && extracted.mode === 'plain' && extracted.data) {
        result = extracted.data;
      } else {
        result = extracted; // fallback
      }

      console.log('✅ Data extracted successfully from steganography');
      return result;
    } catch (error) {
      console.error('❌ Error extracting data:', error);
      return null;
    }
  }

  /**
   * Embed data into PDF (placeholder implementation)
   * @param {string} pdfPath - Path to the original PDF
   * @param {Object} data - Data to embed
   * @returns {string} Path to the modified PDF
   */
  async embedDataInPDF(pdfPath, data) {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would use a PDF manipulation library
      // like pdf-lib or PDFtk to embed data in PDF metadata or hidden layers
      
      const dataString = JSON.stringify(data);
      const outputPath = path.join(this.tempPath, `embedded_${Date.now()}.pdf`);
      
      // For now, just copy the original file
      fs.copyFileSync(pdfPath, outputPath);
      
      console.log('⚠️ PDF steganography not fully implemented - using placeholder');
      return outputPath;
    } catch (error) {
      console.error('❌ Error embedding data in PDF:', error);
      throw new Error('Failed to embed data in PDF');
    }
  }

  /**
   * Extract data from PDF (placeholder implementation)
   * @param {string} pdfPath - Path to the PDF with embedded data
   * @returns {Object|null} Extracted data or null if not found
   */
  async extractDataFromPDF(pdfPath) {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would extract data from PDF metadata
      // or hidden layers
      
      console.log('⚠️ PDF steganography not fully implemented - using placeholder');
      return null;
    } catch (error) {
      console.error('❌ Error extracting data from PDF:', error);
      return null;
    }
  }

  /**
   * Convert string to binary representation
   * @param {string} str - String to convert
   * @returns {string} Binary string
   */
  stringToBinary(str) {
    return str.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
  }

  /**
   * Convert binary string to original string
   * @param {string} binary - Binary string
   * @returns {string} Original string
   */
  binaryToString(binary) {
    let str = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.slice(i, i + 8);
      str += String.fromCharCode(parseInt(byte, 2));
    }
    return str;
  }

  /**
   * Convert number to binary representation with specified length
   * @param {number} num - Number to convert
   * @param {number} length - Length of binary string
   * @returns {string} Binary string
   */
  numberToBinary(num, length) {
    return num.toString(2).padStart(length, '0');
  }

  /**
   * Convert binary string to number
   * @param {string} binary - Binary string
   * @returns {number} Number
   */
  binaryToNumber(binary) {
    return parseInt(binary, 2);
  }

  /**
   * Clean up temporary files
   * @param {string} filePath - Path to file to delete
   */
  cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ Temporary file cleaned up:', filePath);
      }
    } catch (error) {
      console.error('❌ Error cleaning up file:', error);
    }
  }

  /**
   * Clean up all temporary files
   */
  cleanupAll() {
    try {
      const files = fs.readdirSync(this.tempPath);
      for (const file of files) {
        const filePath = path.join(this.tempPath, file);
        fs.unlinkSync(filePath);
      }
      console.log('✅ All temporary files cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up temporary files:', error);
    }
  }
}

module.exports = new StegoService();
