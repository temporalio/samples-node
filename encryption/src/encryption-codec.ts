// TODO switch to this once this is merged: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/63028
// import { decode, encode } from 'fastestsmallesttextencoderdecoder';
// @@@SNIPSTART typescript-encryption-codec
import { METADATA_ENCODING_KEY, Payload, PayloadCodec, ValueError } from '@temporalio/common';
import { temporal } from '@temporalio/proto';
import { decode, encode } from '@temporalio/common/lib/encoding';
import { decrypt, encrypt } from './crypto';

const ENCODING = 'binary/encrypted';
const METADATA_ENCRYPTION_KEY_ID = 'encryption-key-id';

export class EncryptionCodec implements PayloadCodec {
  constructor(protected readonly keys: Map<string, Buffer>, protected readonly defaultKeyId: string) {}

  static async create(keyId: string): Promise<EncryptionCodec> {
    const keys = new Map<string, Buffer>();
    keys.set(keyId, await fetchKey(keyId));
    return new this(keys, keyId);
  }

  async encode(payloads: Payload[]): Promise<Payload[]> {
    return Promise.all(
      payloads.map(async (payload) => ({
        metadata: {
          [METADATA_ENCODING_KEY]: encode(ENCODING),
          [METADATA_ENCRYPTION_KEY_ID]: encode(this.defaultKeyId),
        },
        // Encrypt entire payload, preserving metadata
        data: await encrypt(
          temporal.api.common.v1.Payload.encodeDelimited(payload).finish(),
          this.keys.get(this.defaultKeyId)! // eslint-disable-line @typescript-eslint/no-non-null-assertion
        ),
      }))
    );
  }

  async decode(payloads: Payload[]): Promise<Payload[]> {
    return Promise.all(
      payloads.map(async (payload) => {
        if (!payload.metadata || decode(payload.metadata[METADATA_ENCODING_KEY]) !== ENCODING) {
          return payload;
        }
        if (!payload.data) {
          throw new ValueError('Payload data is missing');
        }

        const keyIdBytes = payload.metadata[METADATA_ENCRYPTION_KEY_ID];
        if (!keyIdBytes) {
          throw new ValueError('Unable to decrypt Payload without encryption key id');
        }

        const keyId = decode(keyIdBytes);
        let key = this.keys.get(keyId);
        if (!key) {
          key = await fetchKey(keyId);
          this.keys.set(keyId, key);
        }
        const decryptedPayloadBytes = await decrypt(payload.data, key);
        console.log('Decrypting payload.data:', payload.data);
        return temporal.api.common.v1.Payload.decodeDelimited(decryptedPayloadBytes);
      })
    );
  }
}

async function fetchKey(_keyId: string): Promise<Buffer> {
  // In production, fetch key from a key management system (KMS). You may want to memoize requests if you'll be decoding
  // Payloads that were encrypted using keys other than defaultKeyId.
  return Buffer.from('test-key-test-key-test-key-test!');
}
// @@@SNIPEND
