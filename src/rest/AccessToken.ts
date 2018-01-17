import { IErrorResponse } from './EndpointCaller';
import { Logger } from '../misc/Logger';
import { debounce } from 'underscore';

export type onRenew = (newToken: string) => void;

export enum ACCESS_TOKEN_ERRORS {
  NO_RENEW_FUNCTIONS = 'NO_RENEW_FUNCTIONS',
  REPEATED_FAILURES = 'REPEATED_FAILURES'
}

export class AccessToken {
  private subscribers: onRenew[] = [];
  private logger: Logger = new Logger(this);
  private triedRenewals: number = 0;
  private resetRenewalTriesAfterDelay;

  constructor(public token: string, public renew?: () => Promise<string>) {
    this.resetRenewalTriesAfterDelay = debounce(
      () => {
        this.triedRenewals = 0;
      },
      500,
      false
    );
  }

  public isExpired(error: IErrorResponse) {
    return error != null && error.statusCode != null && error.statusCode == 419;
  }

  public async doRenew(onError?: (error: Error) => void): Promise<Boolean> {
    this.triedRenewals++;
    this.resetRenewalTriesAfterDelay();

    try {
      this.verifyRenewSetup();
      this.logger.info('Renewing expired access token');
      this.token = await this.renew();
      this.logger.info('Access token renewed', this.token);
      this.subscribers.forEach(subscriber => subscriber(this.token));
      return true;
    } catch (err) {
      switch (err.message) {
        case ACCESS_TOKEN_ERRORS.REPEATED_FAILURES:
          this.logger.error('AccessToken tried to renew itself extremely fast in a short period of time');
          this.logger.error('There is most probably an authentication error, or a bad implementation of the custom renew function');
          this.logger.error('Inspect the developer console of your browser to find out the root cause');
          break;
        case ACCESS_TOKEN_ERRORS.NO_RENEW_FUNCTIONS:
          this.logger.error(`AccessToken tried to renew, but no function is configured on initialization to provide acess token renewal`);
          this.logger.error('The option name is renewAccessToken on the SearchEndpoint class');
          break;
      }
      this.logger.error('Failed to renew access token', err);

      if (onError) {
        onError(err);
      }
      return false;
    }
  }

  public afterRenew(afterRenew: onRenew) {
    this.subscribers.push(afterRenew);
  }

  private verifyRenewSetup() {
    if (this.renew == null) {
      throw new Error(ACCESS_TOKEN_ERRORS.NO_RENEW_FUNCTIONS);
    }
    if (this.triedRenewals >= 5) {
      throw new Error(ACCESS_TOKEN_ERRORS.REPEATED_FAILURES);
    }
  }
}
