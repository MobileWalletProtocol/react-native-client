import { EncryptedData } from ':core/message';
import { hexStringToUint8Array, uint8ArrayToHex } from ':core/type/util';
import * as fflate from "fflate";

export async function webEncrypt(sharedSecret: CryptoKey, plainText: string): Promise<EncryptedData> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    let encoded = new TextEncoder().encode(plainText)
    let compressedBytes = fflate.zlibSync(encoded);
    const cipherText = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        sharedSecret,
        compressedBytes
    );

    return { iv: new Uint8Array(iv), cipherText: new Uint8Array(cipherText) };
}

export async function webDecrypt(
    sharedSecret: CryptoKey,
    { iv, cipherText }: EncryptedData
): Promise<string> {
    const plainText = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedSecret, cipherText);
    let decompressed = fflate.unzlibSync(new Uint8Array(plainText));
    return new TextDecoder().decode(decompressed);
}

function getFormat(keyType: 'public' | 'private') {
    switch (keyType) {
        case 'public':
            return 'spki';
        case 'private':
            return 'pkcs8';
    }
}

export async function webExportKeyToHexString(
    type: 'public' | 'private',
    key: CryptoKey
): Promise<string> {
    const format = getFormat(type);
    const exported = await crypto.subtle.exportKey(format, key);
    return uint8ArrayToHex(new Uint8Array(exported));
}

export async function webImportKeyFromHexString(
    type: 'public' | 'private',
    hexString: string
): Promise<CryptoKey> {
    const format = getFormat(type);
    const arrayBuffer = hexStringToUint8Array(hexString).buffer;
    return await crypto.subtle.importKey(
        format,
        arrayBuffer,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        type === 'private' ? ['deriveKey'] : []
    );
}