// Copyright (c) 2018-2019 Coinbase, Inc. <https://coinbase.com/>
// Licensed under the Apache License, version 2.0

import bind from "bind-decorator"

const css = require("./WalletLinkNotification.css").default

const containerElId = "_WalletLinkNotifications"
const elClassName = "_WalletLinkNotification"
const showElClassName = "_WalletLinkNotificationShow"
const expandElClassName = "_WalletLinkNotificationExpand"
const boxElClassName = "_WalletLinkNotificationBox"
const contentElClassName = "_WalletLinkNotificationContent"
const iconContainerElClassName = "_WalletLinkNotificationIconContainer"
const iconElClassName = "_WalletLinkNotificationIcon"
const spinnerElClassName = "_WalletLinkNotificationSpinner"
const messageElClassName = "_WalletLinkNotificationMessage"
const chevronElClassName = "_WalletLinkNotificationChevron"
const chevronImageElClassName = "_WalletLinkNotificationChevronImage"
const actionsElClassName = "_WalletLinkNotificationActions"
const actionElClassName = "_WalletLinkNotificationAction"
const buttonInfoElClassName = "_WalletLinkNotificationButtonInfo"
const buttonElClassName = "_WalletLinkNotificationButton"

const images = {
  spinner: require("./images/spinner.svg"),
  chevron: require("./images/chevron.svg")
}

export class WalletLinkNotification {
  public static injectContainer(): void {
    if (document.querySelector(`#${containerElId}`)) {
      return
    }

    const containerEl = document.createElement("div")
    containerEl.id = containerElId

    const styleEl = document.createElement("style")
    styleEl.type = "text/css"
    styleEl.appendChild(document.createTextNode(css))

    containerEl.appendChild(styleEl)
    document.documentElement.appendChild(containerEl)
  }

  private readonly message: string
  private readonly iconUrl: string

  private readonly buttonInfo1: string
  private readonly buttonInfo2: string
  private readonly buttonInfo3: string

  private readonly buttonLabel1: string
  private readonly buttonLabel2: string
  private readonly buttonLabel3: string

  private readonly onClickButton1: (() => void) | null
  private readonly onClickButton2: (() => void) | null
  private readonly onClickButton3: (() => void) | null

  private el: HTMLElement | null = null
  private expanded = false

  constructor(params: {
    message?: string
    iconUrl?: string
    buttonInfo1?: string
    buttonInfo2?: string
    buttonInfo3?: string
    buttonLabel1?: string
    buttonLabel2?: string
    buttonLabel3?: string
    onClickButton1?: () => void
    onClickButton2?: () => void
    onClickButton3?: () => void
  }) {
    const {
      message,
      iconUrl,
      buttonInfo1,
      buttonInfo2,
      buttonInfo3,
      buttonLabel1,
      buttonLabel2,
      buttonLabel3,
      onClickButton1,
      onClickButton2,
      onClickButton3
    } = params
    this.message = message || "Notification"
    this.iconUrl = iconUrl || ""
    this.buttonInfo1 = buttonInfo1 || ""
    this.buttonInfo2 = buttonInfo2 || ""
    this.buttonInfo3 = buttonInfo3 || ""
    this.buttonLabel1 = buttonLabel1 || "Cancel"
    this.buttonLabel2 = buttonLabel2 || "Help"
    this.buttonLabel3 = buttonLabel3 || "Dismiss"
    this.onClickButton1 = onClickButton1 || null
    this.onClickButton2 = onClickButton2 || null
    this.onClickButton3 = onClickButton3 || null
  }

  public show() {
    const { buttonLabel1, buttonLabel2, buttonLabel3 } = this

    if (!this.el) {
      this.el = document.createElement("div")
      this.el.className = elClassName

      const boxEl = document.createElement("div")
      boxEl.className = boxElClassName

      const contentEl = document.createElement("div")
      contentEl.className = contentElClassName

      const iconContainerEl = document.createElement("div")
      iconContainerEl.className = iconContainerElClassName

      if (this.iconUrl) {
        const iconEl = document.createElement("div")
        iconEl.style.backgroundImage = `url(${this.iconUrl})`
        iconEl.className = iconElClassName
        iconContainerEl.append(iconEl)
      }

      const spinnerEl = document.createElement("img")
      spinnerEl.src = images.spinner
      spinnerEl.alt = ""
      spinnerEl.className = spinnerElClassName
      iconContainerEl.appendChild(spinnerEl)
      contentEl.appendChild(iconContainerEl)

      const messageEl = document.createElement("div")
      messageEl.className = messageElClassName
      messageEl.appendChild(document.createTextNode(this.message))
      contentEl.appendChild(messageEl)

      if (this.onClickButton1 || this.onClickButton2 || this.onClickButton3) {
        const chevronEl = document.createElement("button")
        chevronEl.className = chevronElClassName
        const chevronImageEl = document.createElement("img")
        chevronImageEl.src = images.chevron
        chevronImageEl.alt = "Expand"
        chevronImageEl.className = chevronImageElClassName
        chevronEl.appendChild(chevronImageEl)
        chevronEl.addEventListener("click", this.handleClickChevron, false)
        contentEl.appendChild(chevronEl)
      }

      boxEl.appendChild(contentEl)

      const actionsEl = document.createElement("div")
      actionsEl.className = actionsElClassName

      if (this.onClickButton1) {
        const actionEl = document.createElement("div")
        actionEl.className = actionElClassName

        const infoEl = document.createElement("span")
        infoEl.classList.add(buttonInfoElClassName)
        infoEl.classList.add(`${buttonInfoElClassName}1`)
        infoEl.appendChild(document.createTextNode(this.buttonInfo1))
        actionEl.appendChild(infoEl)

        const buttonEl = document.createElement("button")
        buttonEl.classList.add(buttonElClassName)
        buttonEl.classList.add(`${buttonElClassName}1`)
        buttonEl.appendChild(document.createTextNode(buttonLabel1))
        actionEl.appendChild(buttonEl)

        actionsEl.appendChild(actionEl)
      }

      if (this.onClickButton2) {
        const actionEl = document.createElement("div")
        actionEl.className = actionElClassName

        const infoEl = document.createElement("span")
        infoEl.classList.add(buttonInfoElClassName)
        infoEl.classList.add(`${buttonInfoElClassName}2`)
        infoEl.appendChild(document.createTextNode(this.buttonInfo2))
        actionEl.appendChild(infoEl)

        const buttonEl = document.createElement("button")
        buttonEl.classList.add(buttonElClassName)
        buttonEl.classList.add(`${buttonElClassName}2`)
        buttonEl.appendChild(document.createTextNode(buttonLabel2))
        actionEl.appendChild(buttonEl)

        actionsEl.appendChild(actionEl)
      }

      if (this.onClickButton3) {
        const actionEl = document.createElement("div")
        actionEl.className = actionElClassName

        const infoEl = document.createElement("span")
        infoEl.classList.add(buttonInfoElClassName)
        infoEl.classList.add(`${buttonInfoElClassName}3`)
        infoEl.appendChild(document.createTextNode(this.buttonInfo3))
        actionEl.appendChild(infoEl)

        const buttonEl = document.createElement("button")
        buttonEl.classList.add(buttonElClassName)
        buttonEl.classList.add(`${buttonElClassName}3`)
        buttonEl.appendChild(document.createTextNode(buttonLabel3))
        actionEl.appendChild(buttonEl)

        actionsEl.appendChild(actionEl)
      }

      boxEl.appendChild(actionsEl)
      this.el.appendChild(boxEl)
    }

    const containerEl = document.querySelector(`#${containerElId}`)
    if (!containerEl) {
      return
    }
    containerEl.appendChild(this.el)

    const button1El = this.$(`.${buttonElClassName}1`)
    if (button1El) {
      button1El.addEventListener("click", this.handleClickButton1, false)
    }

    const button2El = this.$(`.${buttonElClassName}2`)
    if (button2El) {
      button2El.addEventListener("click", this.handleClickButton2, false)
    }

    const button3El = this.$(`.${buttonElClassName}3`)
    if (button3El) {
      button3El.addEventListener("click", this.handleClickButton3, false)
    }

    window.setTimeout(() => {
      if (this.el) {
        this.el.classList.add(showElClassName)
      }
    }, 5)
  }

  public hide() {
    if (!this.el) {
      return
    }

    const { parentNode } = this.el
    if (parentNode) {
      parentNode.removeChild(this.el)
    }

    const button1El = this.$(`.${buttonElClassName}1`)
    if (button1El) {
      button1El.removeEventListener("click", this.handleClickButton1, false)
    }

    const button2El = this.$(`.${buttonElClassName}2`)
    if (button2El) {
      button2El.removeEventListener("click", this.handleClickButton2, false)
    }

    const button3El = this.$(`.${buttonElClassName}3`)
    if (button3El) {
      button3El.removeEventListener("click", this.handleClickButton3, false)
    }

    this.el = null
  }

  private $(selector: string): HTMLElement | null {
    if (!this.el) {
      return null
    }
    return this.el.querySelector(selector)
  }

  @bind
  private handleClickChevron(evt: MouseEvent): void {
    evt.preventDefault()
    this.expanded = !this.expanded

    if (this.el) {
      if (this.expanded) {
        this.el.classList.add(expandElClassName)
      } else {
        this.el.classList.remove(expandElClassName)
      }
    }
  }

  @bind
  private handleClickButton1(evt: MouseEvent): void {
    evt.preventDefault()
    if (this.onClickButton1) {
      this.onClickButton1()
    }
  }

  @bind
  private handleClickButton2(evt: MouseEvent): void {
    evt.preventDefault()
    if (this.onClickButton2) {
      this.onClickButton2()
    }
  }

  @bind
  private handleClickButton3(evt: MouseEvent): void {
    evt.preventDefault()
    if (this.onClickButton3) {
      this.onClickButton3()
    }
  }
}