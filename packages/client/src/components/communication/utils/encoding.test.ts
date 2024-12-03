import { decodeResponseURLParams, encodeRequestURLParams } from './encoding';
import { MessageID, RPCRequestMessage } from ':core/message';

describe('encoding', () => {
  it('should encode handshake URL params', () => {
    const request: RPCRequestMessage = {
      id: '1' as MessageID,
      sender: 'sender',
      sdkVersion: '1.0.0',
      callbackUrl: 'https://callback.example.com',
      timestamp: new Date('2021-01-01T00:00:00Z'),
      content: {
        handshake: {
          method: 'eth_requestAccounts',
          params: {
            appName: 'My App',
          },
        },
      },
    };

    const result = encodeRequestURLParams(request);

    expect(result).toEqual(
      'id=%221%22&sender=%22sender%22&sdkVersion=%221.0.0%22&callbackUrl=%22https%3A%2F%2Fcallback.example.com%22&timestamp=%222021-01-01T00%3A00%3A00.000Z%22&content=%7B%22handshake%22%3A%7B%22method%22%3A%22eth_requestAccounts%22%2C%22params%22%3A%7B%22appName%22%3A%22My+App%22%7D%7D%7D'
    );
  });

  it('should encode encrypted URL params', () => {
    const request: RPCRequestMessage = {
      id: '1' as MessageID,
      sender: 'sender',
      sdkVersion: '1.0.0',
      callbackUrl: 'https://callback.example.com',
      timestamp: new Date('2021-01-01T00:00:00Z'),
      content: {
        encrypted: {
          iv: new Uint8Array([1, 2, 3]),
          cipherText: new Uint8Array([4, 5, 6]),
        },
      },
    };

    const result = encodeRequestURLParams(request);

    expect(result).toEqual(
      'id=%221%22&sender=%22sender%22&sdkVersion=%221.0.0%22&callbackUrl=%22https%3A%2F%2Fcallback.example.com%22&timestamp=%222021-01-01T00%3A00%3A00.000Z%22&content=%7B%22encrypted%22%3A%7B%22iv%22%3A%22AQID%22%2C%22cipherText%22%3A%22BAUG%22%7D%7D'
    );
  });

  it('should not include customScheme when undefined', () => {
    const request: RPCRequestMessage = {
      id: '1' as MessageID,
      sender: 'sender',
      sdkVersion: '1.0.0',
      callbackUrl: 'https://callback.example.com',
      customScheme: undefined, // falsy
      timestamp: new Date('2021-01-01T00:00:00Z'),
      content: {
        encrypted: {
          iv: new Uint8Array([1, 2, 3]),
          cipherText: new Uint8Array([4, 5, 6]),
        },
      },
    };

    const result = encodeRequestURLParams(request);

    expect(result).toEqual(
      'id=%221%22&sender=%22sender%22&sdkVersion=%221.0.0%22&callbackUrl=%22https%3A%2F%2Fcallback.example.com%22&timestamp=%222021-01-01T00%3A00%3A00.000Z%22&content=%7B%22encrypted%22%3A%7B%22iv%22%3A%22AQID%22%2C%22cipherText%22%3A%22BAUG%22%7D%7D'
    );
  });
});

describe('decoding', () => {
  const mockResponse = {
    id: '541efc8b-1aa8-4af1-88d1-34c4231f92bf' as MessageID,
    sender:
      '3059301306072a8648ce3d020106082a8648ce3d030107034200048235f8adc26178a6674f6e684e90eaacec95af520f39b1e14578b5f5648cc3379e48064dbc97331d60b9ed9ab6b4078e06c9c387872a4a4178ffbe9bc56c4a74',
    requestId: '300c44da-a3b1-40d8-ad13-35132392e8dd' as MessageID,
    content: {
      encrypted: {
        iv: new Uint8Array([198, 79, 43, 184, 133, 92, 255, 206, 76, 5, 15, 87]),
        cipherText: new Uint8Array([
          87, 77, 213, 130, 164, 31, 135, 79, 218, 132, 25, 93, 200, 28, 204, 226, 252, 216, 27, 36,
          146, 165, 27, 82, 63, 93, 0, 182, 18, 111, 55, 100, 27, 15, 11, 194, 80, 116, 115, 93, 41,
          127, 47, 38, 63, 135, 146, 221, 36, 143, 229, 83, 100, 245, 199, 3, 20, 170, 53, 72, 255,
          220, 205, 186, 31, 128, 166, 226, 19, 217, 168, 215, 255, 83, 232, 18, 65, 240, 132, 196,
          184, 6, 43, 207, 152, 44, 85, 179, 179, 17, 111, 40, 92, 41, 251, 37, 49, 66, 235, 160,
          202, 193, 188, 112, 31, 94, 216, 44, 95, 163, 210, 23, 98, 215, 245, 15, 140, 174, 145,
          165, 12, 44, 45, 124, 94, 161, 107, 70, 138, 169, 156, 135, 213, 96, 236, 250, 29, 214,
          218, 147, 29, 6, 86, 124, 188, 78, 3, 46, 0, 31, 121, 40, 139, 52, 30, 184, 169, 184, 189,
          76, 27, 82, 126, 112, 60, 222, 211, 27, 116, 184, 169, 160, 119, 231, 190, 183, 190, 34,
          40, 7, 56, 194, 246, 61, 210, 113, 170, 152, 135, 82, 254, 111, 63, 174, 155, 252, 191,
          17, 217, 93, 24, 130, 107, 117, 54, 216, 30, 99, 169, 103, 23, 47, 246, 178, 128, 201, 95,
          50, 40, 63, 243, 146, 236, 22, 78, 169, 211, 251, 138, 2, 168, 16, 253, 218, 119, 151,
          122, 66, 87, 172, 33, 162, 57, 213, 214, 223, 52, 72, 175, 58, 138, 175, 180, 228, 68,
          165, 111, 53, 232, 153, 119, 4, 165, 225, 252, 235, 129, 5, 162, 180, 152, 96, 81, 176,
          106, 198, 208, 110, 243, 85, 235, 27, 77, 58, 44, 212, 220, 42, 72, 89, 240, 244, 166, 24,
          83, 193, 238, 195, 182, 248, 129, 232, 72, 164, 81, 57, 170, 210, 69, 93, 162, 59, 255,
          236, 34, 66, 233, 218, 125, 111, 54, 64, 238, 36, 224, 222, 73, 83, 0, 120, 5, 215, 125,
          68, 66, 32, 60, 97, 73, 197, 87, 80, 72, 225, 202, 196, 17, 200, 169, 127, 95, 132, 87,
          175, 127, 26, 80, 108, 223, 80, 29, 151, 44, 179, 50, 161, 166, 209, 48, 25, 122, 38, 240,
          211, 158, 117, 218, 102, 207, 110, 236, 5, 159, 10, 180, 219, 49, 153, 194, 129, 228, 0,
          223, 154, 53, 118, 180, 99, 194, 18, 4, 65, 148, 98, 232, 34, 97, 160, 150, 123, 243, 53,
          57, 60, 129, 38, 180, 229, 69, 166, 141, 59, 45, 26, 150, 164, 88, 191, 102, 24, 169, 160,
          189, 240, 193, 116, 124, 194, 163, 153, 129, 169, 167, 234, 121, 150, 42, 143, 205, 171,
          172, 44, 103, 21, 175, 59, 37, 177, 43, 199, 180, 158, 34, 205, 208, 179, 25, 64, 0, 134,
          205, 7, 248, 114, 83, 12, 38, 218, 157, 92, 106, 47, 176, 199, 106, 191, 171, 10, 163,
          255, 115, 25, 116, 69, 138, 207, 65, 71, 250, 233, 100, 250, 57, 199, 147, 185, 86, 196,
          27, 5, 208, 93, 17, 74, 109, 111, 59, 230, 235, 9, 221, 184, 219, 254, 158, 48, 240, 154,
          44, 108, 176, 68, 188, 131, 33, 134, 87, 68, 162, 155, 89, 235, 206, 177, 193, 117, 218,
          183, 72, 4, 141, 57, 239, 232, 17, 77, 82, 19, 37, 93, 20, 233, 214, 248, 110, 157, 175,
          137, 31, 234, 99, 124, 91, 227, 127, 11, 248, 54, 164, 103, 30, 75, 73, 23, 249, 186, 241,
          139, 166, 146, 59, 25, 160, 103, 26, 73, 94, 74, 79, 46, 109, 173, 92, 149, 217, 155, 183,
          251, 34, 172, 140, 10, 223, 155, 224, 184, 87, 6, 144, 203, 59, 1, 157, 62, 73, 82, 72,
          112, 115, 68, 196, 197, 244, 114, 186, 119, 0, 55, 170, 253, 21, 103, 215, 8, 248, 18,
          155, 233, 217, 115, 74, 71, 178, 225, 255, 190, 126, 220, 158, 166, 42, 11, 62, 161, 210,
          54, 186, 64, 241, 144, 58, 1, 114, 73, 105, 96, 135, 217, 78, 67, 249, 69, 228, 71, 177,
          17, 94, 254, 255, 33, 237, 151, 53, 201, 160, 190, 122, 158, 162, 48, 219, 177, 110, 252,
          63, 44, 217, 220, 189, 61, 231, 11, 57, 24, 159, 154, 88, 4, 162, 231, 78, 62, 183, 12,
          45, 234, 133, 76, 56, 207, 154, 44, 171, 3, 194, 20, 248, 94, 101, 50, 189, 15, 144, 227,
          150, 219, 0, 37, 10, 136, 162, 17, 20, 5, 32, 39, 73, 20, 125, 157, 124, 54, 159, 138,
          151, 83, 0, 136, 180, 128, 199, 18, 138, 45, 147, 210, 249, 24, 91, 236, 183, 131, 191,
          166, 103, 140, 119, 216, 72, 44, 95, 30, 145, 62, 211, 227, 53, 89, 121, 159, 139, 49, 3,
          198, 241, 27, 28, 242, 5, 112, 107, 159, 246, 109, 87, 77, 37, 68, 225, 164, 89, 7, 238,
          89, 227, 113, 181, 29, 245, 183, 89, 189, 137, 154, 215, 141, 251, 156, 84, 3, 63, 99,
          129, 189, 105, 231, 61, 41, 216, 71, 202, 49, 128, 211, 162, 229, 180, 116, 248, 247, 114,
          125, 229, 183, 74, 148, 102, 54, 69, 27, 105, 114, 236, 249, 48, 79, 133, 215, 137, 228,
          14, 188, 110, 242, 242, 184, 163, 182, 2, 214, 140, 44, 149, 86, 252, 30, 166, 156, 112,
          187, 73, 84, 41, 226, 149, 72, 68, 87, 52, 127, 117, 173, 64, 253, 115, 130, 224, 58, 198,
          71, 199, 193, 39, 31, 88, 51, 228, 243, 32, 156, 79, 51, 30, 246, 169, 35, 210, 238, 186,
          240, 241, 200, 216, 157, 76, 246, 98, 108, 92, 21, 229, 156, 124, 17, 52, 5, 174, 1, 154,
          97, 78, 47, 4, 114, 254, 120, 175, 158, 62, 183, 151, 189, 35, 113, 2, 43, 168, 79, 94,
          10, 246, 55, 163, 129, 83, 209, 169, 204, 73, 70, 122, 149, 22, 171, 39, 216, 223, 110,
          15, 65, 4, 102, 180, 95, 46, 250, 37, 133, 203, 231, 150, 83, 197, 162, 180, 167, 245, 89,
          229, 78, 181, 37, 98, 40, 120, 230, 169, 235, 76, 84, 98, 67, 178, 203, 62, 68, 19, 54,
          218, 9, 117, 160, 206, 57, 218, 8, 40, 3, 134, 255, 12, 94, 41, 233, 89, 4, 213, 46, 169,
          13, 76, 127, 25, 36, 235, 252, 39, 238, 125, 56, 224, 213, 67, 220, 66, 134, 98, 244, 73,
          162, 36, 37, 160, 108, 50, 188, 162, 75, 195, 101, 241, 76, 222, 193, 198, 81, 113, 46,
          233, 91, 161, 13, 145, 37, 178, 68, 32, 233, 184, 60, 90, 13, 208, 5, 179, 185, 158, 203,
          53, 219, 184, 103, 31, 187, 160, 233, 219, 226, 71, 112, 119, 39, 183, 201, 73, 175, 57,
          113, 119, 194, 1, 203, 173, 159, 77, 235, 124, 101, 187, 240, 143, 205, 224, 163, 166,
          179, 25, 178, 233, 221, 47, 4, 247, 208, 88, 249, 63, 81, 225, 246, 231, 110, 9, 176, 168,
          61, 169, 156, 193, 243, 251, 18, 98, 232, 45, 80, 9, 89, 241, 176, 241, 240, 88, 3, 254,
          246, 0, 100, 248, 134, 2, 205, 138, 54, 144, 24, 181, 208, 154, 109, 41, 147, 65, 251, 41,
          231, 51, 214, 221, 66, 77, 1, 253, 3, 19, 253, 174, 236, 231, 241, 167, 2, 218, 219, 56,
          108, 74, 127, 105, 29, 15, 133, 24, 22, 220, 159, 103, 126, 205, 66, 104, 4, 225, 215, 84,
          146, 170, 209, 77, 131, 141, 65, 46, 50, 111, 232, 146, 208, 141, 203, 203, 212, 31, 225,
          171, 93, 200, 255, 26, 139, 132, 108, 56, 148, 50, 48, 66, 6, 116, 182, 38, 203, 24, 215,
          238, 39, 41, 34, 196, 79, 148, 106, 187, 69, 80, 4, 229, 194, 110, 38, 6, 73, 84, 247,
          150, 225, 72, 170, 152, 229, 54, 143, 78, 46, 138, 0, 137, 120, 123, 95, 174, 74, 165, 76,
          236, 198, 75, 205, 45, 174, 48, 247, 3, 217, 228, 126, 230, 167, 103, 221, 178, 154, 183,
          61, 158, 151, 239, 182, 36, 191, 176, 205, 108, 213, 230, 235, 209, 145, 205, 40, 118,
          148, 236, 113, 113, 57, 168, 203, 67, 120, 149, 96, 94, 118, 78, 12, 235, 91, 84, 11, 59,
          83, 78, 21, 94, 181, 105, 114, 100, 239, 119, 76, 18, 223, 238, 10, 147, 58, 70, 29, 228,
          135, 147, 10, 88, 53, 238, 72, 24, 30, 16, 245, 10, 41, 116, 167, 227, 152, 94, 184, 47,
          214, 87, 161, 65, 168, 250, 145, 100, 23, 198, 30, 1, 108, 103, 46, 160, 142, 28, 79, 48,
          108, 95, 249, 85, 150, 187, 55, 168, 110, 110, 243, 30, 239, 255, 180, 0, 44, 24, 194,
          100, 22, 145, 242, 53, 223, 39, 147, 150, 93, 86, 151, 89, 211, 207, 184, 91, 42, 69, 133,
          85, 0, 206, 20, 50, 218, 248, 185, 130, 35, 98, 77, 45, 130, 181, 210, 41, 9, 101, 36, 45,
          215, 217, 227, 20, 246, 89, 220, 134, 37, 214, 121, 250, 154, 101, 130, 30, 102, 234, 75,
          23, 195, 124, 207, 126, 105, 123, 223, 64, 204, 188, 13, 109, 61, 217, 71, 145, 97, 247,
          118, 200, 180, 122, 11, 184, 240, 57, 214, 232, 38, 130, 119, 170, 54, 155, 116, 126, 119,
          56, 31, 153, 231, 96, 165, 51, 31, 186, 134, 248, 7, 122, 130, 78, 22, 158, 1, 231, 190,
          148, 60, 172, 135, 129, 107, 20, 224, 152, 0, 145, 125, 5, 149, 157, 73, 129, 109, 247,
          153, 201, 3, 110, 72, 152, 231, 151, 31, 99, 73, 86, 208, 23, 239, 157, 249, 184, 213,
          185, 10, 170, 247, 25, 59, 104, 201, 188, 97, 232, 172, 169, 74, 183, 46, 183, 130, 214,
          113, 68, 74, 131, 32, 11, 158, 192, 42, 167, 204, 111, 147, 155, 195, 156, 53, 102, 200,
          148, 201, 191, 173, 5, 30, 19, 171, 17, 202, 144, 190, 219, 122, 243, 72, 222, 135, 46,
          75, 230, 249, 196, 215, 55, 65, 238, 25, 93, 159, 90, 139, 38, 43, 173, 89, 147, 189, 163,
          5, 56, 233, 146, 45, 41, 80, 6, 218, 235, 18, 65, 74, 149, 53, 65, 202, 193, 24, 20, 176,
          71, 133, 230, 12, 140, 177, 61, 108, 129, 50, 224, 161, 78, 203, 60, 226, 126, 92, 67, 83,
          200, 87, 161, 108, 79, 230, 166, 18, 10, 200, 62, 25, 187, 156, 112, 197, 19, 61, 192,
          198, 230, 207, 182, 9, 176, 52, 137, 178, 180, 56, 58, 173, 213, 27, 163, 161, 208, 220,
          165, 102, 65, 89, 67, 82, 226, 10, 88, 35, 161, 226, 88, 22, 197, 252, 241, 239, 163, 129,
          190, 247, 255, 95, 233, 34, 167, 186, 101, 113, 89, 253, 246, 33, 54, 228, 101, 170, 30,
          47, 141, 183, 134, 242, 246, 253, 48, 7, 41, 251, 86, 84, 191, 227, 196, 207, 178, 187,
          172, 16, 240, 208, 21, 141, 106, 120, 45, 182, 39, 129, 139, 142, 223, 82, 174, 174, 82,
          162, 90, 205, 18, 213, 154, 174, 115, 207, 73, 252, 255, 213, 163, 211, 180, 146, 13, 218,
          205, 211, 122, 16, 141, 225, 51, 99, 159, 47, 221, 83, 68, 232, 86, 42, 87,
        ]),
      },
    },
    timestamp: new Date('2024-08-09T19:10:34.785Z'),
  };

  it('should decode encrypted URL params', () => {
    const searchParams = new URLSearchParams(
      `?id=%22541efc8b-1aa8-4af1-88d1-34c4231f92bf%22&sender=%223059301306072a8648ce3d020106082a8648ce3d030107034200048235f8adc26178a6674f6e684e90eaacec95af520f39b1e14578b5f5648cc3379e48064dbc97331d60b9ed9ab6b4078e06c9c387872a4a4178ffbe9bc56c4a74%22&content=%7B%22encrypted%22%3A%7B%22iv%22%3A%22xk8ruIVc/85MBQ9X%22%2C%22cipherText%22%3A%22V03VgqQfh0%2FahBldyBzM4vzYGySSpRtSP10AthJvN2QbDwvCUHRzXSl%2FLyY%2Fh5LdJI%2FlU2T1xwMUqjVI%2F9zNuh%2BApuIT2ajX%2F1PoEkHwhMS4BivPmCxVs7MRbyhcKfslMULroMrBvHAfXtgsX6PSF2LX9Q%2BMrpGlDCwtfF6ha0aKqZyH1WDs%2Bh3W2pMdBlZ8vE4DLgAfeSiLNB64qbi9TBtSfnA83tMbdLipoHfnvre%2BIigHOML2PdJxqpiHUv5vP66b%2FL8R2V0Ygmt1NtgeY6lnFy%2F2soDJXzIoP%2FOS7BZOqdP7igKoEP3ad5d6QlesIaI51dbfNEivOoqvtOREpW816Jl3BKXh%2FOuBBaK0mGBRsGrG0G7zVesbTTos1NwqSFnw9KYYU8Huw7b4gehIpFE5qtJFXaI7%2F%2BwiQunafW82QO4k4N5JUwB4Bdd9REIgPGFJxVdQSOHKxBHIqX9fhFevfxpQbN9QHZcsszKhptEwGXom8NOeddpmz27sBZ8KtNsxmcKB5ADfmjV2tGPCEgRBlGLoImGglnvzNTk8gSa05UWmjTstGpakWL9mGKmgvfDBdHzCo5mBqafqeZYqj82rrCxnFa87JbErx7SeIs3QsxlAAIbNB%2FhyUwwm2p1cai%2Bwx2q%2Fqwqj%2F3MZdEWKz0FH%2Bulk%2BjnHk7lWxBsF0F0RSm1vO%2BbrCd242%2F6eMPCaLGywRLyDIYZXRKKbWevOscF12rdIBI057%2BgRTVITJV0U6db4bp2viR%2FqY3xb438L%2BDakZx5LSRf5uvGLppI7GaBnGkleSk8uba1cldmbt%2FsirIwK35vguFcGkMs7AZ0%2BSVJIcHNExMX0crp3ADeq%2FRVn1wj4Epvp2XNKR7Lh%2F75%2B3J6mKgs%2BodI2ukDxkDoBcklpYIfZTkP5ReRHsRFe%2Fv8h7Zc1yaC%2Bep6iMNuxbvw%2FLNncvT3nCzkYn5pYBKLnTj63DC3qhUw4z5osqwPCFPheZTK9D5DjltsAJQqIohEUBSAnSRR9nXw2n4qXUwCItIDHEootk9L5GFvst4O%2FpmeMd9hILF8ekT7T4zVZeZ%2BLMQPG8Rsc8gVwa5%2F2bVdNJUThpFkH7lnjcbUd9bdZvYma1437nFQDP2OBvWnnPSnYR8oxgNOi5bR0%2BPdyfeW3SpRmNkUbaXLs%2BTBPhdeJ5A68bvLyuKO2AtaMLJVW%2FB6mnHC7SVQp4pVIRFc0f3WtQP1zguA6xkfHwScfWDPk8yCcTzMe9qkj0u668PHI2J1M9mJsXBXlnHwRNAWuAZphTi8Ecv54r54%2Bt5e9I3ECK6hPXgr2N6OBU9GpzElGepUWqyfY324PQQRmtF8u%2BiWFy%2BeWU8WitKf1WeVOtSViKHjmqetMVGJDsss%2BRBM22gl1oM452ggoA4b%2FDF4p6VkE1S6pDUx%2FGSTr%2FCfufTjg1UPcQoZi9EmiJCWgbDK8okvDZfFM3sHGUXEu6VuhDZElskQg6bg8Wg3QBbO5nss127hnH7ug6dviR3B3J7fJSa85cXfCAcutn03rfGW78I%2FN4KOmsxmy6d0vBPfQWPk%2FUeH2524JsKg9qZzB8%2FsSYugtUAlZ8bDx8FgD%2FvYAZPiGAs2KNpAYtdCabSmTQfsp5zPW3UJNAf0DE%2F2u7OfxpwLa2zhsSn9pHQ%2BFGBbcn2d%2BzUJoBOHXVJKq0U2DjUEuMm%2FoktCNy8vUH%2BGrXcj%2FGouEbDiUMjBCBnS2JssY1%2B4nKSLET5Rqu0VQBOXCbiYGSVT3luFIqpjlNo9OLooAiXh7X65KpUzsxkvNLa4w9wPZ5H7mp2fdspq3PZ6X77Ykv7DNbNXm69GRzSh2lOxxcTmoy0N4lWBedk4M61tUCztTThVetWlyZO93TBLf7gqTOkYd5IeTClg17kgYHhD1Cil0p%2BOYXrgv1lehQaj6kWQXxh4BbGcuoI4cTzBsX%2FlVlrs3qG5u8x7v%2F7QALBjCZBaR8jXfJ5OWXVaXWdPPuFsqRYVVAM4UMtr4uYIjYk0tgrXSKQllJC3X2eMU9lnchiXWefqaZYIeZupLF8N8z35pe99AzLwNbT3ZR5Fh93bItHoLuPA51ugmgneqNpt0fnc4H5nnYKUzH7qG%2BAd6gk4WngHnvpQ8rIeBaxTgmACRfQWVnUmBbfeZyQNuSJjnlx9jSVbQF%2B%2Bd%2BbjVuQqq9xk7aMm8YeisqUq3LreC1nFESoMgC57AKqfMb5Obw5w1ZsiUyb%2BtBR4TqxHKkL7bevNI3ocuS%2Bb5xNc3Qe4ZXZ9aiyYrrVmTvaMFOOmSLSlQBtrrEkFKlTVBysEYFLBHheYMjLE9bIEy4KFOyzziflxDU8hXoWxP5qYSCsg%2BGbuccMUTPcDG5s%2B2CbA0ibK0ODqt1RujodDcpWZBWUNS4gpYI6HiWBbF%2FPHvo4G%2B9%2F9f6SKnumVxWf32ITbkZaoeL423hvL2%2FTAHKftWVL%2FjxM%2Byu6wQ8NAVjWp4LbYngYuO31KurlKiWs0S1Zquc89J%2FP%2FVo9O0kg3azdN6EI3hM2OfL91TROhWKlc%3D%22%7D%7D&requestId=%22300c44da-a3b1-40d8-ad13-35132392e8dd%22&timestamp=%222024-08-09T19%3A10%3A34.785Z%22`
    );

    const result = decodeResponseURLParams(searchParams);

    expect(result).toEqual(mockResponse);
  });
});
