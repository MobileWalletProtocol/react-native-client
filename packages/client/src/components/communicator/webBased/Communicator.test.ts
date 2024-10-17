import { WebBasedWalletCommunicator } from './Communicator';
import { standardErrors } from ':core/error';
import { MessageID } from ':core/message';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
  dismissBrowser: jest.fn(),
}));

import * as WebBrowser from 'expo-web-browser';

const mockUrl = 'https://coinbase.com/';

describe('Communicator', () => {
  const mockID = '123' as MessageID;

  beforeEach(() => {
    WebBasedWalletCommunicator['disconnect']();
    jest.clearAllMocks();
  });

  describe('postRequestAndWaitForResponse', () => {
    const mockRequest = {
      id: mockID,
      sdkVersion: '1.0.0',
      callbackUrl: 'https://callback.com',
      content: {
        encrypted: {
          iv: new Uint8Array([70, 85, 197, 66, 13, 97, 238, 140, 77, 183, 134, 63]),
          cipherText: new Uint8Array([
            131, 213, 92, 75, 184, 170, 220, 92, 49, 222, 73, 187, 37, 156, 65, 240, 89, 92, 144,
            92, 225, 54, 98, 253, 16, 248, 66, 132, 148, 245, 196, 226, 175, 50, 184, 200, 130, 240,
            225, 118, 140, 168, 59, 155, 37, 185, 71, 102, 87, 59, 41, 3, 40, 45, 64, 245, 4, 111,
            145, 235, 73, 183, 115, 202, 4, 135, 195, 138, 32, 250, 203, 169, 59, 18, 2, 244, 246,
            94, 141, 104, 163, 37, 224, 46, 163, 242, 194, 109, 147, 86, 231, 93, 16, 138, 112, 178,
            184, 116, 39, 65, 62, 147, 249, 130, 109, 214, 104, 100, 24, 163, 15, 146, 227, 24, 169,
            232, 219, 205, 51, 76, 78, 154, 114, 191, 150, 202, 147, 123, 176, 246, 36, 49, 39, 219,
            124, 248, 90, 65, 68, 160, 87, 173, 124, 216, 253, 94, 245, 231, 86, 184, 131, 3, 93,
            183, 88,
          ]),
        },
      },
      sender: '123',
      timestamp: new Date('2022-02-01T20:30:45.500Z'),
    };

    it('should open browser with correct URL on iOS', async () => {
      (WebBrowser.openBrowserAsync as jest.Mock).mockResolvedValue({
        type: 'dismiss',
      });

      WebBasedWalletCommunicator.postRequestAndWaitForResponse(mockRequest, mockUrl);

      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
        'https://coinbase.com/?q=eJxrW5SZstjQyHhVcUp2WGpRcWZ%2B3lJDPQM9g9XJiTk5SYnJ2aFFOVsySkoKiq309WFiesn5ucuT8%2FNKUvNKGlem5iUXVRaUpKY0LcosO8LjFnrUiTfxXY%2Fv9jb7VcmZBRmpRSGpFSVHZjdfjfHesepOjOE9z92qcxw%2FRMZMiHlolvRX4IdTy5SvRx6tN9pxounDw7KeFdazVXe6p4VbazJr6Dp8Zcmf%2BNpze%2FEplvbDXQq%2FTq%2B0FmL68i2uN2Ox6gO9xZ8O5U4Oex4r0FWwaUeJuqPd5J9NudcyUiQW8096LLHyxe2zxj5%2Bs4r2Tzs1uXrDNxVD9ds1P6IcXRaEr6258Tfu6%2FOwHc3MsdsjlhWn5qWkFoFCYmVJZm5qcUlibsH1%2F%2BWmUxgSf84oBQCL4oxY',
        {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        }
      );
      expect(WebBasedWalletCommunicator['responseHandlers'].get(mockID)).toBeDefined();
    });

    it('should open browser with correct URL on Android', async () => {
      (WebBrowser.openBrowserAsync as jest.Mock).mockResolvedValue({
        type: 'opened',
      });

      WebBasedWalletCommunicator.postRequestAndWaitForResponse(mockRequest, mockUrl);

      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
        'https://coinbase.com/?q=eJxrW5SZstjQyHhVcUp2WGpRcWZ%2B3lJDPQM9g9XJiTk5SYnJ2aFFOVsySkoKiq309WFiesn5ucuT8%2FNKUvNKGlem5iUXVRaUpKY0LcosO8LjFnrUiTfxXY%2Fv9jb7VcmZBRmpRSGpFSVHZjdfjfHesepOjOE9z92qcxw%2FRMZMiHlolvRX4IdTy5SvRx6tN9pxounDw7KeFdazVXe6p4VbazJr6Dp8Zcmf%2BNpze%2FEplvbDXQq%2FTq%2B0FmL68i2uN2Ox6gO9xZ8O5U4Oex4r0FWwaUeJuqPd5J9NudcyUiQW8096LLHyxe2zxj5%2Bs4r2Tzs1uXrDNxVD9ds1P6IcXRaEr6258Tfu6%2FOwHc3MsdsjlhWn5qWkFoFCYmVJZm5qcUlibsH1%2F%2BWmUxgSf84oBQCL4oxY',
        {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        }
      );
      expect(WebBasedWalletCommunicator['responseHandlers'].get(mockID)).toBeDefined();
    });

    it('should reject with user rejected error when browser is cancelled on iOS', async () => {
      (WebBrowser.openBrowserAsync as jest.Mock).mockResolvedValue({
        type: 'cancel',
      });

      await expect(
        WebBasedWalletCommunicator.postRequestAndWaitForResponse(mockRequest, mockUrl)
      ).rejects.toEqual(standardErrors.provider.userRejectedRequest());

      expect(WebBasedWalletCommunicator['responseHandlers'].get(mockID)).toBeUndefined();
    });

    it('should reject with user rejected error when browser throws an error', async () => {
      (WebBrowser.openBrowserAsync as jest.Mock).mockRejectedValue(new Error('Browser error'));

      await expect(
        WebBasedWalletCommunicator.postRequestAndWaitForResponse(mockRequest, mockUrl)
      ).rejects.toEqual(standardErrors.provider.userRejectedRequest());

      expect(WebBasedWalletCommunicator['responseHandlers'].get(mockID)).toBeUndefined();
    });
  });

  describe('handleResponse', () => {
    const mockHandshakeResponse = {
      id: '541efc8b-1aa8-4af1-88d1-34c4231f92bf',
      sender:
        '3059301306072a8648ce3d020106082a8648ce3d030107034200048235f8adc26178a6674f6e684e90eaacec95af520f39b1e14578b5f5648cc3379e48064dbc97331d60b9ed9ab6b4078e06c9c387872a4a4178ffbe9bc56c4a74',
      requestId: '300c44da-a3b1-40d8-ad13-35132392e8dd' as MessageID,
      content: {
        encrypted: {
          iv: new Uint8Array([198, 79, 43, 184, 133, 92, 255, 206, 76, 5, 15, 87]),
          cipherText: new Uint8Array([
            87, 77, 213, 130, 164, 31, 135, 79, 218, 132, 25, 93, 200, 28, 204, 226, 252, 216, 27,
            36, 146, 165, 27, 82, 63, 93, 0, 182, 18, 111, 55, 100, 27, 15, 11, 194, 80, 116, 115,
            93, 41, 127, 47, 38, 63, 135, 146, 221, 36, 143, 229, 83, 100, 245, 199, 3, 20, 170, 53,
            72, 255, 220, 205, 186, 31, 128, 166, 226, 19, 217, 168, 215, 255, 83, 232, 18, 65, 240,
            132, 196, 184, 6, 43, 207, 152, 44, 85, 179, 179, 17, 111, 40, 92, 41, 251, 37, 49, 66,
            235, 160, 202, 193, 188, 112, 31, 94, 216, 44, 95, 163, 210, 23, 98, 215, 245, 15, 140,
            174, 145, 165, 12, 44, 45, 124, 94, 161, 107, 70, 138, 169, 156, 135, 213, 96, 236, 250,
            29, 214, 218, 147, 29, 6, 86, 124, 188, 78, 3, 46, 0, 31, 121, 40, 139, 52, 30, 184,
            169, 184, 189, 76, 27, 82, 126, 112, 60, 222, 211, 27, 116, 184, 169, 160, 119, 231,
            190, 183, 190, 34, 40, 7, 56, 194, 246, 61, 210, 113, 170, 152, 135, 82, 254, 111, 63,
            174, 155, 252, 191, 17, 217, 93, 24, 130, 107, 117, 54, 216, 30, 99, 169, 103, 23, 47,
            246, 178, 128, 201, 95, 50, 40, 63, 243, 146, 236, 22, 78, 169, 211, 251, 138, 2, 168,
            16, 253, 218, 119, 151, 122, 66, 87, 172, 33, 162, 57, 213, 214, 223, 52, 72, 175, 58,
            138, 175, 180, 228, 68, 165, 111, 53, 232, 153, 119, 4, 165, 225, 252, 235, 129, 5, 162,
            180, 152, 96, 81, 176, 106, 198, 208, 110, 243, 85, 235, 27, 77, 58, 44, 212, 220, 42,
            72, 89, 240, 244, 166, 24, 83, 193, 238, 195, 182, 248, 129, 232, 72, 164, 81, 57, 170,
            210, 69, 93, 162, 59, 255, 236, 34, 66, 233, 218, 125, 111, 54, 64, 238, 36, 224, 222,
            73, 83, 0, 120, 5, 215, 125, 68, 66, 32, 60, 97, 73, 197, 87, 80, 72, 225, 202, 196, 17,
            200, 169, 127, 95, 132, 87, 175, 127, 26, 80, 108, 223, 80, 29, 151, 44, 179, 50, 161,
            166, 209, 48, 25, 122, 38, 240, 211, 158, 117, 218, 102, 207, 110, 236, 5, 159, 10, 180,
            219, 49, 153, 194, 129, 228, 0, 223, 154, 53, 118, 180, 99, 194, 18, 4, 65, 148, 98,
            232, 34, 97, 160, 150, 123, 243, 53, 57, 60, 129, 38, 180, 229, 69, 166, 141, 59, 45,
            26, 150, 164, 88, 191, 102, 24, 169, 160, 189, 240, 193, 116, 124, 194, 163, 153, 129,
            169, 167, 234, 121, 150, 42, 143, 205, 171, 172, 44, 103, 21, 175, 59, 37, 177, 43, 199,
            180, 158, 34, 205, 208, 179, 25, 64, 0, 134, 205, 7, 248, 114, 83, 12, 38, 218, 157, 92,
            106, 47, 176, 199, 106, 191, 171, 10, 163, 255, 115, 25, 116, 69, 138, 207, 65, 71, 250,
            233, 100, 250, 57, 199, 147, 185, 86, 196, 27, 5, 208, 93, 17, 74, 109, 111, 59, 230,
            235, 9, 221, 184, 219, 254, 158, 48, 240, 154, 44, 108, 176, 68, 188, 131, 33, 134, 87,
            68, 162, 155, 89, 235, 206, 177, 193, 117, 218, 183, 72, 4, 141, 57, 239, 232, 17, 77,
            82, 19, 37, 93, 20, 233, 214, 248, 110, 157, 175, 137, 31, 234, 99, 124, 91, 227, 127,
            11, 248, 54, 164, 103, 30, 75, 73, 23, 249, 186, 241, 139, 166, 146, 59, 25, 160, 103,
            26, 73, 94, 74, 79, 46, 109, 173, 92, 149, 217, 155, 183, 251, 34, 172, 140, 10, 223,
            155, 224, 184, 87, 6, 144, 203, 59, 1, 157, 62, 73, 82, 72, 112, 115, 68, 196, 197, 244,
            114, 186, 119, 0, 55, 170, 253, 21, 103, 215, 8, 248, 18, 155, 233, 217, 115, 74, 71,
            178, 225, 255, 190, 126, 220, 158, 166, 42, 11, 62, 161, 210, 54, 186, 64, 241, 144, 58,
            1, 114, 73, 105, 96, 135, 217, 78, 67, 249, 69, 228, 71, 177, 17, 94, 254, 255, 33, 237,
            151, 53, 201, 160, 190, 122, 158, 162, 48, 219, 177, 110, 252, 63, 44, 217, 220, 189,
            61, 231, 11, 57, 24, 159, 154, 88, 4, 162, 231, 78, 62, 183, 12, 45, 234, 133, 76, 56,
            207, 154, 44, 171, 3, 194, 20, 248, 94, 101, 50, 189, 15, 144, 227, 150, 219, 0, 37, 10,
            136, 162, 17, 20, 5, 32, 39, 73, 20, 125, 157, 124, 54, 159, 138, 151, 83, 0, 136, 180,
            128, 199, 18, 138, 45, 147, 210, 249, 24, 91, 236, 183, 131, 191, 166, 103, 140, 119,
            216, 72, 44, 95, 30, 145, 62, 211, 227, 53, 89, 121, 159, 139, 49, 3, 198, 241, 27, 28,
            242, 5, 112, 107, 159, 246, 109, 87, 77, 37, 68, 225, 164, 89, 7, 238, 89, 227, 113,
            181, 29, 245, 183, 89, 189, 137, 154, 215, 141, 251, 156, 84, 3, 63, 99, 129, 189, 105,
            231, 61, 41, 216, 71, 202, 49, 128, 211, 162, 229, 180, 116, 248, 247, 114, 125, 229,
            183, 74, 148, 102, 54, 69, 27, 105, 114, 236, 249, 48, 79, 133, 215, 137, 228, 14, 188,
            110, 242, 242, 184, 163, 182, 2, 214, 140, 44, 149, 86, 252, 30, 166, 156, 112, 187, 73,
            84, 41, 226, 149, 72, 68, 87, 52, 127, 117, 173, 64, 253, 115, 130, 224, 58, 198, 71,
            199, 193, 39, 31, 88, 51, 228, 243, 32, 156, 79, 51, 30, 246, 169, 35, 210, 238, 186,
            240, 241, 200, 216, 157, 76, 246, 98, 108, 92, 21, 229, 156, 124, 17, 52, 5, 174, 1,
            154, 97, 78, 47, 4, 114, 254, 120, 175, 158, 62, 183, 151, 189, 35, 113, 2, 43, 168, 79,
            94, 10, 246, 55, 163, 129, 83, 209, 169, 204, 73, 70, 122, 149, 22, 171, 39, 216, 223,
            110, 15, 65, 4, 102, 180, 95, 46, 250, 37, 133, 203, 231, 150, 83, 197, 162, 180, 167,
            245, 89, 229, 78, 181, 37, 98, 40, 120, 230, 169, 235, 76, 84, 98, 67, 178, 203, 62, 68,
            19, 54, 218, 9, 117, 160, 206, 57, 218, 8, 40, 3, 134, 255, 12, 94, 41, 233, 89, 4, 213,
            46, 169, 13, 76, 127, 25, 36, 235, 252, 39, 238, 125, 56, 224, 213, 67, 220, 66, 134,
            98, 244, 73, 162, 36, 37, 160, 108, 50, 188, 162, 75, 195, 101, 241, 76, 222, 193, 198,
            81, 113, 46, 233, 91, 161, 13, 145, 37, 178, 68, 32, 233, 184, 60, 90, 13, 208, 5, 179,
            185, 158, 203, 53, 219, 184, 103, 31, 187, 160, 233, 219, 226, 71, 112, 119, 39, 183,
            201, 73, 175, 57, 113, 119, 194, 1, 203, 173, 159, 77, 235, 124, 101, 187, 240, 143,
            205, 224, 163, 166, 179, 25, 178, 233, 221, 47, 4, 247, 208, 88, 249, 63, 81, 225, 246,
            231, 110, 9, 176, 168, 61, 169, 156, 193, 243, 251, 18, 98, 232, 45, 80, 9, 89, 241,
            176, 241, 240, 88, 3, 254, 246, 0, 100, 248, 134, 2, 205, 138, 54, 144, 24, 181, 208,
            154, 109, 41, 147, 65, 251, 41, 231, 51, 214, 221, 66, 77, 1, 253, 3, 19, 253, 174, 236,
            231, 241, 167, 2, 218, 219, 56, 108, 74, 127, 105, 29, 15, 133, 24, 22, 220, 159, 103,
            126, 205, 66, 104, 4, 225, 215, 84, 146, 170, 209, 77, 131, 141, 65, 46, 50, 111, 232,
            146, 208, 141, 203, 203, 212, 31, 225, 171, 93, 200, 255, 26, 139, 132, 108, 56, 148,
            50, 48, 66, 6, 116, 182, 38, 203, 24, 215, 238, 39, 41, 34, 196, 79, 148, 106, 187, 69,
            80, 4, 229, 194, 110, 38, 6, 73, 84, 247, 150, 225, 72, 170, 152, 229, 54, 143, 78, 46,
            138, 0, 137, 120, 123, 95, 174, 74, 165, 76, 236, 198, 75, 205, 45, 174, 48, 247, 3,
            217, 228, 126, 230, 167, 103, 221, 178, 154, 183, 61, 158, 151, 239, 182, 36, 191, 176,
            205, 108, 213, 230, 235, 209, 145, 205, 40, 118, 148, 236, 113, 113, 57, 168, 203, 67,
            120, 149, 96, 94, 118, 78, 12, 235, 91, 84, 11, 59, 83, 78, 21, 94, 181, 105, 114, 100,
            239, 119, 76, 18, 223, 238, 10, 147, 58, 70, 29, 228, 135, 147, 10, 88, 53, 238, 72, 24,
            30, 16, 245, 10, 41, 116, 167, 227, 152, 94, 184, 47, 214, 87, 161, 65, 168, 250, 145,
            100, 23, 198, 30, 1, 108, 103, 46, 160, 142, 28, 79, 48, 108, 95, 249, 85, 150, 187, 55,
            168, 110, 110, 243, 30, 239, 255, 180, 0, 44, 24, 194, 100, 22, 145, 242, 53, 223, 39,
            147, 150, 93, 86, 151, 89, 211, 207, 184, 91, 42, 69, 133, 85, 0, 206, 20, 50, 218, 248,
            185, 130, 35, 98, 77, 45, 130, 181, 210, 41, 9, 101, 36, 45, 215, 217, 227, 20, 246, 89,
            220, 134, 37, 214, 121, 250, 154, 101, 130, 30, 102, 234, 75, 23, 195, 124, 207, 126,
            105, 123, 223, 64, 204, 188, 13, 109, 61, 217, 71, 145, 97, 247, 118, 200, 180, 122, 11,
            184, 240, 57, 214, 232, 38, 130, 119, 170, 54, 155, 116, 126, 119, 56, 31, 153, 231, 96,
            165, 51, 31, 186, 134, 248, 7, 122, 130, 78, 22, 158, 1, 231, 190, 148, 60, 172, 135,
            129, 107, 20, 224, 152, 0, 145, 125, 5, 149, 157, 73, 129, 109, 247, 153, 201, 3, 110,
            72, 152, 231, 151, 31, 99, 73, 86, 208, 23, 239, 157, 249, 184, 213, 185, 10, 170, 247,
            25, 59, 104, 201, 188, 97, 232, 172, 169, 74, 183, 46, 183, 130, 214, 113, 68, 74, 131,
            32, 11, 158, 192, 42, 167, 204, 111, 147, 155, 195, 156, 53, 102, 200, 148, 201, 191,
            173, 5, 30, 19, 171, 17, 202, 144, 190, 219, 122, 243, 72, 222, 135, 46, 75, 230, 249,
            196, 215, 55, 65, 238, 25, 93, 159, 90, 139, 38, 43, 173, 89, 147, 189, 163, 5, 56, 233,
            146, 45, 41, 80, 6, 218, 235, 18, 65, 74, 149, 53, 65, 202, 193, 24, 20, 176, 71, 133,
            230, 12, 140, 177, 61, 108, 129, 50, 224, 161, 78, 203, 60, 226, 126, 92, 67, 83, 200,
            87, 161, 108, 79, 230, 166, 18, 10, 200, 62, 25, 187, 156, 112, 197, 19, 61, 192, 198,
            230, 207, 182, 9, 176, 52, 137, 178, 180, 56, 58, 173, 213, 27, 163, 161, 208, 220, 165,
            102, 65, 89, 67, 82, 226, 10, 88, 35, 161, 226, 88, 22, 197, 252, 241, 239, 163, 129,
            190, 247, 255, 95, 233, 34, 167, 186, 101, 113, 89, 253, 246, 33, 54, 228, 101, 170, 30,
            47, 141, 183, 134, 242, 246, 253, 48, 7, 41, 251, 86, 84, 191, 227, 196, 207, 178, 187,
            172, 16, 240, 208, 21, 141, 106, 120, 45, 182, 39, 129, 139, 142, 223, 82, 174, 174, 82,
            162, 90, 205, 18, 213, 154, 174, 115, 207, 73, 252, 255, 213, 163, 211, 180, 146, 13,
            218, 205, 211, 122, 16, 141, 225, 51, 99, 159, 47, 221, 83, 68, 232, 86, 42, 87,
          ]),
        },
      },
      timestamp: new Date('2024-08-09T19:10:34.785Z'),
    };

    const responseUrl = `https://callback.example.com/coinbase-wallet-sdk?id=%22541efc8b-1aa8-4af1-88d1-34c4231f92bf%22&sender=%223059301306072a8648ce3d020106082a8648ce3d030107034200048235f8adc26178a6674f6e684e90eaacec95af520f39b1e14578b5f5648cc3379e48064dbc97331d60b9ed9ab6b4078e06c9c387872a4a4178ffbe9bc56c4a74%22&content=%7B%22encrypted%22%3A%7B%22iv%22%3A%22c64f2bb8855cffce4c050f57%22%2C%22cipherText%22%3A%22574dd582a41f874fda84195dc81ccce2fcd81b2492a51b523f5d00b6126f37641b0f0bc25074735d297f2f263f8792dd248fe55364f5c70314aa3548ffdccdba1f80a6e213d9a8d7ff53e81241f084c4b8062bcf982c55b3b3116f285c29fb253142eba0cac1bc701f5ed82c5fa3d21762d7f50f8cae91a50c2c2d7c5ea16b468aa99c87d560ecfa1dd6da931d06567cbc4e032e001f79288b341eb8a9b8bd4c1b527e703cded31b74b8a9a077e7beb7be22280738c2f63dd271aa988752fe6f3fae9bfcbf11d95d18826b7536d81e63a967172ff6b280c95f32283ff392ec164ea9d3fb8a02a810fdda77977a4257ac21a239d5d6df3448af3a8aafb4e444a56f35e8997704a5e1fceb8105a2b4986051b06ac6d06ef355eb1b4d3a2cd4dc2a4859f0f4a61853c1eec3b6f881e848a45139aad2455da23bffec2242e9da7d6f3640ee24e0de4953007805d77d4442203c6149c5575048e1cac411c8a97f5f8457af7f1a506cdf501d972cb332a1a6d130197a26f0d39e75da66cf6eec059f0ab4db3199c281e400df9a3576b463c21204419462e82261a0967bf335393c8126b4e545a68d3b2d1a96a458bf6618a9a0bdf0c1747cc2a39981a9a7ea79962a8fcdabac2c6715af3b25b12bc7b49e22cdd0b319400086cd07f872530c26da9d5c6a2fb0c76abfab0aa3ff731974458acf4147fae964fa39c793b956c41b05d05d114a6d6f3be6eb09ddb8dbfe9e30f09a2c6cb044bc8321865744a29b59ebceb1c175dab748048d39efe8114d5213255d14e9d6f86e9daf891fea637c5be37f0bf836a4671e4b4917f9baf18ba6923b19a0671a495e4a4f2e6dad5c95d99bb7fb22ac8c0adf9be0b8570690cb3b019d3e495248707344c4c5f472ba770037aafd1567d708f8129be9d9734a47b2e1ffbe7edc9ea62a0b3ea1d236ba40f1903a017249696087d94e43f945e447b1115efeff21ed9735c9a0be7a9ea230dbb16efc3f2cd9dcbd3de70b39189f9a5804a2e74e3eb70c2dea854c38cf9a2cab03c214f85e6532bd0f90e396db00250a88a2111405202749147d9d7c369f8a97530088b480c7128a2d93d2f9185becb783bfa6678c77d8482c5f1e913ed3e33559799f8b3103c6f11b1cf205706b9ff66d574d2544e1a45907ee59e371b51df5b759bd899ad78dfb9c54033f6381bd69e73d29d847ca3180d3a2e5b474f8f7727de5b74a946636451b6972ecf9304f85d789e40ebc6ef2f2b8a3b602d68c2c9556fc1ea69c70bb495429e295484457347f75ad40fd7382e03ac647c7c1271f5833e4f3209c4f331ef6a923d2eebaf0f1c8d89d4cf6626c5c15e59c7c113405ae019a614e2f0472fe78af9e3eb797bd2371022ba84f5e0af637a38153d1a9cc49467a9516ab27d8df6e0f410466b45f2efa2585cbe79653c5a2b4a7f559e54eb525622878e6a9eb4c546243b2cb3e441336da0975a0ce39da08280386ff0c5e29e95904d52ea90d4c7f1924ebfc27ee7d38e0d543dc428662f449a22425a06c32bca24bc365f14cdec1c651712ee95ba10d9125b24420e9b83c5a0dd005b3b99ecb35dbb8671fbba0e9dbe247707727b7c949af397177c201cbad9f4deb7c65bbf08fcde0a3a6b319b2e9dd2f04f7d058f93f51e1f6e76e09b0a83da99cc1f3fb1262e82d500959f1b0f1f05803fef60064f88602cd8a369018b5d09a6d299341fb29e733d6dd424d01fd0313fdaeece7f1a702dadb386c4a7f691d0f851816dc9f677ecd426804e1d75492aad14d838d412e326fe892d08dcbcbd41fe1ab5dc8ff1a8b846c38943230420674b626cb18d7ee272922c44f946abb455004e5c26e26064954f796e148aa98e5368f4e2e8a0089787b5fae4aa54cecc64bcd2dae30f703d9e47ee6a767ddb29ab73d9e97efb624bfb0cd6cd5e6ebd191cd287694ec717139a8cb437895605e764e0ceb5b540b3b534e155eb5697264ef774c12dfee0a933a461de487930a5835ee48181e10f50a2974a7e3985eb82fd657a141a8fa916417c61e016c672ea08e1c4f306c5ff95596bb37a86e6ef31eefffb4002c18c2641691f235df2793965d569759d3cfb85b2a45855500ce1432daf8b98223624d2d82b5d2290965242dd7d9e314f659dc8625d679fa9a65821e66ea4b17c37ccf7e697bdf40ccbc0d6d3dd9479161f776c8b47a0bb8f039d6e8268277aa369b747e77381f99e760a5331fba86f8077a824e169e01e7be943cac87816b14e09800917d05959d49816df799c9036e4898e7971f634956d017ef9df9b8d5b90aaaf7193b68c9bc61e8aca94ab72eb782d671444a83200b9ec02aa7cc6f939bc39c3566c894c9bfad051e13ab11ca90bedb7af348de872e4be6f9c4d73741ee195d9f5a8b262bad5993bda30538e9922d295006daeb12414a953541cac11814b04785e60c8cb13d6c8132e0a14ecb3ce27e5c4353c857a16c4fe6a6120ac83e19bb9c70c5133dc0c6e6cfb609b03489b2b4383aadd51ba3a1d0dca56641594352e20a5823a1e25816c5fcf1efa381bef7ff5fe922a7ba657159fdf62136e465aa1e2f8db786f2f6fd300729fb5654bfe3c4cfb2bbac10f0d0158d6a782db627818b8edf52aeae52a25acd12d59aae73cf49fcffd5a3d3b4920ddacdd37a108de133639f2fdd5344e8562a57%22%7D%7D&requestId=%22300c44da-a3b1-40d8-ad13-35132392e8dd%22&timestamp=%222024-08-09T19%3A10%3A34.785Z%22`;

    it('should parse error response and call the correct handler', () => {
      const mockErrorResponse = {
        id: 'b6a94830-2448-44df-a6f5-8b1d601d0e61',
        sender: '',
        requestId: 'de9d8e02-6cd5-4979-b7b9-6c0dc1f4271c' as MessageID,
        timestamp: new Date('2024-08-08T17:42:31.771Z'),
        content: {
          failure: { code: 4001, message: 'User denied connection request' },
        },
      };

      const mockHandler = jest.fn();
      WebBasedWalletCommunicator['responseHandlers'].set(mockErrorResponse.requestId, mockHandler);

      const responseUrl =
        'https://callback.example.com/coinbase-wallet-sdk?id=%22b6a94830-2448-44df-a6f5-8b1d601d0e61%22&sender=%22%22&content=%7B%22failure%22%3A%7B%22code%22%3A4001%2C%22message%22%3A%22User+denied+connection+request%22%7D%7D&requestId=%22de9d8e02-6cd5-4979-b7b9-6c0dc1f4271c%22&timestamp=%222024-08-08T17%3A42%3A31.771Z%22';

      WebBasedWalletCommunicator.handleResponse(responseUrl);

      expect(mockHandler).toHaveBeenCalledWith(mockErrorResponse);
      expect(WebBasedWalletCommunicator['responseHandlers'].size).toBe(0);
      expect(WebBrowser.dismissBrowser).toHaveBeenCalled();
    });

    it('should parse response and call the correct handler', () => {
      const mockHandler = jest.fn();
      WebBasedWalletCommunicator['responseHandlers'].set(
        mockHandshakeResponse.requestId,
        mockHandler
      );

      WebBasedWalletCommunicator.handleResponse(responseUrl);

      expect(mockHandler).toHaveBeenCalledWith(mockHandshakeResponse);
      expect(WebBasedWalletCommunicator['responseHandlers'].size).toBe(0);
      expect(WebBrowser.dismissBrowser).toHaveBeenCalled();
    });

    it('should not throw if no handler is found', () => {
      expect(() => WebBasedWalletCommunicator.handleResponse(responseUrl)).not.toThrow();
    });

    it('should return true if the communicator handled the message', () => {
      const mockHandler = jest.fn();
      WebBasedWalletCommunicator['responseHandlers'].set(
        mockHandshakeResponse.requestId,
        mockHandler
      );

      const handled = WebBasedWalletCommunicator.handleResponse(responseUrl);

      expect(handled).toBe(true);
    });

    it('should return false if the communicator did not handle the message', () => {
      const handled = WebBasedWalletCommunicator.handleResponse(responseUrl);

      expect(handled).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should clear all response handlers', () => {
      WebBasedWalletCommunicator['responseHandlers'].set('123' as MessageID, jest.fn());
      WebBasedWalletCommunicator['responseHandlers'].set('456' as MessageID, jest.fn());

      WebBasedWalletCommunicator['disconnect']();

      expect(WebBasedWalletCommunicator['responseHandlers'].size).toBe(0);
    });
  });
});
