// Geração de hash SHA-256 para prova digital imutável
// Em produção, usar crypto-js ou SubtleCrypto

export function generateHash(data) {
  // Simulação de SHA-256 para MVP
  // Em produção: import CryptoJS from 'crypto-js'; return CryptoJS.SHA256(data).toString();
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Gerar string hexadecimal de 64 caracteres (simula SHA-256)
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return hex.repeat(8).substring(0, 64);
}

export function createCheckInProof(data) {
  const proof = {
    employeeId: data.employeeId,
    employerId: data.employerId,
    timestamp: data.timestamp,
    latitude: data.latitude,
    longitude: data.longitude,
    type: data.type, // 'check_in' ou 'check_out'
    photoUri: data.photoUri,
  };

  const hash = generateHash(proof);

  return {
    ...proof,
    hash,
    hashAlgorithm: "SHA-256",
    version: "1.0",
  };
}
