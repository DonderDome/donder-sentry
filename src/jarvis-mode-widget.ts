/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  TemplateResult,
  css,
  PropertyValues,
  CSSResultGroup,
} from 'lit';
import { property, state } from "lit/decorators";
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import { CARD_VERSION } from './constants';
import './editor';

import type { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';

/* eslint no-console: 0 */
console.info(
  `%c  JARVIS-MODE-WIDGET \n%c  version: ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'jarvis-mode-widget',
  name: 'Boilerplate Card',
  description: 'A template custom card for you to create something awesome',
});

export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // REPLACE "jarvis-mode-widget" with widget name, everywhere in the project
    // REPLACE the file name with the actual widget name
    return document.createElement('jarvis-mode-widget-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: BoilerplateCardConfig;

  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Boilerplate',
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      /* REPLACE "jarvis-mode-widget" with actual widget name */
      @keyframes pulse {
        from {opacity: 0;}
        to {opacity: 1;}
      }
      .type-custom-jarvis-mode-widget {
        height: 100%;
        width: 100%;
      }
      .jarvis-widget {
        font-weight: 200;
        height: 100%;
        line-height: 2em;
        display: flex;
        margin-right: 7px;
        flex-direction: row-reverse;
        align-items: center;
      }
      .jarvis-mode-wrapper {
        background-color: rgb(72, 75, 92);
        padding: 5px 15px;
        display: flex;
        flex-direction: row;
        align-items: center;
        align-content: center;
      }
      .jarvis-mode-wrapper.arming .jarvis-mode-state {
        animation-name: pulse;
        animation-duration: .5s;
        animation-iteration-count: infinite;
        animation-direction: alternate;
      }
      .jarvis-mode-label {
        text-transform: uppercase;
        font-size: 1.2rem;
        font-weight: 300;
        font-stretch: extra-expanded;
        margin-right: 20px;
      }
      .jarvis-mode-state {
        font-weight: 700;
        text-transform: uppercase;
        display: inline-block;
        font-size: 1.5rem;
        font-stretch: extra-expanded;
        margin-right: 20px;
      }
    `;
  }

  protected render(): TemplateResult | void {
    /*
      ## INTERFACE
      - this.hass: A lot of information about everything in HA, such as states, theme, etc. The source of the tree
        - states: States of each of the components available
      - this.config: Lovelace settings for this instance

      Example: this.hass.states[this.config.entities[0]] shows the state of the first component
     */

    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning('warning message');
    }

    if (this.config.show_error) {
      return this._showError('error message');
    }

    const armedStates = ['armed_away', 'armed_home', 'armed_vacation']
    const alarmState = this.hass.states[this.config.entity].state

    let alarmName

    if (armedStates.includes(alarmState)) {
      alarmName = 'Armed'
    } else if (alarmState === 'armed_night') {
      alarmName = 'Night mode'
    } else {
      alarmName = alarmState
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
      >
        <div class='jarvis-widget'>
          <div class=${'jarvis-mode-wrapper '+alarmName}>
            <div class='jarvis-mode-label'>Sentry mode:</div>
            <div class='jarvis-mode-state'>${alarmName}</div>
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("jarvis-mode-widget", BoilerplateCard);
