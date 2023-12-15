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
  `%c  Donder Sentry \n%c  version: ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'donder-sentry',
  name: 'Donder Sentry',
  description: 'A template custom card for you to create something awesome',
});

export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // REPLACE "donder-sentry" with widget name, everywhere in the project
    // REPLACE the file name with the actual widget name
    return document.createElement('donder-sentry-editor');
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

  protected hasConfigOrEntityChanged(element: any, changedProps: PropertyValues, forceUpdate: boolean): boolean {
    if (changedProps.has('config') || forceUpdate) {
      return true;
    }
    
    const warningStates = element.hass.states['donder_sentry.global']?.state
    const entityState = element.hass.states[this.config.entity].state
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

    if (oldHass && this.config.entity) {
      const oldWarningStates = oldHass.states['donder_sentry.global']?.state
      const OldEntityState = oldHass.states[this.config.entity].state
      
      if (entityState !== OldEntityState) {
        return true
      } else if (warningStates !== oldWarningStates) {
        return true
      } else {
        return false
      }
    } else {
      return false;
    }
  }

  private handleClick(): void {
    this.hass.callService('browser_mod', 'more_info', {
      entity: 'alarm_control_panel.donder_sentry',
      browser_id: localStorage.getItem('browser_mod-browser-id')
    })
  }

  protected _handleAction(ev: ActionHandlerEvent): void {
    const { action } = ev?.detail

    if (action === 'tap') {
      this.handleClick()
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
      /* REPLACE "donder-mode-widget" with actual widget name */
      @keyframes pulse {
        from {opacity: 0;}
        to {opacity: 1;}
      }
      .type-custom-donder-mode-widget {
        height: 100%;
        width: 100%;
      }
      .donder-sizer {
        max-width: 100%;
        opacity: 0;
      }
      .donder-widget {
        background-color: var(--ha-card-background);
        color: var(--text-primary-color);
        padding: 15px 22px 22px;
        box-sizing: border-box;
        text-align: center;
        border-radius: var(--ha-card-border-radius)
      }
      .donder-widget .donder-mode-icon {
        opacity: .3;
        padding: 20px 0;
        margin: 0 auto;
      }
      .donder-widget.arming .donder-mode-icon {
        animation-name: pulse;
        animation-duration: .5s;
        animation-iteration-count: infinite;
        animation-direction: alternate;
      }
      .donder-widget.armed_away,
      .donder-widget.armed_night,
      .donder-widget.armed_home,
      .donder-widget.armed_vacation {
        background-color: rgb(0, 78, 79);
        border: 2px solid rgb(97, 236, 189);
      }
      .donder-widget.armed_away .donder-mode-icon,
      .donder-widget.armed_night .donder-mode-icon,
      .donder-widget.armed_home .donder-mode-icon,
      .donder-widget.arming .donder-mode-icon,
      .donder-widget.triggered .donder-mode-icon,
      .donder-widget.armed_vacation .donder-mode-icon {
        opacity: 1;
      }
      .donder-mode-icon ha-icon{
        --mdc-icon-size: 60%;
      }
      .donder-widget.on {
        background-color: rgba(214, 163, 25, .2);
        border: 2px solid rgb(214, 163, 25);
      }
      .donder-widget.triggered {
        background-color: rgba(132, 63, 77, .3);
        border: 2px solid red;
      }
      @media (max-width: 600px) {
        .donder-widget {
          display: block;
        }
      }
    `;
  }

  protected render(): TemplateResult | void {
    if (this.config.show_warning) {
      return this._showWarning('warning message');
    }

    if (this.config.show_error) {
      return this._showError('error message');
    }

    const armedStates = ['armed_away', 'armed_night', 'armed_vacation', 'arming', 'triggered', 'armed_home']
    const alarmState = this.hass.states[this.config.entity].state
    const warningStates = this.hass.states['donder_sentry.global']?.state
    const warningState = warningStates
      ? JSON.parse(warningStates.replace(/'/g, '"'))?.length > 0
        ? 'on'
        : 'off'
      : 'off'

    let alarmIcon

    if (armedStates.includes(alarmState)) {
      alarmIcon = 'mode-sentry'
    } else {
      alarmIcon = 'mode-normal'
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${`Boilerplate: ${this.config || 'No Entity Defined'}`}
      >
        <div class=${'donder-widget '+alarmState+' '+warningState}>
          <div class='donder-mode-label'>
            <ha-icon icon="hass:weather-sunny"></ha-icon>
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("donder-sentry", BoilerplateCard);
