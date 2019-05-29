// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0

import bind from "bind-decorator"
import BN from "bn.js"
import crypto from "crypto"
import url from "url"
import { AddressString, IntNumber, RegExpString } from "./types"
import { bigIntStringFromBN, hexStringFromBuffer } from "./util"
import { Web3Method } from "./Web3Method"
import { Web3Request, Web3RequestMessage } from "./Web3Request"
import {
  EthereumAddressFromSignedMessageResponse,
  isWeb3ResponseMessage,
  RequestEthereumAddressesResponse,
  ScanQRCodeResponse,
  SignEthereumMessageResponse,
  SignEthereumTransactionResponse,
  SubmitEthereumTransactionResponse,
  Web3Response
} from "./Web3Response"

export interface EthereumTransactionParams {
  fromAddress: AddressString
  toAddress: AddressString | null
  weiValue: BN
  data: Buffer
  nonce: IntNumber | null
  gasPriceInWei: BN | null
  gasLimit: BN | null
  chainId: IntNumber
}

type ResponseCallback = (response: Web3Response) => void

export class WalletLinkRelay {
  private static _callbacks = new Map<string, ResponseCallback>()

  private _walletLinkWebUrl: string
  private _iframe: HTMLIFrameElement | null = null

  constructor(walletLinkWebUrl: string) {
    this._walletLinkWebUrl = walletLinkWebUrl
  }

  public injectIframe(): void {
    if (this._iframe) {
      throw new Error("iframe already injected!")
    }
    const iframe = (this._iframe = document.createElement("iframe"))
    iframe.className = "__WalletLink__"
    iframe.src = `${this._walletLinkWebUrl}/#/bridge`
    iframe.width = "1"
    iframe.height = "1"
    iframe.style.opacity = "0"
    iframe.style.pointerEvents = "none"
    iframe.style.position = "absolute"
    iframe.style.top = "0"
    iframe.style.right = "0"

    const inject = () => {
      const parentEl = document.body || document.documentElement
      parentEl.appendChild(iframe)
    }

    if (["complete", "interactive"].includes(document.readyState)) {
      inject()
    } else {
      window.addEventListener("load", inject, false)
    }

    window.addEventListener("message", this._handleMessage, false)
  }

  public requestEthereumAccounts(
    appName: string
  ): Promise<RequestEthereumAddressesResponse> {
    return this.sendRequest({
      method: Web3Method.requestEthereumAddresses,
      params: {
        appName
      }
    })
  }

  public signEthereumMessage(
    message: Buffer,
    address: AddressString,
    addPrefix: boolean
  ): Promise<SignEthereumMessageResponse> {
    return this.sendRequest({
      method: Web3Method.signEthereumMessage,
      params: {
        message: hexStringFromBuffer(message, true),
        address,
        addPrefix
      }
    })
  }

  public ethereumAddressFromSignedMessage(
    message: Buffer,
    signature: Buffer,
    addPrefix: boolean
  ): Promise<EthereumAddressFromSignedMessageResponse> {
    return this.sendRequest({
      method: Web3Method.ethereumAddressFromSignedMessage,
      params: {
        message: hexStringFromBuffer(message, true),
        signature: hexStringFromBuffer(signature, true),
        addPrefix
      }
    })
  }

  public signEthereumTransaction(
    params: EthereumTransactionParams
  ): Promise<SignEthereumTransactionResponse> {
    return this.sendRequest({
      method: Web3Method.signEthereumTransaction,
      params: {
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        weiValue: bigIntStringFromBN(params.weiValue),
        data: hexStringFromBuffer(params.data, true),
        nonce: params.nonce,
        gasPriceInWei: params.gasPriceInWei
          ? bigIntStringFromBN(params.gasPriceInWei)
          : null,
        gasLimit: params.gasLimit ? bigIntStringFromBN(params.gasLimit) : null,
        chainId: params.chainId,
        shouldSubmit: false
      }
    })
  }

  public signAndSubmitEthereumTransaction(
    params: EthereumTransactionParams
  ): Promise<SubmitEthereumTransactionResponse> {
    return this.sendRequest({
      method: Web3Method.signEthereumTransaction,
      params: {
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        weiValue: bigIntStringFromBN(params.weiValue),
        data: hexStringFromBuffer(params.data, true),
        nonce: params.nonce,
        gasPriceInWei: params.gasPriceInWei
          ? bigIntStringFromBN(params.gasPriceInWei)
          : null,
        gasLimit: params.gasLimit ? bigIntStringFromBN(params.gasLimit) : null,
        chainId: params.chainId,
        shouldSubmit: true
      }
    })
  }

  public submitEthereumTransaction(
    signedTransaction: Buffer,
    chainId: IntNumber
  ): Promise<SubmitEthereumTransactionResponse> {
    return this.sendRequest({
      method: Web3Method.submitEthereumTransaction,
      params: {
        signedTransaction: hexStringFromBuffer(signedTransaction, true),
        chainId
      }
    })
  }

  public scanQRCode(regExp: RegExpString): Promise<ScanQRCodeResponse> {
    return this.sendRequest({
      method: Web3Method.scanQRCode,
      params: { regExp }
    })
  }

  public sendRequest<T extends Web3Request, U extends Web3Response>(
    request: T
  ): Promise<U> {
    return new Promise((resolve, reject) => {
      if (!this._iframe || !this._iframe.contentWindow) {
        return reject("iframe is not initialized")
      }

      const u = url.parse(this._walletLinkWebUrl)
      const targetOrigin = `${u.protocol}//${u.host}`

      const id = crypto.randomBytes(8).toString("hex")

      WalletLinkRelay._callbacks.set(id, response => {
        if (response.errorMessage) {
          return reject(new Error(response.errorMessage))
        }
        resolve(response as U)
      })

      const message: Web3RequestMessage = { id, request }
      this._iframe.contentWindow.postMessage(message, targetOrigin)
    })
  }

  @bind
  private _handleMessage(evt: MessageEvent): void {
    const message = isWeb3ResponseMessage(evt.data) ? evt.data : null
    if (!message) {
      return
    }

    const callback = WalletLinkRelay._callbacks.get(message.id)
    if (callback) {
      callback(message.response)
    }
  }
}