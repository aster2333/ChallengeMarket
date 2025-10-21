import CryptoJS from 'crypto-js';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

// 加密配置
const ENCRYPTION_CONFIG = {
  keySize: 256 / 32,
  ivSize: 128 / 32,
  iterations: 10000,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
};

// 私钥验证
export function validatePrivateKey(privateKey: string): boolean {
  try {
    // 尝试多种格式的私钥
    let keyBytes: Uint8Array;
    
    // 1. 尝试 Base58 格式
    if (privateKey.length >= 87 && privateKey.length <= 88) {
      keyBytes = bs58.decode(privateKey);
    }
    // 2. 尝试十六进制格式
    else if (privateKey.length === 128 && /^[0-9a-fA-F]+$/.test(privateKey)) {
      keyBytes = new Uint8Array(Buffer.from(privateKey, 'hex'));
    }
    // 3. 尝试数组格式 [1,2,3,...]
    else if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
      const arrayStr = privateKey.slice(1, -1);
      const numbers = arrayStr.split(',').map(n => parseInt(n.trim()));
      keyBytes = new Uint8Array(numbers);
    }
    // 4. 尝试逗号分隔的数字
    else if (privateKey.includes(',')) {
      const numbers = privateKey.split(',').map(n => parseInt(n.trim()));
      keyBytes = new Uint8Array(numbers);
    }
    else {
      return false;
    }

    // 验证密钥长度
    if (keyBytes.length !== 64) {
      return false;
    }

    // 尝试创建 Keypair 来验证有效性
    const keypair = Keypair.fromSecretKey(keyBytes);
    
    // 验证公钥是否有效
    new PublicKey(keypair.publicKey);
    
    return true;
  } catch (error) {
    console.error('Private key validation failed:', error);
    return false;
  }
}

// 从私钥创建 Keypair
export function createKeypairFromPrivateKey(privateKey: string): Keypair {
  try {
    let keyBytes: Uint8Array;
    
    // 根据格式解析私钥
    if (privateKey.length >= 87 && privateKey.length <= 88) {
      keyBytes = bs58.decode(privateKey);
    }
    else if (privateKey.length === 128 && /^[0-9a-fA-F]+$/.test(privateKey)) {
      keyBytes = new Uint8Array(Buffer.from(privateKey, 'hex'));
    }
    else if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
      const arrayStr = privateKey.slice(1, -1);
      const numbers = arrayStr.split(',').map(n => parseInt(n.trim()));
      keyBytes = new Uint8Array(numbers);
    }
    else if (privateKey.includes(',')) {
      const numbers = privateKey.split(',').map(n => parseInt(n.trim()));
      keyBytes = new Uint8Array(numbers);
    }
    else {
      throw new Error('Unsupported private key format');
    }

    return Keypair.fromSecretKey(keyBytes);
  } catch (error) {
    console.error('Failed to create keypair from private key:', error);
    throw new Error('Invalid private key format');
  }
}

// 生成随机密码盐
function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128/8).toString();
}

// 从密码派生密钥
function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: ENCRYPTION_CONFIG.keySize,
    iterations: ENCRYPTION_CONFIG.iterations
  });
}

// 加密私钥
export function encryptPrivateKey(privateKey: string, password: string): string {
  try {
    const salt = generateSalt();
    const key = deriveKey(password, salt);
    const iv = CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize);
    
    const encrypted = CryptoJS.AES.encrypt(privateKey, key, {
      iv: iv,
      mode: ENCRYPTION_CONFIG.mode,
      padding: ENCRYPTION_CONFIG.padding
    });

    // 组合盐、IV和加密数据
    const combined = {
      salt: salt,
      iv: iv.toString(),
      encrypted: encrypted.toString()
    };

    return JSON.stringify(combined);
  } catch (error) {
    console.error('Failed to encrypt private key:', error);
    throw new Error('Private key encryption failed');
  }
}

// 解密私钥
export function decryptPrivateKey(encryptedData: string, password: string): string {
  try {
    const combined = JSON.parse(encryptedData);
    const { salt, iv, encrypted } = combined;
    
    const key = deriveKey(password, salt);
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: ivWordArray,
      mode: ENCRYPTION_CONFIG.mode,
      padding: ENCRYPTION_CONFIG.padding
    });

    const privateKey = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!privateKey) {
      throw new Error('Decryption failed - invalid password');
    }

    return privateKey;
  } catch (error) {
    console.error('Failed to decrypt private key:', error);
    throw new Error('Private key decryption failed - check password');
  }
}

// 生成新的钱包
export function generateNewWallet(): { keypair: Keypair; privateKey: string; publicKey: string } {
  const keypair = Keypair.generate();
  const privateKey = bs58.encode(keypair.secretKey);
  const publicKey = keypair.publicKey.toString();
  
  return {
    keypair,
    privateKey,
    publicKey
  };
}

// 验证密码强度
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: '密码长度至少8位' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: '密码必须包含大写字母' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: '密码必须包含小写字母' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: '密码必须包含数字' };
  }
  
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, message: '密码必须包含特殊字符' };
  }
  
  return { isValid: true, message: '密码强度良好' };
}

// 安全清除敏感数据
export function secureClear(data: string): void {
  // 在 JavaScript 中无法真正安全清除内存
  // 但我们可以覆盖变量内容
  if (typeof data === 'string') {
    // 用随机字符覆盖
    const randomChars = Array(data.length).fill(0).map(() => 
      String.fromCharCode(Math.floor(Math.random() * 256))
    ).join('');
    data = randomChars;
  }
}